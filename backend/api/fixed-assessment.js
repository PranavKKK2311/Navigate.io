const express = require('express');
const router = express.Router();
const path = require('path');
const authMiddleware = require('../middlewares/auth');

// This is a simplified version of assessment.js
// Only containing the fixed endpoint we need

// @route   GET /api/assessment/templates/:courseId
// @desc    Get assessment templates (predefined or course-specific)
// @access  Private
router.get('/templates/:courseId', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // If courseId is provided and not 'default', we could load course-specific templates
    // For now, return a set of predefined templates for all courses
    
    const templates = [
      {
        name: "Standard Quiz",
        description: "A balanced assessment with multiple choice and short answer questions",
        difficulty: "Medium",
        timeLimit: 30,
        questionDistribution: [
          { type: "multiple-choice", count: 10, pointsEach: 1 },
          { type: "short-answer", count: 5, pointsEach: 2 }
        ],
        totalPoints: 20,
        isRecommended: true
      },
      {
        name: "Comprehensive Exam",
        description: "In-depth assessment covering all major topics with varied question types",
        difficulty: "Hard",
        timeLimit: 90,
        questionDistribution: [
          { type: "multiple-choice", count: 15, pointsEach: 1 },
          { type: "true-false", count: 10, pointsEach: 1 },
          { type: "short-answer", count: 5, pointsEach: 3 },
          { type: "essay", count: 2, pointsEach: 10 }
        ],
        totalPoints: 50,
        isRecommended: false
      },
      {
        name: "Quick Check",
        description: "Brief assessment to quickly gauge understanding of key concepts",
        difficulty: "Easy",
        timeLimit: 15,
        questionDistribution: [
          { type: "multiple-choice", count: 8, pointsEach: 1 },
          { type: "true-false", count: 7, pointsEach: 1 }
        ],
        totalPoints: 15,
        isRecommended: true
      },
      {
        name: "Conceptual Understanding",
        description: "Focus on deeper understanding with short answer and essay questions",
        difficulty: "Medium",
        timeLimit: 45,
        questionDistribution: [
          { type: "short-answer", count: 8, pointsEach: 2 },
          { type: "essay", count: 2, pointsEach: 7 }
        ],
        totalPoints: 30,
        isRecommended: false
      },
      {
        name: "Practical Application",
        description: "Assessment focused on applying concepts to real-world scenarios",
        difficulty: "Medium",
        timeLimit: 60,
        questionDistribution: [
          { type: "multiple-choice", count: 5, pointsEach: 1 },
          { type: "short-answer", count: 5, pointsEach: 2 },
          { type: "essay", count: 3, pointsEach: 5 }
        ],
        totalPoints: 25,
        isRecommended: true
      }
    ];
    
    // Return templates with success status
    res.status(200).json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error fetching assessment templates:', error);
    res.status(500).json({
      success: false,
      message: `Error fetching templates: ${error.message}`
    });
  }
});

// @route   GET /api/assessment/student/:assessmentId
// @desc    Get assessment for student (filtered to hide instructor-only content)
// @access  Private (Student only)
router.get('/student/:assessmentId', authMiddleware, async (req, res) => {
  try {
    const { assessmentId } = req.params;
    
    console.log(`Fetching assessment ID: "${assessmentId}" for student: ${req.user.id}`);
    
    // Priority 1: Get instructor-created assessments from environment variable (backend "database")
    try {
      const savedAssessmentsString = process.env.SAVED_ASSESSMENTS || '[]';
      let savedAssessments = JSON.parse(savedAssessmentsString);
      
      // Debug logging
      console.log(`Looking for assessment ID "${assessmentId}" in ${savedAssessments.length} saved assessments`);
      
      // Log all available assessments to help with debugging
      if (savedAssessments.length > 0) {
        console.log('Available assessments:');
        savedAssessments.forEach(a => {
          console.log(`- ID: ${a.id || a._id}, Title: ${a.title}, Course: ${a.courseId}`);
        });
      }
      // Find the assessment by ID (case insensitive to be safe)
      const instructorAssessment = savedAssessments.find(a => 
        String(a.id || '').toLowerCase() === assessmentId.toLowerCase() || 
        String(a._id || '').toLowerCase() === assessmentId.toLowerCase()
      );
      
      if (instructorAssessment) {
        console.log(`✅ Found instructor-created assessment: ${instructorAssessment.title} for course: ${instructorAssessment.courseId}`);
        
        // Filter out the answers and other instructor-only content
        const filteredQuestions = instructorAssessment.questions.map(question => {
          // Create a student-safe version of each question
          const studentQuestion = {
            id: question.id || question._id,
            text: question.text || question.question,
            type: question.type || question.questionType?.toLowerCase(),
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
            courseName: instructorAssessment.courseName || 'Course',
            timeLimit: instructorAssessment.timeLimit,
            totalPoints: instructorAssessment.totalPoints,
            dueDate: instructorAssessment.dueDate,
            questions: filteredQuestions,
            randomizeQuestions: instructorAssessment.randomizeQuestions || false
          }
        });
      } else {
        console.log(`❌ No instructor-created assessment found with ID: ${assessmentId}`);
      }
    } catch (err) {
      console.warn('Error retrieving assessment from backend storage:', err);
    }
    
    // If no instructor assessment found, return clear error
    return res.status(404).json({
      success: false,
      message: `Assessment with ID "${assessmentId}" not found. Please ensure the assessment exists in the course and has been published by the instructor.`
    });
    
  } catch (error) {
    console.error('Error retrieving assessment for student:', error);
    res.status(500).json({
      success: false,
      message: `Error retrieving assessment: ${error.message}`
    });
  }
});

// @route   POST /api/assessment/save
// @desc    Save an instructor-created assessment
// @access  Private (Instructor only)
router.post('/save', authMiddleware, async (req, res) => {
  try {
    // Check that user is an instructor
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ 
        success: false, 
        message: 'Permission denied. Only instructors can create assessments.' 
      });
    }
    
    // Get assessment data from request body
    const assessmentData = req.body;
    
    // Validate the assessment data
    if (!assessmentData.id || !assessmentData.title || !assessmentData.courseId) {
      return res.status(400).json({
        success: false,
        message: 'Assessment must include id, title, and courseId'
      });
    }
    
    // Ensure questions exist
    if (!assessmentData.questions || !Array.isArray(assessmentData.questions) || assessmentData.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Assessment must include at least one question'
      });
    }
    
    console.log(`Saving assessment: "${assessmentData.title}" for course: ${assessmentData.courseId}`);
    
    // Get existing assessments
    const savedAssessmentsString = process.env.SAVED_ASSESSMENTS || '[]';
    let savedAssessments = JSON.parse(savedAssessmentsString);
    
    // Check if an assessment with this ID already exists
    const existingIndex = savedAssessments.findIndex(a => 
      (a.id === assessmentData.id || a._id === assessmentData.id)
    );
    
    if (existingIndex >= 0) {
      // Update existing assessment
      savedAssessments[existingIndex] = assessmentData;
      console.log(`Updated existing assessment with ID: ${assessmentData.id}`);
    } else {
      // Add new assessment
      savedAssessments.push(assessmentData);
      console.log(`Added new assessment with ID: ${assessmentData.id}`);
    }
    
    // Save the updated assessments
    process.env.SAVED_ASSESSMENTS = JSON.stringify(savedAssessments);
    
    // Return success
    return res.status(200).json({
      success: true,
      message: 'Assessment saved successfully',
      assessmentId: assessmentData.id
    });
    
  } catch (error) {
    console.error('Error saving assessment:', error);
    return res.status(500).json({
      success: false,
      message: `Error saving assessment: ${error.message}`
    });
  }
});

module.exports = router;
