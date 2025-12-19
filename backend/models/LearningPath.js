const mongoose = require('mongoose');

const LearningPathSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  currentLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  masteredConcepts: [{
    concept: String,
    masteryLevel: {
      type: Number,
      min: 0,
      max: 100
    },
    lastAssessed: Date
  }],
  weakConcepts: [{
    concept: String,
    masteryLevel: {
      type: Number,
      min: 0,
      max: 100
    },
    recommendedResources: [{
      type: String,
      resourceType: {
        type: String,
        enum: ['video', 'article', 'exercise', 'quiz']
      },
      url: String
    }]
  }],
  learningRecommendations: [{
    concept: String,
    resources: [{
      title: String,
      type: String,
      url: String,
      priority: {
        type: Number,
        min: 1,
        max: 5
      }
    }],
    suggestedActivities: [String]
  }],
  progressHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    conceptsLearned: [String],
    assessmentsCompleted: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment'
    }],
    overallProgress: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LearningPath', LearningPathSchema);