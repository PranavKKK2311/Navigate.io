const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define Question schema (embedded document)
const QuestionSchema = new Schema({
  text: {
    type: String,
    required: false  // Made optional to accept 'question' field
  },
  question: {
    type: String,
    required: false  // Alternative field name
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'short-answer', 'multiple-select', 'essay'],
    required: false  // Made optional to accept 'questionType' field
  },
  questionType: {
    type: String,
    required: false  // Alternative field name
  },
  options: {
    type: [String],
    default: []
  },
  correctAnswer: {
    type: Schema.Types.Mixed, // Can be String, Boolean, or Array depending on question type
    required: false,  // Made optional to allow draft questions
    default: ''  // Default empty string
  },
  points: {
    type: Number,
    default: 1
  },
  explanation: {
    type: String
  }
});

// Define Assessment schema
const AssessmentSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  courseId: {
    type: String,
    required: false  // Made optional to allow course codes
  },
  courseCode: {
    type: String  // Store course codes like "U21CSG01"
  },
  questions: [QuestionSchema],
  timeLimit: {
    type: Number, // in minutes
    default: 60
  },
  totalPoints: {
    type: Number,
    default: function () {
      return this.questions.reduce((sum, q) => sum + q.points, 0);
    }
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  allowedAttempts: {
    type: Number,
    default: 1
  },
  randomizeQuestions: {
    type: Boolean,
    default: false
  },
  // New fields for assessment flow
  syllabusTitle: {
    type: String,
    default: ''
  },
  isAssignedToAllStudents: {
    type: Boolean,
    default: false
  },
  assignedStudents: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  visibility: {
    instructorCanSeeAnswers: {
      type: Boolean,
      default: true
    },
    studentsCanSeeAnswers: {
      type: Boolean,
      default: false
    },
    studentsCanSeeSyllabusTitle: {
      type: Boolean,
      default: false
    },
    showResultsImmediately: {
      type: Boolean,
      default: true
    },
    pattern: {
      type: Object,
      default: null
    }
  },
  // Store the complete pattern information
  pattern: {
    type: Object,
    default: null
  }
});

// Create model
const Assessment = mongoose.model('Assessment', AssessmentSchema);

module.exports = Assessment;