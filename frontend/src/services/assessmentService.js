import axios from 'axios';

// API URL from environment or default to localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to include auth token in requests
const configureAxios = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token
    }
  };
};

/**
 * Upload syllabus file to the server
 * @param {File} file - The syllabus file to upload
 * @param {Object} metadata - Additional metadata about the syllabus
 * @returns {Promise} Promise with upload results
 */
export const uploadSyllabus = async (file, metadata = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add any metadata as additional form fields
    if (metadata) {
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });    }
    
    const response = await axios.post(`${API_URL}/instructor/assessment/upload-syllabus`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-auth-token': localStorage.getItem('token')
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading syllabus:', error);
    throw error;
  }
};

/**
 * Analyze syllabus content with AI
 * @param {string} syllabusContent - Extracted text content from syllabus
 * @param {string} courseId - Optional course ID to associate with
 * @returns {Promise} Promise with syllabus analysis
 */
export const analyzeSyllabus = async (syllabusContent, courseId) => {
  try {
    const response = await axios.post(
      `${API_URL}/instructor/assessment/analyze-syllabus`, 
      { syllabusContent, courseId }, 
      configureAxios()
    );
    return response.data.syllabusAnalysis;
  } catch (error) {
    console.error('Error analyzing syllabus:', error);
    throw error;
  }
};

/**
 * Generate an assessment based on syllabus analysis
 * @param {Object} syllabusAnalysis - The analyzed syllabus data
 * @param {Object} preferences - Assessment generation preferences
 * @param {string} courseId - Optional course ID to associate with
 * @returns {Promise} Promise with the generated assessment
 */
export const generateAssessment = async (syllabusAnalysis, pattern, courseId) => {
  try {
    // Make request to generate assessment
    const response = await axios.post(
      `${API_URL}/instructor/assessment/generate-questions`,
      { 
        syllabusAnalysis, 
        pattern,
        courseId 
      },
      configureAxios()
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to generate assessment');
    }
    
    return response.data.assessment;
  } catch (error) {
    console.error('Error generating assessment:', error);
    throw error;
  }
};

/**
 * Get a list of analyzed syllabi
 * @returns {Promise} Promise with the list of syllabi
 */
export const getSyllabiList = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/instructor/assessment/syllabus/list`,
      configureAxios()
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to get syllabi list');
    }
    
    return response.data.syllabi;
  } catch (error) {
    console.error('Error getting syllabi list:', error);
    throw error;
  }
};

/**
 * Get a specific syllabus analysis by ID
 * @param {string} id - The ID of the syllabus analysis
 * @returns {Promise} Promise with the syllabus analysis
 */
export const getSyllabusAnalysis = async (id) => {
  try {
    const response = await axios.get(
      `${API_URL}/instructor/assessment/syllabus/${id}`,
      configureAxios()
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to get syllabus analysis');
    }
    
    return response.data.syllabusAnalysis;
  } catch (error) {
    console.error('Error getting syllabus analysis:', error);
    throw error;
  }
};

/**
 * Iterate on a quiz based on feedback
 * @param {string} syllabusId - The ID of the syllabus
 * @param {Object} currentQuiz - The current quiz
 * @param {string} feedback - Feedback for improvement
 * @param {Object} parameters - Quiz parameters
 * @returns {Promise} Promise with the iterated quiz
 */
export const iterateQuiz = async (syllabusId, currentQuiz, feedback, parameters) => {
  try {
    const response = await axios.post(
      `${API_URL}/instructor/assessment/iterate-quiz`,
      {
        syllabusId,
        currentQuiz,
        feedback,
        parameters
      },
      configureAxios()
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to iterate quiz');
    }
    
    return response.data.iteratedQuiz;
  } catch (error) {
    console.error('Error iterating quiz:', error);
    throw error;
  }
};