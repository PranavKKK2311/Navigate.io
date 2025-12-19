// Add this route to the fixed-assessment.js file

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
