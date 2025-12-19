import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PreviewIcon from '@mui/icons-material/Preview';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Step,
  StepLabel,
  Stepper,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import SyllabusUpload from '../../components/instructor/SyllabusUpload';
import { saveAssessment } from '../../services/assessmentSaveService';

// Mock data removed
const mockPatterns = [];

// Mock data removed
const mockGeneratedQuestions = [];

const AssessmentCreation = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeStep, setActiveStep] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Assessment data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [timeLimit, setTimeLimit] = useState(60);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [assignToAllStudents, setAssignToAllStudents] = useState(false);
  const [syllabusAnalysis, setSyllabusAnalysis] = useState(null);
  const [courses, setCourses] = useState([]);

  // Load courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/courses', {
          headers: { 'x-auth-token': token }
        });
        const data = await response.json();
        if (data.courses) {
          setCourses(data.courses.map(c => ({ id: c._id, title: c.title })));
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      }
    };
    fetchCourses();
  }, []);

  // Load assessment data if editing existing assessment or coming from quiz generator
  useEffect(() => {
    // Check if we have quiz data from the quiz generator
    if (location?.state?.quiz) {
      const quizData = location.state.quiz;
      console.log('Received quiz data:', quizData);

      // Set quiz data into our assessment
      setTitle(quizData.title || 'Quick Knowledge Check');
      setDescription(quizData.description || 'Auto-generated quiz based on syllabus analysis');
      setTimeLimit(quizData.timeLimit || 15);

      // Transform quiz questions to match our format
      if (quizData.questions && Array.isArray(quizData.questions)) {
        const formattedQuestions = quizData.questions.map((q, index) => ({
          id: `quiz-${index + 1}`,
          question: q.question,
          questionType: q.questionType,
          options: q.options || [],
          correctAnswer: q.groundTruth || q.correctAnswer,
          topic: q.topic || 'General',
          difficulty: q.difficulty || 'Medium',
          points: q.points || 1,
          bloomLevel: q.bloomLevel || 'Knowledge',
          rubric: q.rubric || {
            accuracy: { weight: 0.6, criteria: "Factual correctness" },
            conceptualUnderstanding: { weight: 0.3, criteria: "Understanding of concept" },
            presentation: { weight: 0.1, criteria: "Clarity" }
          },
          relatedConcepts: q.relatedConcepts || []
        }));

        setQuestions(formattedQuestions);

        // Move to question customization step
        setActiveStep(2);
      }

      // If we have a syllabusId, set that too
      if (location.state.syllabusId) {
        // Fetch the syllabus analysis data for the sidebar display
        // This would be an API call in a real app
        console.log('Fetching syllabus data for ID:', location.state.syllabusId);
      }
    }
    // Original code for loading existing assessment data
    else if (assessmentId) {
      setIsEditing(true);
      // Simulate loading assessment data from API
      setLoading(true);
      // TODO: Replace with real API call
      // For now, since we removed mocks, we just stop loading
      setLoading(false);
    }
  }, [assessmentId, location]);

  // Handle syllabus analysis
  const handleSyllabusAnalysisComplete = (analysisData) => {
    if (!analysisData) return;

    setSyllabusAnalysis(analysisData);
    const patternName = selectedPattern ? selectedPattern.name : (mockPatterns[0]?.name || 'Assessment');
    setTitle(`${patternName}: ${analysisData.basicInfo.courseTitle}`);
    // setCourseId('1'); 
    // Now that we have analysis data, proceed to the question customization step
    setActiveStep(2);
  };

  // Handle pattern selection
  const handlePatternSelection = (pattern) => {
    setSelectedPattern(pattern);
  };

  // Generate questions based on syllabus and pattern
  const handleGenerateQuestions = () => {
    if (!selectedPattern || !syllabusAnalysis) {
      alert('Please select a pattern and upload a syllabus before generating questions.');
      return;
    }

    setGenerating(true);

    // Call the API to generate questions using Gemini AI
    fetch('/api/assessment/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include auth token in a real application
        // 'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        syllabusAnalysis: syllabusAnalysis,
        pattern: selectedPattern
      })
    })
      .then(response => {
        if (!response.ok) {
          // Check for specific error status codes
          if (response.status === 500) {
            throw new Error('Server error: The Gemini API may not be configured properly.');
          } else if (response.status === 400) {
            throw new Error('Invalid request: Please check your syllabus and pattern selection.');
          } else {
            throw new Error(`Server responded with status: ${response.status}`);
          }
        }
        return response.json();
      })
      .then(data => {
        if (data.success && data.assessment && data.assessment.questions) {
          console.log('Generated assessment with Gemini API:', data.message);

          // Transform the questions to match our frontend structure if needed
          const formattedQuestions = data.assessment.questions.map((q, index) => ({
            id: `gen-${index + 1}`,
            text: q.text || q.question,
            questionType: q.type || q.questionType,  // Backend sends "type", frontend uses "questionType"
            options: q.options || [],
            correctAnswer: q.groundTruth || q.correctAnswer,
            topic: q.topic,
            difficulty: q.difficulty || 'Medium',
            points: q.points || parseInt(selectedPattern.structure.find(s =>
              s.questionType === (q.type || q.questionType) ||
              s.questionType.toLowerCase() === (q.type || q.questionType).toLowerCase()
            )?.pointsPerQuestion) || 2,
            bloomLevel: q.bloomLevel || 'Remember',
            rubric: q.rubric || {
              accuracy: { weight: 0.6, criteria: ["Factual correctness", "Completeness"] },
              conceptualUnderstanding: { weight: 0.3, criteria: ["Depth of understanding"] },
              presentation: { weight: 0.1, criteria: ["Clarity of explanation"] }
            },
            relatedConcepts: q.relatedConcepts || []
          }));

          setQuestions(formattedQuestions);

          // Update assessment title and description if provided by the API
          if (data.assessment.title) {
            setTitle(data.assessment.title);
          }

          if (data.assessment.description) {
            setDescription(data.assessment.description);
          }

          // Update time limit if provided
          if (data.assessment.timeLimit) {
            setTimeLimit(data.assessment.timeLimit);
          }

          // Show success message
          alert(`Successfully generated ${formattedQuestions.length} questions using Gemini AI!`);
        } else {
          // Handle error case from API response
          console.error('Failed to generate questions:', data);

          if (data.error && data.error.includes('GEMINI_API_KEY')) {
            alert('Gemini API Key is missing or invalid. Please contact your administrator to configure the Gemini API.');
          } else {
            alert('Failed to generate questions with Gemini AI. Please try again with a different pattern or syllabus.');
          }
        }
        setGenerating(false);
      })
      .catch(error => {
        console.error('Error generating questions:', error);

        // Provide more specific error messages
        if (error.message.includes('Gemini API')) {
          alert('Gemini API error: ' + error.message);
        } else {
          alert('An error occurred while generating questions with Gemini AI. Please try again.');
        }

        setGenerating(false);
      });
  };

  // Add a new question manually
  const handleAddQuestion = () => {
    const newQuestion = {
      id: `new-${questions.length + 1}`,
      text: '',
      questionType: 'Multiple Choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      topic: '',
      difficulty: 'Medium',
      points: 2,
      bloomLevel: 'Remember'
    };

    setQuestions([...questions, newQuestion]);
  };

  // Remove a question
  const handleRemoveQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Save assessment
  const handleSave = async () => {
    // Validate required fields
    if (!courseId) {
      alert('Please select a course before saving the assessment.');
      return;
    }

    if (!title || title.trim() === '') {
      alert('Please enter an assessment title.');
      return;
    }

    if (questions.length === 0) {
      alert('Please add at least one question to the assessment.');
      return;
    }

    // Transform questions to match backend schema BEFORE sending
    const transformedQuestions = questions.map(q => ({
      text: q.text || q.question,
      type: q.type || q.questionType,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      points: q.points || 1,
      explanation: q.explanation
    }));

    // Prepare assessment data
    const assessmentData = {
      id: assessmentId || `new-${Date.now()}`,
      title,
      description,
      courseId,
      dueDate,
      timeLimit,
      randomizeQuestions,
      showAnswers,
      assignToAllStudents,
      questions: transformedQuestions,  // Use transformed questions
      pattern: selectedPattern,
      // Add these fields for student display
      questionCount: transformedQuestions.length,
      totalPoints: calculateTotalPoints(),
      createdAt: new Date().toISOString(),
      // Explicitly set status based on whether it's assigned to all students
      status: assignToAllStudents ? 'published' : 'draft',
      // Include visibility settings to match SyllabusUpload component
      visibility: {
        instructorCanSeeAnswers: true,
        studentsCanSeeAnswers: showAnswers,
        studentsCanSeeSyllabusTitle: true,
        showResultsImmediately: true,
        pattern: selectedPattern ? {
          name: selectedPattern.name,
          description: selectedPattern.description,
          questionDistribution: selectedPattern.structure,
          difficulty: selectedPattern.difficulty
        } : null
      }
    };

    console.log('Attempting to save assessment with data:', assessmentData);
    setLoading(true);

    try {
      // Use the assessment save service to save both locally and to backend
      const result = await saveAssessment(assessmentData);
      console.log('Save result:', result);
      alert('Assessment saved successfully!');

      // Navigate back to instructor dashboard instead of course page
      navigate('/instructor/dashboard');
    } catch (error) {
      console.error('Error saving assessment:', error);
      alert(`Error saving assessment: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total points
  const calculateTotalPoints = () => {
    return questions.reduce((total, question) => total + question.points, 0);
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

  // For the initial steps (0-1), we'll use the SyllabusUpload component
  if (activeStep < 2) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditing ? 'Edit Assessment' : 'Create New Assessment'}
        </Typography>

        <SyllabusUpload onAnalysisComplete={handleSyllabusAnalysisComplete} />
      </Container>
    );
  }

  // For steps 2-3, we'll use our own UI
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {isEditing ? 'Edit Assessment' : 'Create New Assessment'}
      </Typography>

      <Stepper activeStep={activeStep - 2} sx={{ mb: 4 }}>
        {['Customize Questions', 'Settings & Review'].map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        {/* Step 3: Customize Questions */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Customize Questions
            </Typography>

            {/* Display syllabus analysis summary */}
            {syllabusAnalysis && (
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Based on analysis of: {syllabusAnalysis.basicInfo?.courseTitle}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {syllabusAnalysis.learningOutcomes?.keyTopics?.map((topic, index) => (
                    <Chip key={index} label={topic} size="small" />
                  ))}
                </Box>

                {/* Add pattern selection indicator */}
                {selectedPattern && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Selected Pattern: <strong>{selectedPattern.name}</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedPattern.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <img src="https://www.gstatic.com/lamda/images/gemini_logo_v1.svg"
                        alt="Gemini AI"
                        width="16"
                        height="16"
                        style={{ marginRight: '4px' }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Questions will be generated using Gemini AI
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Generate questions button always visible when syllabus is uploaded */}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    onClick={handleGenerateQuestions}
                    disabled={generating || !selectedPattern}
                    startIcon={generating ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
                    size="small"
                  >
                    {generating ? 'Generating...' : 'Generate with Gemini'}
                  </Button>
                </Box>
              </Paper>
            )}

            <Typography variant="body1" paragraph>
              Review, edit, or add assessment questions. You can modify AI-generated questions or create your own.
            </Typography>

            <Box sx={{ width: '100%', mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab label="All Questions" />
                <Tab label="Multiple Choice" />
                <Tab label="Free Response" />
                <Tab label="Programming" />
              </Tabs>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddQuestion}
              >
                Add New Question
              </Button>
            </Box>

            <List>
              {questions
                .filter(q => {
                  if (activeTab === 0) return true;
                  if (activeTab === 1) return q.questionType === 'Multiple Choice';
                  if (activeTab === 2) return ['Short Answer', 'Essay'].includes(q.questionType);
                  if (activeTab === 3) return q.questionType === 'Programming';
                  return true;
                })
                .map((question, index) => (
                  <React.Fragment key={question.id}>
                    <ListItem
                      alignItems="flex-start"
                      secondaryAction={
                        <Box>
                          <IconButton edge="end" onClick={() => { }}>
                            <EditIcon />
                          </IconButton>
                          <IconButton edge="end" onClick={() => handleRemoveQuestion(question.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      }
                      sx={{ py: 2 }}
                    >
                      <ListItemIcon sx={{ mt: 0 }}>
                        <Typography variant="body1">
                          {index + 1}.
                        </Typography>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body1">{question.text || question.question}</Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                              <Chip
                                label={question.questionType}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                              <Chip
                                label={question.difficulty}
                                size="small"
                                color={
                                  question.difficulty === 'Easy' ? 'success' :
                                    question.difficulty === 'Medium' ? 'primary' :
                                      'error'
                                }
                                variant="outlined"
                              />
                              <Chip
                                label={`${question.points} pts`}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={question.topic}
                                size="small"
                                variant="outlined"
                              />
                            </Box>

                            {(question.questionType === 'Multiple Choice' || question.questionType === 'multiple-choice') && (
                              <List dense>
                                {question.options.map((option, idx) => (
                                  <ListItem key={idx} dense sx={{ py: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                      {option === question.correctAnswer ? (
                                        <CheckCircleIcon color="success" fontSize="small" />
                                      ) : (
                                        <Typography variant="body2">
                                          {String.fromCharCode(65 + idx)}.
                                        </Typography>
                                      )}
                                    </ListItemIcon>
                                    <ListItemText primary={option} />
                                  </ListItem>
                                ))}
                              </List>
                            )}

                            {/* Display Answer Key / Sample Answer */}
                            {(['Short Answer', 'Essay', 'short-answer', 'essay'].includes(question.questionType)) && (
                              <Paper variant="outlined" sx={{ mt: 1, p: 1.5, bgcolor: 'background.default', borderColor: 'divider' }}>
                                <Typography variant="subtitle2" color="success.main" gutterBottom>
                                  Suggested Answer Key:
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                                  {question.correctAnswer || "No suggested answer provided."}
                                </Typography>
                              </Paper>
                            )}

                            {question.questionType === 'Programming' && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  <b>Sample Solution</b> (abbreviated)
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: 'monospace',
                                    whiteSpace: 'pre-wrap',
                                    bgcolor: 'grey.100',
                                    p: 1,
                                    borderRadius: 1,
                                    maxHeight: 80,
                                    overflow: 'hidden'
                                  }}
                                >
                                  {question.correctAnswer.split('\n').slice(0, 3).join('\n')}...
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
            </List>

            {questions.length === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {generating ?
                    'Generating questions with Gemini AI...' :
                    'No questions added yet. Click "Generate with Gemini" to create questions based on your syllabus and selected pattern.'}
                </Typography>
                {!generating && !selectedPattern && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    Please select a pattern first to enable question generation.
                  </Typography>
                )}
                {!generating && (
                  <Button
                    variant="contained"
                    onClick={handleGenerateQuestions}
                    disabled={generating || !selectedPattern}
                    startIcon={<AutoAwesomeIcon />}
                    sx={{ mt: 2 }}
                  >
                    Generate Questions with Gemini
                  </Button>
                )}
                {generating && (
                  <CircularProgress size={40} sx={{ mt: 2 }} />
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
              <Button
                variant="contained"
                onClick={() => setActiveStep(3)}
                disabled={questions.length === 0}
              >
                Continue to Settings
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 4: Settings & Review */}
        {activeStep === 3 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Assessment Settings & Review
            </Typography>
            <Typography variant="body1" paragraph>
              Configure assessment settings and review all details before saving.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <TextField
                  label="Assessment Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  fullWidth
                  margin="normal"
                  required
                />
                <TextField
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={3}
                />
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Course</InputLabel>
                  <Select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    label="Course"
                  >
                    {courses.map(course => (
                      <MenuItem key={course.id} value={course.id}>
                        {course.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Due Date & Time"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  fullWidth
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Assessment Settings
                </Typography>
                <TextField
                  label="Time Limit (minutes)"
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  fullWidth
                  margin="normal"
                  InputProps={{ inputProps: { min: 0 } }}
                  helperText="Set to 0 for no time limit"
                />
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={randomizeQuestions}
                        onChange={(e) => setRandomizeQuestions(e.target.checked)}
                      />
                    }
                    label="Randomize question order"
                  />
                </Box>
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showAnswers}
                        onChange={(e) => setShowAnswers(e.target.checked)}
                      />
                    }
                    label="Show answers after submission"
                  />
                </Box>
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Availability Settings
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={assignToAllStudents}
                        onChange={(e) => setAssignToAllStudents(e.target.checked)}
                      />
                    }
                    label="Make visible to all students immediately"
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
                    When enabled, all enrolled students will see this assessment on their dashboard
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Assessment Summary
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Question Type</TableCell>
                        <TableCell align="right">Count</TableCell>
                        <TableCell align="right">Points Each</TableCell>
                        <TableCell align="right">Total Points</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {['Multiple Choice', 'Short Answer', 'Essay', 'Programming'].map(type => {
                        const typeQuestions = questions.filter(q => q.questionType === type);
                        if (typeQuestions.length === 0) return null;

                        return (
                          <TableRow key={type}>
                            <TableCell component="th" scope="row">
                              {type}
                            </TableCell>
                            <TableCell align="right">{typeQuestions.length}</TableCell>
                            <TableCell align="right">
                              {typeQuestions.length > 0
                                ? `${Math.min(...typeQuestions.map(q => q.points))} - ${Math.max(...typeQuestions.map(q => q.points))}`
                                : 'N/A'}
                            </TableCell>
                            <TableCell align="right">
                              {typeQuestions.reduce((sum, q) => sum + q.points, 0)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow sx={{ '& td': { fontWeight: 'bold' } }}>
                        <TableCell>Total</TableCell>
                        <TableCell align="right">{questions.length}</TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell align="right">{calculateTotalPoints()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button variant="outlined" onClick={() => setActiveStep(2)}>
                Back
              </Button>
              <Box>
                <Button
                  variant="outlined"
                  sx={{ mr: 2 }}
                  startIcon={<PreviewIcon />}
                >
                  Preview
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={!title || !courseId}
                  startIcon={<CheckCircleIcon />}
                >
                  {isEditing ? 'Save Changes' : 'Create Assessment'}
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default AssessmentCreation;