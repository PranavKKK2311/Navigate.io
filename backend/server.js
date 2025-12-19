require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./api/auth');
// Use assessment.js file for instructor assessment routes temporarily
// Use assessment.js file for instructor assessment routes (contains full implementation)
const assessmentRoutes = require('./api/assessment');
const instructorAssessmentRoutes = require('./api/instructor-assessment-routes');
const studentAssessmentRoutes = require('./api/student-assessment-routes');
const adaptiveLearningRoutes = require('./api/adaptiveLearning');
const curriculumRoutes = require('./api/curriculum');
const courseRoutes = require('./api/courses');

// Create Express app
const app = express();

// CORS configuration for production
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://navigate-io.vercel.app',
    /\.vercel\.app$/  // Allow all Vercel preview deployments
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/instructor/assessment', assessmentRoutes); // Instructor assessment routes
app.use('/api/instructor/assessment', instructorAssessmentRoutes); // Instructor CRUD (my-assessments, delete, update)
app.use('/api/student/assessment', studentAssessmentRoutes);  // Student assessment routes
app.use('/api/assessment', assessmentRoutes); // Direct assessment route
app.use('/api/adaptive-learning', adaptiveLearningRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/courses', courseRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.log('Starting in demo mode with mock data...');
  }    // Continue application execution instead of exiting
  // This allows the app to run even without a database connection

  // Check if we should load mock data (can be controlled via environment variable)
  const enableMockData = process.env.ENABLE_MOCK_DATA !== 'false';
  if (enableMockData) {
    // Set up a mock instructor-created assessment for testing
    const mockInstructorAssessment = {
      id: 'instructor-assessment-1',
      title: 'Java Data Structures Assessment',
      description: 'Comprehensive evaluation of Java data structures and collections framework',
      courseId: '1',
      courseName: 'Data Structures and Algorithms in Java',
      timeLimit: 45,
      totalPoints: 40,
      dueDate: '2025-05-20T23:59:00',
      status: 'published',
      createdAt: new Date().toISOString(),
      randomizeQuestions: true,
      questions: [
        {
          id: 'q1',
          question: 'Which Java collection interface is implemented by ArrayList and LinkedList?',
          questionType: 'multiple-choice',
          options: [
            'Set',
            'List',
            'Queue',
            'Map'
          ],
          correctAnswer: 'List',
          points: 5,
          difficulty: 'Easy'
        }, {
          id: 'q2',
          question: 'In Java, which data structure would be most appropriate for implementing a FIFO (First In First Out) queue?',
          questionType: 'multiple-choice',
          options: [
            'java.util.Stack',
            'java.util.LinkedList',
            'java.util.TreeSet',
            'java.util.HashMap'
          ],
          correctAnswer: 'java.util.LinkedList',
          points: 5,
          difficulty: 'Easy'
        },
        {
          id: 'q3',
          question: 'Briefly explain the difference between formative and summative assessments.',
          questionType: 'short-answer',
          correctAnswer: 'Formative assessments are ongoing evaluations that monitor student learning during the instructional process, providing feedback to improve teaching and learning. Summative assessments evaluate student learning at the end of an instructional period by comparing against standards or benchmarks.',
          points: 10,
          difficulty: 'Medium'
        },
        {
          id: 'q4',
          question: 'Select all features that are available in this assessment platform:',
          questionType: 'multiple-select',
          options: [
            'Multiple choice questions',
            'Short answer questions',
            'Automatic grading',
            'Question randomization',
            'Time limits'
          ],
          correctAnswer: ['Multiple choice questions', 'Short answer questions', 'Question randomization', 'Time limits'],
          points: 10,
          difficulty: 'Medium'
        },
        {
          id: 'q5',
          question: 'True or False: This platform allows instructors to create custom assessments.',
          questionType: 'true-false',
          options: ['True', 'False'],
          correctAnswer: 'True',
          points: 5,
          difficulty: 'Easy'
        },
        {
          id: 'q6',
          question: 'What is the main benefit of using automated assessment tools?',
          questionType: 'multiple-choice',
          options: [
            'They eliminate the need for instructors',
            'They reduce grading time and provide quick feedback',
            'They only work for technical subjects',
            'They are always more accurate than manual grading'
          ],
          correctAnswer: 'They reduce grading time and provide quick feedback',
          points: 5,
          difficulty: 'Easy'
        }
      ]
    };    // Store the mock assessment in the environment variable for API access
    process.env.SAVED_ASSESSMENTS = JSON.stringify([mockInstructorAssessment]);
    console.log('Mock instructor assessment loaded for testing');
    console.log(`Assessment ID: ${mockInstructorAssessment.id}`);
    console.log(`Assessment title: ${mockInstructorAssessment.title}`);
    console.log(`Course ID: ${mockInstructorAssessment.courseId}`);
    console.log(`Contains ${mockInstructorAssessment.questions.length} questions`);
  }
};

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'build', 'index.html'));
  });
}

// Connect to database
connectDB();

// Define PORT
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Log the mock assessments that are available
  if (process.env.SAVED_ASSESSMENTS) {
    try {
      const mockAssessments = JSON.parse(process.env.SAVED_ASSESSMENTS);
      if (Array.isArray(mockAssessments) && mockAssessments.length > 0) {
        console.log('=========================================');
        console.log('AVAILABLE INSTRUCTOR-CREATED ASSESSMENTS:');
        mockAssessments.forEach(assessment => {
          console.log(`- "${assessment.title}" (ID: ${assessment.id}) with ${assessment.questions.length} questions`);
        });
        console.log('=========================================');
      }
    } catch (e) {
      console.error('Error parsing mock assessments:', e);
    }
  }
});