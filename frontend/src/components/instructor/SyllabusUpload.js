import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Alert, Box, Button, Card, CardContent, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, FormControlLabel, IconButton, InputLabel, List, ListItem, MenuItem, Paper, Select, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios'; // Import axios instead of using fetch
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth hook
import AssessmentPatternSelector from './AssessmentPatternSelector';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configure axios instance with base URL and default timeout
const api = axios.create({
  baseURL: API_URL,
  timeout: 60000 // 60 second timeout
});

// Create axios interceptor to add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const steps = [
  'Upload Syllabus',
  'Select Pattern & Generate Quiz',
  'Customize Questions',
  'Settings & Review'
];

const SyllabusUpload = () => {
  const [file, setFile] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('file');
  const [syllabusAnalysis, setSyllabusAnalysis] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [generatedAssessment, setGeneratedAssessment] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [generatingAssessment, setGeneratingAssessment] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [apiAccessible, setApiAccessible] = useState(false);
  const [syllabusTopics, setSyllabusTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const { currentUser, token } = useAuth(); // Get auth context
  const navigate = useNavigate(); // Initialize navigate hook

  const patternSectionRef = useRef(null);

  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        const response = await api.get('/health');
        if (response.status === 200) {
          setApiAccessible(true);
        } else {
          setApiAccessible(false);
        }
      } catch (error) {
        console.error('Error checking API connection:', error);
        setApiAccessible(false);
      }
    };

    checkApiConnection();
  }, []);

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);

      if (selectedFile.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setTextContent(e.target.result);
        };
        reader.readAsText(selectedFile);
      }
    }
  };

  const handleTextChange = (event) => {
    setTextContent(event.target.value);
    setError(null);
  };

  const handleAnalyzeSyllabus = async () => {
    try {
      setError(null);
      setAnalyzing(true);

      let syllabusContent = '';

      if (uploadMethod === 'file' && file) {
        if (file.type === 'text/plain') {
          syllabusContent = textContent;
        } else {
          const formData = new FormData();
          formData.append('file', file);

          const uploadResponse = await api.post('/instructor/assessment/upload-syllabus', formData);

          if (uploadResponse.status !== 200) {
            throw new Error(`File upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
          }

          const uploadData = uploadResponse.data;
          syllabusContent = uploadData.syllabusContent || '';
        }
      } else if (uploadMethod === 'text' && textContent) {
        syllabusContent = textContent;
      } else {
        throw new Error('Please upload a file or enter text content');
      }

      if (!syllabusContent || syllabusContent.trim().length < 10) {
        console.error('Syllabus content too short:', syllabusContent);
        throw new Error('The syllabus content appears to be too short or empty. Please ensure you have uploaded a complete syllabus document.');
      }

      console.log(`Analyzing syllabus. Content length: ${syllabusContent.length} characters`);

      const analysisResponse = await api.post('/assessment/analyze-syllabus', { syllabusContent });

      if (analysisResponse.status !== 200) {
        throw new Error(`API error: ${analysisResponse.status} ${analysisResponse.statusText}`);
      }

      const analysisData = analysisResponse.data;

      if (!analysisData.success || !analysisData.syllabusAnalysis) {
        throw new Error(analysisData.message || 'Failed to analyze syllabus');
      }

      setSyllabusAnalysis(analysisData.syllabusAnalysis);
      if (analysisData.syllabusTopics && Array.isArray(analysisData.syllabusTopics)) {
        setSyllabusTopics(analysisData.syllabusTopics);
        setSelectedTopics(analysisData.syllabusTopics);
      } else {
        // Try to get topics from the learning outcomes
        const fallbackTopics = analysisData.syllabusAnalysis.learningOutcomes?.keyTopics || [];

        // If we still don't have topics, provide some mock topics based on common educational subjects
        if (fallbackTopics.length === 0) {
          const mockTopics = [
            "Introduction to the Subject",
            "Fundamental Concepts",
            "Theoretical Frameworks",
            "Practical Applications",
            "Problem-Solving Techniques",
            "Critical Analysis",
            "Research Methods",
            "Case Studies",
            "Professional Ethics",
            "Current Trends"
          ];

          setSyllabusTopics(mockTopics);
          setSelectedTopics(mockTopics);
        } else {
          setSyllabusTopics(fallbackTopics);
          setSelectedTopics(fallbackTopics);
        }
      }

      setSuccess('Syllabus successfully analyzed! Proceeding to pattern selection.');

      setActiveStep(1);
    } catch (err) {
      console.error('Error analyzing syllabus:', err);

      if (err.message.includes('too short') || err.message.includes('empty')) {
        setError('The syllabus content is too short. Please upload a complete syllabus document with sufficient content for analysis.');
      } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        setError('Authentication error. Please log in again to continue.');
      } else {
        setError(err.message || 'Error analyzing syllabus. Please try again.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateAssessment = async () => {
    if (!selectedPattern) {
      setError('Please select an assessment pattern first');
      return;
    }

    try {
      setError(null);
      setGeneratingAssessment(true);

      console.log("Generating assessment with pattern using Gemini API:", selectedPattern.name);
      const response = await api.post('/instructor/assessment/generate-questions', {
        syllabusAnalysis: syllabusAnalysis,
        pattern: {
          ...selectedPattern,
          topicFocus: selectedTopics,
          modelName: process.env.REACT_APP_GEMINI_MODEL || 'gemini-2.0-flash'
        }
      });

      if (response.status !== 200) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = response.data;

      if (!data.success || !data.assessment) {
        throw new Error(data.message || 'Failed to generate assessment');
      }

      setGeneratedAssessment(data.assessment);
      setSuccess('Assessment successfully generated!');
      setActiveStep(2);
    } catch (err) {
      console.error('Error generating assessment:', err);
      setError(err.message || 'Error generating assessment. Please try again.');
    } finally {
      setGeneratingAssessment(false);
    }
  };

  useEffect(() => {
    if (activeStep === 1 && !syllabusAnalysis && (file || textContent)) {
      handleAnalyzeSyllabus();
    }
  }, [activeStep, syllabusAnalysis]);

  const handleBackToUpload = () => {
    setActiveStep(0);
  };

  const handleOpenTopicDialog = () => {
    setTopicDialogOpen(true);
  };

  const handleCloseTopicDialog = () => {
    setTopicDialogOpen(false);
  };

  const handleToggleTopic = (topic) => {
    setSelectedTopics(prev => {
      if (prev.includes(topic)) {
        return prev.filter(t => t !== topic);
      } else {
        return [...prev, topic];
      }
    });
  };

  const handleSelectAllTopics = () => {
    setSelectedTopics([...syllabusTopics]);
  };

  const handleDeselectAllTopics = () => {
    setSelectedTopics([]);
  };

  // Question editing handlers
  const handleEditQuestion = (index) => {
    setEditingQuestionIndex(index);
    setEditingQuestion({ ...generatedAssessment.questions[index] });
  };

  const handleSaveEditedQuestion = () => {
    if (editingQuestionIndex !== null && editingQuestion) {
      const updatedQuestions = [...generatedAssessment.questions];
      updatedQuestions[editingQuestionIndex] = editingQuestion;
      setGeneratedAssessment({
        ...generatedAssessment,
        questions: updatedQuestions
      });
      setEditingQuestionIndex(null);
      setEditingQuestion(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingQuestionIndex(null);
    setEditingQuestion(null);
  };

  const handleUpdateEditingQuestion = (field, value) => {
    setEditingQuestion(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateOption = (optionIndex, value) => {
    const newOptions = [...editingQuestion.options];
    newOptions[optionIndex] = value;
    setEditingQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const handleDeleteQuestion = (index) => {
    const updatedQuestions = generatedAssessment.questions.filter((_, i) => i !== index);
    setGeneratedAssessment({
      ...generatedAssessment,
      questions: updatedQuestions,
      totalPoints: updatedQuestions.reduce((sum, q) => sum + (q.points || 0), 0)
    });
  };

  const renderTopicSelector = () => (
    <Box mt={2} mb={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Selected Topics ({selectedTopics.length}/{syllabusTopics.length})</Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleOpenTopicDialog}
        >
          Manage Topics
        </Button>
      </Box>

      <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
        {selectedTopics.map((topic, index) => (
          <Chip
            key={index}
            label={topic}
            color="primary"
            variant="outlined"
          />
        ))}
        {selectedTopics.length === 0 && (
          <Typography color="text.secondary" variant="body2">No topics selected. Click "Manage Topics" to select topics for your assessment.</Typography>
        )}
      </Box>

      <Dialog open={topicDialogOpen} onClose={handleCloseTopicDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Select Topics for Assessment</Typography>
          <Typography variant="body2" color="text.secondary">
            Choose which topics to include in your assessment
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box mb={2} display="flex" justifyContent="space-between">
            <Button size="small" onClick={handleSelectAllTopics}>Select All</Button>
            <Button size="small" onClick={handleDeselectAllTopics}>Deselect All</Button>
          </Box>
          <List sx={{ pt: 0 }}>
            {syllabusTopics.map((topic, index) => (
              <ListItem key={index} disablePadding>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedTopics.includes(topic)}
                      onChange={() => handleToggleTopic(topic)}
                    />
                  }
                  label={topic}
                  sx={{ width: '100%', py: 0.5 }}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTopicDialog} color="primary">Done</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  const renderUploadSyllabusStep = () => (
    <Box>
      <Typography variant="body1" paragraph>
        Upload your course syllabus to move to the next step where you can select a pattern and generate assessment questions.
      </Typography>

      <Box mb={3}>
        <Box sx={{ display: 'flex', mb: 2 }}>
          <Button
            variant={uploadMethod === 'file' ? 'contained' : 'outlined'}
            onClick={() => setUploadMethod('file')}
            sx={{ mr: 1 }}
          >
            File Upload
          </Button>
          <Button
            variant={uploadMethod === 'text' ? 'contained' : 'outlined'}
            onClick={() => setUploadMethod('text')}
          >
            Enter Text
          </Button>
        </Box>

        {uploadMethod === 'file' ? (
          <Box sx={{ mb: 2 }}>
            <Button
              component="label"
              variant="contained"
              startIcon={<CloudUploadIcon />}
              fullWidth
              sx={{ mb: 1 }}
            >
              Upload Syllabus
              <VisuallyHiddenInput type="file" onChange={handleFileUpload} />
            </Button>
            {file && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected file: {file.name}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              Supported formats: PDF, DOC, DOCX, TXT
            </Typography>
          </Box>
        ) : (
          <TextField
            multiline
            rows={6}
            fullWidth
            placeholder="Paste syllabus content here..."
            value={textContent}
            onChange={handleTextChange}
            sx={{ mb: 2 }}
            variant="outlined"
          />
        )}
      </Box>

      {(!file && uploadMethod === 'file') && (
        <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Sample Content (for testing):
          </Typography>
          <Box sx={{ maxHeight: '150px', overflowY: 'auto', fontSize: '0.75rem' }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              Unit 1: Introduction to Python Programming
              Unit 2: Variables, Data Types, and Operators
              Unit 3: Control Flow and Looping Statements
              Unit 4: Functions and Modular Programming
              Unit 5: Data Structures and String Manipulation
            </pre>
          </Box>
        </Paper>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setActiveStep(1)}
          disabled={(uploadMethod === 'file' && !file) || (uploadMethod === 'text' && !textContent)}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );

  const renderPatternSelectionStep = () => (
    <Box>
      <Typography variant="body1" paragraph>
        Select an assessment pattern or create a custom pattern. The selected pattern will determine the structure and types of questions generated.
      </Typography>      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {syllabusTopics && syllabusTopics.length > 0 && renderTopicSelector()}

      <Box ref={patternSectionRef} mb={3}>
        <AssessmentPatternSelector
          courseId={null}
          syllabusAnalysis={syllabusAnalysis}
          onPatternSelect={setSelectedPattern}
          onCustomPatternChange={() => { }}
          selectedPattern={selectedPattern}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleBackToUpload}
        >
          Back
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerateAssessment}
          disabled={!selectedPattern || generatingAssessment}
        >
          {generatingAssessment ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              Generating...
            </>
          ) : (
            'Generate Assessment'
          )}
        </Button>
      </Box>
    </Box>
  );

  const renderQuestionsCustomizationStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Assessment Preview
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {generatedAssessment ? (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {generatedAssessment.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {generatedAssessment.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <Chip label={`Total: ${generatedAssessment.totalPoints} points`} />
                <Chip label={`Time: ${generatedAssessment.timeLimit} minutes`} />
                <Chip label={`Questions: ${generatedAssessment.questions?.length || 0}`} />
                <Chip
                  label={`Generated by: ${generatedAssessment.generatedBy || 'GPT-2'}`}
                  color="secondary"
                />
              </Box>
            </CardContent>
          </Card>

          <Typography variant="h6" gutterBottom>
            Generated Questions
          </Typography>

          {generatedAssessment.questions?.map((question, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Question {index + 1}: {question.questionType || question.type}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      size="small"
                      label={`${question.points || 0} points`}
                      color="primary"
                      variant="outlined"
                    />
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEditQuestion(index)}
                      title="Edit question"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteQuestion(index)}
                      title="Delete question"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Typography variant="body1" paragraph>
                  {question.question}
                </Typography>

                {(question.options && question.options.length > 0) && (
                  <Box sx={{ ml: 2 }}>
                    {question.options.map((option, optIndex) => (
                      <Typography
                        key={optIndex}
                        variant="body2"
                        sx={{
                          mb: 1,
                          fontWeight: option === question.correctAnswer ? 'bold' : 'normal',
                          color: option === question.correctAnswer ? 'success.main' : 'text.primary'
                        }}
                      >
                        {String.fromCharCode(65 + optIndex)}. {option}
                        {option === question.correctAnswer && ' ✓'}
                      </Typography>
                    ))}
                  </Box>
                )}

                {(!question.options || question.options.length === 0) && question.correctAnswer && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2">
                      Sample Answer:
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      {question.correctAnswer}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip size="small" label={`Topic: ${question.topic || 'General'}`} />
                  <Chip size="small" label={`Difficulty: ${question.difficulty || 'Medium'}`} />
                  {question.bloomLevel && (
                    <Chip
                      size="small"
                      label={`Bloom's Level: ${question.bloomLevel}`}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}

          {/* Question Edit Modal */}
          <QuestionEditModal
            open={editingQuestionIndex !== null}
            question={editingQuestion}
            onSave={handleSaveEditedQuestion}
            onCancel={handleCancelEdit}
            onUpdate={handleUpdateEditingQuestion}
            onUpdateOption={handleUpdateOption}
          />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => setActiveStep(1)}
        >
          Back to Patterns
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setActiveStep(3)}
          disabled={!generatedAssessment}
        >
          Continue to Settings
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label, index) => (
          <Step key={index}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box mt={3}>
        {activeStep === 0 && renderUploadSyllabusStep()}
        {activeStep === 1 && renderPatternSelectionStep()}
        {activeStep === 2 && renderQuestionsCustomizationStep()}        {activeStep === 3 && (
          <SettingsAndReviewStep
            generatedAssessment={generatedAssessment}
            syllabusAnalysis={syllabusAnalysis}
            loading={loading}
            setLoading={setLoading}
            success={success}
            setSuccess={setSuccess}
            navigate={navigate}
            setActiveStep={setActiveStep}
            selectedPattern={selectedPattern}
          />
        )}
      </Box>
    </Box>
  );
};

const SettingsAndReviewStep = ({
  generatedAssessment,
  syllabusAnalysis,
  loading,
  setLoading,
  success,
  setSuccess,
  navigate,
  setActiveStep,
  selectedPattern
}) => {
  const [courseId, setCourseId] = useState('');
  const [assignToAll, setAssignToAll] = useState(true);
  const [formError, setFormError] = useState(null);
  const [message, setMessage] = useState('');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Default 1 week
  const [assessmentTitle, setAssessmentTitle] = useState(generatedAssessment?.title || 'Course Assessment');
  const handleSaveAssessment = async () => {
    try {
      setFormError(null);
      setLoading(true);

      if (!generatedAssessment) {
        throw new Error('Please generate an assessment first');
      }

      if (!courseId) {
        setFormError('Please select a course');
        setLoading(false);
        return;
      }
      // Prepare assessment data
      const assessmentData = {
        id: `assessment-${Date.now()}`,
        title: assessmentTitle,
        description: generatedAssessment.description || 'Assessment generated from syllabus analysis',
        courseId: courseId,
        questions: generatedAssessment.questions,
        timeLimit: generatedAssessment.timeLimit || 60,
        totalPoints: generatedAssessment.totalPoints || generatedAssessment.questions.reduce((sum, q) => sum + (q.points || 0), 0),
        assignToAllStudents: assignToAll,
        syllabusTitle: syllabusAnalysis.title || generatedAssessment.title || 'Course Assessment',
        pattern: selectedPattern, // Include the selected pattern in the assessment data
        status: assignToAll ? 'published' : 'draft', // Explicitly set the status
        visibility: {
          instructorCanSeeAnswers: true,
          studentsCanSeeAnswers: false,
          studentsCanSeeSyllabusTitle: false,
          showResultsImmediately: true,
          pattern: selectedPattern ? {
            name: selectedPattern.name,
            description: selectedPattern.description,
            questionDistribution: selectedPattern.questionDistribution || selectedPattern.structure,
            difficulty: selectedPattern.difficulty
          } : null // Include pattern information in visibility settings
        },
        dueDate: new Date(dueDate).toISOString(), // Use teacher-set due date
        createdAt: new Date().toISOString()
      };
      try {
        // Try to save to API        console.log(`Saving assessment to API for course ID: ${courseId}...`);
        const token = localStorage.getItem('token');
        const response = await axios.post('/api/instructor/assessment/save', assessmentData, {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          }
        });
        console.log("Assessment saved to API successfully:", response.data);

        const successMsg = `Assessment "${assessmentData.title}" has been saved successfully. ${assignToAll ? 'It is now available to students.' : 'It has been saved as a draft.'}`;
        setSuccess(successMsg);
        setMessage(successMsg);
        setLoading(false);

        return;
      } catch (apiError) {
        console.warn("API save failed:", apiError.response ? apiError.response.data : apiError.message);
        setFormError(`Error saving assessment: ${apiError.response?.data?.message || apiError.message}. Please try again.`);
        setLoading(false);
      }

      // Show success message
      const successMsg = `Assessment saved successfully. ${assignToAll ? 'Assessment has been assigned to all students in the course.' : 'Assessment saved as draft.'}`;
      setSuccess(successMsg);
      setMessage(successMsg);

      // Reset the form or navigate to the course page
      setTimeout(() => {
        navigate(`/instructor/courses/${courseId}`);
      }, 2000);
    } catch (err) {
      console.error('Error saving assessment:', err);
      setFormError(err.message || 'Error saving assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>      <Typography variant="h6" gutterBottom>
      Settings & Review
    </Typography>

      {formError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message || success}
        </Alert>
      )}

      <Box mb={3}>
        <TextField
          label="Assessment Title"
          fullWidth
          value={assessmentTitle}
          onChange={(e) => setAssessmentTitle(e.target.value)}
          variant="outlined"
          sx={{ mb: 2 }}
          helperText="Customize the name of this assessment"
        />
        <TextField
          label="Course ID"
          fullWidth
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <TextField
          label="Due Date"
          type="date"
          fullWidth
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          variant="outlined"
          sx={{ mb: 2 }}
          InputLabelProps={{ shrink: true }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={assignToAll}
              onChange={(e) => setAssignToAll(e.target.checked)}
            />
          }
          label="Assign to all students in the course"
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => setActiveStep(2)}
        >
          Back to Questions
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveAssessment}
          disabled={loading}
        >
          {loading ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              Saving...
            </>
          ) : (
            'Save Assessment'
          )}
        </Button>
      </Box>
    </Box>
  );
};

// Question Edit Modal component
const QuestionEditModal = ({
  open,
  question,
  onSave,
  onCancel,
  onUpdate,
  onUpdateOption
}) => {
  if (!question) return null;

  const isMultipleChoice = question.questionType === 'multiple-choice' || question.type === 'multiple-choice';
  const isTrueFalse = question.questionType === 'true-false' || question.type === 'true-false';

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1a1a2e',
          backgroundImage: 'none',
          border: '2px solid #4a4a6a',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)'
        }
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.85)'
          }
        }
      }}
    >
      <DialogTitle sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1.3rem' }}>Edit Question</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Question Text"
            value={question.question || ''}
            onChange={(e) => onUpdate('question', e.target.value)}
            multiline
            rows={3}
            fullWidth
          />

          {isMultipleChoice && question.options && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>Options:</Typography>
              {question.options.map((option, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography sx={{ minWidth: 24 }}>{String.fromCharCode(65 + idx)}.</Typography>
                  <TextField
                    value={option}
                    onChange={(e) => onUpdateOption(idx, e.target.value)}
                    size="small"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: option === question.correctAnswer ? 'rgba(46, 125, 50, 0.1)' : 'transparent'
                      }
                    }}
                  />
                  <Button
                    size="small"
                    variant={option === question.correctAnswer ? 'contained' : 'outlined'}
                    color="success"
                    onClick={() => onUpdate('correctAnswer', option)}
                  >
                    ✓
                  </Button>
                </Box>
              ))}
            </Box>
          )}

          {isTrueFalse && (
            <FormControl fullWidth>
              <InputLabel>Correct Answer</InputLabel>
              <Select
                value={question.correctAnswer || 'True'}
                label="Correct Answer"
                onChange={(e) => onUpdate('correctAnswer', e.target.value)}
              >
                <MenuItem value="True">True</MenuItem>
                <MenuItem value="False">False</MenuItem>
              </Select>
            </FormControl>
          )}

          {!isMultipleChoice && !isTrueFalse && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Sample Answer"
                value={question.sampleAnswer || question.correctAnswer || ''}
                onChange={(e) => {
                  onUpdate('sampleAnswer', e.target.value);
                  onUpdate('correctAnswer', e.target.value);
                }}
                multiline
                rows={2}
                fullWidth
                helperText="The model answer that demonstrates what a complete response should include"
              />
              <TextField
                label="Keywords for Grading (comma-separated)"
                value={question.keywords || ''}
                onChange={(e) => onUpdate('keywords', e.target.value)}
                fullWidth
                placeholder="e.g., native state, elementary form, element, pure form"
                helperText="Students must use these keywords to receive full credit. Enter key terms separated by commas."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(46, 125, 50, 0.05)'
                  }
                }}
              />
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Points"
              type="number"
              value={question.points || 10}
              onChange={(e) => onUpdate('points', parseInt(e.target.value) || 0)}
              sx={{ width: 120 }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={question.difficulty || 'Medium'}
                label="Difficulty"
                onChange={(e) => onUpdate('difficulty', e.target.value)}
              >
                <MenuItem value="Easy">Easy</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Hard">Hard</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Topic"
              value={question.topic || ''}
              onChange={(e) => onUpdate('topic', e.target.value)}
              sx={{ flexGrow: 1 }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ backgroundColor: 'rgba(30, 30, 50, 0.9)', borderTop: '1px solid #4a4a6a', p: 2 }}>
        <Button onClick={onCancel} sx={{ color: '#ccc', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}>Cancel</Button>
        <Button onClick={onSave} variant="contained" color="primary" sx={{ fontWeight: 'bold', px: 3 }}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Wrap the main component with the edit modal
const SyllabusUploadWithModal = () => {
  return <SyllabusUpload />;
};

export default SyllabusUpload;
