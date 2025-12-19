// Test script to verify the instructor -> student assessment flow
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAssessmentFlow() {
  console.log('=== TESTING INSTRUCTOR -> STUDENT ASSESSMENT FLOW ===');

  try {
    // Step 1: Save an assessment as an instructor
    console.log('\n1. Saving assessment as instructor...');
    const assessmentData = {
      title: 'Test Assessment - Data Structures',
      description: 'A test assessment to verify the instructor->student flow',
      courseId: '1',
      courseName: 'Data Structures and Algorithms in Java',
      timeLimit: 60,
      assignToAllStudents: true, // This is the key flag
      visibleToStudents: true,   // This should be set automatically
      questions: [
        {
          id: 'q1',
          question: 'What is the time complexity of ArrayList get() operation?',
          questionType: 'multiple-choice',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
          correctAnswer: 'O(1)',
          points: 5
        },
        {
          id: 'q2',
          question: 'Explain the difference between HashMap and TreeMap.',
          questionType: 'short-answer',
          correctAnswer: 'HashMap uses hash table for O(1) access, TreeMap uses Red-Black tree for O(log n) access with sorted order.',
          points: 10
        }
      ]
    };

    const saveResponse = await axios.post(`${BASE_URL}/assessment/save`, assessmentData, {
      headers: {
        'x-test-mode': 'true', // Bypass auth for testing
        'Content-Type': 'application/json'
      }
    });

    if (saveResponse.data.success) {
      console.log('✅ Assessment saved successfully');
      console.log('Assessment ID:', saveResponse.data.assessmentId);
      
      // Step 2: Check if students can see the assessment
      console.log('\n2. Checking if students can see the assessment...');
      
      // Wait a moment for the data to be available
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const studentAssessmentsResponse = await axios.get(`${BASE_URL}/student/assessment/upcoming`, {
        headers: {
          'x-test-mode': 'true' // Simulate student access
        }
      });

      if (studentAssessmentsResponse.data.success) {
        const assessments = studentAssessmentsResponse.data.assessments;
        console.log(`✅ Students can see ${assessments.length} assessments`);
        
        const ourAssessment = assessments.find(a => a.title === assessmentData.title);
        if (ourAssessment) {
          console.log('✅ Our test assessment is visible to students');
          console.log('Assessment details:', {
            id: ourAssessment.id,
            title: ourAssessment.title,
            questionCount: ourAssessment.questionCount,
            totalPoints: ourAssessment.totalPoints
          });

          // Step 3: Try to get the assessment details (without answers)
          console.log('\n3. Getting assessment details for student...');
          const assessmentDetailsResponse = await axios.get(`${BASE_URL}/student/assessment/${ourAssessment.id}`, {
            headers: {
              'x-test-mode': 'true'
            }
          });

          if (assessmentDetailsResponse.data.success) {
            const assessment = assessmentDetailsResponse.data.assessment;
            console.log('✅ Assessment details retrieved for student');
            console.log(`Questions: ${assessment.questions.length}`);
            
            // Verify that correct answers are not included
            const hasCorrectAnswers = assessment.questions.some(q => 'correctAnswer' in q);
            if (!hasCorrectAnswers) {
              console.log('✅ Correct answers are properly hidden from students');
            } else {
              console.log('❌ WARNING: Correct answers are visible to students!');
            }

            // Step 4: Test submission
            console.log('\n4. Testing assessment submission...');
            const submissionData = {
              assessmentId: ourAssessment.id,
              answers: {
                'q1': 'O(1)',
                'q2': 'HashMap is faster for basic operations, TreeMap maintains sorted order'
              },
              timeSpent: 1200 // 20 minutes
            };

            const submissionResponse = await axios.post(`${BASE_URL}/student/assessment/submit`, submissionData, {
              headers: {
                'x-test-mode': 'true',
                'Content-Type': 'application/json'
              }
            });

            if (submissionResponse.data.success) {
              console.log('✅ Assessment submission successful');
              console.log(`Score: ${submissionResponse.data.score}/${submissionResponse.data.maxScore}`);
              console.log(`Percentage: ${submissionResponse.data.percentage}%`);
            } else {
              console.log('❌ Assessment submission failed:', submissionResponse.data.message);
            }

          } else {
            console.log('❌ Failed to get assessment details for student');
          }
        } else {
          console.log('❌ Our test assessment is NOT visible to students');
          console.log('Available assessments:', assessments.map(a => a.title));
        }
      } else {
        console.log('❌ Failed to fetch student assessments:', studentAssessmentsResponse.data.message);
      }
    } else {
      console.log('❌ Failed to save assessment:', saveResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.response?.data || error.message);
  }

  console.log('\n=== TEST COMPLETED ===');
}

// Run the test
testAssessmentFlow();
