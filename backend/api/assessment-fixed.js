const express = require('express');
const router = express.Router();
const path = require('path');
const authMiddleware = require('../middlewares/auth');

// This is a fixed version of the assessment.js file
// focusing on the endpoint that had syntax errors

// @route   GET /api/assessment/student/:assessmentId
// @desc    Get assessment for student (filtered to hide instructor-only content)
// @access  Private (Student only)
router.get('/student/:assessmentId', authMiddleware, async (req, res) => {
  try {
    const { assessmentId } = req.params;
    
    console.log(`Fetching assessment ID: ${assessmentId} for student: ${req.user.id}`);
    
    // Priority 1: Get instructor-created assessments from environment variable (backend "database")
    try {
      const savedAssessmentsString = process.env.SAVED_ASSESSMENTS || '[]';
      let savedAssessments = JSON.parse(savedAssessmentsString);
      
      console.log(`Looking for assessment ID: "${assessmentId}" in ${savedAssessments.length} saved assessments`);
      
      // Log the available assessment IDs for debugging
      if (savedAssessments.length > 0) {
        console.log('Available assessment IDs:');
        savedAssessments.forEach(a => console.log(`- ${a.id || a._id}`));
      }
      
      // Find the assessment by ID (case insensitive to be safe)
      const instructorAssessment = savedAssessments.find(a => 
        String(a.id || '').toLowerCase() === assessmentId.toLowerCase() || 
        String(a._id || '').toLowerCase() === assessmentId.toLowerCase()
      );
      
      if (instructorAssessment) {
        console.log(`Found instructor-created assessment in backend storage: ${instructorAssessment.title}`);
        
        // Filter out the answers and other instructor-only content
        const filteredQuestions = instructorAssessment.questions.map(question => {
          // Create a student-safe version of each question
          const studentQuestion = {
            id: question.id || question._id,
            text: question.text || question.question, // Handle different property naming
            type: question.type || question.questionType?.toLowerCase(), // Normalize question type
            options: question.options || [],
            points: question.points || 1,
            // Omit the correctAnswer, explanation, and other instructor-only fields
          };
          
          return studentQuestion;
        });
        
        // Return the filtered assessment
        return res.status(200).json({
          success: true,
          assessment: {
            id: instructorAssessment.id || instructorAssessment._id,
            title: instructorAssessment.title,
            description: instructorAssessment.description,
            courseId: instructorAssessment.courseId,
            courseName: instructorAssessment.courseName || 'Course', // Fallback
            timeLimit: instructorAssessment.timeLimit,
            totalPoints: instructorAssessment.totalPoints,
            dueDate: instructorAssessment.dueDate,
            questions: filteredQuestions,
            randomizeQuestions: instructorAssessment.randomizeQuestions || false
          }
        });
      }
    } catch (err) {
      console.warn('Error retrieving assessment from backend storage:', err);
    }
    
    // Priority 2: If not found in backend, try localStorage (for development only)
    // Note: This won't actually work in Node.js backend, but we'll keep it for future use
    console.log('No instructor-created assessment found in backend storage, checking alternatives...');
    
    // If no instructor assessment found, return a simple default for testing
    console.log('No assessment found for ID:', assessmentId);
    
    // Return 404 Not Found
    return res.status(404).json({
      success: false,
      message: `Assessment with ID "${assessmentId}" not found. Make sure you're using the correct assessment ID.`
    });
    
  } catch (error) {
    console.error('Error retrieving assessment for student:', error);
    res.status(500).json({
      success: false,
      message: `Error retrieving assessment: ${error.message}`
    });
  }
});

// Export the router
module.exports = router;
