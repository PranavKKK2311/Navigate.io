// Test script to verify assessment submission works
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testSubmissionFlow() {
  console.log('=== TESTING ASSESSMENT SUBMISSION FLOW ===');

  try {
    // Step 1: First, create an assessment (as instructor)
    console.log('\n1. Creating a test assessment...');
    const assessmentData = {
      title: 'Submission Test Assessment',
      description: 'Test assessment to verify submission functionality',
      courseId: '1',
      courseName: 'Data Structures and Algorithms in Java',
      timeLimit: 30,
      assignToAllStudents: true,
      visibleToStudents: true,
      questions: [
        {
          id: 'q1',
          question: 'What is 2 + 2?',
          questionType: 'multiple-choice',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
          points: 5
        },
        {
          id: 'q2',
          question: 'Is JavaScript a programming language?',
          questionType: 'true-false',
          options: ['True', 'False'],
          correctAnswer: 'True',
          points: 5
        },
        {
          id: 'q3',
          question: 'Explain what an array is.',
          questionType: 'short-answer',
          correctAnswer: 'An array is a data structure that stores multiple elements.',
          points: 10
        }
      ]
    };

    const saveResponse = await axios.post(`${BASE_URL}/assessment/save`, assessmentData, {
      headers: {
        'x-test-mode': 'true',
        'Content-Type': 'application/json'
      }
    });

    if (!saveResponse.data.success) {
      throw new Error('Failed to create assessment');
    }

    const assessmentId = saveResponse.data.assessmentId;
    console.log('✅ Assessment created with ID:', assessmentId);

    // Step 2: Test getting the assessment as a student
    console.log('\n2. Getting assessment as student...');
    const getResponse = await axios.get(`${BASE_URL}/student/assessment/${assessmentId}`, {
      headers: {
        'x-test-mode': 'true'
      }
    });

    if (!getResponse.data.success) {
      throw new Error('Failed to get assessment');
    }

    const assessment = getResponse.data.assessment;
    console.log('✅ Got assessment:', assessment.title);
    console.log('Questions:', assessment.questions.length);

    // Step 3: Test submission with answers
    console.log('\n3. Submitting assessment with answers...');
    const submissionData = {
      assessmentId: assessmentId,
      answers: {
        'q1': '4',        // Correct answer
        'q2': 'True',     // Correct answer  
        'q3': 'An array is a collection of elements stored in contiguous memory locations that can be accessed using an index.' // Good answer
      },
      timeSpent: 600 // 10 minutes
    };

    console.log('Submission data:', submissionData);

    const submitResponse = await axios.post(`${BASE_URL}/student/assessment/submit`, submissionData, {
      headers: {
        'x-test-mode': 'true',
        'Content-Type': 'application/json'
      }
    });

    if (submitResponse.data.success) {
      console.log('✅ Submission successful!');
      console.log('Submission ID:', submitResponse.data.submissionId);
      console.log('Score:', submitResponse.data.score + '/' + submitResponse.data.maxScore);
      console.log('Percentage:', submitResponse.data.percentage + '%');
    } else {
      console.log('❌ Submission failed:', submitResponse.data.message);
      return false;
    }

    // Step 4: Test submission with different answers
    console.log('\n4. Testing submission with mixed answers...');
    const submissionData2 = {
      assessmentId: assessmentId,
      answers: {
        'q1': '3',        // Wrong answer
        'q2': 'True',     // Correct answer
        'q3': 'Array'     // Too short answer
      },
      timeSpent: 300
    };

    const submitResponse2 = await axios.post(`${BASE_URL}/student/assessment/submit`, submissionData2, {
      headers: {
        'x-test-mode': 'true',
        'Content-Type': 'application/json'
      }
    });

    if (submitResponse2.data.success) {
      console.log('✅ Second submission successful!');
      console.log('Score:', submitResponse2.data.score + '/' + submitResponse2.data.maxScore);
      console.log('Percentage:', submitResponse2.data.percentage + '%');
    } else {
      console.log('❌ Second submission failed:', submitResponse2.data.message);
    }

    console.log('\n✅ All submission tests completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error.response?.data || error.message);
    return false;
  }
}

// Run the test
testSubmissionFlow();
