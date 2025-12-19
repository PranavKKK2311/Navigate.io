import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SaveIcon from '@mui/icons-material/Save';
import SchoolIcon from '@mui/icons-material/School';
// Import all Material UI icons that might be used for topics
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AppsIcon from '@mui/icons-material/Apps';
import BarChartIcon from '@mui/icons-material/BarChart';
import BiotechIcon from '@mui/icons-material/Biotech';
import BrushIcon from '@mui/icons-material/Brush';
import BuildIcon from '@mui/icons-material/Build';
import BusinessIcon from '@mui/icons-material/Business';
import CalculateIcon from '@mui/icons-material/Calculate';
import CampaignIcon from '@mui/icons-material/Campaign';
import CodeIcon from '@mui/icons-material/Code';
import ConstructionIcon from '@mui/icons-material/Construction';
import DataObjectIcon from '@mui/icons-material/DataObject';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import DeveloperModeIcon from '@mui/icons-material/DeveloperMode';
// EditIcon is already imported above
import FindInPageIcon from '@mui/icons-material/FindInPage';
import FunctionsIcon from '@mui/icons-material/Functions';
import GradingIcon from '@mui/icons-material/Grading';
import HistoryIcon from '@mui/icons-material/History';
import ImportContactsIcon from '@mui/icons-material/ImportContacts';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PaidIcon from '@mui/icons-material/Paid';
import PaletteIcon from '@mui/icons-material/Palette';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ScienceIcon from '@mui/icons-material/Science';
import SearchIcon from '@mui/icons-material/Search';
import StorageIcon from '@mui/icons-material/Storage';
import TranslateIcon from '@mui/icons-material/Translate';
import WebIcon from '@mui/icons-material/Web';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Import curriculum service
import curriculumService from '../../services/curriculumService';

// Bloom's Taxonomy Levels
const bloomLevels = [
  { value: 'Recollect', color: '#e3f2fd' },
  { value: 'Understand', color: '#bbdefb' },
  { value: 'Apply', color: '#90caf9' },
  { value: 'Analyze', color: '#64b5f6' },
  { value: 'Evaluate', color: '#42a5f5' },
  { value: 'Create', color: '#2196f3' }
];

// Competency Levels
const competencyLevels = [
  { value: 'Introductory', color: '#c8e6c9' },
  { value: 'Core', color: '#81c784' },
  { value: 'Advanced', color: '#4caf50' }
];

const CurriculumMapping = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [course, setCourse] = useState({
    id: courseId || '1',
    title: '',
    code: '',
    description: '',
    learningOutcomes: [],
    assessments: [],
    topics: [],
    programOutcomes: []
  });
  const [editingOutcome, setEditingOutcome] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [hoveredCell, setHoveredCell] = useState(null);

  // Helper function to render the correct icon based on icon name
  const renderTopicIcon = (iconName) => {
    const iconMap = {
      'AccountTree': <AccountTreeIcon />,
      'Analytics': <AnalyticsIcon />,
      'Apps': <AppsIcon />,
      'BarChart': <BarChartIcon />,
      'Biotech': <BiotechIcon />,
      'Brush': <BrushIcon />,
      'Build': <BuildIcon />,
      'Business': <BusinessIcon />,
      'Calculate': <CalculateIcon />,
      'Campaign': <CampaignIcon />,
      'Code': <CodeIcon />,
      'Construction': <ConstructionIcon />,
      'DataObject': <DataObjectIcon />,
      'Design': <DesignServicesIcon />,
      'DeveloperMode': <DeveloperModeIcon />,
      'Edit': <EditIcon />,
      'FindInPage': <FindInPageIcon />,
      'Functions': <FunctionsIcon />,
      'Grading': <GradingIcon />,
      'History': <HistoryIcon />,
      'ImportContacts': <ImportContactsIcon />,
      'Lightbulb': <LightbulbIcon />,
      'ManageAccounts': <ManageAccountsIcon />,
      'MenuBook': <MenuBookIcon />,
      'Paid': <PaidIcon />,
      'Palette': <PaletteIcon />,
      'Psychology': <PsychologyIcon />,
      'School': <SchoolIcon />,
      'Science': <ScienceIcon />,
      'Search': <SearchIcon />,
      'Storage': <StorageIcon />,
      'Translate': <TranslateIcon />,
      'Web': <WebIcon />
    };

    return iconMap[iconName] || <SchoolIcon />;
  };

  // Load course data
  useEffect(() => {
    setLoading(true);
    setError(null);

    const fetchCourseData = async () => {
      try {
        // First, check if we have course data from the course management page
        const currentCourseStr = localStorage.getItem('currentCourse');

        if (currentCourseStr) {
          const currentCourse = JSON.parse(currentCourseStr);

          // If the courseId matches, use the stored course data
          if (currentCourse.id === courseId) {
            setCourse(prevCourse => ({
              ...prevCourse,
              id: currentCourse.id,
              title: currentCourse.title,
              code: currentCourse.code,
              description: currentCourse.description,
              topics: currentCourse.topics || []
            }));

            setLoading(false);
            return;
          }
        }

        // If no stored course data or different course ID, try to fetch from API
        if (courseId) {
          // This would be an API call in a real app
          const response = await curriculumService.getCurriculumMap(courseId);
          if (response && response.course) {
            setCourse(response.course);
          }
        } else {
          // Set up an empty course structure with default values
          const emptyCourse = {
            id: 'new', // Will be replaced with real ID after save
            title: '',
            code: '',
            description: '',
            learningOutcomes: [], assessments: [
              {
                id: '1',
                title: 'Java Data Structures Assessment',
                type: 'Exam',
                topics: [],
                questions: 0,
                totalPoints: 100
              },
              {
                id: '2',
                title: 'Final Project',
                type: 'Project',
                topics: [],
                questions: 0,
                totalPoints: 100
              },
              {
                id: '3',
                title: 'Final Exam',
                type: 'Exam',
                topics: [],
                questions: 0,
                totalPoints: 100
              }
            ],
            topics: [],
            programOutcomes: [
              {
                id: '1',
                text: 'Apply knowledge appropriate to the discipline',
                mappedOutcomes: []
              },
              {
                id: '2',
                text: 'Analyze problems and identify requirements appropriate to its solution',
                mappedOutcomes: []
              },
              {
                id: '3',
                text: 'Design, implement, and evaluate solutions to meet desired needs',
                mappedOutcomes: []
              },
              {
                id: '4',
                text: 'Use current techniques, skills, and tools necessary for professional practice',
                mappedOutcomes: []
              }
            ]
          };

          setCourse(emptyCourse);
        }
      } catch (error) {
        console.error('Error loading course data:', error);
        setError('Failed to load course data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Open edit dialog
  const handleOpenEditDialog = (outcome) => {
    setEditingOutcome({ ...outcome });
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingOutcome(null);
  };

  // Save outcome changes
  const handleSaveOutcome = () => {
    // In a real app, you would save the changes to the database
    console.log('Saving outcome:', editingOutcome);

    // Update the local state
    setCourse(prevCourse => ({
      ...prevCourse,
      learningOutcomes: prevCourse.learningOutcomes.map(outcome =>
        outcome.id === editingOutcome.id ? editingOutcome : outcome
      )
    }));

    handleCloseDialog();
  };

  // Add a new empty outcome
  const handleAddOutcome = () => {
    const newId = `outcome-${course.learningOutcomes.length + 1}`;
    const newOutcome = {
      id: newId,
      text: '',
      bloom: 'Apply',
      competency: 'Core',
      assessments: []
    };

    setEditingOutcome(newOutcome);
    setOpenDialog(true);

    // Add the new outcome when saved
    const handleSaveNewOutcome = () => {
      if (editingOutcome.text) {
        setCourse(prevCourse => ({
          ...prevCourse,
          learningOutcomes: [...prevCourse.learningOutcomes, editingOutcome]
        }));
      }
      handleCloseDialog();
    };

    // Replace the save function temporarily
    handleSaveOutcome = handleSaveNewOutcome;
  };

  // Generate learning outcomes from course description
  const handleGenerateLearningOutcomes = async () => {
    setGenerating(true);
    setError(null);

    try {
      const courseTitle = course?.title || 'New Course';
      const courseDescription = course?.description || '';

      if (!courseDescription) {
        setError('Please provide a course description with clearly defined topics before generating learning outcomes');
        setGenerating(false);
        return;
      }

      // Check if user is authenticated before making the request
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to generate learning outcomes. Please log in and try again.');
        setGenerating(false);
        return;
      }

      // Extract topics from the description if possible
      const topics = extractTopicsFromDescription(courseDescription);

      // Call the service method to generate outcomes based on the description and extracted topics
      const result = await curriculumService.generateLearningOutcomesFromDescription(
        courseTitle,
        courseDescription,
        topics
      );

      if (result.success) {
        // Update the course with the AI-generated learning outcomes
        setCourse(prevCourse => {
          // Generate IDs for new outcomes
          const newOutcomes = result.data.outcomes.map((outcome, index) => ({
            id: `lo-${prevCourse.learningOutcomes.length + index + 1}`,
            text: outcome.text,
            bloom: outcome.bloom,
            competency: outcome.competency,
            assessments: []
          }));

          return {
            ...prevCourse,
            // Add new outcomes to existing ones
            learningOutcomes: [...prevCourse.learningOutcomes, ...newOutcomes]
          };
        });
      } else {
        // Display a more user-friendly error message for auth issues
        if (result.error && result.error.includes('401')) {
          setError('Authentication error: Your session may have expired. Please try logging out and back in.');
        } else {
          setError('Failed to generate learning outcomes: ' + (result.error || 'Unknown error'));
        }
        console.error('Failed to generate learning outcomes:', result.error);
      }
    } catch (error) {
      // Handle authentication errors specifically
      if (error.response && error.response.status === 401) {
        setError('Authentication error: Your session may have expired. Please try logging out and back in.');
      } else {
        setError('Error generating learning outcomes: ' + (error.message || 'Unknown error'));
      }
      console.error('Error generating learning outcomes:', error);
    } finally {
      setGenerating(false);
    }
  };

  // Extract topics from course description
  const extractTopicsFromDescription = (description) => {
    if (!description) return [];

    // The description itself acts as the source of topics
    // Try to extract meaningful topics based on common formats

    // Look for "Unit X: Topic" pattern
    const unitRegex = /Unit\s*\d+\s*:\s*([^.;]*)/gi;
    const unitMatches = [...description.matchAll(unitRegex)];
    if (unitMatches.length > 0) {
      return unitMatches.map(match => match[1].trim());
    }

    // Look for "Topic X:" pattern
    const topicRegex = /Topic\s*\d+\s*:\s*([^.;]*)/gi;
    const topicMatches = [...description.matchAll(topicRegex)];
    if (topicMatches.length > 0) {
      return topicMatches.map(match => match[1].trim());
    }

    // Look for bullet points or numbered lists
    const bulletRegex = /[-•*]\s*([^.;]*)/g;
    const bulletMatches = [...description.matchAll(bulletRegex)];
    if (bulletMatches.length > 0) {
      return bulletMatches.map(match => match[1].trim());
    }

    // Fall back to splitting by newlines or semicolons
    const lines = description.split(/[\n;]/)
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.length < 100); // Avoid very long lines

    if (lines.length > 1) {
      return lines;
    }

    // If no clear topics found, use sentences from the description
    const sentences = description.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && s.length < 100);

    if (sentences.length > 0) {
      return sentences;
    }

    // Last resort: Use the entire description as a single topic
    return [description];
  };

  // Generate curriculum topics using AI
  const handleGenerateCurriculumTopics = async () => {
    setGeneratingTopics(true);
    setError(null);

    try {
      const courseTitle = course?.title || 'New Course';
      const courseDescription = course?.description || '';

      if (!courseTitle) {
        setError('Please provide a course title before generating topics');
        setGeneratingTopics(false);
        return;
      }

      // Call the service to generate curriculum map with topics
      const result = await curriculumService.generateCurriculumMap(
        courseTitle,
        courseDescription
      );

      if (result.success && result.data && result.data.topics) {
        // Update the course with the AI-generated topics
        setCourse(prevCourse => ({
          ...prevCourse,
          topics: result.data.topics
        }));
      } else {
        setError('Failed to generate curriculum topics: ' + (result.error || 'Unknown error'));
        console.error('Failed to generate curriculum topics:', result.error);
      }
    } catch (error) {
      setError('Error generating curriculum topics: ' + (error.message || 'Unknown error'));
      console.error('Error generating curriculum topics:', error);
    } finally {
      setGeneratingTopics(false);
    }
  };

  // Save the curriculum map
  const handleSaveCurriculumMap = async () => {
    try {
      setLoading(true);

      // In a real app, this would make an API call to save the curriculum map
      // For now, we'll save it to localStorage

      // Store the course with full curriculum mapping data
      localStorage.setItem('savedCurriculumMap', JSON.stringify(course));

      // Also update the currentCourse in localStorage to keep data consistent
      localStorage.setItem('currentCourse', JSON.stringify({
        id: course.id,
        title: course.title,
        code: course.code,
        description: course.description,
        topics: course.topics || []
      }));

      // Show success message
      alert('Curriculum map saved successfully!');

      // In a real app, you would navigate back to the course page or show a success message
      console.log('Curriculum map saved:', course);
    } catch (error) {
      console.error('Error saving curriculum map:', error);
      setError('Failed to save curriculum map: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Container sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Render main content
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/instructor/courses')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Curriculum Mapping
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveCurriculumMap}
        >
          Save Curriculum Map
        </Button>
      </Box>

      {/* Course info */}
      <Paper sx={{ p: 3, mb: 4 }}>
        {/* Show error alert if there's an error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                {course.title}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {course.code}
              </Typography>
              <Typography variant="body1">
                {course.description}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Main tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<SchoolIcon />} label="Learning Outcomes" />
          <Tab icon={<AssessmentIcon />} label="Assessment Mapping" />
          <Tab icon={<AutoGraphIcon />} label="Program Outcomes" />
        </Tabs>

        {/* Learning Outcomes Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" component="h3" fontWeight="bold">
                Learning Outcomes
              </Typography>

              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AutoAwesomeIcon />}
                  onClick={handleGenerateLearningOutcomes}
                  disabled={generating}
                  sx={{ mr: 2 }}
                >
                  {generating ? 'Generating...' : 'Generate Learning Outcomes'}
                  {generating && <CircularProgress size={24} sx={{ ml: 1 }} />}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleAddOutcome}
                >
                  Add Outcome
                </Button>
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="60%">Learning Outcome</TableCell>
                    <TableCell align="center" width="15%">
                      <Tooltip title="Bloom's Taxonomy Level">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          Bloom's Level <HelpOutlineIcon fontSize="small" sx={{ ml: 0.5 }} />
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center" width="15%">
                      <Tooltip title="Competency Level">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          Competency <HelpOutlineIcon fontSize="small" sx={{ ml: 0.5 }} />
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center" width="10%">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {course?.learningOutcomes.map((outcome) => {
                    const bloomColor = bloomLevels.find(l => l.value === outcome.bloom)?.color || '#e0e0e0';
                    const competencyColor = competencyLevels.find(l => l.value === outcome.competency)?.color || '#e0e0e0';

                    return (
                      <TableRow key={outcome.id}>
                        <TableCell>{outcome.text}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={outcome.bloom}
                            sx={{ bgcolor: bloomColor, fontWeight: 'medium' }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={outcome.competency}
                            sx={{ bgcolor: competencyColor, fontWeight: 'medium' }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton onClick={() => handleOpenEditDialog(outcome)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Assessment Mapping Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" component="h3" fontWeight="bold" sx={{ mb: 3 }}>
              Assessment-Outcome Mapping
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="30%">Assessment</TableCell>
                    {course?.learningOutcomes.map((outcome) => (
                      <TableCell
                        key={outcome.id}
                        align="center"
                        onMouseEnter={() => setHoveredCell(outcome.id)}
                        onMouseLeave={() => setHoveredCell(null)}
                        sx={{
                          bgcolor: hoveredCell === outcome.id ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                          minWidth: '100px',
                          p: 1
                        }}
                      >
                        <Tooltip title={outcome.text}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            LO {outcome.id}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {course?.assessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {assessment.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {assessment.type} • {assessment.totalPoints} pts
                        </Typography>
                      </TableCell>

                      {course?.learningOutcomes.map((outcome) => {
                        const isAssessed = outcome.assessments.includes(assessment.id);
                        return (
                          <TableCell
                            key={`${assessment.id}-${outcome.id}`}
                            align="center"
                            onMouseEnter={() => setHoveredCell(outcome.id)}
                            onMouseLeave={() => setHoveredCell(null)}
                            sx={{
                              bgcolor: hoveredCell === outcome.id ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                              cursor: 'pointer'
                            }}
                            onClick={() => console.log(`Toggle assessment ${assessment.id} for outcome ${outcome.id}`)}
                          >
                            {isAssessed && <CheckCircleIcon color="success" />}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Program Outcomes Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" component="h3" fontWeight="bold" sx={{ mb: 3 }}>
              Program Outcome Alignment
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Program Outcomes
                  </Typography>

                  <List>
                    {course?.programOutcomes.map((outcome) => (
                      <ListItem key={outcome.id} divider>
                        <ListItemText
                          primary={`PO ${outcome.id}`}
                          secondary={outcome.text}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Mapping Matrix
                  </Typography>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Program Outcome</TableCell>
                          {course?.learningOutcomes.map((outcome) => (
                            <TableCell key={outcome.id} align="center">
                              LO {outcome.id}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {course?.programOutcomes.map((programOutcome) => (
                          <TableRow key={programOutcome.id}>
                            <TableCell>PO {programOutcome.id}</TableCell>
                            {course?.learningOutcomes.map((learningOutcome) => {
                              const isMapped = programOutcome.mappedOutcomes.includes(learningOutcome.id);
                              return (
                                <TableCell
                                  key={`${programOutcome.id}-${learningOutcome.id}`}
                                  align="center"
                                  sx={{ cursor: 'pointer' }}
                                  onClick={() => console.log(`Toggle mapping for PO ${programOutcome.id} and LO ${learningOutcome.id}`)}
                                >
                                  {isMapped && <CheckCircleIcon color="success" fontSize="small" />}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Edit Learning Outcome</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Learning Outcome"
            fullWidth
            multiline
            rows={3}
            value={editingOutcome?.text || ''}
            onChange={(e) => setEditingOutcome({ ...editingOutcome, text: e.target.value })}
            sx={{ mb: 3 }}
          />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom>
                Bloom's Taxonomy Level
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {bloomLevels.map((level) => (
                  <Button
                    key={level.value}
                    variant={editingOutcome?.bloom === level.value ? "contained" : "outlined"}
                    sx={{
                      bgcolor: editingOutcome?.bloom === level.value ? level.color : 'transparent',
                      borderColor: level.color,
                      color: editingOutcome?.bloom === level.value ? 'rgba(0, 0, 0, 0.7)' : 'inherit',
                      '&:hover': {
                        bgcolor: editingOutcome?.bloom === level.value
                          ? level.color
                          : `${level.color}33`
                      }
                    }}
                    onClick={() => setEditingOutcome({ ...editingOutcome, bloom: level.value })}
                  >
                    {level.value}
                  </Button>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom>
                Competency Level
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {competencyLevels.map((level) => (
                  <Button
                    key={level.value}
                    variant={editingOutcome?.competency === level.value ? "contained" : "outlined"}
                    sx={{
                      bgcolor: editingOutcome?.competency === level.value ? level.color : 'transparent',
                      borderColor: level.color,
                      color: editingOutcome?.competency === level.value ? 'rgba(0, 0, 0, 0.7)' : 'inherit',
                      '&:hover': {
                        bgcolor: editingOutcome?.competency === level.value
                          ? level.color
                          : `${level.color}33`
                      }
                    }}
                    onClick={() => setEditingOutcome({ ...editingOutcome, competency: level.value })}
                  >
                    {level.value}
                  </Button>
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveOutcome}
            variant="contained"
            startIcon={<SaveIcon />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CurriculumMapping;

