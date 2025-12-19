/**
 * Test script to verify the assessment loading functionality
 * Run this script with node test-assessment-loading.js
 */
const axios = require('axios');

const testAssessmentLoading = async () => {
  try {
    console.log('Testing assessment loading functionality...');
    
    // Create a test assessment
    const testAssessment = {
      id: 'test-assessment-123',
      title: 'Test Assessment',
      description: 'This is a test assessment to verify loading functionality',
      courseId: 'test-course-123',
      courseName: 'Test Course',
      status: 'published',
      assignToAllStudents: true,
      visibleToStudents: true,
      questions: [
        {
          id: 'q1',
          text: 'What is the capital of France?',
          type: 'multiple-choice',
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correctAnswer: 'Paris',
          points: 5
        },
        {
          id: 'q2',
          text: 'Which of the following are primary colors? (Select all that apply)',
          type: 'multiple-select',
          options: ['Red', 'Green', 'Blue', 'Yellow', 'Purple'],
          correctAnswer: ['Red', 'Blue', 'Yellow'],
          points: 10
        }
      ]
    };
    
    // Save the test assessment to environment variable
    const savedAssessmentsString = process.env.SAVED_ASSESSMENTS || '[]';
    let savedAssessments = JSON.parse(savedAssessmentsString);
    
    // Add or update test assessment
    const existingIndex = savedAssessments.findIndex(a => a.id === testAssessment.id);
    if (existingIndex >= 0) {
      savedAssessments[existingIndex] = testAssessment;
    } else {
      savedAssessments.push(testAssessment);
    }
    
    // Save back to environment variable
    process.env.SAVED_ASSESSMENTS = JSON.stringify(savedAssessments);
    console.log('Test assessment saved with ID:', testAssessment.id);
    
    // Start the server (this would normally be done separately)
    // const server = require('./server');
    
    // Test fetching the assessment
    const response = await axios.get(`http://localhost:5000/api/student/assessment/${testAssessment.id}`, {
      headers: {
        'x-auth-token': 'test-token' // This would be a real token in production
      }
    });
    
    if (response.data.success) {
      console.log('Successfully loaded test assessment from API!');
      console.log('Assessment title:', response.data.assessment.title);
      console.log('Questions:', response.data.assessment.questions.length);
      
      // Verify that correctAnswer fields are not included in the response
      const hasCorrectAnswer = response.data.assessment.questions.some(q => q.correctAnswer);
      if (hasCorrectAnswer) {
        console.error('ERROR: Student-facing assessment contains correctAnswer fields!');
      } else {
        console.log('SUCCESS: correctAnswer fields properly removed from student view');
      }
    } else {
      console.error('Failed to load test assessment:', response.data.message);
    }
    
    console.log('Assessment loading test complete!');
  } catch (error) {
    console.error('Error during test:', error.message);
    if (error.response) {
      console.error('Server response:', error.response.data);
    }
  }
};

// Run the test
testAssessmentLoading();
