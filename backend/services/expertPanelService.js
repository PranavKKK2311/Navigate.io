const { Configuration, OpenAIApi } = require('openai');

// Configure OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/**
 * Get feedback from a panel of AI experts
 * @param {String} question - The assessment question
 * @param {String} studentAnswer - The student's answer
 * @param {String} groundTruth - The reference answer
 * @param {Array} relatedConcepts - Array of related concepts
 * @returns {Array} Expert feedback from different perspectives
 */
exports.getExpertFeedback = async (question, studentAnswer, groundTruth, relatedConcepts) => {
  try {
    // Run all expert analyses in parallel
    const [factChecker, conceptAnalyzer, clarityChecker] = await Promise.all([
      factCheckerAnalysis(question, studentAnswer, groundTruth),
      conceptualAnalysis(question, studentAnswer, relatedConcepts),
      clarityAnalysis(studentAnswer)
    ]);
    
    return [
      {
        role: 'fact-checker',
        feedback: factChecker.feedback,
        suggestions: factChecker.suggestions
      },
      {
        role: 'concept-analyzer',
        feedback: conceptAnalyzer.feedback,
        suggestions: conceptAnalyzer.suggestions
      },
      {
        role: 'clarity-checker',
        feedback: clarityChecker.feedback,
        suggestions: clarityChecker.suggestions
      }
    ];
  } catch (error) {
    console.error('Error getting expert panel feedback:', error);
    return [
      {
        role: 'fact-checker',
        feedback: 'Error analyzing facts. Please review manually.',
        suggestions: ['Ensure all key facts are verified with reliable sources']
      },
      {
        role: 'concept-analyzer',
        feedback: 'Error analyzing conceptual understanding. Please review manually.',
        suggestions: ['Review core concepts related to this topic']
      },
      {
        role: 'clarity-checker',
        feedback: 'Error analyzing clarity. Please review manually.',
        suggestions: ['Ensure your answer is clearly structured and easy to follow']
      }
    ];
  }
};

/**
 * Fact checker analysis - focuses on factual accuracy and correctness
 */
async function factCheckerAnalysis(question, studentAnswer, groundTruth) {
  try {
    const prompt = `
      You are an academic fact checker analyzing a student's answer.
      
      Question: ${question}
      
      Student Answer: ${studentAnswer}
      
      Reference Answer: ${groundTruth}
      
      As a fact checker, your job is to:
      1. Identify any factual errors or inaccuracies in the student's answer
      2. Highlight missing key facts that should be included
      3. Note any misinterpretations of concepts or theories
      
      Provide:
      1. A concise analysis of factual accuracy (max 3 sentences)
      2. A bulleted list of 2-3 specific suggestions for improving factual accuracy
      
      Format your response as:
      Feedback: [your analysis]
      
      Suggestions:
      - [suggestion 1]
      - [suggestion 2]
      - [suggestion 3]
    `;
    
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      max_tokens: 400,
      temperature: 0.3,
    });
    
    const response = completion.data.choices[0].text.trim();
    
    // Parse response
    const feedbackMatch = response.match(/Feedback:([\s\S]*?)(?=\n\nSuggestions:|$)/i);
    const suggestionsMatch = response.match(/Suggestions:([\s\S]*)/i);
    
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'Analysis not available';
    
    const suggestions = suggestionsMatch
      ? suggestionsMatch[1].split('-')
        .map(item => item.trim())
        .filter(item => item.length > 0)
      : ['Verify all facts against credible sources'];
    
    return { feedback, suggestions };
  } catch (error) {
    console.error('Error in fact checker analysis:', error);
    return { 
      feedback: 'Unable to complete fact checking. Please verify factual accuracy manually.',
      suggestions: ['Verify key facts against reliable sources'] 
    };
  }
}

/**
 * Conceptual analysis - focuses on understanding of core concepts
 */
async function conceptualAnalysis(question, studentAnswer, relatedConcepts) {
  try {
    const prompt = `
      You are an expert in conceptual analysis evaluating a student's understanding of key concepts.
      
      Question: ${question}
      
      Student Answer: ${studentAnswer}
      
      Related Concepts: ${relatedConcepts.join(', ')}
      
      As a concept analyzer, your job is to:
      1. Assess how well the student demonstrates understanding of core concepts
      2. Identify connections between concepts that the student made or missed
      3. Evaluate the depth of conceptual understanding
      
      Provide:
      1. A concise analysis of conceptual understanding (max 3 sentences)
      2. A bulleted list of 2-3 specific suggestions for improving conceptual depth
      
      Format your response as:
      Feedback: [your analysis]
      
      Suggestions:
      - [suggestion 1]
      - [suggestion 2]
      - [suggestion 3]
    `;
    
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      max_tokens: 400,
      temperature: 0.3,
    });
    
    const response = completion.data.choices[0].text.trim();
    
    // Parse response
    const feedbackMatch = response.match(/Feedback:([\s\S]*?)(?=\n\nSuggestions:|$)/i);
    const suggestionsMatch = response.match(/Suggestions:([\s\S]*)/i);
    
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'Analysis not available';
    
    const suggestions = suggestionsMatch
      ? suggestionsMatch[1].split('-')
        .map(item => item.trim())
        .filter(item => item.length > 0)
      : ['Explore the relationships between key concepts in more depth'];
    
    return { feedback, suggestions };
  } catch (error) {
    console.error('Error in conceptual analysis:', error);
    return { 
      feedback: 'Unable to complete conceptual analysis. Please review the depth of understanding manually.',
      suggestions: ['Focus on clearly articulating how concepts relate to each other'] 
    };
  }
}

/**
 * Clarity analysis - focuses on communication and presentation
 */
async function clarityAnalysis(studentAnswer) {
  try {
    const prompt = `
      You are an expert in clear communication evaluating a student's writing clarity.
      
      Student Answer: ${studentAnswer}
      
      As a clarity checker, your job is to:
      1. Assess the organization and structure of the response
      2. Evaluate the clarity of expression and language usage
      3. Check for logical flow and coherence
      
      Provide:
      1. A concise analysis of the communication clarity (max 3 sentences)
      2. A bulleted list of 2-3 specific suggestions for improving clarity and organization
      
      Format your response as:
      Feedback: [your analysis]
      
      Suggestions:
      - [suggestion 1]
      - [suggestion 2]
      - [suggestion 3]
    `;
    
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      max_tokens: 400,
      temperature: 0.3,
    });
    
    const response = completion.data.choices[0].text.trim();
    
    // Parse response
    const feedbackMatch = response.match(/Feedback:([\s\S]*?)(?=\n\nSuggestions:|$)/i);
    const suggestionsMatch = response.match(/Suggestions:([\s\S]*)/i);
    
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'Analysis not available';
    
    const suggestions = suggestionsMatch
      ? suggestionsMatch[1].split('-')
        .map(item => item.trim())
        .filter(item => item.length > 0)
      : ['Structure your answer with clear introduction, body, and conclusion'];
    
    return { feedback, suggestions };
  } catch (error) {
    console.error('Error in clarity analysis:', error);
    return { 
      feedback: 'Unable to complete clarity analysis. Please review for clear organization manually.',
      suggestions: ['Ensure your response has a logical structure'] 
    };
  }
}

module.exports = exports;