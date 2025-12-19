import {
  AccessTime as AccessTimeIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Flag as FlagIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Radio,
  RadioGroup,
  TextField,
  Typography
} from '@mui/material';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProctoringWebcam from '../../components/student/ProctoringWebcam';
import { useAuth } from '../../contexts/AuthContext';

const AssessmentTake = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timer, setTimer] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [fullscreenViolation, setFullscreenViolation] = useState(false);
  const [proctorViolation, setProctorViolation] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [gracePeriodActive, setGracePeriodActive] = useState(true);
  const VIOLATION_THRESHOLD = 10; // Increased threshold to be more lenient
  const GRACE_PERIOD_SECONDS = 10; // 10 second grace period for camera initialization
  const containerRef = useRef(null);
  useEffect(() => {
    const fetchAssessment = async () => {
      setLoading(true);
      try {
        // Import the assessmentTakeLoader utility
        const AssessmentTakeLoader = (await import('../../services/assessmentTakeLoader')).default;
        console.log(`Loading assessment with ID: ${assessmentId}`);
        // Use the assessmentTakeLoader to fetch the assessment from the API
        const success = await AssessmentTakeLoader(
          assessmentId,
          setAssessment,
          setTimeRemaining,
          setError,
          setLoading
        );
        if (!success) {
          console.error('Failed to load assessment from the API');
          setError('Could not load the assessment. Please check that the assessment exists and has been published.');
        }
      } catch (error) {
        console.error('Error loading assessment:', error);
        setError('Failed to load assessment. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
    // Clean up timer on unmount
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [assessmentId]);

  useEffect(() => {
    if (testStarted && timeRemaining !== null && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleSubmitAssessment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTimer(interval);

      return () => clearInterval(interval);
    }
  }, [testStarted, timeRemaining]);

  // Fullscreen API helpers - only for test-taking mode
  const enterFullscreen = () => {
    // Only fullscreen the main assessment content, not the sidebar/header
    const elem = document.getElementById('assessment-fullscreen-container');
    if (elem && elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => { });
    } else if (elem && elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem && elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem && elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  };

  const exitFullscreen = () => {
    // Only exit fullscreen if testStarted is false (leaving test-taking mode)
    if (testStarted) return;
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    if (!document.hasFocus() || !isFullscreen) return;
    try {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    } catch (e) {
      // Ignore errors if document is not active
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    function handleFullscreenChange() {
      const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
      if (!isFullscreen && testStarted) {
        setFullscreenViolation(true);
      } else {
        setFullscreenViolation(false);
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [testStarted]);

  const handleProctorViolation = (reason) => {
    // Only count violations after grace period
    if (!gracePeriodActive) {
      setProctorViolation(true);
      incrementViolation('Face not detected');
    }
  };

  const startTest = () => {
    setTestStarted(true);
    setFullscreenViolation(false);
    setProctorViolation(false);
    setViolationCount(0);
    setGracePeriodActive(true);

    // Grace period for camera initialization
    setTimeout(() => {
      setGracePeriodActive(false);
      console.log('Grace period ended - violations will now be counted');
    }, GRACE_PERIOD_SECONDS * 1000);

    // Wait for DOM update, then request fullscreen
    setTimeout(() => {
      enterFullscreen();
    }, 0);
  };

  // Exit full screen when leaving assessment-taking mode
  useEffect(() => {
    if (!testStarted) {
      // Only exit fullscreen if we were in test mode
      exitFullscreen();
    }
    // Only run when testStarted changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testStarted]);

  // Keyboard restrictions and violation logic
  useEffect(() => {
    if (!testStarted) return;
    const handleKeyDown = (e) => {
      // Block Ctrl+C, Ctrl+V, Ctrl+R, F5, Windows key
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V' || e.key === 'r' || e.key === 'R')) ||
        e.key === 'F5' ||
        e.key === 'Meta' || // Windows key (Meta)
        e.key === 'OS'
      ) {
        e.preventDefault();
        incrementViolation('Prohibited key pressed');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [testStarted]);

  // Violation logic for fullscreen
  useEffect(() => {
    if (fullscreenViolation && testStarted && !gracePeriodActive) {
      incrementViolation('Exited full screen');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreenViolation]);

  // Violation logic for proctoring
  useEffect(() => {
    if (proctorViolation && testStarted && !gracePeriodActive) {
      incrementViolation('Camera/face violation');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proctorViolation]);

  // Terminate exam if violation threshold exceeded
  useEffect(() => {
    if (violationCount >= VIOLATION_THRESHOLD && testStarted) {
      setTestStarted(false);
      exitFullscreen();
      // Optionally, you can show a modal or redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard', { replace: true, state: { terminated: true } });
      }, 1000);
      setError('Exam terminated due to repeated violations.');
    }
  }, [violationCount, testStarted]);

  // Helper to increment violation count
  const incrementViolation = (reason) => {
    setViolationCount((prev) => prev + 1);
  };

  // Format the remaining time
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${secs}s`;
  };

  // Calculate progress percentage
  const progressPercentage = () => {
    const totalQuestions = assessment?.questions.length || 0;
    const answeredQuestions = Object.keys(answers).length;
    return (answeredQuestions / totalQuestions) * 100;
  };

  // Handle answer change
  const handleAnswerChange = (value) => {
    // Use _id (MongoDB) preferentially, fallback to id (generated)
    const question = assessment.questions[currentQuestionIndex];
    const questionId = question._id || question.id;
    console.log(`Saving answer for question ${questionId}:`, value);
    setAnswers({
      ...answers,
      [questionId]: value
    });
  };

  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Navigate to previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Toggle flagged status of current question
  const toggleFlagged = () => {
    const questionId = assessment.questions[currentQuestionIndex].id;
    if (flaggedQuestions.includes(questionId)) {
      setFlaggedQuestions(flaggedQuestions.filter(id => id !== questionId));
    } else {
      setFlaggedQuestions([...flaggedQuestions, questionId]);
    }
  };

  // Open confirmation dialog
  const handleOpenSubmitDialog = () => {
    setConfirmSubmit(true);
  };

  // Close confirmation dialog
  const handleCloseSubmitDialog = () => {
    setConfirmSubmit(false);
  };

  // Handle assessment submission
  const handleSubmitAssessment = async () => {
    setTestStarted(false); // Stop proctoring immediately to avoid violations during submission
    setConfirmSubmit(false); // Close dialog
    console.log('Submit button clicked');
    setSubmitting(true);
    try {
      // Get the authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in.');
        setSubmitting(false);
        return;
      }

      // Calculate time spent
      const timeSpent = assessment.timeLimit * 60 - timeRemaining;

      console.log('=== FRONTEND SUBMISSION DEBUG ===');
      console.log('Assessment ID:', assessment.id || assessment._id);
      console.log('Answer keys:', Object.keys(answers));
      console.log('First answer key:', Object.keys(answers)[0]);
      console.log('First answer value:', answers[Object.keys(answers)[0]]);
      console.log('Answers object:', JSON.stringify(answers, null, 2));
      console.log('Time spent:', timeSpent);

      // Submit to backend API
      const response = await axios.post('/api/student/assessment/submit', {
        assessmentId: assessment.id || assessment._id,
        answers,
        timeSpent
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      console.log('Submission response:', response.data);

      if (!response.data.success) {
        setError(response.data.message || 'Failed to submit assessment (backend error).');
        setSubmitting(false);
        return;
      }
      let score = response.data.score;
      let maxScore = response.data.maxScore;
      let submissionId = response.data.submissionId;

      // If no score provided (manual grading needed), calculate a tentative score
      if (!score) {
        score = 0;
        maxScore = 0;
        assessment.questions.forEach(question => {
          maxScore += question.points;
          const userAnswer = answers[question.id];
          if (!userAnswer) return;
          if (question.type === 'multiple-choice' || question.type === 'true-false') {
            if (userAnswer === question.correctAnswer) {
              score += question.points;
            }
          } else if (question.type === 'multiple-select') {
            if (userAnswer.length === question.correctAnswer.length && userAnswer.every(a => question.correctAnswer.includes(a))) {
              score += question.points;
            }
          } else if (question.type === 'short-answer') {
            if (userAnswer.length > 10) {
              score += question.points * 0.8;
            }
          }
        });
      }
      // Mark assessment as completed (for UI/UX)
      setTestStarted(false);
      // Navigate to results page with proper submission ID and pass/fail info
      const percentage = response.data.percentage || Math.round((score / maxScore) * 100);
      const isPassed = response.data.isPassed !== undefined ? response.data.isPassed : percentage >= 50;
      navigate(`/results/${submissionId || 'temp'}`, {
        state: {
          score,
          maxScore,
          percentage,
          isPassed,
          answers,
          assessment,
          submissionId: submissionId || 'temp',
          message: response.data.message,
          completed: true
        }
      });
    } catch (error) {
      console.error('Submission error:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setError('Failed to submit assessment: ' + error.response.data.message);
      } else {
        setError('Failed to submit assessment. Please try again.');
      }
      setSubmitting(false);
    }
  };

  // Render the current question
  const renderQuestion = () => {
    const question = assessment.questions[currentQuestionIndex];
    const questionType = question.type || question.questionType; // Handle both field names

    switch (questionType) {
      case 'multiple-choice':
        return (
          <RadioGroup
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
          >
            {question.options.map((option, index) => (
              <FormControlLabel
                key={index}
                value={option}
                control={<Radio />}
                label={option}
              />
            ))}
          </RadioGroup>
        );

      case 'true-false':
        return (
          <RadioGroup
            value={answers[question.id]?.toString() || ''}
            onChange={(e) => handleAnswerChange(e.target.value === 'true')}
          >
            <FormControlLabel
              value="true"
              control={<Radio />}
              label="True"
            />
            <FormControlLabel
              value="false"
              control={<Radio />}
              label="False"
            />
          </RadioGroup>
        );

      case 'short-answer':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            placeholder="Enter your answer here..."
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
          />
        );

      case 'multiple-select':
        return (
          <FormGroup>
            {question.options.map((option, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    checked={(answers[question.id] || []).includes(option)}
                    onChange={(e) => {
                      const currentSelections = answers[question.id] || [];
                      if (e.target.checked) {
                        handleAnswerChange([...currentSelections, option]);
                      } else {
                        handleAnswerChange(currentSelections.filter(item => item !== option));
                      }
                    }}
                  />
                }
                label={option}
              />
            ))}
          </FormGroup>
        );

      default:
        console.error('Unsupported question type:', questionType, 'for question:', question);
        return <Alert severity="error">Unsupported question type: {questionType || 'undefined'}</Alert>;
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show error state if error is set (do not reload or auto-redirect)
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Error
          </Typography>
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
            sx={{ mt: 2 }}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!assessment) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Assessment Not Found
          </Typography>
          <Alert severity="error" sx={{ mb: 3 }}>
            {"The assessment you're looking for is not available or may have been removed."}
          </Alert>
          <Typography variant="body1" paragraph>
            Please check that you have the correct assessment ID or try to access the assessment from your dashboard.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
            sx={{ mt: 2 }}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!testStarted) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          {assessment.title && (
            <Typography variant="h4" gutterBottom>
              {assessment.title}
            </Typography>
          )}
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {assessment.courseName}
          </Typography>
          {assessment.visibility && assessment.visibility.pattern && (
            <>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {assessment.visibility.pattern.name} • {assessment.visibility.pattern.difficulty}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {assessment.visibility.pattern.description}
              </Typography>
            </>
          )}
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Total Points"
                    secondary={assessment.totalPoints}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AccessTimeIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Time Limit"
                    secondary={assessment.timeLimit ? `${assessment.timeLimit} minutes` : 'No time limit'}
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} sm={6}>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <HelpIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Questions"
                    secondary={assessment.questions.length}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Due Date"
                    secondary={assessment.dueDate && !isNaN(new Date(assessment.dueDate)) ? new Date(assessment.dueDate).toLocaleDateString() : 'Not set'}
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
          <Alert severity="info" sx={{ mb: 3 }}>
            {assessment.timeLimit
              ? `This assessment has a time limit of ${assessment.timeLimit} minutes. The timer will start once you begin.`
              : 'This assessment has no time limit, but must be completed in one session.'}
          </Alert>
          <Typography variant="body1" paragraph>
            {assessment.description}
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This assessment will require full screen mode and camera proctoring. Exiting full screen or disabling the camera will be flagged as a violation.
          </Alert>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={startTest}
            >
              Begin Assessment
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container id="assessment-fullscreen-container" maxWidth="lg" sx={{ py: 4 }} ref={containerRef}>
      {/* Proctoring webcam and violation alerts */}
      <ProctoringWebcam onViolation={handleProctorViolation} />
      {gracePeriodActive && (
        <Alert severity="info" sx={{ position: 'fixed', top: 120, right: 20, zIndex: 9999, width: 340 }}>
          <div>
            <div>Initializing proctoring system...</div>
            <div>Violations will not be counted for the first {GRACE_PERIOD_SECONDS} seconds.</div>
          </div>
        </Alert>
      )}
      {!gracePeriodActive && (fullscreenViolation || proctorViolation || violationCount > 0) && (
        <Alert severity={violationCount >= VIOLATION_THRESHOLD ? 'error' : 'warning'} sx={{ position: 'fixed', top: 120, right: 20, zIndex: 9999, width: 340 }}>
          <div>
            {fullscreenViolation && <div>You have exited full screen mode. Please return to full screen.</div>}
            {proctorViolation && <div>Camera not detected or interrupted. Please enable your camera.</div>}
            <div>Violation Count: {violationCount} / {VIOLATION_THRESHOLD}</div>
            {violationCount >= VIOLATION_THRESHOLD && <div>Exam terminated due to repeated violations.</div>}
          </div>
        </Alert>
      )}
      <Paper elevation={3} sx={{ p: 3, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">
            {assessment.title}
          </Typography>
          {timeRemaining !== null && (
            <Chip
              icon={<AccessTimeIcon />}
              label={`Time remaining: ${formatTime(timeRemaining)}`}
              color={timeRemaining < 300 ? 'error' : 'default'}
              variant="outlined"
            />
          )}
        </Box>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Question {currentQuestionIndex + 1} of {assessment.questions.length}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progressPercentage()}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(progressPercentage())}% Complete
                </Typography>
                <Box>
                  <IconButton
                    onClick={toggleFlagged}
                    color={flaggedQuestions.includes(assessment.questions[currentQuestionIndex].id) ? 'error' : 'default'}
                    title={flaggedQuestions.includes(assessment.questions[currentQuestionIndex].id) ? 'Unflag question' : 'Flag for review'}
                  >
                    <FlagIcon />
                  </IconButton>
                </Box>
              </Box>
            </Box>

            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {assessment.questions[currentQuestionIndex].text || assessment.questions[currentQuestionIndex].question || 'Question text not available'}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {renderQuestion()}
                </Box>
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              {currentQuestionIndex < assessment.questions.length - 1 ? (
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleNextQuestion}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleOpenSubmitDialog}
                >
                  Submit Assessment
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Question Navigator
            </Typography>
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {assessment.questions.map((question, index) => (
                <Grid item key={question.id}>
                  <Button
                    variant={currentQuestionIndex === index ? 'contained' : 'outlined'}
                    color={
                      flaggedQuestions.includes(question.id) ? 'error' :
                        answers[question.id] ? 'success' : 'primary'
                    }
                    onClick={() => setCurrentQuestionIndex(index)}
                    sx={{ minWidth: 40, height: 40, p: 0 }}
                  >
                    {index + 1}
                  </Button>
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" gutterBottom>
                Legend:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: 'primary.main' }} />
                  <Typography variant="body2">Current question</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: 'success.main' }} />
                  <Typography variant="body2">Answered</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: 'error.main' }} />
                  <Typography variant="body2">Flagged for review</Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmSubmit}
        onClose={handleCloseSubmitDialog}
        container={document.getElementById('assessment-fullscreen-container') || undefined}
      // Ensures dialog is rendered inside fullscreen container
      >
        <DialogTitle>Submit Assessment?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to submit this assessment? You will not be able to change your answers after submission.
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              Total questions: {assessment.questions.length}
            </Typography>
            <Typography variant="body2">
              Answered questions: {Object.keys(answers).length}
            </Typography>
            <Typography variant="body2">
              Unanswered questions: {assessment.questions.length - Object.keys(answers).length}
            </Typography>
            <Typography variant="body2">
              Flagged questions: {flaggedQuestions.length}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSubmitDialog}>
            Continue Editing
          </Button>
          <Button
            onClick={() => {
              console.log('Submit Assessment button pressed');
              handleSubmitAssessment();
            }}
            variant="contained"
            color="primary"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;

export default AssessmentTake;