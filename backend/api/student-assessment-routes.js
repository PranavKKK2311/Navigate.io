// Student assessment routes for students to view and take assessments
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');

// Import models
const Assessment = require('../models/Assessment');
const Submission = require('../models/Submission');
const Course = require('../models/Course'); // Might be needed for enrollment checks

// @route   GET /api/student/assessment/assessments
// @desc    Get assessments available for students
// @access  Private (Student access)
router.get('/assessments', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching assessments for student:', req.user.id);

    // Find assessments that are published and assigned to the student (or all)
    // We assume if a course is public or student is enrolled, they might see it,
    // but typically assessments are course-specific.
    // Ideally, we should first find courses the student is enrolled in.

    // For now, let's just find all published assessments that match the criteria:
    // 1. Published
    // 2. Either assigned to all students OR student is in assignedStudents list

    const assessments = await Assessment.find({
      isPublished: true,
      $or: [
        { isAssignedToAllStudents: true },
        { assignedStudents: req.user.id }
      ]
    }).populate('courseId', 'title');

    // Transform for frontend
    const studentAssessments = await Promise.all(assessments.map(async (assessment) => {
      // Check if submitted
      const submission = await Submission.findOne({
        assessment: assessment._id,
        student: req.user.id
      });

      return {
        id: assessment._id,
        _id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        status: submission ? 'completed' : 'published', // 'available' logic
        course: {
          _id: assessment.courseId?._id,
          title: assessment.courseId?.title || assessment.syllabusTitle || assessment.courseCode || 'Course'
        },
        dueDate: assessment.dueDate,
        timeLimit: assessment.timeLimit,
        isCompleted: !!submission,
        score: submission?.overallScore
      };
    }));

    console.log(`Found ${studentAssessments.length} assessments for student`);

    return res.status(200).json({
      success: true,
      assessments: studentAssessments
    });

  } catch (error) {
    console.error('Error fetching student assessments:', error);
    return res.status(500).json({
      success: false,
      message: `Error fetching assessments: ${error.message}`
    });
  }
});

// @route   GET /api/student/assessment/upcoming
// @desc    Get upcoming assessments for a student
// @access  Private (Student access)
router.get('/upcoming', authMiddleware, async (req, res) => {
  try {
    console.log('=== FETCHING UPCOMING ASSESSMENTS FOR STUDENT ===');

    // Similar logic to above but sorted by date and maybe filtering out completed/past due
    const assessments = await Assessment.find({
      isPublished: true,
      $or: [
        { isAssignedToAllStudents: true },
        { assignedStudents: req.user.id }
      ]
    })
      .sort({ dueDate: 1 }) // Sort by due date ascending
      .populate('courseId', 'title');

    const upcomingAssessments = [];

    for (const assessment of assessments) {
      // Check submission
      const submission = await Submission.findOne({
        assessment: assessment._id,
        student: req.user.id
      });

      // Only include if not submitted (or if multiple attempts allowed - future feature)
      if (!submission) {
        // Calculate total points from questions
        const totalPoints = assessment.totalPoints ||
          (assessment.questions ? assessment.questions.reduce((sum, q) => sum + (q.points || 0), 0) : 0);

        upcomingAssessments.push({
          id: assessment._id,
          _id: assessment._id,
          title: assessment.title,
          description: assessment.description,
          status: 'available',
          course: {
            _id: assessment.courseId?._id,
            title: assessment.courseId?.title || assessment.syllabusTitle || assessment.courseCode || 'Course'
          },
          dueDate: assessment.dueDate,
          timeLimit: assessment.timeLimit,
          totalPoints: totalPoints,
          questionCount: assessment.questions?.length || 0
        });
      }
    }

    console.log(`Returning ${upcomingAssessments.length} upcoming assessments for student`);

    return res.status(200).json({
      success: true,
      assessments: upcomingAssessments
    });

  } catch (error) {
    console.error('Error fetching upcoming assessments:', error);
    return res.status(500).json({
      success: false,
      message: `Error fetching upcoming assessments: ${error.message}`
    });
  }
});

// @route   GET /api/student/assessment/my-grades
// @desc    Get all graded submissions for the current student
// @access  Private (Student)
// IMPORTANT: This must be defined BEFORE /:id route to avoid collision
router.get('/my-grades', authMiddleware, async (req, res) => {
  try {
    console.log('=== FETCHING GRADES FOR STUDENT ===');
    console.log('Student ID from auth:', req.user.id);
    console.log('Student ID type:', typeof req.user.id);

    // Try multiple query strategies to find submissions
    const mongoose = require('mongoose');
    let studentId = req.user.id;

    // Convert to ObjectId if it's a valid hex string
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      studentId = new mongoose.Types.ObjectId(studentId);
    }

    console.log('Querying with studentId:', studentId);

    // Find all submissions by this student
    const submissions = await Submission.find({
      $or: [
        { student: req.user.id },
        { student: studentId }
      ]
    })
      .populate('assessment', 'title courseId courseCode')
      .sort({ submissionDate: -1 })
      .lean();

    console.log(`Found ${submissions.length} submissions for student`);

    // Debug: Log first submission if found
    if (submissions.length > 0) {
      console.log('First submission student field:', submissions[0].student);
      console.log('First submission assessment:', submissions[0].assessment?.title);
    }

    // Format for frontend
    const grades = submissions.map(sub => ({
      _id: sub._id,
      assessmentTitle: sub.assessment?.title || 'Unknown Assessment',
      courseCode: sub.assessment?.courseCode || sub.assessment?.courseId || '',
      submissionDate: sub.submissionDate,
      status: sub.status || (sub.hasPendingReview ? 'pending' : 'graded'),
      overallScore: sub.overallScore || 0,
      maxScore: sub.maxScore || 100,
      percentage: Math.round(((sub.overallScore || 0) / (sub.maxScore || 100)) * 100),
      feedback: sub.feedback || '',
      hasPendingReview: sub.hasPendingReview || false
    }));

    res.json({
      success: true,
      grades: grades
    });

  } catch (error) {
    console.error('Error fetching student grades:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching grades'
    });
  }
});


// @route   GET /api/student/assessment/:id
// @desc    Get details of a specific assessment for a student
// @access  Private (Student)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await Assessment.findById(id).populate('courseId', 'title');

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    if (!assessment.isPublished) {
      return res.status(403).json({
        success: false,
        message: 'Assessment is not published'
      });
    }

    // Create a student-safe version (remove correct answers from options if they were stored there, 
    // though our model stores correctAnswer properly separate or we should ensure we don't send it)
    // The Update to Assessment.js removed explicit `correctAnswer` from the QUESTION SCHEMA? 
    // Wait, let's double check the Assessment model schema in previous steps.
    // Step 775: QuestionSchema has `correctAnswer` field.
    // We MUST NOT send `correctAnswer` to the student.

    const safeQuestions = assessment.questions.map(q => ({
      _id: q._id,
      text: q.text || q.question,  // Support both property names
      question: q.question || q.text,  // Send both for compatibility
      type: q.type,
      options: q.options,
      points: q.points,
      topic: q.topic
      // OMIT correctAnswer
    }));

    const safeAssessment = {
      id: assessment._id,
      _id: assessment._id,
      title: assessment.title,
      description: assessment.description,
      courseId: assessment.courseId?._id,
      courseName: assessment.courseId?.title || 'Course',
      dueDate: assessment.dueDate,
      timeLimit: assessment.timeLimit,
      totalPoints: assessment.totalPoints,
      status: 'published',
      questions: safeQuestions
    };

    return res.status(200).json({
      success: true,
      assessment: safeAssessment
    });

  } catch (error) {
    console.error('Error fetching assessment:', error);
    return res.status(500).json({
      success: false,
      message: `Error fetching assessment: ${error.message}`
    });
  }
});

// @route   POST /api/student/assessment/submit
// @desc    Submit answers for an assessment
// @access  Private (Student)
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { assessmentId, answers, timeSpent } = req.body;

    console.log('=== ASSESSMENT SUBMISSION ===');
    console.log('Student ID:', req.user.id);
    console.log('Assessment ID:', assessmentId);

    // Fetch assessment to calculate score
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    // Calculate Score
    // Note: This logic duplicates the grading logic. 
    // In a real app, grading might happen asynchronously or via a service.
    // We'll impl simple grading here.

    console.log('=== GRADING DEBUG ===');
    console.log('Answers received:', JSON.stringify(answers, null, 2));
    console.log('Number of questions:', assessment.questions.length);
    console.log('First question _id:', assessment.questions[0]?._id);
    console.log('First question id:', assessment.questions[0]?.id);
    console.log('First question correctAnswer:', assessment.questions[0]?.correctAnswer);

    let totalScore = 0;
    let maxScore = 0;
    const evaluatedAnswers = [];

    // Map through questions to grade
    // Create a flexible lookup: try _id, id, and index-based matching
    const answerKeys = Object.keys(answers);

    assessment.questions.forEach((q, qIndex) => {
      const questionPoints = q.points || 10;
      maxScore += questionPoints;

      // Try to find student answer by matching against all answer keys
      // This handles cases where frontend uses different ID formats
      let studentAns;
      let matchedKey;

      // First try exact matches
      const exactKeys = [
        q._id?.toString(),
        q.id?.toString(),
        q.id,
        `q${qIndex + 1}`,
        `q-${qIndex}`,
        qIndex.toString()
      ].filter(Boolean);

      for (const key of exactKeys) {
        if (answers[key] !== undefined) {
          studentAns = answers[key];
          matchedKey = key;
          break;
        }
      }

      // If no exact match, try to find by index position
      // Assume answers are in same order as questions
      if (studentAns === undefined && answerKeys[qIndex]) {
        studentAns = answers[answerKeys[qIndex]];
        matchedKey = answerKeys[qIndex];
      }

      if (qIndex === 0) {
        console.log('Answer keys from frontend:', answerKeys.slice(0, 3));
        console.log('Tried exact keys:', exactKeys);
        console.log('Matched using key:', matchedKey);
        console.log('Found answer:', studentAns);
        console.log('Correct answer:', q.correctAnswer);
      }

      let isCorrect = false;
      let earnedPoints = 0;
      let feedback = '';

      if (studentAns !== undefined && studentAns !== '') {
        // SEPARATE HANDLING FOR TRUE/FALSE
        if (q.type === 'true-false') {
          // Normalize both to lowercase strings for comparison
          const studentNorm = String(studentAns).toLowerCase().trim();
          const correctNorm = String(q.correctAnswer).toLowerCase().trim();

          // Compare normalized values
          isCorrect = (studentNorm === correctNorm);
          earnedPoints = isCorrect ? questionPoints : 0;

          feedback = isCorrect
            ? 'Correct!'
            : `Incorrect. The correct answer was: ${q.correctAnswer}`;

          evaluatedAnswers.push({
            questionId: q._id,
            questionText: q.text || q.question || '',
            type: q.type || 'true-false',
            options: q.options || ['True', 'False'],
            answer: studentAns,
            correctAnswer: q.correctAnswer,
            correct: isCorrect,
            score: earnedPoints,
            maxPoints: questionPoints,
            feedback: feedback
          });
          totalScore += earnedPoints;
          return; // Skip the push below
        }

        // MULTIPLE CHOICE HANDLING
        if (q.type === 'multiple-choice') {
          const options = q.options || [];
          const correctAnswer = q.correctAnswer || '';

          // Find correct answer index (could be stored as text or letter)
          let correctIndex = options.findIndex(opt => opt === correctAnswer);

          // If not found by exact match, check if correctAnswer is a letter (A, B, C, D)
          if (correctIndex < 0 && /^[A-D]$/i.test(correctAnswer)) {
            correctIndex = correctAnswer.toUpperCase().charCodeAt(0) - 65;
          }

          const correctLetter = correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : '';
          const correctText = correctIndex >= 0 ? options[correctIndex] : correctAnswer;

          // Find student answer index - could be letter, index, or full text
          let studentIndex = -1;
          if (typeof studentAns === 'number') {
            studentIndex = studentAns;
          } else if (/^[A-D]$/i.test(studentAns)) {
            studentIndex = studentAns.toUpperCase().charCodeAt(0) - 65;
          } else {
            studentIndex = options.findIndex(opt => opt === studentAns);
          }

          const studentLetter = studentIndex >= 0 ? String.fromCharCode(65 + studentIndex) : '';

          // Compare by index for reliability
          isCorrect = (studentIndex >= 0 && studentIndex === correctIndex);
          earnedPoints = isCorrect ? questionPoints : 0;

          feedback = isCorrect
            ? 'Correct!'
            : `Incorrect. The correct answer was: ${correctLetter}`;

          evaluatedAnswers.push({
            questionId: q._id,
            questionText: q.text || q.question || '',
            type: q.type || 'multiple-choice',
            options: q.options || [],
            answer: studentAns,
            studentLetter: studentLetter,
            correctLetter: correctLetter,
            correctAnswer: correctText,
            correct: isCorrect,
            score: earnedPoints,
            maxPoints: questionPoints,
            feedback: feedback
          });
          totalScore += earnedPoints;
          return; // Skip the push below
        }

        if (q.type === 'short-answer') {
          // Short-answer: Calculate suggested score but mark as PENDING for teacher review
          const sampleAnswer = q.correctAnswer || q.sampleAnswer || '';
          const studentLower = studentAns.toLowerCase().trim();
          const sampleLower = sampleAnswer.toLowerCase();

          // PRIORITY 1: Use teacher-provided keywords if available
          let keywords = [];
          if (q.keywords && typeof q.keywords === 'string' && q.keywords.trim().length > 0) {
            keywords = q.keywords.split(',')
              .map(kw => kw.trim().toLowerCase())
              .filter(kw => kw.length > 0);
          }

          // PRIORITY 2: Extract keywords from sample answer if no manual keywords
          if (keywords.length === 0) {
            const commonWords = ['the', 'and', 'that', 'this', 'with', 'from', 'have', 'are', 'was', 'were', 'which', 'their', 'about', 'been', 'through', 'would', 'could', 'should', 'there', 'these', 'those', 'what', 'when', 'where', 'while'];
            keywords = sampleLower.split(/\W+/)
              .filter(word => word.length > 4 && !commonWords.includes(word));
          }

          // Calculate suggested score (for teacher reference)
          const matchedKeywords = keywords.filter(kw => studentLower.includes(kw));
          const matchRatio = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0;
          const suggestedScore = Math.round(questionPoints * matchRatio);

          // Don't auto-award points - mark as pending
          earnedPoints = 0; // Will be graded by teacher
          isCorrect = false; // Pending review
          feedback = 'Pending teacher review';

          // Store for teacher grading
          evaluatedAnswers.push({
            questionId: q._id,
            questionText: q.text || q.question || '',
            type: q.type || 'short-answer',
            answer: studentAns,
            correct: null,  // null = pending review
            score: 0,
            maxPoints: questionPoints,
            suggestedScore: suggestedScore,  // AI suggestion for teacher
            feedback: 'This response is pending teacher review.',
            keywords: keywords.slice(0, 6),
            matchedKeywords: matchedKeywords,
            pendingReview: true,  // Flag for teacher grading
            sampleAnswer: sampleAnswer
          });

          // Don't add to totalScore yet - pending review
          return; // Skip the push below
        }
      } else {
        feedback = 'No answer provided.';
      }

      totalScore += earnedPoints;

      evaluatedAnswers.push({
        questionId: q._id,
        questionText: q.text || q.question || '',
        type: q.type || 'unknown',
        options: q.options || [],
        answer: studentAns,
        correct: isCorrect,
        score: earnedPoints,
        maxPoints: questionPoints,
        feedback: feedback
      });
    });

    const percentage = Math.round((totalScore / maxScore) * 100);

    // Check if any questions are pending teacher review
    const hasPendingReview = evaluatedAnswers.some(a => a.pendingReview === true);

    const submission = new Submission({
      assessment: assessmentId,
      student: req.user.id,
      answers: evaluatedAnswers, // Schema now has grading fields
      overallScore: totalScore,
      maxScore: maxScore,
      hasPendingReview: hasPendingReview,
      submissionDate: new Date(),
      timeSpent: timeSpent,
      status: hasPendingReview ? 'pending_review' : 'graded'
    });

    console.log('=== BEFORE SAVE DEBUG ===');
    console.log('evaluatedAnswers type:', Array.isArray(evaluatedAnswers) ? 'array' : typeof evaluatedAnswers);
    console.log('evaluatedAnswers length:', evaluatedAnswers?.length);
    console.log('First evaluatedAnswer:', JSON.stringify(evaluatedAnswers?.[0], null, 2));
    console.log('submission.answers type:', Array.isArray(submission.answers) ? 'array' : typeof submission.answers);
    console.log('submission.answers length:', submission.answers?.length);

    await submission.save();

    console.log(`Submission successful: ${totalScore}/${maxScore}, pending: ${hasPendingReview}`);

    return res.status(200).json({
      success: true,
      submissionId: submission._id,
      score: totalScore,
      maxScore: maxScore,
      percentage: percentage,
      isPassed: percentage >= 50,
      status: hasPendingReview ? 'pending_review' : 'completed',
      hasPendingReview: hasPendingReview,
      message: hasPendingReview
        ? 'Assessment submitted. Multiple-choice questions graded. Short-answer questions sent to instructor for review.'
        : 'Assessment submitted and graded successfully.'
    });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    return res.status(500).json({
      success: false,
      message: `Error submitting assessment: ${error.message}`
    });
  }
});

module.exports = router;