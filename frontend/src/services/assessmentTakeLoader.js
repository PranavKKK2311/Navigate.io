import axios from 'axios';

const AssessmentTakeLoader = async (assessmentId, setAssessment, setTimeRemaining, setError, setLoading) => {
  try {
    // Get the authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required. Please log in.');
      setLoading(false);
      return false;
    }

    console.log(`Attempting to fetch assessment with ID: ${assessmentId} from API`);
    const response = await axios.get(`/api/student/assessment/${assessmentId}`, {
      headers: {
        'x-auth-token': token
      }
    });

    if (response.data.success) {
      const assessmentData = response.data.assessment;

      // Ensure questions are properly formatted for the UI
      const formattedQuestions = assessmentData.questions.map(q => ({
        id: q.id || `q-${Math.random()}`,
        text: q.text || q.question || 'Question text not available',
        type: (q.type || q.questionType || 'multiple-choice').toLowerCase(),
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        points: q.points || 1
      }));

      const formattedAssessment = {
        ...assessmentData,
        questions: formattedQuestions
      };

      console.log('Successfully loaded assessment:', formattedAssessment.title);
      console.log('Assessment has', formattedAssessment.questions.length, 'questions');

      setAssessment(formattedAssessment);
      if (formattedAssessment.timeLimit) {
        setTimeRemaining(formattedAssessment.timeLimit * 60);
      }
      setLoading(false);
      return true;
    }
  } catch (apiError) {
    console.error('API fetch error:', apiError.response ? apiError.response.data : apiError.message);

    if (apiError.response && apiError.response.status === 404) {
      setError(`Assessment not found: ${apiError.response.data.message || 'The assessment ID may be incorrect.'}`);
    } else if (apiError.response && apiError.response.status === 401) {
      setError('Authentication required. Please log in again.');
    } else {
      setError(`Error loading assessment: ${apiError.response?.data?.message || apiError.message}`);
    }
    setLoading(false);
    return false;
  }

  setError('Could not load the assessment. Please check that the assessment exists and has been published.');
  setLoading(false);
  return false;
};

export default AssessmentTakeLoader;
