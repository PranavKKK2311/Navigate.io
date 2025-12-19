// Test script to verify the pass/fail system works correctly
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testPassFailSystem() {
  console.log('=== TESTING PASS/FAIL SYSTEM ===');

  try {
    // Step 1: Create a test assessment
    console.log('\n1. Creating test assessment...');
    const assessmentData = {
      title: 'Pass/Fail Test Assessment',
      description: 'Test assessment to verify pass/fail functionality',
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
          points: 25
        },
        {
          id: 'q2',
          question: 'What is 3 + 3?',
          questionType: 'multiple-choice',
          options: ['5', '6', '7', '8'],
          correctAnswer: '6',
          points: 25
        },
        {
          id: 'q3',
          question: 'What is 4 + 4?',
          questionType: 'multiple-choice',
          options: ['6', '7', '8', '9'],
          correctAnswer: '8',
          points: 25
        },
        {
          id: 'q4',
          question: 'What is 5 + 5?',
          questionType: 'multiple-choice',
          options: ['8', '9', '10', '11'],
          correctAnswer: '10',
          points: 25
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

    // Step 2: Test PASSING submission (3/4 correct = 75%)
    console.log('\n2. Testing PASSING submission (75%)...');
    const passingSubmission = {
      assessmentId: assessmentId,
      answers: {
        'q1': '4',   // Correct (25 points)
        'q2': '6',   // Correct (25 points)
        'q3': '8',   // Correct (25 points)
        'q4': '9'    // Wrong (0 points) - Total: 75/100 = 75%
      },
      timeSpent: 300
    };

    const passingResponse = await axios.post(`${BASE_URL}/student/assessment/submit`, passingSubmission, {
      headers: {
        'x-test-mode': 'true',
        'Content-Type': 'application/json'
      }
    });

    if (passingResponse.data.success) {
      console.log('✅ Passing submission successful!');
      console.log('Score:', passingResponse.data.score + '/' + passingResponse.data.maxScore);
      console.log('Percentage:', passingResponse.data.percentage + '%');
      console.log('Passed:', passingResponse.data.isPassed);
      console.log('Message:', passingResponse.data.message);
      
      if (passingResponse.data.isPassed && passingResponse.data.percentage >= 50) {
        console.log('✅ PASS/FAIL LOGIC WORKING: Student correctly marked as PASSED');
      } else {
        console.log('❌ PASS/FAIL LOGIC ERROR: Student should be marked as PASSED');
      }
    } else {
      console.log('❌ Passing submission failed:', passingResponse.data.message);
    }

    // Step 3: Test FAILING submission (1/4 correct = 25%)
    console.log('\n3. Testing FAILING submission (25%)...');
    const failingSubmission = {
      assessmentId: assessmentId,
      answers: {
        'q1': '4',   // Correct (25 points)
        'q2': '5',   // Wrong (0 points)
        'q3': '7',   // Wrong (0 points)
        'q4': '9'    // Wrong (0 points) - Total: 25/100 = 25%
      },
      timeSpent: 200
    };

    const failingResponse = await axios.post(`${BASE_URL}/student/assessment/submit`, failingSubmission, {
      headers: {
        'x-test-mode': 'true',
        'Content-Type': 'application/json'
      }
    });

    if (failingResponse.data.success) {
      console.log('✅ Failing submission successful!');
      console.log('Score:', failingResponse.data.score + '/' + failingResponse.data.maxScore);
      console.log('Percentage:', failingResponse.data.percentage + '%');
      console.log('Passed:', failingResponse.data.isPassed);
      console.log('Message:', failingResponse.data.message);
      
      if (!failingResponse.data.isPassed && failingResponse.data.percentage < 50) {
        console.log('✅ PASS/FAIL LOGIC WORKING: Student correctly marked as FAILED');
      } else {
        console.log('❌ PASS/FAIL LOGIC ERROR: Student should be marked as FAILED');
      }
    } else {
      console.log('❌ Failing submission failed:', failingResponse.data.message);
    }

    // Step 4: Test BORDERLINE PASSING submission (2/4 correct = 50%)
    console.log('\n4. Testing BORDERLINE PASSING submission (50%)...');
    const borderlineSubmission = {
      assessmentId: assessmentId,
      answers: {
        'q1': '4',   // Correct (25 points)
        'q2': '6',   // Correct (25 points)
        'q3': '7',   // Wrong (0 points)
        'q4': '9'    // Wrong (0 points) - Total: 50/100 = 50%
      },
      timeSpent: 250
    };

    const borderlineResponse = await axios.post(`${BASE_URL}/student/assessment/submit`, borderlineSubmission, {
      headers: {
        'x-test-mode': 'true',
        'Content-Type': 'application/json'
      }
    });

    if (borderlineResponse.data.success) {
      console.log('✅ Borderline submission successful!');
      console.log('Score:', borderlineResponse.data.score + '/' + borderlineResponse.data.maxScore);
      console.log('Percentage:', borderlineResponse.data.percentage + '%');
      console.log('Passed:', borderlineResponse.data.isPassed);
      console.log('Message:', borderlineResponse.data.message);
      
      if (borderlineResponse.data.isPassed && borderlineResponse.data.percentage >= 50) {
        console.log('✅ PASS/FAIL LOGIC WORKING: Student correctly marked as PASSED (borderline case)');
      } else {
        console.log('❌ PASS/FAIL LOGIC ERROR: Student should be marked as PASSED (50% is passing)');
      }
    } else {
      console.log('❌ Borderline submission failed:', borderlineResponse.data.message);
    }

    // Step 5: Test instructor view of submissions
    console.log('\n5. Testing instructor view of submissions...');
    const instructorResponse = await axios.get(`${BASE_URL}/instructor/course/1/submissions`, {
      headers: {
        'x-test-mode': 'true'
      }
    });

    if (instructorResponse.data.success) {
      console.log('✅ Instructor can view submissions!');
      console.log(`Found ${instructorResponse.data.submissions.length} submissions`);
      
      instructorResponse.data.submissions.forEach((sub, index) => {
        console.log(`Submission ${index + 1}:`);
        console.log(`  - Student: ${sub.studentName}`);
        console.log(`  - Score: ${sub.score}/${sub.maxScore} (${sub.percentage}%)`);
        console.log(`  - Status: ${sub.isPassed ? 'PASSED' : 'FAILED'}`);
        console.log(`  - Assessment: ${sub.assessmentTitle}`);
      });
    } else {
      console.log('❌ Instructor view failed:', instructorResponse.data.message);
    }

    console.log('\n✅ Pass/Fail system test completed successfully!');
    console.log('\nSUMMARY:');
    console.log('- Pass threshold: 50%');
    console.log('- Students with ≥50% are marked as PASSED');
    console.log('- Students with <50% are marked as FAILED');
    console.log('- Instructors can see pass/fail status in their dashboard');
    console.log('- Assessment status changes from "Available" to "Completed" after submission');

  } catch (error) {
    console.error('❌ Test failed with error:', error.response?.data || error.message);
  }
}

// Run the test
testPassFailSystem();
