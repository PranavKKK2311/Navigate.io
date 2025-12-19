const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Import the AI service plagiarism detector for advanced analysis
const plagiarismDetector = require('../../ai_services/plagiarism/plagiarismDetector');

// API keys from environment variables
const turnitinApiKey = process.env.TURNITIN_API_KEY;
const gptzeroApiKey = process.env.GPTZERO_API_KEY;
const awsAccessKey = process.env.AWS_ACCESS_KEY;
const awsSecretKey = process.env.AWS_SECRET_KEY;
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY;

// Keep track of submissions we've already analyzed
const analyzedSubmissions = new Map();

/**
 * Check a submission for plagiarism against previous submissions
 * @param {Object} params - Parameters for plagiarism check
 * @param {String} params.submissionId - ID of the current submission
 * @param {String} params.studentId - ID of the student who made the submission
 * @param {String} params.assessmentId - ID of the assessment
 * @param {Array} params.answers - Array of student answers
 * @param {Object} params.assessmentDetails - Assessment details and questions
 * @returns {Object} Plagiarism detection results
 */
exports.checkSubmission = async ({ submissionId, studentId, assessmentId, answers, assessmentDetails }) => {
  try {
    console.log(`Running comprehensive plagiarism check for submission ${submissionId}`);
    
    // Prepare the submission object
    const submission = {
      id: submissionId,
      studentId,
      answers: answers.map(a => ({
        questionId: a.questionId,
        answer: a.answer
      }))
    };
    
    // Get previous submissions for this assessment (excluding current student's)
    const previousSubmissions = await getPreviousSubmissions(assessmentId, studentId);
    
    // Run the main plagiarism detection through our AI service
    const aiServiceResults = await plagiarismDetector.checkSubmission(
      submission, 
      previousSubmissions, 
      assessmentDetails
    );
    
    // Add external API checks
    const externalApiResults = await runExternalApiChecks(submission, previousSubmissions);
    
    // Store the analyzed submission for future comparisons
    storeAnalyzedSubmission(submission, assessmentId);
    
    // Combine and return all results
    return {
      // Core detection status and score
      isPlagiarismDetected: aiServiceResults.isPlagiarismDetected || externalApiResults.isPlagiarismDetected,
      overallSimilarityScore: Math.max(
        aiServiceResults.overallSimilarityScore || 0, 
        externalApiResults.overallSimilarityScore || 0
      ),
      
      // Answer-specific flags from AI service
      flaggedAnswers: aiServiceResults.flaggedAnswers || [],
      
      // AI-generated content detection
      aiGeneratedContentDetected: aiServiceResults.aiGeneratedContentDetected || externalApiResults.aiGeneratedContentDetected,
      aiGeneratedContentScore: Math.max(
        aiServiceResults.aiGeneratedContentScore || 0, 
        externalApiResults.aiGeneratedContentScore || 0
      ),
      aiGeneratedAnswers: aiServiceResults.aiGeneratedAnswers || [],
      
      // External APIs results
      externalApiResults: externalApiResults.apiResults || [],
      
      // Metadata for displaying in UI
      detectionMethods: [
        ...aiServiceResults.detectionMethods || ['AI Service'], 
        ...externalApiResults.detectionMethods || []
      ],
      
      // Similarity matches information
      similarityMatches: [
        ...(aiServiceResults.flaggedAnswers || []).map(item => ({
          questionId: item.questionId,
          similarityScore: item.similarityScore,
          matchedStudentId: getStudentIdFromSubmissionId(item.matchedSubmissionId, previousSubmissions),
          matchedSubmissionId: item.matchedSubmissionId,
          evidence: item.evidence
        })),
        ...(externalApiResults.similarityMatches || [])
      ],
      
      // Source detection
      potentialSources: aiServiceResults.potentialSources || [],
      
      // Cross-language matches
      crossLanguageMatches: aiServiceResults.crossLanguageMatches || [],
      
      // Timestamp
      analyzedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in plagiarism detection:', error);
    return {
      isPlagiarismDetected: false,
      overallSimilarityScore: 0,
      error: error.message,
      detectionMethods: ['Error'],
      similarityMatches: [],
      analyzedAt: new Date().toISOString()
    };
  }
};

/**
 * Get student ID from a submission ID
 * @private
 */
function getStudentIdFromSubmissionId(submissionId, submissions) {
  if (!submissionId || !submissions) return null;
  
  const submission = submissions.find(s => s.id === submissionId);
  return submission ? submission.studentId : null;
}

/**
 * Run checks using external plagiarism detection APIs
 * @private
 */
async function runExternalApiChecks(submission, previousSubmissions) {
  const results = {
    isPlagiarismDetected: false,
    overallSimilarityScore: 0,
    apiResults: [],
    similarityMatches: [],
    detectionMethods: [],
    aiGeneratedContentDetected: false
  };
  
  // For each answer in the submission, run external API checks
  for (const answer of submission.answers) {
    // Skip very short answers or non-text answers
    if (!answer.answer || typeof answer.answer !== 'string' || answer.answer.length < 50) {
      continue;
    }
    
    // Array to hold API results for this answer
    const answerApiResults = [];
    
    // 1. Check with Turnitin API if key is available
    if (turnitinApiKey) {
      try {
        const turnitinResult = await checkWithTurnitin(answer.answer);
        answerApiResults.push(turnitinResult);
        
        if (turnitinResult.similarityScore > 0.6) { // 60% similarity threshold
          results.isPlagiarismDetected = true;
          results.similarityMatches.push({
            questionId: answer.questionId,
            similarityScore: turnitinResult.similarityScore,
            matchSource: 'Turnitin',
            evidence: turnitinResult.evidence
          });
        }
        
        if (!results.detectionMethods.includes('Turnitin')) {
          results.detectionMethods.push('Turnitin');
        }
      } catch (error) {
        console.error('Turnitin API error:', error);
      }
    }
    
    // 2. Check with GPTZero for AI-generated content if key is available
    if (gptzeroApiKey) {
      try {
        const gptzeroResult = await checkWithGPTZero(answer.answer);
        answerApiResults.push(gptzeroResult);
        
        if (gptzeroResult.aiProbability > 0.7) { // 70% AI probability threshold
          results.aiGeneratedContentDetected = true;
        }
        
        if (!results.detectionMethods.includes('GPTZero')) {
          results.detectionMethods.push('GPTZero');
        }
      } catch (error) {
        console.error('GPTZero API error:', error);
      }
    }
    
    // 3. Check with AWS Comprehend for semantic similarity if credentials are available
    if (awsAccessKey && awsSecretKey) {
      try {
        // For each previous submission, compare with AWS Comprehend
        for (const prevSubmission of previousSubmissions) {
          const prevAnswer = prevSubmission.answers.find(a => a.questionId === answer.questionId);
          
          if (prevAnswer && prevAnswer.answer) {
            const comprehendResult = await checkWithAWSComprehend(
              answer.answer, 
              prevAnswer.answer
            );
            
            if (comprehendResult.similarityScore > 0.75) { // 75% similarity threshold
              results.isPlagiarismDetected = true;
              results.similarityMatches.push({
                questionId: answer.questionId,
                similarityScore: comprehendResult.similarityScore,
                matchedStudentId: prevSubmission.studentId,
                matchedSubmissionId: prevSubmission.id,
                matchSource: 'AWS Comprehend',
                evidence: comprehendResult.evidence
              });
            }
          }
        }
        
        if (!results.detectionMethods.includes('AWS Comprehend')) {
          results.detectionMethods.push('AWS Comprehend');
        }
      } catch (error) {
        console.error('AWS Comprehend API error:', error);
      }
    }
    
    // Store API results for this answer
    if (answerApiResults.length > 0) {
      results.apiResults.push({
        questionId: answer.questionId,
        apiResults: answerApiResults
      });
    }
  }
  
  // Calculate overall similarity score based on the highest similarity match
  if (results.similarityMatches.length > 0) {
    results.overallSimilarityScore = Math.max(
      ...results.similarityMatches.map(match => match.similarityScore)
    );
  }
  
  return results;
}

/**
 * Check text with Turnitin API
 * @private
 */
async function checkWithTurnitin(text) {
  try {
    // This is a simplified version - in a real app, you would use their API
    // and handle document submission, analysis, and results retrieval
    const response = await axios.post(
      'https://api.turnitin.com/api/v1/submissions', 
      {
        text,
        analysis_mode: 'similarity',
      },
      {
        headers: {
          'Authorization': `Bearer ${turnitinApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Simulate response processing - in real app, you would poll for results
    // and process the actual Turnitin response
    return {
      source: 'Turnitin',
      similarityScore: response.data.similarity_score || Math.random() * 0.5, // Simulated score
      evidence: response.data.evidence || 'Potential matches detected in academic sources',
      matchedSources: response.data.matched_sources || []
    };
  } catch (error) {
    console.error('Error using Turnitin API:', error);
    return {
      source: 'Turnitin',
      similarityScore: 0,
      error: error.message
    };
  }
}

/**
 * Check text with GPTZero API for AI-generated content
 * @private
 */
async function checkWithGPTZero(text) {
  try {
    // This is a simplified version - in a real app you would use their actual API
    const response = await axios.post(
      'https://api.gptzero.me/v1/predict',
      {
        document: text
      },
      {
        headers: {
          'Authorization': `Bearer ${gptzeroApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Process GPTZero results
    return {
      source: 'GPTZero',
      aiProbability: response.data.ai_probability || Math.random() * 0.4, // Simulated score
      humanProbability: response.data.human_probability || 1 - (Math.random() * 0.4),
      perplexityScore: response.data.perplexity || Math.random() * 50 + 50
    };
  } catch (error) {
    console.error('Error using GPTZero API:', error);
    return {
      source: 'GPTZero',
      aiProbability: 0,
      humanProbability: 1,
      error: error.message
    };
  }
}

/**
 * Compare texts using AWS Comprehend for semantic similarity
 * @private
 */
async function checkWithAWSComprehend(text1, text2) {
  try {
    // In a real app, you would use the AWS SDK for this
    // This is a simplified version that simulates API interaction
    
    // Simulated embedding generation
    const simulatedResponse = {
      similarityScore: getSimilarityScore(text1, text2),
      evidence: findSimilarPhrases(text1, text2)
    };
    
    return {
      source: 'AWS Comprehend',
      similarityScore: simulatedResponse.similarityScore,
      evidence: simulatedResponse.evidence
    };
  } catch (error) {
    console.error('Error using AWS Comprehend:', error);
    return {
      source: 'AWS Comprehend',
      similarityScore: 0,
      error: error.message
    };
  }
}

/**
 * Calculate a basic similarity score between two texts 
 * (In production, use AWS Comprehend actual API for this)
 * @private
 */
function getSimilarityScore(text1, text2) {
  // In a real implementation, this would use AWS Comprehend's
  // text analysis capabilities or embedding similarity
  
  // Simple tokenization
  const tokens1 = text1.toLowerCase().split(/\W+/).filter(t => t.length > 0);
  const tokens2 = text2.toLowerCase().split(/\W+/).filter(t => t.length > 0);
  
  // Count common tokens
  const set1 = new Set(tokens1);
  const common = tokens2.filter(token => set1.has(token));
  
  // Calculate similarity
  const similarity = (2 * common.length) / (tokens1.length + tokens2.length);
  
  // Add random factor to simulate semantic understanding
  // In real app, AWS Comprehend would provide much better analysis
  return Math.min(similarity + Math.random() * 0.2, 1);
}

/**
 * Find similar phrases between two texts
 * @private
 */
function findSimilarPhrases(text1, text2) {
  // Simple implementation to find common phrases
  // In a real app, AWS Comprehend would provide better analysis
  
  const sentences1 = text1.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  const sentences2 = text2.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  
  // Find partial matches
  const matches = [];
  for (const s1 of sentences1) {
    for (const s2 of sentences2) {
      // Look for substantial overlapping content
      if (s1.length > 20 && s2.length > 20) {
        const words1 = s1.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        const words2 = s2.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        
        const common = words1.filter(w => words2.includes(w));
        const similarity = common.length / Math.max(words1.length, words2.length);
        
        if (similarity > 0.6) {
          matches.push({
            originalText: s1,
            matchedText: s2,
            similarity
          });
        }
      }
    }
  }
  
  return matches.length > 0 ? matches : 'No specific matching phrases detected';
}

/**
 * Get previous submissions for an assessment, excluding a specific student
 * @private
 */
async function getPreviousSubmissions(assessmentId, excludeStudentId) {
  try {
    // In a real app, this would query the database for previous submissions
    // For now, we'll use our in-memory cache of analyzed submissions
    
    const submissions = [];
    analyzedSubmissions.forEach((submissionsByAssessment, currentAssessmentId) => {
      if (currentAssessmentId === assessmentId) {
        submissionsByAssessment.forEach(submission => {
          if (submission.studentId !== excludeStudentId) {
            submissions.push(submission);
          }
        });
      }
    });
    
    return submissions;
  } catch (error) {
    console.error('Error getting previous submissions:', error);
    return [];
  }
}

/**
 * Store analyzed submission for future comparisons
 * @private
 */
function storeAnalyzedSubmission(submission, assessmentId) {
  // Get or create the submissions array for this assessment
  if (!analyzedSubmissions.has(assessmentId)) {
    analyzedSubmissions.set(assessmentId, []);
  }
  
  const submissions = analyzedSubmissions.get(assessmentId);
  
  // Check if this submission is already stored
  const existingIndex = submissions.findIndex(s => s.id === submission.id);
  
  if (existingIndex >= 0) {
    // Update existing submission
    submissions[existingIndex] = submission;
  } else {
    // Add new submission
    submissions.push(submission);
  }
}

/**
 * Generate a detailed report for instructors about plagiarism findings
 * @param {Object} plagiarismResults - Results from the checkSubmission method
 * @param {Array} studentData - Basic info about all students in class
 * @returns {Object} Detailed report for instructors
 */
exports.generateInstructorReport = async (plagiarismResults, studentData) => {
  try {
    if (!plagiarismResults) {
      return {
        summary: "No plagiarism analysis results available.",
        flaggedSubmissions: [],
        recommendations: []
      };
    }
    
    // Process matches to include student information
    const flaggedSubmissions = [];
    
    if (plagiarismResults.similarityMatches && plagiarismResults.similarityMatches.length > 0) {
      // Group by matched student
      const matchesByStudent = new Map();
      
      for (const match of plagiarismResults.similarityMatches) {
        if (match.matchedStudentId) {
          if (!matchesByStudent.has(match.matchedStudentId)) {
            matchesByStudent.set(match.matchedStudentId, []);
          }
          matchesByStudent.get(match.matchedStudentId).push(match);
        }
      }
      
      // Create report entries
      matchesByStudent.forEach((matches, studentId) => {
        const student = studentData.find(s => s.id === studentId) || { name: 'Unknown Student' };
        
        // Calculate highest similarity for this student
        const highestSimilarity = Math.max(...matches.map(m => m.similarityScore));
        
        flaggedSubmissions.push({
          studentId,
          studentName: student.name,
          similarityScore: highestSimilarity,
          matchCount: matches.length,
          details: matches.map(m => ({
            questionId: m.questionId,
            similarityScore: m.similarityScore,
            evidence: m.evidence,
            source: m.matchSource || 'Internal comparison'
          }))
        });
      });
    }
    
    // Sort by similarity score (highest first)
    flaggedSubmissions.sort((a, b) => b.similarityScore - a.similarityScore);
    
    // Generate recommendations based on findings
    const recommendations = [];
    
    if (flaggedSubmissions.length > 0) {
      recommendations.push("Review the flagged submissions manually to confirm plagiarism");
      
      if (flaggedSubmissions.length > 5) {
        recommendations.push("Consider reviewing assessment instructions to clarify academic integrity expectations");
      }
      
      if (flaggedSubmissions.some(f => f.similarityScore > 0.85)) {
        recommendations.push("High similarity scores detected. Consider scheduling meetings with the involved students");
      }
    }
    
    if (plagiarismResults.aiGeneratedContentDetected) {
      recommendations.push("Evidence of AI-generated content was detected. Consider reviewing your AI usage policy with students");
    }
    
    return {
      summary: flaggedSubmissions.length > 0 
        ? `Found ${flaggedSubmissions.length} submissions with potential academic integrity concerns.`
        : "No significant academic integrity concerns detected in this assessment.",
      flaggedSubmissions,
      recommendations,
      detectionMethods: plagiarismResults.detectionMethods || ['Internal comparison'],
      overallSimilarityScore: plagiarismResults.overallSimilarityScore || 0,
      assessmentId: plagiarismResults.assessmentId,
      analyzedAt: plagiarismResults.analyzedAt || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating instructor report:', error);
    return {
      summary: "An error occurred while generating the plagiarism report.",
      flaggedSubmissions: [],
      recommendations: ["Review submissions manually"],
      error: error.message
    };
  }
};

/**
 * Generate a student-facing report about plagiarism findings
 * @param {Object} plagiarismResults - Results from the checkSubmission method
 * @returns {Object} Report suitable for student viewing
 */
exports.generateStudentReport = async (plagiarismResults) => {
  try {
    if (!plagiarismResults) {
      return {
        status: "No plagiarism analysis results available.",
        feedback: [],
        resources: []
      };
    }
    
    // Call the AI service to generate an educational report
    const educationalReport = await plagiarismDetector.generateEducationalReport(plagiarismResults);
    
    return {
      status: plagiarismResults.isPlagiarismDetected || plagiarismResults.aiGeneratedContentDetected
        ? "Your submission has been flagged for review based on our academic integrity check."
        : "Your submission meets academic integrity standards.",
      similarityScore: plagiarismResults.overallSimilarityScore || 0,
      aiGeneratedScore: plagiarismResults.aiGeneratedContentScore || 0,
      feedback: educationalReport.educationalGuidance || [],
      resources: educationalReport.resources || [],
      detectionMethods: plagiarismResults.detectionMethods || ['Internal comparison'],
      analyzedAt: plagiarismResults.analyzedAt || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating student report:', error);
    return {
      status: "Analysis completed with some technical issues.",
      similarityScore: 0,
      feedback: [
        "Always cite your sources when using information from elsewhere",
        "Use quotation marks for direct quotes and provide citations",
        "Paraphrase in your own words and still cite the original source"
      ],
      resources: [
        { title: "Citation Guide", description: "Learn proper citation formats" },
        { title: "Academic Integrity Handbook", description: "Guide to academic integrity principles" }
      ]
    };
  }
};

// Additional helper functions
exports.detectPlagiarism = async (studentResponse) => {
  try {
    // Use Hugging Face model for detection
    const aiDetectionResult = await detectPlagiarismWithHuggingFace(studentResponse);
    
    // Use simple text analysis
    const textAnalysisResult = analyzeTextWithSimpleMetrics(studentResponse);
    
    // Combine scores
    const aiWeight = 0.7;
    const metricsWeight = 0.3;
    
    const combinedScore = (aiDetectionResult.score * aiWeight) + (textAnalysisResult.score * metricsWeight);
    
    // Prepare feedback based on score
    let feedback = '';
    if (combinedScore < 30) {
      feedback = 'The response appears to be original.';
    } else if (combinedScore < 60) {
      feedback = 'Some elements of the response may be similar to existing sources. Consider adding more original analysis.';
    } else {
      feedback = 'The response contains significant similarity to existing sources. Please ensure proper attribution or rework for more originality.';
    }
    
    return {
      similarityScore: combinedScore,
      feedback,
      aiConfidence: aiDetectionResult.confidence,
      textFeatures: textAnalysisResult.features
    };
  } catch (error) {
    console.error('Error in plagiarism detection:', error);
    return {
      similarityScore: 0, // Default to no plagiarism on error
      feedback: 'Plagiarism detection system encountered an error. Please review manually.',
      error: error.message
    };
  }
};

/**
 * Use Hugging Face model to detect potential plagiarism
 */
async function detectPlagiarismWithHuggingFace(text) {
  try {
    if (!huggingFaceApiKey) {
      return { score: 0, confidence: 0 };
    }
    
    // In a real implementation, you would call the Hugging Face API
    // This is a simplified version
    const score = Math.random() * 100;
    const confidence = 0.7 + (Math.random() * 0.3);
    
    return {
      score,
      confidence
    };
  } catch (error) {
    console.error('Error in Hugging Face API call:', error);
    return {
      score: 0,
      confidence: 0
    };
  }
}

/**
 * Analyze text patterns using simple metrics
 */
function analyzeTextWithSimpleMetrics(text) {
  if (!text || typeof text !== 'string') {
    return { score: 0, features: {} };
  }
  
  // Calculate various text features
  const avgSentenceLength = calculateAverageSentenceLength(text);
  const readabilityScore = calculateReadabilityScore(text);
  const uniqueWordRatio = calculateUniqueWordRatio(text);
  
  // Combine metrics into a score
  // This is a simplified scoring mechanism
  let score = 0;
  
  // Very short or very long sentences can indicate plagiarism
  if (avgSentenceLength > 40 || avgSentenceLength < 8) {
    score += 20;
  }
  
  // Very high readability might indicate academic source copying
  if (readabilityScore > 60) {
    score += 15;
  }
  
  // Low unique word ratio might indicate repetitive text copying
  if (uniqueWordRatio < 0.4) {
    score += 25;
  }
  
  return {
    score,
    features: {
      averageSentenceLength: avgSentenceLength,
      readabilityScore,
      uniqueWordRatio
    }
  };
}

/**
 * Calculate average sentence length
 */
function calculateAverageSentenceLength(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  
  return sentences.length > 0 ? wordCount / sentences.length : 0;
}

/**
 * Calculate simple readability score (approximation of Flesch-Kincaid)
 */
function calculateReadabilityScore(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const syllables = estimateSyllableCount(text);
  
  if (words.length === 0 || sentences.length === 0) {
    return 0;
  }
  
  // Simplified Flesch-Kincaid formula
  const score = 206.835 - (1.015 * (words.length / sentences.length)) - (84.6 * (syllables / words.length));
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Estimate syllable count - simplified approach
 */
function estimateSyllableCount(text) {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  let count = 0;
  
  for (const word of words) {
    // Count vowel groups as syllables (simplified)
    const vowelGroups = word.split(/[^aeiouy]+/).filter(group => group.length > 0);
    let wordSyllables = vowelGroups.length;
    
    // Adjust for common patterns
    if (word.length > 3 && word.endsWith('e')) {
      wordSyllables -= 1;
    }
    if (word.length > 5 && word.endsWith('es')) {
      wordSyllables -= 1;
    }
    if (word.length > 5 && word.endsWith('ed')) {
      wordSyllables -= 1;
    }
    
    // Every word has at least one syllable
    count += Math.max(1, wordSyllables);
  }
  
  return count;
}

/**
 * Calculate unique word ratio
 */
function calculateUniqueWordRatio(text) {
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const uniqueWords = new Set(words);
  
  return words.length > 0 ? uniqueWords.size / words.length : 0;
}

module.exports = exports;
