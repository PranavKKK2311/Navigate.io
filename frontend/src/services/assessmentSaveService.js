// assessmentSaveService.js
import axios from 'axios';

/**
 * Save an assessment to both localStorage and the backend server
 * @param {Object} assessmentData - The assessment data to save
 * @returns {Promise<Object>} The response from the backend
 */
export const saveAssessment = async (assessmentData) => {
  console.log('=== SAVING ASSESSMENT ===');
  console.log('Assessment data:', assessmentData);

  // Prepare assessment data with proper visibility flags
  const preparedAssessmentData = {
    ...assessmentData,
    // Transform questions to match backend schema (type instead of questionType)
    questions: (assessmentData.questions || []).map(q => ({
      text: q.text || q.question,  // Ensure text field is set
      type: q.type || q.questionType,  // Map questionType to type
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      points: q.points || 1,
      explanation: q.explanation
    })),
    // Ensure proper visibility when assigned to all students
    visibleToStudents: assessmentData.assignToAllStudents === true ? true : (assessmentData.visibleToStudents || false),
    status: assessmentData.assignToAllStudents === true ? 'published' : (assessmentData.status || 'draft'),
    isPublished: assessmentData.assignToAllStudents === true ? true : (assessmentData.isPublished || false),
    courseId: assessmentData.courseId,
    // courseName: assessmentData.courseName // Removed hardcoded fallback
  };

  console.log('Prepared assessment data:', preparedAssessmentData);

  // Save to localStorage first
  try {
    const savedAssessmentsString = localStorage.getItem('savedAssessments');
    let savedAssessments = [];

    if (savedAssessmentsString) {
      savedAssessments = JSON.parse(savedAssessmentsString);
    }

    // Check if we're updating an existing assessment
    const existingIndex = savedAssessments.findIndex(a => a.id === preparedAssessmentData.id);

    if (existingIndex >= 0) {
      savedAssessments[existingIndex] = preparedAssessmentData;
    } else {
      savedAssessments.push(preparedAssessmentData);
    }

    localStorage.setItem('savedAssessments', JSON.stringify(savedAssessments));
    console.log('Assessment saved to localStorage');
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }

  // Save to backend API
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post('/api/assessment/save', preparedAssessmentData, {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json'
      }
    });

    console.log('Assessment saved to backend:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error saving assessment to backend:', error);
    throw new Error(`Failed to save assessment: ${error.message}`);
  }
};

/**
 * Publish an assessment to make it visible to students
 * @param {string} assessmentId - The ID of the assessment to publish
 * @param {boolean} makeVisibleToStudents - Whether to make the assessment visible to students (default: true)
 * @returns {Promise<Object>} The response from the backend
 */
export const publishAssessment = async (assessmentId, makeVisibleToStudents = true) => {
  try {
    // First, get the assessment from localStorage
    const savedAssessmentsString = localStorage.getItem('savedAssessments');
    if (!savedAssessmentsString) {
      throw new Error('No saved assessments found');
    }

    const savedAssessments = JSON.parse(savedAssessmentsString);
    const assessment = savedAssessments.find(a => a.id === assessmentId);

    if (!assessment) {
      throw new Error(`Assessment with ID ${assessmentId} not found`);
    }

    // Set the assessment as published - use explicit status values used in the API
    assessment.isPublished = true;
    assessment.status = 'published';
    assessment.assignToAllStudents = true;

    // Only set visibleToStudents if the caller explicitly wants it to be visible
    assessment.visibleToStudents = makeVisibleToStudents;

    // Add timestamp for when it was published
    assessment.publishedAt = new Date().toISOString();

    // Save the updated assessment
    return saveAssessment(assessment);
  } catch (error) {
    console.error('Error publishing assessment:', error);
    throw new Error(`Failed to publish assessment: ${error.message}`);
  }
};

/**
 * Set an assessment's visibility to students without changing its published status
 * @param {string} assessmentId - The ID of the assessment to modify
 * @param {boolean} visibleToStudents - Whether to make the assessment visible to students
 * @returns {Promise<Object>} The response from the backend
 */
export const setAssessmentVisibility = async (assessmentId, visibleToStudents) => {
  try {
    // First, get the assessment from localStorage
    const savedAssessmentsString = localStorage.getItem('savedAssessments');
    if (!savedAssessmentsString) {
      throw new Error('No saved assessments found');
    }

    const savedAssessments = JSON.parse(savedAssessmentsString);
    const assessment = savedAssessments.find(a => a.id === assessmentId);

    if (!assessment) {
      throw new Error(`Assessment with ID ${assessmentId} not found`);
    }

    // Update the visibility flag
    assessment.visibleToStudents = visibleToStudents;

    // Add timestamp for when visibility was changed
    assessment.visibilityUpdatedAt = new Date().toISOString();

    // Save the updated assessment
    return saveAssessment(assessment);
  } catch (error) {
    console.error('Error updating assessment visibility:', error);
    throw new Error(`Failed to update assessment visibility: ${error.message}`);
  }
};
