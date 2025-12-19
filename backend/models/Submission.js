const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.Mixed,  // Changed to Mixed to handle ObjectId or string
      required: true
    },
    answer: {
      type: mongoose.Schema.Types.Mixed,  // Student's answer
      required: false
    },
    questionText: {
      type: String
    },
    type: {
      type: String
    },
    options: [{
      type: String
    }],
    // GRADING FIELDS ADDED
    correct: {
      type: Boolean,
      default: false
    },
    score: {
      type: Number,
      default: 0
    },
    feedback: {
      type: String,
      default: ''
    },
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed  // The correct answer text
    },
    correctLetter: {
      type: String  // For MCQ: A, B, C, D
    },
    studentLetter: {
      type: String  // Student's selected letter
    },
    pendingReview: {
      type: Boolean,
      default: false
    },
    suggestedScore: {
      type: Number  // For short-answer AI suggestions
    },
    keywords: [{
      type: String
    }],
    matchedKeywords: [{
      type: String
    }],
    sampleAnswer: {
      type: String
    },
    aiEvaluation: {
      accuracy: {
        score: Number,
        feedback: String
      },
      conceptualUnderstanding: {
        score: Number,
        feedback: String
      },
      originality: {
        score: Number,
        feedback: String,
        similarityScore: Number
      },
      presentation: {
        score: Number,
        feedback: String
      },
      totalScore: Number,
      suggestions: [String]
    },
    expertPanelFeedback: [{
      role: {
        type: String,
        enum: ['fact-checker', 'concept-analyzer', 'clarity-checker']
      },
      feedback: String,
      suggestions: [String]
    }],
    misconceptions: [String],
    learningGaps: [String]
  }],
  overallScore: {
    type: Number,
    min: 0,
    max: 100
  },
  maxScore: {
    type: Number,
    default: 100
  },
  status: {
    type: String,
    enum: ['pending_review', 'graded', 'submitted'],
    default: 'submitted'
  },
  hasPendingReview: {
    type: Boolean,
    default: false
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  timeSpent: {
    type: Number  // Time spent in seconds
  },
  gradedAt: {
    type: Date
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

module.exports = mongoose.model('Submission', SubmissionSchema);