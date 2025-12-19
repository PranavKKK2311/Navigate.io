// Script to test assessment API endpoint

// This script can be run in Node.js to verify the assessment API endpoint is working correctly
const axios = require('axios');

// Test different assessment IDs
const testCases = [
  { id: 'instructor-assessment-1', name: 'Instructor Assessment' },
  { id: 'assessment-1', name: 'Timestamp-based Assessment' },
  { id: 'non-existent-id', name: 'Non-existent Assessment (should fail)' }
];

async function testAssessmentEndpoint(testCase) {
  try {
    console.log(`\nTesting assessment endpoint for ID: "${testCase.id}" (${testCase.name})`);
    
    const response = await axios.get(`http://localhost:5000/api/assessment/student/${testCase.id}`, {
      headers: {
        'x-test-mode': 'true'  // Use test mode to bypass authentication
      }
    });
    
    if (response.data.success) {
      console.log('✅ Successfully retrieved assessment:');
      console.log(`- Title: ${response.data.assessment.title}`);
      console.log(`- Description: ${response.data.assessment.description}`);
      console.log(`- Questions: ${response.data.assessment.questions.length}`);
      
      // Verify the assessment doesn't include answers
      const hasAnswers = response.data.assessment.questions.some(q => 'correctAnswer' in q);
      console.log(`- Contains correctAnswers: ${hasAnswers ? 'YES (PROBLEM!)' : 'No (Good)'}`);
      
      console.log('\nTest PASSED ✅');
      return true;
    } else {
      console.error('❌ Error in response:', response.data);
      console.log('\nTest FAILED ❌');
      return false;
    }
  } catch (error) {
    if (error.response && error.response.status === 404 && testCase.id === 'non-existent-id') {
      console.log('✅ Correctly returned 404 for non-existent assessment ID');
      console.log('\nTest PASSED ✅');
      return true;
    } else {
      console.error('❌ Error testing endpoint:', error.response ? error.response.data : error.message);
      console.log('\nTest FAILED ❌');
      return false;
    }
  }
}

async function runTests() {
  console.log('Starting assessment API endpoint tests...');
  
  let allPassed = true;
  
  for (const testCase of testCases) {
    const passed = await testAssessmentEndpoint(testCase);
    allPassed = allPassed && passed;
  }
  
  console.log('\n----------------------------------------');
  console.log(allPassed ? '✅ All tests PASSED' : '❌ Some tests FAILED');
  console.log('----------------------------------------');
}

runTests();
