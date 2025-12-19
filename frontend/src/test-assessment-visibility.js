// Test script to verify assessment visibility logic
console.log("Testing assessment visibility and user role logic");

// Mock localStorage
const localStorageItems = {
  'userRole': 'student',
  'token': 'test-token'
};

// Mock the localStorage API
global.localStorage = {
  getItem: (key) => localStorageItems[key],
  setItem: (key, value) => localStorageItems[key] = value,
  removeItem: (key) => delete localStorageItems[key]
};

// Mock assessment data
const assessments = [
  {
    id: 'assessment-1',
    title: 'Assessment 1: Published, Visible',
    isPublished: true,
    status: 'published',
    visibleToStudents: true,
    assignToAllStudents: true
  },
  {
    id: 'assessment-2',
    title: 'Assessment 2: Published, Not Visible',
    isPublished: true,
    status: 'published',
    visibleToStudents: false,
    assignToAllStudents: false
  },
  {
    id: 'assessment-3',
    title: 'Assessment 3: Draft',
    isPublished: false,
    status: 'draft',
    visibleToStudents: false,
    assignToAllStudents: false
  },
  {
    id: 'assessment-4',
    title: 'Assessment 4: Assigned but not visible',
    isPublished: false,
    status: 'draft',
    visibleToStudents: false,
    assignToAllStudents: true
  }
];

// Test filter logic
function testFilterLogic() {
  console.log("\nTesting assessment filter logic:");
  
  // Filter assessments that should be visible to students
  const visibleAssessments = assessments.filter(assessment => {
    const isPublished = assessment.status === 'published' || assessment.isPublished === true;
    const isVisible = assessment.visibleToStudents === true;
    const isAssigned = assessment.assignToAllStudents === true;
    
    console.log(`Assessment ${assessment.id}: published=${isPublished}, visible=${isVisible}, assigned=${isAssigned}`);
    
    return (isPublished && isVisible) || (isAssigned && isVisible);
  });
  
  console.log("\nResult: These assessments should be visible to students:");
  visibleAssessments.forEach(assessment => {
    console.log(`- ${assessment.title} (${assessment.id})`);
  });
  
  return visibleAssessments;
}

// Test the filter
const visibleAssessments = testFilterLogic();

// Verify the results
const expectedVisible = 1; // Only assessment-1 should be visible
if (visibleAssessments.length === expectedVisible) {
  console.log(`\nTEST PASSED: ${visibleAssessments.length}/${assessments.length} assessments are visible to students (expected ${expectedVisible})`);
} else {
  console.log(`\nTEST FAILED: ${visibleAssessments.length}/${assessments.length} assessments are visible to students (expected ${expectedVisible})`);
}

// Output the stringified assessments for reference
console.log("\nHere's how the assessments should be stored in localStorage:");
console.log(JSON.stringify(assessments, null, 2));
