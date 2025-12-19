// Instructor assessment routes for creating, updating, and managing assessments
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Import models
const Assessment = require('../models/Assessment');
const Submission = require('../models/Submission');

// Import services
const syllabusAnalyzerService = require('../services/syllabusAnalyzerService');
const plagiarismService = require('../services/plagiarismService');
const authMiddleware = require('../middlewares/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueId = crypto.randomBytes(4).toString('hex');
    const fileExt = path.extname(file.originalname);
    cb(null, uniqueId + fileExt);
  }
});

const upload = multer({ storage: storage });

// @route   GET /templates/:courseId
// @desc    Get assessment templates (predefined or course-specific)
// @access  Private (Instructor only)
router.get('/templates/:courseId', authMiddleware, async (req, res) => {
  try {
    // In a real app, this would fetch from a database or be hardcoded types
    const templates = [
      {
        id: 'java-basics-quiz',
        name: 'Java Basics Quiz',
        description: 'A quick assessment covering Java fundamentals and syntax',
        questionTypes: ['multiple-choice', 'true-false'],
        defaultTimeLimit: 30,
        sampleQuestions: [
          {
            type: 'multiple-choice',
            stem: 'Which of the following is not a primitive data type in Java?',
            options: ['int', 'boolean', 'String', 'char'],
            correctAnswer: 'String'
          }
        ]
      },
      {
        id: 'java-data-structures-exam',
        name: 'Java Data Structures Exam',
        description: 'A comprehensive exam covering Java collections framework and data structures implementation',
        questionTypes: ['multiple-choice', 'short-answer', 'essay', 'programming'],
        defaultTimeLimit: 120,
        sampleQuestions: [
          {
            type: 'essay',
            stem: 'Compare and contrast ArrayList and LinkedList in Java. When would you choose one over the other?',
            wordLimit: 500
          }
        ]
      }
    ];

    res.json(templates);
  } catch (err) {
    console.error('Error fetching assessment templates:', err);
    res.status(500).json({ message: 'Server error fetching templates' });
  }
});

// @route   POST /generate-questions
// @desc    Generate questions using AI (Mock for now)
// @access  Private (Instructor only)
router.post('/generate-questions', authMiddleware, async (req, res) => {
  try {
    console.log('Generating questions (Mock AI)...');
    // In a real app, this would call Gemini API
    // For now, return the mock questions concept

    const mockQuestions = [
      {
        question: 'Which design pattern is best suited for this scenario?',
        questionType: 'Multiple Choice',
        options: ['Singleton', 'Factory', 'Observer', 'Strategy'],
        correctAnswer: 'Factory',
        topic: 'Design Patterns',
        difficulty: 'Medium',
        points: 5,
        bloomLevel: 'Apply'
      },
      {
        question: 'Explain the concept of dependency injection.',
        questionType: 'Short Answer',
        correctAnswer: 'Dependency Injection is a design pattern...',
        topic: 'Software Architecture',
        difficulty: 'Hard',
        points: 10,
        bloomLevel: 'Understand'
      }
    ];

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    res.json({
      success: true,
      message: 'Questions generated successfully',
      assessment: {
        questions: mockQuestions
      }
    });
  } catch (err) {
    console.error('Error generating questions:', err);
    res.status(500).json({ message: 'Server error generating questions' });
  }
});

// @route   POST /save
// @desc    Create or update an assessment
// @access  Private (Instructor only)
router.post('/save', authMiddleware, async (req, res) => {
  console.log('=== INSTRUCTOR SAVE ROUTE CALLED ===');
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Questions count:', req.body.questions?.length);
  console.log('First question sample:', JSON.stringify(req.body.questions?.[0], null, 2));

  try {
    const { id, _id, title, description, courseId, questions, timeLimit, isPublished, visibility, dueDate, status, syllabusTitle, pattern } = req.body;

    // Check if we updating an existing assessment (if _id is valid mongo ID)
    let assessment;
    if (_id && _id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('UPDATE path - found _id:', _id);
      assessment = await Assessment.findById(_id);
    }
    // Or if passing id which might be mongo ID
    else if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('UPDATE path - found id:', id);
      assessment = await Assessment.findById(id);
    }

    if (assessment) {
      // Strip generated 'id' field from questions in UPDATE path
      const cleanedQuestions = questions ? questions.map((q, idx) => {
        if (idx === 0) {
          console.log('INSTRUCTOR UPDATE - BEFORE cleaning:', JSON.stringify(q, null, 2));
        }
        const { id, ...questionWithoutId } = q;
        if (idx === 0) {
          console.log('INSTRUCTOR UPDATE - AFTER cleaning:', JSON.stringify(questionWithoutId, null, 2));
          console.log('INSTRUCTOR UPDATE - Removed id:', id);
        }
        return questionWithoutId;
      }) : null;

      // Update existing
      assessment.title = title || assessment.title;
      assessment.description = description || assessment.description;
      assessment.questions = cleanedQuestions || assessment.questions;
      assessment.timeLimit = timeLimit || assessment.timeLimit;
      assessment.isPublished = isPublished !== undefined ? isPublished : assessment.isPublished;
      if (visibility) assessment.visibility = visibility;
      if (dueDate) assessment.dueDate = new Date(dueDate);  // ADD DUEDATE UPDATE

      await assessment.save();
      console.log(`Assessment updated: ${assessment.title}`);
      return res.json(assessment);
    }

    // CHECK FOR DUPLICATE: Prevent publishing same assessment twice
    console.log(`Checking for duplicate: title="${title}", instructor=${req.user.id}`);
    const existingAssessment = await Assessment.findOne({
      title: title,
      createdBy: req.user.id
    });

    if (existingAssessment) {
      console.log(`DUPLICATE BLOCKED: "${title}" already exists (ID: ${existingAssessment._id})`);
      return res.status(409).json({
        success: false,
        message: `An assessment with title "${title}" already exists. Please use a different title or delete the existing one first.`
      });
    }
    console.log('No duplicate found, creating new assessment...');

    // DEBUG: Log questions to verify correctAnswer is included
    console.log(`Received ${questions?.length || 0} questions for assessment`);
    if (questions && questions.length > 0) {
      console.log('First question sample:', JSON.stringify(questions[0], null, 2));
      console.log(`First question correctAnswer: "${questions[0].correctAnswer}"`);
    }

    // Strip generated 'id' field from questions so MongoDB creates proper _id
    const cleanedQuestions = questions ? questions.map(q => {
      const { id, ...questionWithoutId } = q;
      return questionWithoutId;
    }) : [];

    // Create new
    const newAssessment = new Assessment({
      title,
      description,
      courseId,
      timeLimit: timeLimit || 60,
      totalPoints: questions ? questions.reduce((sum, q) => sum + (q.points || 0), 0) : 0,
      status: status || (isPublished ? 'published' : 'draft'),
      isPublished: isPublished || false,
      questions: cleanedQuestions,
      createdBy: req.user.id,
      dueDate: dueDate ? new Date(dueDate) : null,  // ADD DUEDATE TO NEW ASSESSMENT
      syllabusTitle: syllabusTitle || title,
      visibility: visibility || {
        instructorCanSeeAnswers: true,
        studentsCanSeeAnswers: false,
        studentsCanSeeSyllabusTitle: false,
        showResultsImmediately: true
      }
    });

    const saved = await newAssessment.save();
    console.log(`New assessment created: "${title}" (ID: ${saved._id})`);
    console.log(`  Due Date: ${saved.dueDate}`);  // Log dueDate to verify

    res.status(201).json(saved);
  } catch (err) {
    console.error('Error saving assessment:', err);
    res.status(500).json({ message: 'Server error saving assessment' });
  }
});

// @route   GET /course/:courseId/submissions
// @desc    Get all student submissions for a specific course's assessments
// @access  Private (Instructor only)
router.get('/course/:courseId/submissions', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;

    console.log('=== INSTRUCTOR FETCHING COURSE SUBMISSIONS ===');
    console.log('Course ID:', courseId);

    // Check if user is an instructor
    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        success: false,
        message: 'Only instructors can view course submissions'
      });
    }

    // Find assessments for this course to link submissions
    const assessments = await Assessment.find({ courseId });
    const assessmentIds = assessments.map(a => a._id);

    // Find submissions for any assessment in this course
    // Or if we stored courseId on submission (which we did in the new plan), we can query directly
    // Let's check Submission model - it has assessment and student refs.
    // It doesn't explicitly have courseId, so we query via assessments.

    const submissions = await Submission.find({ assessment: { $in: assessmentIds } })
      .populate('student', 'name email') // assuming User model has name/email
      .populate('assessment', 'title courseId')
      .sort({ submittedAt: -1 });

    console.log(`Found ${submissions.length} submissions for course ${courseId}`);

    // Transform submissions for frontend
    const instructorSubmissions = submissions.map(sub => ({
      id: sub._id,
      submissionId: sub._id,
      studentId: sub.student?._id?.toString() || 'Unknown',
      name: sub.student?.name || 'Unknown Student',
      email: sub.student?.email || 'No email',
      studentName: sub.student?.name || 'Unknown Student',
      assessmentId: sub.assessment?._id,
      assessmentTitle: sub.assessment?.title || 'Assessment',
      courseId: sub.assessment?.courseId,
      courseName: 'Course',
      score: sub.overallScore || 0,
      maxScore: sub.assessment?.totalPoints || 100,
      percentage: sub.overallScore || 0,
      isPassed: (sub.overallScore || 0) >= 50,
      status: sub.gradedAt ? 'Passed' : 'Pending',
      gradingStatus: sub.gradedAt ? 'completed' : 'pending',
      submittedAt: sub.submittedAt,
      submissionDate: sub.submittedAt || new Date(),
      timeSpent: sub.timeSpent || 0,
      timeTaken: sub.timeSpent || 0,
      feedbackProvided: !!sub.comments?.length,
      attempts: 1,
      improvement: 0
    }));

    res.json({
      success: true,
      submissions: instructorSubmissions,
      count: instructorSubmissions.length
    });
  } catch (err) {
    console.error('Error fetching submissions:', err);
    res.status(500).json({
      success: false,
      message: 'Server error fetching submissions'
    });
  }
});

// @route   POST /analyze-syllabus
// @desc    Analyze a syllabus to extract assessment opportunities
// @access  Private (Instructor only)
router.post('/analyze-syllabus', authMiddleware, upload.single('syllabus'), async (req, res) => {
  try {
    const syllabusFile = req.file;

    if (!syllabusFile) {
      return res.status(400).json({ message: 'No syllabus file uploaded' });
    }

    // Get file path
    const filePath = syllabusFile.path;

    // Invoke the syllabus analyzer service
    const analysisResults = await syllabusAnalyzerService.analyzeSyllabus(filePath);

    // Delete file after analysis
    fs.unlinkSync(filePath);

    res.json({
      message: 'Syllabus analysis complete',
      results: analysisResults
    });
  } catch (err) {
    console.error('Error analyzing syllabus:', err);
    res.status(500).json({ message: 'Server error analyzing syllabus' });
  }
});

// @route   POST /check-plagiarism
// @desc    Check student submissions for plagiarism
// @access  Private (Instructor only)
router.post('/check-plagiarism', authMiddleware, async (req, res) => {
  try {
    const { assessmentId, submissionIds } = req.body;

    if (!assessmentId || !submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return res.status(400).json({ message: 'Invalid request parameters' });
    }

    // Invoke the plagiarism service
    const plagiarismResults = await plagiarismService.checkPlagiarism(assessmentId, submissionIds);

    res.json({
      message: 'Plagiarism check complete',
      results: plagiarismResults
    });
  } catch (err) {
    console.error('Error checking plagiarism:', err);
    res.status(500).json({ message: 'Server error checking plagiarism' });
  }
});

// @route   GET /my-assessments
// @desc    Get all assessments created by this instructor
// @access  Private (Instructor only)
router.get('/my-assessments', authMiddleware, async (req, res) => {
  try {
    console.log('=== FETCHING INSTRUCTOR ASSESSMENTS ===');
    console.log('Instructor ID:', req.user.id);

    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        success: false,
        message: 'Only instructors can view their assessments'
      });
    }

    // Find all assessments (show all for now since createdBy may not be set on older ones)
    // In production, you'd filter by createdBy: req.user.id
    const assessments = await Assessment.find({})
      .sort({ createdAt: -1 });

    console.log(`Found ${assessments.length} assessments for instructor`);

    // Transform for frontend
    const assessmentList = assessments.map(a => ({
      id: a._id,
      title: a.title,
      description: a.description,
      courseId: a.courseId,
      questionCount: a.questions?.length || 0,
      totalPoints: a.totalPoints || 0,
      timeLimit: a.timeLimit,
      status: a.status || (a.isPublished ? 'published' : 'draft'),
      dueDate: a.dueDate,
      createdAt: a.createdAt
    }));

    res.json({
      success: true,
      assessments: assessmentList,
      count: assessmentList.length
    });
  } catch (err) {
    console.error('Error fetching instructor assessments:', err);
    res.status(500).json({
      success: false,
      message: 'Server error fetching assessments'
    });
  }
});

// @route   DELETE /:id
// @desc    Delete an assessment
// @access  Private (Instructor only, must be creator)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting assessment ${id} for instructor ${req.user.id}`);

    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        success: false,
        message: 'Only instructors can delete assessments'
      });
    }

    // Find the assessment
    const assessment = await Assessment.findById(id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Verify ownership
    if (assessment.createdBy && assessment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete assessments you created'
      });
    }

    // Delete the assessment
    await Assessment.findByIdAndDelete(id);

    // Also delete related submissions (optional - can be kept for records)
    await Submission.deleteMany({ assessment: id });

    console.log(`Assessment ${id} deleted successfully`);

    res.json({
      success: true,
      message: 'Assessment deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting assessment:', err);
    res.status(500).json({
      success: false,
      message: 'Server error deleting assessment'
    });
  }
});

// @route   PUT /:id
// @desc    Update an assessment (title, description, etc.)
// @access  Private (Instructor only, must be creator)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, timeLimit, status } = req.body;

    console.log(`Updating assessment ${id} for instructor ${req.user.id}`);

    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        success: false,
        message: 'Only instructors can update assessments'
      });
    }

    // Find the assessment
    const assessment = await Assessment.findById(id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Verify ownership
    if (assessment.createdBy && assessment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update assessments you created'
      });
    }

    // Update fields
    if (title) assessment.title = title;
    if (description) assessment.description = description;
    if (dueDate) assessment.dueDate = new Date(dueDate);
    if (timeLimit) assessment.timeLimit = timeLimit;
    if (status) {
      assessment.status = status;
      assessment.isPublished = status === 'published';
    }

    await assessment.save();

    console.log(`Assessment ${id} updated successfully`);

    res.json({
      success: true,
      message: 'Assessment updated successfully',
      assessment: {
        id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        dueDate: assessment.dueDate,
        status: assessment.status
      }
    });
  } catch (err) {
    console.error('Error updating assessment:', err);
    res.status(500).json({
      success: false,
      message: 'Server error updating assessment'
    });
  }
});

// @route   GET /api/instructor/submissions
// @desc    Get all pending submissions for instructor's assessments
// @access  Private (Instructor only)
router.get('/submissions', authMiddleware, async (req, res) => {
  try {
    console.log('=== FETCHING SUBMISSIONS FOR INSTRUCTOR ===');
    console.log('Instructor ID:', req.user.id);

    // Find all assessments created by this instructor
    const instructorAssessments = await Assessment.find({ createdBy: req.user.id }).select('_id title');
    const assessmentIds = instructorAssessments.map(a => a._id);

    console.log(`Found ${assessmentIds.length} assessments for instructor`);

    // Find all submissions for these assessments
    const submissions = await Submission.find({
      assessment: { $in: assessmentIds }
    })
      .populate('student', 'name email')
      .populate('assessment', 'title courseId questions')
      .sort({ submissionDate: -1 })
      .lean();

    console.log(`Found ${submissions.length} total submissions`);

    // Format submissions for frontend with question text included
    const formattedSubmissions = submissions.map(sub => {
      // Get assessment questions for this submission
      const assessmentQuestions = sub.assessment?.questions || [];

      // Enhance answers with question text and options
      const enhancedAnswers = Array.isArray(sub.answers)
        ? sub.answers.map((ans, idx) => {
          // Try to find the question - first by questionId, then by index
          let question = {};
          if (ans.questionId) {
            question = assessmentQuestions.find(q =>
              q._id?.toString() === ans.questionId?.toString()
            ) || {};
          }
          // Fallback to index matching
          if (!question._id && assessmentQuestions[idx]) {
            question = assessmentQuestions[idx];
          }

          // Get question text - prioritize what's already in the answer
          const questionText = ans.questionText || question.text || question.question || '';

          return {
            ...ans,
            questionText: questionText,
            type: ans.type || question.type || question.questionType || 'multiple-choice',
            maxPoints: ans.maxPoints || question.points || (question.type === 'true-false' ? 5 : 10),
            expectedKeywords: question.expectedKeywords || question.keywords || [],
            // Include MCQ options
            options: ans.options || question.options || [],
            // Include correct answer for reference
            correctAnswer: ans.correctAnswer || question.correctAnswer || question.answer || ''
          };
        })
        : sub.answers;

      return {
        _id: sub._id,
        student: sub.student,
        assessment: {
          _id: sub.assessment?._id,
          title: sub.assessment?.title,
          courseId: sub.assessment?.courseId
        },
        submissionDate: sub.submissionDate,
        status: sub.status || 'pending_review',
        overallScore: sub.overallScore || 0,
        maxScore: sub.maxScore || 100,
        hasPendingReview: sub.hasPendingReview !== false,
        timeSpent: sub.timeSpent,
        answers: enhancedAnswers
      };
    });

    res.json({
      success: true,
      submissions: formattedSubmissions
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submissions'
    });
  }
});

// @route   PUT /api/instructor/submissions/:submissionId/grade
// @desc    Update grade for a submission
// @access  Private (Instructor only)
router.put('/submissions/:submissionId/grade', authMiddleware, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { overallScore, feedback, answers } = req.body;

    console.log('=== GRADING SUBMISSION ===');
    console.log('Submission ID:', submissionId);
    console.log('New score:', overallScore);

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Update submission
    submission.overallScore = overallScore;
    submission.status = 'graded';
    submission.hasPendingReview = false;

    if (feedback) {
      submission.feedback = feedback;
    }

    if (answers) {
      submission.answers = answers;
    }

    await submission.save();

    res.json({
      success: true,
      message: 'Submission graded successfully',
      submission
    });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error grading submission'
    });
  }
});

module.exports = router;
