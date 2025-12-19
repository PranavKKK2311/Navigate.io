import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SpeedIcon from '@mui/icons-material/Speed';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';

const AssessmentPatternSelector = ({
  courseId,
  syllabusAnalysis,
  onPatternSelect,
  onCustomPatternChange,
  selectedPattern
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [syllabusPatterns, setSyllabusPatterns] = useState([]);
  const [progressInfo, setProgressInfo] = useState('');
  const [quickQuizLoading, setQuickQuizLoading] = useState(false);

  // Custom pattern state
  const [customPattern, setCustomPattern] = useState({
    name: "Custom Assessment",
    description: "Customized assessment pattern",
    questionDistribution: [
      { type: "multiple-choice", count: 10, pointsEach: 1 },
      { type: "short-answer", count: 5, pointsEach: 2 }
    ],
    difficulty: "medium",
    focusAreas: [],
    timeLimit: 30
  });

  // Editing state for question distribution
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editingItem, setEditingItem] = useState({
    type: "multiple-choice",
    count: 0,
    pointsEach: 0
  });

  // Define fetchTemplates with useCallback before using it in useEffect
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/assessment/templates/${courseId || 'default'}`);
      if (response.data.success) {
        setTemplates(response.data.templates);
      } else {
        setError('Failed to load templates');
      }
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Error loading assessment templates');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    // Load templates from API
    fetchTemplates();

    // Get assessment patterns from syllabus analysis
    if (syllabusAnalysis && syllabusAnalysis.assessmentPatterns) {
      setSyllabusPatterns(syllabusAnalysis.assessmentPatterns.patterns || []);
    }
  }, [courseId, syllabusAnalysis, fetchTemplates]);

  useEffect(() => {
    // Notify parent component when custom pattern changes
    if (tabValue === 2) { // Custom tab
      onCustomPatternChange(customPattern);
    } else {
      onCustomPatternChange(null);
    }
  }, [customPattern, tabValue, onCustomPatternChange]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);

    // Reset selection when changing tabs
    onPatternSelect(null);
  };

  const handleTemplateSelect = (template) => {
    onPatternSelect(template);
    onCustomPatternChange(null);
  };

  const handlePatternSelect = (pattern) => {
    onPatternSelect(pattern);
    onCustomPatternChange(null);
  };

  // Convert custom pattern to the format expected by the backend
  useEffect(() => {
    if (tabValue === 2) { // If custom pattern tab is selected
      // Create a properly formatted pattern object compatible with the backend
      const formattedCustomPattern = {
        name: customPattern.name,
        description: customPattern.description,
        difficulty: customPattern.difficulty,
        timeLimit: customPattern.timeLimit,
        // Convert questionDistribution to structure with the expected property names
        structure: customPattern.questionDistribution.map(item => ({
          questionType: item.type,
          count: item.count,
          pointsPerQuestion: item.pointsEach
        })),
        // Calculate total points
        totalPoints: customPattern.questionDistribution.reduce(
          (sum, item) => sum + (item.count * item.pointsEach), 0
        ),
        // Include focus areas if specified
        focusAreas: customPattern.focusAreas,
        // Flag to indicate this is a custom pattern
        isCustomPattern: true
      };

      // Set the formatted pattern as the selected pattern
      onPatternSelect(formattedCustomPattern);
      onCustomPatternChange(customPattern);
    }
  }, [customPattern, tabValue, onPatternSelect, onCustomPatternChange]);

  const handleSyllabusPatternSelect = (pattern) => {
    onPatternSelect(pattern);
    onCustomPatternChange(null);
  };

  const handleCustomPatternChange = (field, value) => {
    setCustomPattern(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddQuestionType = () => {
    if (isEditing) {
      // Update existing item
      const updatedDistribution = [...customPattern.questionDistribution];
      updatedDistribution[editingIndex] = editingItem;

      setCustomPattern(prev => ({
        ...prev,
        questionDistribution: updatedDistribution
      }));
    } else {
      // Add new item
      setCustomPattern(prev => ({
        ...prev,
        questionDistribution: [...prev.questionDistribution, editingItem]
      }));
    }

    // Reset editing state
    setIsEditing(false);
    setEditingIndex(-1);
    setEditingItem({
      type: "multiple-choice",
      count: 0,
      pointsEach: 0
    });
  };

  const handleEditQuestionType = (index) => {
    setIsEditing(true);
    setEditingIndex(index);
    setEditingItem({ ...customPattern.questionDistribution[index] });
  };

  const handleDeleteQuestionType = (index) => {
    const updatedDistribution = customPattern.questionDistribution.filter((_, i) => i !== index);
    setCustomPattern(prev => ({
      ...prev,
      questionDistribution: updatedDistribution
    }));
  };

  const handleEditingItemChange = (field, value) => {
    setEditingItem(prev => ({
      ...prev,
      [field]: field === 'count' || field === 'pointsEach' ? parseInt(value) || 0 : value
    }));
  };

  const handleGenerateQuickQuiz = async () => {
    try {
      setQuickQuizLoading(true);
      setProgressInfo('Initiating quick quiz generation...');

      // Create a quick quiz pattern
      const quickPattern = {
        name: "Quick Quiz",
        description: "A rapid assessment of key concepts",
        structure: [
          { questionType: "Multiple Choice", count: 5, pointsPerQuestion: 1 },
          { questionType: "True/False", count: 3, pointsPerQuestion: 1 }
        ],
        totalPoints: 8,
        estimatedTime: 10,
        difficulty: "Beginner",
        isQuickQuiz: true // Special flag for backend
      };

      setProgressInfo('Using optimized model for faster quiz generation...');

      // Select this pattern
      onPatternSelect(quickPattern);

      setProgressInfo('Quiz pattern ready! Click "Generate Assessment" to create your quick quiz.');
    } catch (error) {
      console.error('Error generating quick quiz:', error);
      setError('Failed to generate quick quiz. Please try a different pattern.');
    } finally {
      setQuickQuizLoading(false);
      setTimeout(() => setProgressInfo(''), 5000); // Clear progress message after 5 seconds
    }
  };

  const renderTemplateTab = () => (
    <Grid container spacing={2}>
      {/* Quick Quiz Button */}
      <Grid item xs={12}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<SpeedIcon />}
            onClick={handleGenerateQuickQuiz}
            disabled={quickQuizLoading}
          >
            {quickQuizLoading ? <CircularProgress size={24} /> : 'Generate Quick Quiz'}
          </Button>
        </Box>
        {progressInfo && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {progressInfo}
          </Alert>
        )}
      </Grid>

      {templates.map((template, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card
            elevation={selectedPattern === template ? 3 : 1}
            sx={{
              border: selectedPattern === template ? '2px solid' : '1px solid',
              borderColor: selectedPattern === template ? 'primary.main' : 'divider'
            }}
          >
            <CardActionArea onClick={() => handleTemplateSelect(template)}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {template.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {template.description}
                </Typography>

                <Typography variant="body2">
                  <strong>Difficulty:</strong> {template.difficulty}
                </Typography>
                <Typography variant="body2">
                  <strong>Time:</strong> {template.timeLimit} minutes
                </Typography>
                <Typography variant="body2">
                  <strong>Questions:</strong> {template.questionDistribution.reduce((sum, item) => sum + item.count, 0)}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  {template.questionDistribution.map((item, i) => (
                    <Typography variant="body2" key={i}>
                      • {item.count} {item.type} ({item.pointsEach} {item.pointsEach === 1 ? 'point' : 'points'} each)
                    </Typography>
                  ))}
                </Box>

                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                  <AutoAwesomeIcon
                    sx={{
                      fontSize: 16,
                      mr: 0.5,
                      color: 'secondary.main'
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Generated by Gemini AI
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}

      {templates.length === 0 && !loading && (
        <Grid item xs={12}>
          <Alert severity="info">
            No templates available. Use the syllabus-generated patterns or create a custom pattern.
          </Alert>
        </Grid>
      )}
    </Grid>
  );

  const renderSyllabusPatternTab = () => (
    <Grid container spacing={2}>
      {syllabusPatterns.map((pattern, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card
            elevation={selectedPattern === pattern ? 3 : 1}
            sx={{
              border: selectedPattern === pattern ? '2px solid' : '1px solid',
              borderColor: selectedPattern === pattern ? 'primary.main' : 'divider'
            }}
          >
            <CardActionArea onClick={() => handleSyllabusPatternSelect(pattern)}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {pattern.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {pattern.description}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  {pattern.structure.map((item, i) => (
                    <Typography variant="body2" key={i}>
                      • {item.count} {item.questionType} ({item.pointsPerQuestion} {item.pointsPerQuestion === 1 ? 'point' : 'points'} each)
                    </Typography>
                  ))}
                </Box>

                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Total Points:</strong> {pattern.totalPoints}
                </Typography>
                <Typography variant="body2">
                  <strong>Time:</strong> {pattern.estimatedTime || pattern.estimatedDuration} min
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}

      {syllabusPatterns.length === 0 && (
        <Grid item xs={12}>
          <Alert severity="info">
            No patterns were generated from the syllabus analysis. Please use a template or create a custom pattern.
          </Alert>
        </Grid>
      )}
    </Grid>
  );

  const renderCustomPatternTab = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Custom Assessment Pattern
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Assessment Name"
            value={customPattern.name}
            onChange={(e) => handleCustomPatternChange('name', e.target.value)}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Time Limit (minutes)"
            type="number"
            value={customPattern.timeLimit}
            onChange={(e) => handleCustomPatternChange('timeLimit', parseInt(e.target.value) || 30)}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            value={customPattern.description}
            onChange={(e) => handleCustomPatternChange('description', e.target.value)}
            margin="normal"
            multiline
            rows={2}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Difficulty Level</InputLabel>
            <Select
              value={customPattern.difficulty}
              label="Difficulty Level"
              onChange={(e) => handleCustomPatternChange('difficulty', e.target.value)}
            >
              <MenuItem value="easy">Easy</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="hard">Hard</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
        Question Distribution
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Question Type</TableCell>
              <TableCell align="right">Count</TableCell>
              <TableCell align="right">Points Each</TableCell>
              <TableCell align="right">Total Points</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customPattern.questionDistribution.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.type}</TableCell>
                <TableCell align="right">{item.count}</TableCell>
                <TableCell align="right">{item.pointsEach}</TableCell>
                <TableCell align="right">{item.count * item.pointsEach}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleEditQuestionType(index)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteQuestionType(index)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            <TableRow>
              <TableCell colSpan={3} align="right">
                <strong>Total:</strong>
              </TableCell>
              <TableCell align="right">
                <strong>
                  {customPattern.questionDistribution.reduce((sum, item) =>
                    sum + (item.count * item.pointsEach), 0
                  )}
                </strong>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Typography variant="subtitle1" gutterBottom>
          {isEditing ? 'Edit Question Type' : 'Add Question Type'}
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Question Type</InputLabel>
              <Select
                value={editingItem.type}
                label="Question Type"
                onChange={(e) => handleEditingItemChange('type', e.target.value)}
              >
                <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
                <MenuItem value="short-answer">Short Answer</MenuItem>
                <MenuItem value="essay">Essay</MenuItem>
                <MenuItem value="true-false">True/False</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              label="Count"
              type="number"
              value={editingItem.count}
              onChange={(e) => handleEditingItemChange('count', e.target.value)}
            />
          </Grid>

          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              label="Points Each"
              type="number"
              value={editingItem.pointsEach}
              onChange={(e) => handleEditingItemChange('pointsEach', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={2} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={isEditing ? <EditIcon /> : <AddIcon />}
              onClick={handleAddQuestionType}
              disabled={editingItem.count <= 0 || editingItem.pointsEach <= 0}
            >
              {isEditing ? 'Update' : 'Add'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Add focus areas selection based on syllabus analysis topics */}
      {syllabusAnalysis && syllabusAnalysis.learningOutcomes && syllabusAnalysis.learningOutcomes.keyTopics && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Focus Areas (Optional)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select specific topics to emphasize in the assessment, or leave empty to cover all topics.
          </Typography>

          <Grid container spacing={1}>
            {syllabusAnalysis.learningOutcomes.keyTopics.map((topic, index) => (
              <Grid item key={index}>
                <Button
                  variant={customPattern.focusAreas.includes(topic) ? "contained" : "outlined"}
                  size="small"
                  onClick={() => {
                    const newFocusAreas = customPattern.focusAreas.includes(topic)
                      ? customPattern.focusAreas.filter(t => t !== topic)
                      : [...customPattern.focusAreas, topic];

                    handleCustomPatternChange('focusAreas', newFocusAreas);
                  }}
                  sx={{ mb: 1 }}
                >
                  {topic}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Paper>
  );

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="assessment pattern tabs"
            >
              <Tab label="Templates" />
              <Tab label="Syllabus Patterns" />
              <Tab label="Custom Pattern" />
            </Tabs>
          </Box>

          <Box sx={{ mb: 3 }}>
            {tabValue === 0 && renderTemplateTab()}
            {tabValue === 1 && renderSyllabusPatternTab()}
            {tabValue === 2 && renderCustomPatternTab()}
          </Box>

          {tabValue !== 2 && selectedPattern && (
            <Alert severity="success">
              Selected: <strong>{selectedPattern.name}</strong>
            </Alert>
          )}

          {tabValue === 2 && (
            <Alert severity="info">
              Using custom pattern with {customPattern.questionDistribution.reduce((sum, item) => sum + item.count, 0)} questions
              and {customPattern.questionDistribution.reduce((sum, item) => sum + (item.count * item.pointsEach), 0)} total points
            </Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default AssessmentPatternSelector;