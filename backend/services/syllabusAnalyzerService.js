/**
 * Service layer for syllabus analysis functionality
 * This file bridges the backend API with the AI service implementation
 */

// Import the core syllabusAnalyzer implementation from the AI services
const syllabusAnalyzer = require('../../ai_services/assessment/syllabusAnalyzer');

/**
 * Extract text from an uploaded file
 * @param {Object} file - Uploaded file object from multer
 * @returns {Promise<string>} - Extracted text content
 */
exports.extractTextFromFile = async (file) => {
  try {
    return await syllabusAnalyzer.extractTextFromFile(file);
  } catch (error) {
    console.error('Error in extractTextFromFile service:', error);
    throw new Error(`Failed to extract text from file: ${error.message}`);
  }
};

/**
 * Analyze syllabus content
 * @param {string} syllabusContent - Raw text content of the syllabus
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} - Structured syllabus analysis
 */
exports.analyzeSyllabus = async (syllabusContent, options = {}) => {
  try {
    return await syllabusAnalyzer.analyzeSyllabus(syllabusContent, options);
  } catch (error) {
    console.error('Error in analyzeSyllabus service:', error);
    throw new Error(`Failed to analyze syllabus: ${error.message}`);
  }
};

/**
 * Extract topics from syllabus content
 * @param {string} syllabusContent - Raw text content of the syllabus
 * @returns {Promise<Object>} - Object containing the extracted topics
 */
exports.extractTopicsFromSyllabus = async (syllabusContent) => {
  try {
    // Use the syllabusAnalyzer to extract topics
    const topics = await syllabusAnalyzer.extractTopicsFromSyllabus(syllabusContent);
    return topics;
  } catch (error) {
    console.error('Error in extractTopicsFromSyllabus service:', error);
    throw new Error(`Failed to extract topics from syllabus: ${error.message}`);
  }
};

/**
 * Get list of analyzed syllabi
 * @returns {Promise<Array>} - List of syllabi
 */
exports.getSyllabiList = async () => {
  try {
    return await syllabusAnalyzer.getSyllabiList();
  } catch (error) {
    console.error('Error in getSyllabiList service:', error);
    throw new Error(`Failed to get syllabi list: ${error.message}`);
  }
};

/**
 * Generate a quick quiz based on syllabus analysis
 * @param {Object} syllabusAnalysis - The analyzed syllabus data
 * @param {Object} quizParameters - Parameters for quiz generation
 * @returns {Promise<Object>} - The generated quiz
 */
exports.generateQuickQuiz = async (syllabusAnalysis, quizParameters = {}) => {
  try {
    return await syllabusAnalyzer.generateQuickQuiz(syllabusAnalysis, quizParameters);
  } catch (error) {
    console.error('Error in generateQuickQuiz service:', error);
    throw new Error(`Failed to generate quiz: ${error.message}`);
  }
};

/**
 * Generate assessment based on syllabus analysis
 * @param {Object} syllabusAnalysis - The analyzed syllabus data
 * @param {Object} preferences - Assessment generation preferences
 * @returns {Promise<Object>} - The generated assessment
 */
exports.generateAssessment = async (syllabusAnalysis, preferences = {}) => {
  try {
    return await syllabusAnalyzer.generateAssessment(syllabusAnalysis, preferences);
  } catch (error) {
    console.error('Error in generateAssessment service:', error);
    throw new Error(`Failed to generate assessment: ${error.message}`);
  }
};

/**
 * Store syllabus analysis in cache or database
 * @param {string} id - Identifier for the syllabus analysis
 * @param {Object} analysis - The syllabus analysis object
 * @returns {Promise<boolean>} - Success indicator
 */
exports.storeSyllabusAnalysis = async (id, analysis) => {
  try {
    // This would normally save to a database
    // For now, we'll use a simple in-memory storage
    global.syllabusCache = global.syllabusCache || {};
    global.syllabusCache[id] = {
      analysis,
      timestamp: new Date()
    };
    return true;
  } catch (error) {
    console.error('Error in storeSyllabusAnalysis service:', error);
    return false;
  }
};

/**
 * Retrieve syllabus analysis from cache or database
 * @param {string} id - Identifier for the syllabus analysis
 * @returns {Promise<Object|null>} - The syllabus analysis or null if not found
 */
exports.getSyllabusAnalysis = async (id) => {
  try {
    // This would normally retrieve from a database
    // For now, we'll use a simple in-memory storage
    global.syllabusCache = global.syllabusCache || {};
    return global.syllabusCache[id]?.analysis || null;
  } catch (error) {
    console.error('Error in getSyllabusAnalysis service:', error);
    return null;
  }
};

module.exports = exports;