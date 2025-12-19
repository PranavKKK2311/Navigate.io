const axios = require('axios');
require('dotenv').config();

/**
 * Expert Panel AI Service
 * 
 * This service provides specialized feedback from different expert perspectives:
 * 1. Fact Checker - Focuses on factual accuracy and correctness
 * 2. Concept Analyzer - Evaluates understanding of core concepts
 * 3. Clarity Evaluator - Assesses communication clarity and organization
 * 4. Critical Thinking Evaluator - Assesses depth of analysis and reasoning
 * 5. Domain Expert - Provides subject-specific expertise feedback
 */
class ExpertPanelService {
  constructor() {
    this.gemini = axios.create({
      baseURL: 'https://generativelanguage.googleapis.com/v1/models',
      headers: {
        'Content-Type': 'application/json'
      },
      params: {
        key: process.env.GEMINI_API_KEY
      }
    });

    // Configure expert types
    this.availableExperts = [
      'fact-checker',
      'concept-analyzer',
      'clarity-evaluator',
      'critical-thinking-evaluator',
      'domain-expert'
    ];

    // Gemini model to use
    this.geminiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  }

  /**
   * Get feedback from a panel of AI experts
   * 
   * @param {String} question - The assessment question
   * @param {String} studentAnswer - The student's answer
   * @param {Object} options - Options for expert panel analysis
   * @param {String} options.groundTruth - The reference answer (optional)
   * @param {Array} options.relatedConcepts - Array of related concepts (optional)
   * @param {Array} options.experts - Array of expert types to consult (optional, defaults to all)
   * @param {String} options.domain - Subject domain for domain expert (optional)
   * @returns {Array} Expert feedback from different perspectives
   */
  async getPanelFeedback(question, studentAnswer, options = {}) {
    console.log('Getting expert panel feedback');

    const {
      groundTruth = null,
      relatedConcepts = [],
      experts = this.availableExperts,
      domain = null
    } = options;

    try {
      // Filter to only include valid expert types
      const validExperts = experts.filter(e => this.availableExperts.includes(e));

      if (validExperts.length === 0) {
        return this._getDefaultFeedback();
      }

      // Run expert analyses based on requested types
      const expertPromises = [];

      if (validExperts.includes('fact-checker')) {
        expertPromises.push(this._factCheckerAnalysis(question, studentAnswer, groundTruth));
      }

      if (validExperts.includes('concept-analyzer')) {
        expertPromises.push(this._conceptualAnalysis(question, studentAnswer, relatedConcepts));
      }

      if (validExperts.includes('clarity-evaluator')) {
        expertPromises.push(this._clarityAnalysis(studentAnswer));
      }

      if (validExperts.includes('critical-thinking-evaluator')) {
        expertPromises.push(this._criticalThinkingAnalysis(question, studentAnswer));
      }

      if (validExperts.includes('domain-expert') && domain) {
        expertPromises.push(this._domainExpertAnalysis(question, studentAnswer, groundTruth, domain));
      }

      // Wait for all expert analyses to complete
      const expertResults = await Promise.all(expertPromises);

      // Map results to include expert role
      return expertResults.map((result, index) => ({
        role: validExperts[index],
        feedback: result.feedback,
        suggestions: result.suggestions,
        score: result.score || null
      }));
    } catch (error) {
      console.error('Error getting expert panel feedback:', error);
      return this._getDefaultFeedback();
    }
  }

  /**
   * Get a consensus evaluation from the expert panel
   * 
   * @param {Array} expertFeedback - Array of expert feedback objects
   * @returns {Object} Consolidated feedback and overall evaluation
   */
  async getConsensusEvaluation(expertFeedback) {
    try {
      if (!expertFeedback || expertFeedback.length === 0) {
        return {
          overallFeedback: "Unable to provide a consensus evaluation without expert feedback.",
          strengths: [],
          weaknesses: [],
          recommendedScore: null
        };
      }

      // Extract all feedback and suggestions for the prompt
      const feedbackSummary = expertFeedback.map(expert =>
        `Expert: ${expert.role}\nFeedback: ${expert.feedback}\nSuggestions: ${expert.suggestions.join(', ')}`
      ).join('\n\n');

      const prompt = `
You are a senior educational evaluator synthesizing feedback from multiple expert reviewers.

EXPERT FEEDBACK:
${feedbackSummary}

Based on the collective input from these experts, provide:
1. A cohesive overall evaluation summarizing the key points (3-4 sentences)
2. A list of 2-3 clear strengths identified across multiple experts
3. A list of 2-3 key areas for improvement mentioned by multiple experts
4. A recommended overall score on a scale of 0-100 that reflects the consensus view

Format your response as a JSON object with the following structure:
{
  "overallFeedback": "your cohesive evaluation",
  "strengths": ["strength 1", "strength 2", ...],
  "weaknesses": ["weakness 1", "weakness 2", ...],
  "recommendedScore": numeric_score
}
      `;

      // Request body for Gemini
      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [{ text: `As an educational assessment expert who synthesizes multiple perspectives: ${prompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 800,
          topP: 0.9,
          topK: 40
        }
      };

      const response = await this.gemini.post(
        `/${this.geminiModel}:generateContent`,
        requestBody
      );

      // Parse the Gemini response
      const content = response.data.candidates[0].content.parts[0].text;
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}') + 1;
      return JSON.parse(content.substring(jsonStart, jsonEnd));
    } catch (error) {
      console.error('Error getting consensus evaluation:', error);
      return {
        overallFeedback: "An error occurred while generating the consensus evaluation.",
        strengths: [],
        weaknesses: [],
        recommendedScore: null
      };
    }
  }

  /**
   * Fact checker analysis - focuses on factual accuracy and correctness
   * @private
   */
  async _factCheckerAnalysis(question, studentAnswer, groundTruth) {
    try {
      const prompt = `
You are an academic fact checker analyzing a student's answer.

Question: ${question}

Student Answer: ${studentAnswer}

${groundTruth ? `Reference Answer: ${groundTruth}` : ''}

As a fact checker, your job is to:
1. Identify any factual errors or inaccuracies in the student's answer
2. Highlight missing key facts that should be included
3. Note any misinterpretations of concepts or theories

Provide:
1. A concise analysis of factual accuracy (max 3 sentences)
2. A score from 0-100 representing factual accuracy
3. A bulleted list of 2-3 specific suggestions for improving factual accuracy

Format your response as:
{
  "feedback": "your factual analysis here",
  "score": numeric_score,
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}
`;

      return await this._getExpertAnalysis(prompt);
    } catch (error) {
      console.error('Error in fact checker analysis:', error);
      return {
        feedback: 'Unable to complete fact checking. Please verify factual accuracy manually.',
        suggestions: ['Verify key facts against reliable sources'],
        score: null
      };
    }
  }

  /**
   * Conceptual analysis - focuses on understanding of core concepts
   * @private
   */
  async _conceptualAnalysis(question, studentAnswer, relatedConcepts = []) {
    try {
      const prompt = `
You are an expert in conceptual analysis evaluating a student's understanding of key concepts.

Question: ${question}

Student Answer: ${studentAnswer}

${relatedConcepts.length > 0 ? `Related Concepts: ${relatedConcepts.join(', ')}` : ''}

As a concept analyzer, your job is to:
1. Assess how well the student demonstrates understanding of core concepts
2. Identify connections between concepts that the student made or missed
3. Evaluate the depth of conceptual understanding

Provide:
1. A concise analysis of conceptual understanding (max 3 sentences)
2. A score from 0-100 representing conceptual understanding
3. A bulleted list of 2-3 specific suggestions for improving conceptual depth

Format your response as:
{
  "feedback": "your conceptual analysis here",
  "score": numeric_score,
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}
`;

      return await this._getExpertAnalysis(prompt);
    } catch (error) {
      console.error('Error in conceptual analysis:', error);
      return {
        feedback: 'Unable to complete conceptual analysis. Please review the depth of understanding manually.',
        suggestions: ['Focus on clearly articulating how concepts relate to each other'],
        score: null
      };
    }
  }

  /**
   * Clarity analysis - focuses on communication and presentation
   * @private
   */
  async _clarityAnalysis(studentAnswer) {
    try {
      const prompt = `
You are an expert in clear communication evaluating a student's writing clarity.

Student Answer: ${studentAnswer}

As a clarity evaluator, your job is to:
1. Assess the organization and structure of the response
2. Evaluate the clarity of expression and language usage
3. Check for logical flow and coherence

Provide:
1. A concise analysis of the communication clarity (max 3 sentences)
2. A score from 0-100 representing clarity of communication
3. A bulleted list of 2-3 specific suggestions for improving clarity and organization

Format your response as:
{
  "feedback": "your clarity analysis here",
  "score": numeric_score,
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}
`;

      return await this._getExpertAnalysis(prompt);
    } catch (error) {
      console.error('Error in clarity analysis:', error);
      return {
        feedback: 'Unable to complete clarity analysis. Please review for clear organization manually.',
        suggestions: ['Ensure your response has a logical structure'],
        score: null
      };
    }
  }

  /**
   * Critical thinking analysis - focuses on depth of analysis and reasoning
   * @private
   */
  async _criticalThinkingAnalysis(question, studentAnswer) {
    try {
      const prompt = `
You are an expert in critical thinking and analytical reasoning evaluating a student's response.

Question: ${question}

Student Answer: ${studentAnswer}

As a critical thinking evaluator, your job is to:
1. Assess the depth of analysis in the student's response
2. Evaluate their ability to consider multiple perspectives
3. Check for evidence of reasoned arguments and logical conclusions
4. Identify any logical fallacies or unsupported assertions

Provide:
1. A concise analysis of critical thinking quality (max 3 sentences)
2. A score from 0-100 representing critical thinking ability
3. A bulleted list of 2-3 specific suggestions for improving analytical depth

Format your response as:
{
  "feedback": "your critical thinking analysis here",
  "score": numeric_score,
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}
`;

      return await this._getExpertAnalysis(prompt);
    } catch (error) {
      console.error('Error in critical thinking analysis:', error);
      return {
        feedback: 'Unable to complete critical thinking analysis. Please review depth of analysis manually.',
        suggestions: ['Consider strengthening your arguments with specific evidence'],
        score: null
      };
    }
  }

  /**
   * Domain expert analysis - provides subject-specific expertise
   * @private
   */
  async _domainExpertAnalysis(question, studentAnswer, groundTruth, domain) {
    try {
      const prompt = `
You are an expert in ${domain} evaluating a student's response to a question in this field.

Question: ${question}

Student Answer: ${studentAnswer}

${groundTruth ? `Reference Answer: ${groundTruth}` : ''}

As a domain expert in ${domain}, your job is to:
1. Evaluate the technical accuracy of the response within this specific field
2. Assess the student's use of domain-specific terminology and concepts
3. Consider how well the answer reflects current understanding in the field
4. Identify any field-specific improvements that could be made

Provide:
1. A concise domain-specific analysis (max 3 sentences)
2. A score from 0-100 representing domain mastery
3. A bulleted list of 2-3 specific suggestions for improving domain expertise

Format your response as:
{
  "feedback": "your domain-specific analysis here",
  "score": numeric_score, 
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}
`;

      return await this._getExpertAnalysis(prompt);
    } catch (error) {
      console.error(`Error in ${domain} domain expert analysis:`, error);
      return {
        feedback: `Unable to complete ${domain} expert analysis. Please have a subject matter expert review.`,
        suggestions: [`Review current literature in ${domain} to strengthen your answer`],
        score: null
      };
    }
  }

  /**
   * Helper method to make API calls for expert analysis
   * @private
   */
  async _getExpertAnalysis(prompt) {
    try {
      // Request body for Gemini
      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [{ text: `As an expert educational evaluator: ${prompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
          topP: 0.9,
          topK: 40
        }
      };

      const response = await this.gemini.post(
        `/${this.geminiModel}:generateContent`,
        requestBody
      );

      const content = response.data.candidates[0].content.parts[0].text.trim();

      // Parse JSON response
      try {
        const jsonStartIndex = content.indexOf('{');
        const jsonEndIndex = content.lastIndexOf('}') + 1;

        if (jsonStartIndex >= 0 && jsonEndIndex > 0) {
          const jsonContent = content.substring(jsonStartIndex, jsonEndIndex);
          return JSON.parse(jsonContent);
        } else {
          throw new Error('Could not find valid JSON in the response');
        }
      } catch (parseError) {
        console.error('Error parsing expert analysis response:', parseError);

        // Attempt to extract information from non-JSON response
        const feedbackMatch = content.match(/feedback:(.+?)(?=suggestions:|score:|$)/i);
        const suggestionsMatch = content.match(/suggestions:(.+?)(?=feedback:|score:|$)/i);
        const scoreMatch = content.match(/score:(.+?)(?=feedback:|suggestions:|$)/i);

        return {
          feedback: feedbackMatch ? feedbackMatch[1].trim() : 'Analysis not available',
          suggestions: suggestionsMatch
            ? suggestionsMatch[1].split(/[-*•]/).map(s => s.trim()).filter(s => s.length > 0)
            : ['Review your answer for accuracy and clarity'],
          score: scoreMatch ? parseInt(scoreMatch[1].trim(), 10) : null
        };
      }
    } catch (error) {
      console.error('Error calling expert analysis API:', error);
      return {
        feedback: 'Unable to complete analysis due to a technical error.',
        suggestions: ['Please try again later or contact support.'],
        score: null
      };
    }
  }

  /**
   * Default feedback when API calls fail
   * @private
   */
  _getDefaultFeedback() {
    return [
      {
        role: 'fact-checker',
        feedback: 'Error analyzing facts. Please review manually.',
        suggestions: ['Ensure all key facts are verified with reliable sources'],
        score: null
      },
      {
        role: 'concept-analyzer',
        feedback: 'Error analyzing conceptual understanding. Please review manually.',
        suggestions: ['Review core concepts related to this topic'],
        score: null
      },
      {
        role: 'clarity-evaluator',
        feedback: 'Error analyzing clarity. Please review manually.',
        suggestions: ['Ensure your answer is clearly structured and easy to follow'],
        score: null
      }
    ];
  }
}

module.exports = new ExpertPanelService();