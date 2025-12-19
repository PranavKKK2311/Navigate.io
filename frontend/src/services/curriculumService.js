import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getToken = () => localStorage.getItem('token');

// Create axios instance with auth headers
const authAxios = () => {
  const token = getToken();
  
  // Log token availability for debugging (remove in production)
  console.log(`Auth token available: ${!!token}`);
  
  if (!token) {
    console.warn('No authentication token found. User may need to log in again.');
  }
  
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token
    }
  });
};

/**
 * Generate curriculum mapping using Gemini AI
 * @param {string} courseTitle - Course title
 * @param {string} courseDescription - Course description (optional)
 * @returns {Promise} - Promise with curriculum data
 */
export const generateCurriculumWithAI = async (courseTitle, courseDescription = '') => {
  try {
    const response = await authAxios().post('/curriculum/generate', {
      courseTitle,
      courseDescription
    });
    return response.data;
  } catch (error) {
    console.error('Error generating curriculum:', error);
    throw error;
  }
};

/**
 * Get curriculum mapping for a course
 * @param {string} courseId - Course ID
 * @returns {Promise} - Promise with curriculum data
 */
export const getCurriculumMap = async (courseId) => {
  try {
    const response = await authAxios().get(`/curriculum/map/${courseId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching curriculum map:', error);
    throw error;
  }
};

/**
 * Generate curriculum map using AI based on course title and description
 * @param {string} courseTitle - Course title to generate curriculum for
 * @param {string} courseDescription - Course description to provide context (optional)
 * @returns {Promise} - Promise with success status and generated data
 */
export const generateCurriculumMap = async (courseTitle, courseDescription = '') => {
  try {
    console.log(`Generating curriculum for: "${courseTitle}" with description: "${courseDescription}"`);
    
    // Call the AI generation endpoint with both title and description
    const result = await generateCurriculumWithAI(courseTitle, courseDescription);
    
    // Check if the response contains the data property
    if (!result.data) {
      console.error('Unexpected response format:', result);
      throw new Error('Invalid response format from server');
    }
    
    const curriculumData = result.data;
    
    // Extract topics and learning outcomes from the response
    const topics = curriculumData.topics || [];
    const learningOutcomes = curriculumData.learningOutcomes || [];
    
    console.log('Generated topics:', topics);
    console.log('Generated learning outcomes:', learningOutcomes);
    
    return {
      success: true,
      data: {
        topics: topics,
        outcomes: learningOutcomes.map(outcome => ({
          text: outcome.text,
          bloom: outcome.bloom,
          competency: outcome.competency
        }))
      }
    };
  } catch (error) {
    console.error('Error in curriculum generation:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate curriculum'
    };
  }
};

/**
 * Generate learning outcomes based on course topics using Gemini AI
 * @param {string} courseTitle - Course title
 * @param {string} courseDescription - Course description
 * @param {Array} topics - Array of course topics
 * @returns {Promise} - Promise with generated learning outcomes
 */
export const generateLearningOutcomesFromTopics = async (courseTitle, courseDescription, topics) => {
  try {
    console.log(`Generating learning outcomes for topics: "${topics.join(', ')}"`);
    
    const response = await authAxios().post('/curriculum/generate-outcomes', {
      courseTitle,
      courseDescription,
      topics
    });
    
    if (!response.data || !response.data.learningOutcomes) {
      throw new Error('Invalid response format from server');
    }
    
    return {
      success: true,
      data: {
        outcomes: response.data.learningOutcomes.map(outcome => ({
          text: outcome.text,
          bloom: outcome.bloom,
          competency: outcome.competency
        }))
      }
    };
  } catch (error) {
    console.error('Error generating learning outcomes:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate learning outcomes'
    };
  }
};

/**
 * Generate learning outcomes directly from course description using Gemini AI
 * @param {string} courseTitle - Course title
 * @param {string} courseDescription - Course description (contains the topics)
 * @returns {Promise} - Promise with generated learning outcomes
 */
export const generateLearningOutcomesFromDescription = async (courseTitle, courseDescription) => {
  try {
    console.log(`Generating learning outcomes from description for: "${courseTitle}"`);
    
    const response = await authAxios().post('/curriculum/generate-outcomes-from-description', {
      courseTitle,
      courseDescription
    });
    
    if (!response.data || !response.data.learningOutcomes) {
      throw new Error('Invalid response format from server');
    }
    
    return {
      success: true,
      data: {
        outcomes: response.data.learningOutcomes.map(outcome => ({
          text: outcome.text,
          bloom: outcome.bloom,
          competency: outcome.competency
        }))
      }
    };
  } catch (error) {
    console.error('Error generating learning outcomes:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate learning outcomes'
    };
  }
};

export default {
  generateCurriculumWithAI,
  getCurriculumMap,
  generateCurriculumMap,
  generateLearningOutcomesFromTopics,
  generateLearningOutcomesFromDescription
};