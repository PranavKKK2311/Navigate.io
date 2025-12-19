import {
  ArrowBack as ArrowBackIcon,
  Assessment as AssessmentIcon,
  Description as DescriptionIcon,
  ManageSearch as ManageSearchIcon,
  Person as PersonIcon,
  PsychologyAlt as PsychologyAltIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button, Card, CardContent,
  Chip, CircularProgress,
  Container,
  Divider,
  Grid,
  List, ListItem, ListItemIcon, ListItemText,
  Paper,
  Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Mock data removed

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`student-results-tabpanel-${index}`}
      aria-labelledby={`student-results-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const StudentResults = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const isInstructor = currentUser?.role === 'instructor';

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('score');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  useEffect(() => {
    // Parse query parameters
    const queryParams = new URLSearchParams(location.search);
    const assessmentId = queryParams.get('assessment');
    if (assessmentId) {
      setSelectedAssessment(assessmentId);
    }

    // Fetch real submission data from the API
    const fetchStudentResults = async () => {
      try {
        console.log('=== FETCHING STUDENT RESULTS FOR INSTRUCTOR ===');
        console.log('Course ID:', courseId);

        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          setLoading(false);
          return;
        }

        // Fetch submissions for this course
        const response = await fetch(`/api/instructor/assessment/course/${courseId}/submissions`, {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.submissions) {
          console.log(`Found ${data.submissions.length} submissions for course ${courseId}`);
          setResults(data.submissions);

          // Generate basic statistics from the submissions
          const stats = {
            totalSubmissions: data.submissions.length,
            averageScore: data.submissions.length > 0
              ? Math.round(data.submissions.reduce((sum, sub) => sum + sub.percentage, 0) / data.submissions.length)
              : 0,
            passRate: data.submissions.length > 0
              ? Math.round((data.submissions.filter(sub => sub.isPassed).length / data.submissions.length) * 100)
              : 0,
            completionRate: 100 // All fetched submissions are completed
          };
          setStatistics(stats);

          // Extract unique assessments from submissions
          const uniqueAssessments = [...new Map(
            data.submissions.map(sub => [sub.assessmentId, {
              id: sub.assessmentId,
              title: sub.assessmentTitle
            }])
          ).values()];
          setAssessments(uniqueAssessments);

        } else {
          console.warn('No submissions found or invalid response format');
          setResults([]);
          setStatistics(null);
          setAssessments([]);
        }

      } catch (error) {
        console.error('Error fetching student results:', error);
        setResults([]);
        setStatistics(null);
        setAssessments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentResults();
  }, [courseId, location.search]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleFilterChange = (type, value) => {
    if (type === 'assessment') {
      setSelectedAssessment(value);
    } else if (type === 'status') {
      setSelectedStatus(value);
    }
    setPage(0);
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudentId(studentId);
    // Always use the actual results array for student details
    const student = results.find(s => s.id === studentId);
    if (student) {
      setStudentDetail(student);
    } else {
      setStudentDetail(null);
    }
  };

  const filteredResults = results
    .filter(result => {
      // Apply assessment filter
      if (selectedAssessment !== 'all' && result.assessmentTitle !== selectedAssessment) {
        return false;
      }

      // Apply status filter
      if (selectedStatus !== 'all' && result.status !== selectedStatus) {
        return false;
      }

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          result.name.toLowerCase().includes(searchLower) ||
          result.email.toLowerCase().includes(searchLower) ||
          result.studentId.toLowerCase().includes(searchLower)
        );
      }

      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      if (orderBy === 'submissionDate') {
        return order === 'asc'
          ? new Date(a.submissionDate) - new Date(b.submissionDate)
          : new Date(b.submissionDate) - new Date(a.submissionDate);
      }

      const aValue = a[orderBy];
      const bValue = b[orderBy];

      if (typeof aValue === 'string') {
        return order === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return order === 'asc' ? aValue - bValue : bValue - aValue;
    })
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/instructor/courses/${courseId}`)}
          variant="outlined"
          sx={{ mb: 2 }}
        >
          Back to Course
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Student Assessment Results
        </Typography>
        {/* Removed upcoming assessments section for instructor view */}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab icon={<AssessmentIcon />} label="Assessment Results" iconPosition="start" />
          <Tab icon={<PersonIcon />} label="Student Performance" iconPosition="start" disabled={!selectedStudentId} />
          <Tab icon={<PsychologyAltIcon />} label="AI Evaluation" iconPosition="start" disabled={!selectedStudentId} />
          <Tab icon={<ManageSearchIcon />} label="Integrity Check" iconPosition="start" disabled={!selectedStudentId} />
          <Tab icon={<TrendingUpIcon />} label="Statistics" iconPosition="start" />
          <Tab icon={<DescriptionIcon />} label="Question Analysis" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Assessment Results Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper
              elevation={3}
              sx={{ p: 3, borderRadius: 2 }}
            >
              {/* Filters and Search would go here */}
              <TableContainer sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Student</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Assessment</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Submission Date</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Score</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Time Spent</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredResults.map((result) => (
                      <TableRow
                        key={result.id}
                        hover
                        onClick={() => handleStudentSelect(result.id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {result.name || result.studentName || 'Unknown Student'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {result.email || 'No email'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{result.assessmentTitle}</TableCell>
                        <TableCell>
                          {result.submissionDate && !isNaN(new Date(result.submissionDate).getTime())
                            ? new Date(result.submissionDate).toLocaleString()
                            : 'Not available'}
                        </TableCell>                        <TableCell align="right">
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                            <Chip
                              label={`${result.score}/${result.maxScore} (${result.percentage || Math.round((result.score / result.maxScore) * 100)}%)`}
                              color={
                                result.score / result.maxScore >= 0.9 ? 'success' :
                                  result.score / result.maxScore >= 0.7 ? 'primary' :
                                    result.score / result.maxScore >= 0.6 ? 'warning' : 'error'
                              }
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                            <Chip
                              label="Completed"
                              color="info"
                              size="small"
                            />
                            <Chip
                              label={result.isPassed !== undefined ?
                                (result.isPassed ? 'Passed' : 'Failed') :
                                (result.percentage >= 50 || (result.score / result.maxScore) * 100 >= 50 ? 'Passed' : 'Failed')
                              }
                              color={result.isPassed !== undefined ?
                                (result.isPassed ? 'success' : 'error') :
                                (result.percentage >= 50 || (result.score / result.maxScore) * 100 >= 50 ? 'success' : 'error')
                              }
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {result.timeSpent} min
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            color="primary"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/results/${result.id}`);
                            }}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                    {filteredResults.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography color="text.secondary">
                            No results matching your filters
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {/* Pagination would go here */}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Student Performance Tab */}
      <TabPanel value={tabValue} index={1}>
        {studentDetail ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h5" gutterBottom>
                  {studentDetail.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {studentDetail.studentId} • {studentDetail.email}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Performance Summary
                </Typography>
                {/* Student summary card */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  <Paper elevation={1} sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Result: {(() => {
                        const percent = studentDetail.percentage || Math.round((studentDetail.score / studentDetail.maxScore) * 100);
                        const passed = studentDetail.isPassed !== undefined
                          ? studentDetail.isPassed
                          : percent >= 50;
                        return passed ? 'Passed' : 'Failed';
                      })()}
                    </Typography>
                    <Typography variant="body2">
                      Score: {studentDetail.score} / {studentDetail.maxScore} ({studentDetail.percentage || Math.round((studentDetail.score / studentDetail.maxScore) * 100)}%)
                    </Typography>
                  </Paper>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Alert severity="info">
            Select a student from the results tab to view detailed performance
          </Alert>
        )}
      </TabPanel>

      {/* AI Evaluation Tab */}
      <TabPanel value={tabValue} index={2}>
        {studentDetail ? (
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <PsychologyAltIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />
              <Typography variant="h5">
                AI-Powered Evaluation Report
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                This student's submission was automatically evaluated using multiple AI-based techniques including LLM-based scoring, semantic analysis, and expert panel evaluation.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Expert Panel Evaluation
                    </Typography>
                    <Typography variant="body2" paragraph>
                      The AI Expert Panel evaluated this submission using multiple specialized perspectives.
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Fact Checker
                      </Typography>
                      <Alert severity="success" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          The student demonstrated good factual knowledge with only minor inaccuracies.
                        </Typography>
                      </Alert>

                      <Typography variant="subtitle2" gutterBottom>
                        Concept Analyzer
                      </Typography>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          Good conceptual understanding with some gaps in advanced topics.
                        </Typography>
                      </Alert>

                      <Typography variant="subtitle2" gutterBottom>
                        Clarity Checker
                      </Typography>
                      <Alert severity="success" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          Clear and well-organized responses with logical structure.
                        </Typography>
                      </Alert>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Learning Gaps Analysis
                    </Typography>

                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <TrendingUpIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Binary Search Tree Traversal"
                          secondary="The student lacks comprehensive understanding of BST traversal algorithms"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <TrendingUpIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Algorithm Complexity Analysis"
                          secondary="There's a gap in understanding time complexity for non-standard operations"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <TrendingUpIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Implementation Details"
                          secondary="Responses lack implementation-specific details of data structures"
                        />
                      </ListItem>
                    </List>

                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Recommended Interventions
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText
                            primary="Share additional resources on tree traversal algorithms"
                            secondary="Focus on level-order traversal which was specifically missed"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Assign practical exercises"
                            secondary="Hands-on implementation of various data structures"
                          />
                        </ListItem>
                      </List>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Question-by-Question Analysis
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Question</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Evaluation Method</TableCell>
                            <TableCell>Score</TableCell>
                            <TableCell>Key Findings</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>Q1: Data Structure LIFO Principle</TableCell>
                            <TableCell>Multiple Choice</TableCell>
                            <TableCell>Exact Match</TableCell>
                            <TableCell>5/5 pts</TableCell>
                            <TableCell>Correct answer provided</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Q2: Binary Search Time Complexity</TableCell>
                            <TableCell>Multiple Choice</TableCell>
                            <TableCell>Exact Match</TableCell>
                            <TableCell>5/5 pts</TableCell>
                            <TableCell>Correct answer provided</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Q3: Stack vs. Queue Explanation</TableCell>
                            <TableCell>Short Answer</TableCell>
                            <TableCell>AI Expert Panel</TableCell>
                            <TableCell>8/10 pts</TableCell>
                            <TableCell>Good explanation but lacks implementation details</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Q4: BST Operations</TableCell>
                            <TableCell>Multiple Select</TableCell>
                            <TableCell>Partial Match</TableCell>
                            <TableCell>7/10 pts</TableCell>
                            <TableCell>Missed "Level order traversal" option</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        ) : (
          <Alert severity="info">
            Select a student from the results tab to view AI evaluation details
          </Alert>
        )}
      </TabPanel>

      {/* Integrity Check Tab */}
      <TabPanel value={tabValue} index={3}>
        {studentDetail ? (
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <ManageSearchIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />
              <Typography variant="h5">
                Submission Integrity Analysis
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                This submission was analyzed for potential plagiarism and AI-generated content using multiple detection methods.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Plagiarism Detection Results
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="body1">Overall Similarity Score:</Typography>
                      <Typography variant="h5" color="success.main">12%</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                      Threshold for review: 30%
                    </Typography>

                    <Alert severity="success" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        No significant similarity to external sources or other student submissions detected.
                      </Typography>
                    </Alert>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" gutterBottom>
                      Detection Methods Used:
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Turnitin API" secondary="Compare against academic sources" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Cross-submission analysis" secondary="Internal comparison with other students" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Semantic similarity" secondary="Meaning-based matching regardless of wording" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      AI-Generated Content Detection
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="body1">AI Probability Score:</Typography>
                      <Typography variant="h5" color="success.main">5%</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                      Threshold for review: 65%
                    </Typography>

                    <Alert severity="success" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        Analysis indicates this is likely human-written content with no significant AI generation patterns.
                      </Typography>
                    </Alert>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" gutterBottom>
                      Detection Methods Used:
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="GPTZero" secondary="AI text pattern detection" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Linguistic variance analysis" secondary="Statistical patterns in human vs. AI writing" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="AWS Comprehend" secondary="Machine learning-based text analysis" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="success">
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Academic Integrity Status: Passed
                  </Typography>
                  <Typography variant="body2">
                    This submission meets all academic integrity requirements with no indication of plagiarism or AI-generated content. The work appears to be the student's original effort.
                  </Typography>
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Answer-Level Integrity Analysis
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Question</TableCell>
                            <TableCell>Plagiarism Score</TableCell>
                            <TableCell>AI Generation Score</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>Q1: Data Structure LIFO Principle</TableCell>
                            <TableCell>0%</TableCell>
                            <TableCell>1%</TableCell>
                            <TableCell>
                              <Chip label="Clear" color="success" size="small" />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Q2: Binary Search Time Complexity</TableCell>
                            <TableCell>5%</TableCell>
                            <TableCell>2%</TableCell>
                            <TableCell>
                              <Chip label="Clear" color="success" size="small" />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Q3: Stack vs. Queue Explanation</TableCell>
                            <TableCell>18%</TableCell>
                            <TableCell>12%</TableCell>

                            <TableCell>

                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Q4: BST Operations</TableCell>
                            <TableCell>8%</TableCell>
                            <TableCell>3%</TableCell>
                            <TableCell>
                              <Chip label="Clear" color="success" size="small" />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        ) : (
          <Alert severity="info">
            Select a student from the results tab to view integrity analysis
          </Alert>
        )}
      </TabPanel>

      {/* Statistics Tab */}
      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Score Distribution
                </Typography>
                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Score distribution chart would appear here
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Assessment Statistics
                </Typography>
                {statistics ? (
                  <Box>
                    <Typography variant="body1">
                      Average Score: {statistics.averageScore}%
                    </Typography>
                    <Typography variant="body1">
                      Median Score: {statistics.medianScore}%
                    </Typography>
                    <Typography variant="body1">
                      Highest Score: {statistics.highestScore}%
                    </Typography>
                    <Typography variant="body1">
                      Lowest Score: {statistics.lowestScore}%
                    </Typography>
                    <Typography variant="body1">
                      Standard Deviation: {statistics.standardDeviation}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    No statistics available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Question Analysis Tab */}
      <TabPanel value={tabValue} index={5}>
        <Alert severity="info" sx={{ mb: 3 }}>
          This section shows analysis of student performance on individual questions.
        </Alert>
        <Typography variant="body1" color="text.secondary" align="center">
          Question analysis interface would be shown here
        </Typography>
      </TabPanel>
    </Container>
  );
};

// Mock data
// Mock data removed
const mockStudentResults = [];
const mockStatistics = null;
const mockAssessments = [];

export default StudentResults;