const LearningPath = require('../models/LearningPath');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const axios = require('axios');
require('dotenv').config();

// Configure Gemini API
const gemini = axios.create({
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/models',
  headers: {
    'Content-Type': 'application/json'
  },
  params: {
    key: process.env.GEMINI_API_KEY
  }
});

/**
 * Generate or update a personalized learning path based on assessment results
 * @param {String} studentId - The student's ID
 * @param {String} courseId - The course ID
 * @param {String} submissionId - The latest submission ID to analyze
 * @returns {Object} Updated learning path
 */
exports.updateLearningPath = async (studentId, courseId, submissionId) => {
  try {
    // Get the latest submission
    const submission = await Submission.findById(submissionId);
    
    if (!submission) {
      throw new Error('Submission not found');
    }
    
    // Get course information
    const course = await Course.findById(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Find existing learning path or create new one
    let learningPath = await LearningPath.findOne({
      student: studentId,
      course: courseId
    });
    
    if (!learningPath) {
      learningPath = new LearningPath({
        student: studentId,
        course: courseId,
        currentLevel: 'beginner',
        masteredConcepts: [],
        weakConcepts: [],
        learningRecommendations: [],
        progressHistory: []
      });
    }
    
    // Analyze submission and extract learning gaps and strengths
    const { masteredConcepts, weakConcepts } = analyzeSubmission(submission);
    
    // Update masteredConcepts in learning path
    for (const concept of masteredConcepts) {
      const existingIndex = learningPath.masteredConcepts.findIndex(
        c => c.concept === concept
      );
      
      if (existingIndex >= 0) {
        // Update existing mastered concept
        learningPath.masteredConcepts[existingIndex].masteryLevel = 
          Math.min(100, learningPath.masteredConcepts[existingIndex].masteryLevel + 10);
        learningPath.masteredConcepts[existingIndex].lastAssessed = Date.now();
      } else {
        // Add new mastered concept
        learningPath.masteredConcepts.push({
          concept,
          masteryLevel: 70, // Initial mastery level for concepts identified as mastered
          lastAssessed: Date.now()
        });
      }
    }
    
    // Generate recommendations for weak concepts
    const recommendations = await generateRecommendations(
      weakConcepts, 
      course.curriculumMap
    );
    
    // Update weakConcepts in learning path
    learningPath.weakConcepts = weakConcepts.map(concept => {
      const existingConcept = learningPath.weakConcepts.find(c => c.concept === concept);
      const masteryLevel = existingConcept ? 
        Math.max(10, existingConcept.masteryLevel - 5) : 30;
      
      return {
        concept,
        masteryLevel,
        recommendedResources: recommendations[concept] || []
      };
    });
    
    // Generate overall learning recommendations
    learningPath.learningRecommendations = await generateLearningPath(
      learningPath.masteredConcepts,
      learningPath.weakConcepts,
      course.curriculumMap
    );
    
    // Determine appropriate level based on mastery
    learningPath.currentLevel = determineLevel(learningPath.masteredConcepts);
    
    // Update progress history
    learningPath.progressHistory.push({
      date: Date.now(),
      conceptsLearned: masteredConcepts,
      assessmentsCompleted: [submission.assessment],
      overallProgress: calculateOverallProgress(learningPath, course)
    });
    
    // Save and return updated learning path
    learningPath.lastUpdated = Date.now();
    await learningPath.save();
    
    return learningPath;
  } catch (error) {
    console.error('Error updating learning path:', error);
    throw error;
  }
};

/**
 * Extract mastered concepts and weak concepts from a submission
 */
function analyzeSubmission(submission) {
  const masteredConcepts = new Set();
  const weakConcepts = new Set();
  
  // Process each answer
  submission.answers.forEach(answer => {
    // Consider concepts mastered if score is high enough
    const accuracyScore = answer.aiEvaluation?.accuracy?.score || 0;
    const conceptualScore = answer.aiEvaluation?.conceptualUnderstanding?.score || 0;
    const totalScore = answer.aiEvaluation?.totalScore || 0;
    
    // Extract concepts from learning gaps
    if (answer.learningGaps && answer.learningGaps.length > 0) {
      answer.learningGaps.forEach(gap => {
        // Extract concept names from learning gaps
        const conceptMatches = gap.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g);
        if (conceptMatches) {
          conceptMatches.forEach(concept => weakConcepts.add(concept));
        } else {
          weakConcepts.add(gap);
        }
      });
    }
    
    // If score is high, add related concepts to mastered
    if (totalScore >= 0.8) {
      if (answer.relatedConcepts) {
        answer.relatedConcepts.forEach(concept => masteredConcepts.add(concept));
      }
    } 
    // If score is low, add related concepts to weak
    else if (totalScore < 0.5) {
      if (answer.relatedConcepts) {
        answer.relatedConcepts.forEach(concept => weakConcepts.add(concept));
      }
    }
  });
  
  // Remove concepts that appear in both sets (prioritize learning)
  for (const concept of masteredConcepts) {
    if (weakConcepts.has(concept)) {
      masteredConcepts.delete(concept);
    }
  }
  
  return {
    masteredConcepts: [...masteredConcepts],
    weakConcepts: [...weakConcepts]
  };
}

/**
 * Generate resource recommendations for weak concepts
 */
async function generateRecommendations(weakConcepts, curriculumMap) {
  const recommendations = {};
  
  // For each weak concept, find resources in curriculum map or generate new ones
  for (const concept of weakConcepts) {
    if (curriculumMap && curriculumMap.has(concept) && curriculumMap.get(concept).resources) {
      // Use curriculum map resources if available
      recommendations[concept] = curriculumMap.get(concept).resources.map(resource => ({
        resourceType: guessResourceType(resource),
        url: resource
      }));
    } else {
      // Generate Gemini recommendations if not in curriculum map
      try {
        const prompt = `
          You are an educational resource specialist helping students learn about "${concept}".
          
          Please suggest 3 specific learning resources for this concept, including:
          1. A video tutorial (YouTube or educational platform)
          2. An interactive exercise
          3. An article or reading material
          
          Format your response as:
          Video: [title] | [url]
          Exercise: [title] | [url]
          Reading: [title] | [url]
        `;
        
        const response = await gemini.post('/text-bison-001:generateText', {
          prompt: {
            text: prompt
          },
          temperature: 0.7,
          candidateCount: 1
        });
        
        const completion = response.data.candidates[0].output;
        
        // Parse Gemini suggestions
        const videoMatch = completion.match(/Video:(.+)/);
        const exerciseMatch = completion.match(/Exercise:(.+)/);
        const readingMatch = completion.match(/Reading:(.+)/);
        
        recommendations[concept] = [];
        
        if (videoMatch) {
          recommendations[concept].push({
            resourceType: 'video',
            url: extractUrl(videoMatch[1]) || 'https://www.youtube.com/results?search_query=' + encodeURIComponent(concept)
          });
        }
        
        if (exerciseMatch) {
          recommendations[concept].push({
            resourceType: 'exercise',
            url: extractUrl(exerciseMatch[1]) || 'https://www.khanacademy.org/search?query=' + encodeURIComponent(concept)
          });
        }
        
        if (readingMatch) {
          recommendations[concept].push({
            resourceType: 'article',
            url: extractUrl(readingMatch[1]) || 'https://scholar.google.com/scholar?q=' + encodeURIComponent(concept)
          });
        }
      } catch (error) {
        console.error(`Error generating recommendations for ${concept}:`, error);
        // Fallback recommendations
        recommendations[concept] = [
          {
            resourceType: 'video',
            url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(concept)
          },
          {
            resourceType: 'article',
            url: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(concept.replace(/\s+/g, '_'))
          }
        ];
      }
    }
  }
  
  return recommendations;
}

/**
 * Extract URL from a string
 */
function extractUrl(text) {
  const urlMatch = text.match(/https?:\/\/[^\s|]*/);
  return urlMatch ? urlMatch[0] : null;
}

/**
 * Guess resource type from URL or title
 */
function guessResourceType(resource) {
  const resourceLower = resource.toLowerCase();
  
  if (resourceLower.includes('youtube.com') || 
      resourceLower.includes('vimeo.com') ||
      resourceLower.includes('video')) {
    return 'video';
  } else if (resourceLower.includes('quiz') ||
             resourceLower.includes('exercise') ||
             resourceLower.includes('practice')) {
    return 'exercise';
  } else if (resourceLower.includes('article') ||
             resourceLower.includes('.pdf') ||
             resourceLower.includes('read')) {
    return 'article';
  } else {
    return 'article'; // Default
  }
}

/**
 * Generate a comprehensive learning path with recommendations
 */
async function generateLearningPath(masteredConcepts, weakConcepts, curriculumMap) {
  const learningRecommendations = [];
  
  // Process weak concepts first (higher priority)
  for (const weakConcept of weakConcepts) {
    const conceptName = weakConcept.concept;
    const recommendation = {
      concept: conceptName,
      resources: [],
      suggestedActivities: []
    };
    
    // Add existing recommended resources
    if (weakConcept.recommendedResources && weakConcept.recommendedResources.length > 0) {
      recommendation.resources = weakConcept.recommendedResources.map(resource => ({
        title: `Learn about ${conceptName}`,
        type: resource.resourceType,
        url: resource.url,
        priority: 1 // High priority for weak concepts
      }));
    }
    
    // Generate suggested activities
    try {
      const prompt = `
        You are an educational expert creating a personalized learning plan for a student.
        The student needs to improve their understanding of the concept: "${conceptName}".
        
        Please suggest 3 specific learning activities that would help the student master this concept.
        Each activity should be practical and actionable.
        
        Format your response as a list:
        - [activity 1]
        - [activity 2]
        - [activity 3]
      `;
      
      const response = await gemini.post('/text-bison-001:generateText', {
        prompt: {
          text: prompt
        },
        temperature: 0.7,
        candidateCount: 1
      });
      
      const completion = response.data.candidates[0].output;
      
      // Parse activities
      recommendation.suggestedActivities = completion
        .split('-')
        .map(activity => activity.trim())
        .filter(activity => activity.length > 0);
    } catch (error) {
      console.error(`Error generating activities for ${conceptName}:`, error);
      recommendation.suggestedActivities = [
        `Create a concept map for ${conceptName}`,
        `Practice explaining ${conceptName} in your own words`,
        `Find real-world examples of ${conceptName} and analyze them`
      ];
    }
    
    learningRecommendations.push(recommendation);
  }
  
  // Add some recommendations for related concepts not yet mastered
  // This adds breadth to the learning path
  try {
    const relatedConcepts = new Set();
    
    // Find related concepts from curriculum map
    for (const weakConcept of weakConcepts) {
      const conceptName = weakConcept.concept;
      if (curriculumMap && curriculumMap.has(conceptName)) {
        const conceptData = curriculumMap.get(conceptName);
        if (conceptData && conceptData.dependsOn) {
          conceptData.dependsOn.forEach(relatedConcept => {
            // Only add if not already mastered
            const isAlreadyMastered = masteredConcepts.some(mc => mc.concept === relatedConcept);
            const isAlreadyWeak = weakConcepts.some(wc => wc.concept === relatedConcept);
            
            if (!isAlreadyMastered && !isAlreadyWeak) {
              relatedConcepts.add(relatedConcept);
            }
          });
        }
      }
    }
    
    // Add recommendations for related concepts (with lower priority)
    for (const relatedConcept of relatedConcepts) {
      learningRecommendations.push({
        concept: relatedConcept,
        resources: [
          {
            title: `Introduction to ${relatedConcept}`,
            type: 'article',
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(relatedConcept.replace(/\s+/g, '_'))}`,
            priority: 3 // Lower priority
          }
        ],
        suggestedActivities: [
          `Learn the basics of ${relatedConcept} to support your understanding of related concepts`
        ]
      });
    }
  } catch (error) {
    console.error('Error adding related concept recommendations:', error);
    // Continue without adding related concepts
  }
  
  return learningRecommendations;
}

/**
 * Determine student level based on mastered concepts
 */
function determineLevel(masteredConcepts) {
  if (!masteredConcepts || masteredConcepts.length === 0) {
    return 'beginner';
  }
  
  // Calculate average mastery level
  const totalMastery = masteredConcepts.reduce((sum, concept) => sum + concept.masteryLevel, 0);
  const averageMastery = totalMastery / masteredConcepts.length;
  
  // Determine level based on average mastery and number of concepts
  if (averageMastery >= 85 && masteredConcepts.length >= 5) {
    return 'advanced';
  } else if (averageMastery >= 70 || masteredConcepts.length >= 3) {
    return 'intermediate';
  } else {
    return 'beginner';
  }
}

/**
 * Calculate overall progress percentage
 */
function calculateOverallProgress(learningPath, course) {
  // If no course or curriculum map, use simple calculation
  if (!course || !course.curriculumMap) {
    const masteredCount = learningPath.masteredConcepts.length;
    const weakCount = learningPath.weakConcepts.length;
    const totalConcepts = masteredCount + weakCount;
    
    return totalConcepts > 0 ? Math.round((masteredCount / totalConcepts) * 100) : 0;
  }
  
  // Calculate based on curriculum map if available
  const totalConcepts = course.curriculumMap.size;
  if (totalConcepts === 0) return 0;
  
  // Count mastered concepts that appear in curriculum
  const masteredInCurriculum = learningPath.masteredConcepts.filter(item => 
    course.curriculumMap.has(item.concept)
  ).length;
  
  return Math.round((masteredInCurriculum / totalConcepts) * 100);
}

/**
 * Get recommended next assessment based on learning path
 * @param {String} studentId - The student's ID
 * @param {String} courseId - The course ID
 * @returns {Object} Recommended next assessment
 */
exports.getRecommendedAssessment = async (studentId, courseId) => {
  try {
    // Get student's learning path
    const learningPath = await LearningPath.findOne({
      student: studentId,
      course: courseId
    });
    
    if (!learningPath) {
      throw new Error('Learning path not found');
    }
    
    // Get all course assessments
    const course = await Course.findById(courseId).populate('assessments');
    
    if (!course || !course.assessments || course.assessments.length === 0) {
      return null;
    }
    
    // Find completed assessments
    const completedAssessmentIds = new Set();
    for (const progressEntry of learningPath.progressHistory) {
      progressEntry.assessmentsCompleted.forEach(id => completedAssessmentIds.add(id.toString()));
    }
    
    // Filter out completed assessments
    const incompleteAssessments = course.assessments.filter(
      assessment => !completedAssessmentIds.has(assessment._id.toString())
    );
    
    if (incompleteAssessments.length === 0) {
      return null; // All assessments completed
    }
    
    // Score assessments based on alignment with learning path
    const scoredAssessments = incompleteAssessments.map(assessment => {
      let relevanceScore = 0;
      
      // Check if assessment covers weak concepts
      for (const question of assessment.questions) {
        for (const concept of question.relatedConcepts) {
          // Check if concept is in weak concepts
          const isWeakConcept = learningPath.weakConcepts.some(wc => 
            wc.concept.toLowerCase() === concept.toLowerCase()
          );
          
          if (isWeakConcept) {
            relevanceScore += 2; // Higher weight for weak concepts
          }
        }
      }
      
      // Consider difficulty level
      const difficultyMatch = assessment.questions.some(q => {
        if (learningPath.currentLevel === 'beginner' && q.difficultyLevel <= 2) return true;
        if (learningPath.currentLevel === 'intermediate' && q.difficultyLevel >= 2 && q.difficultyLevel <= 4) return true;
        if (learningPath.currentLevel === 'advanced' && q.difficultyLevel >= 3) return true;
        return false;
      });
      
      if (difficultyMatch) {
        relevanceScore += 1;
      }
      
      return {
        assessment,
        relevanceScore
      };
    });
    
    // Sort by relevance score and return top recommendation
    scoredAssessments.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    return scoredAssessments[0].assessment;
  } catch (error) {
    console.error('Error getting recommended assessment:', error);
    throw error;
  }
};

module.exports = exports;