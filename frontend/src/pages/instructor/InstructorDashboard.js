import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ErrorIcon from '@mui/icons-material/Error';
import EventIcon from '@mui/icons-material/Event';
import InfoIcon from '@mui/icons-material/Info';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PendingIcon from '@mui/icons-material/Pending';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import GradingQueue from '../../components/instructor/GradingQueue';

// Mock data removed
const mockData = null;

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myAssessments, setMyAssessments] = useState([]);
  const [editDialog, setEditDialog] = useState({ open: false, assessment: null, newTitle: '' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, assessment: null });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch courses
        const coursesRes = await axios.get('/api/courses', {
          headers: { 'x-auth-token': token }
        });
        const realCourses = coursesRes.data.courses || [];

        // Calculate stats
        const coursesData = realCourses.map(c => ({
          id: c._id,
          title: c.title,
          code: c.code || 'N/A',
          term: c.term || 'N/A',
          enrollment: c.students?.length || 0,
          assessmentCount: c.assessments?.length || 0,
          recentActivity: false // Logic to be added later
        }));

        setData({
          instructor: {
            name: currentUser?.name || 'Instructor',
          },
          courses: coursesData,
          recentAssessments: [], // To be fetched from assessments API later
          upcomingAssessments: [], // To be fetched
          pendingGrading: [],
          notifications: [],
          insights: []
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        // Fallback or empty state
        setData({
          instructor: { name: currentUser?.name },
          courses: [],
          recentAssessments: [],
          upcomingAssessments: [],
          pendingGrading: [],
          notifications: [],
          insights: []
        });
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchDashboardData();
      fetchMyAssessments();
    }
  }, [currentUser]);

  // Fetch instructor's assessments
  const fetchMyAssessments = async () => {
    try {
      console.log('=== FETCHING MY ASSESSMENTS ===');
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'present' : 'missing');

      const res = await axios.get('/api/instructor/assessment/my-assessments', {
        headers: { 'x-auth-token': token }
      });

      console.log('Response:', res.data);

      if (res.data.success) {
        console.log('Assessments found:', res.data.assessments?.length || 0);
        setMyAssessments(res.data.assessments || []);
      } else {
        console.log('API returned success: false');
        setMyAssessments([]);
      }
    } catch (err) {
      console.error('Error fetching my assessments:', err);
      setMyAssessments([]);
    }
  };

  // Handle delete assessment
  const handleDeleteAssessment = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/instructor/assessment/${deleteDialog.assessment.id}`, {
        headers: { 'x-auth-token': token }
      });
      setMyAssessments(prev => prev.filter(a => a.id !== deleteDialog.assessment.id));
      setDeleteDialog({ open: false, assessment: null });
    } catch (err) {
      console.error('Error deleting assessment:', err);
    }
  };

  // Handle edit assessment title
  const handleEditTitle = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/instructor/assessment/${editDialog.assessment.id}`,
        { title: editDialog.newTitle },
        { headers: { 'x-auth-token': token } }
      );
      setMyAssessments(prev => prev.map(a =>
        a.id === editDialog.assessment.id ? { ...a, title: editDialog.newTitle } : a
      ));
      setEditDialog({ open: false, assessment: null, newTitle: '' });
    } catch (err) {
      console.error('Error updating assessment:', err);
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Welcome and Overview */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Welcome back, {currentUser?.name || data.instructor.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AssessmentIcon />}
              onClick={() => navigate('/instructor/assessment')}
            >
              Create Assessment
            </Button>
          </Box>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h5" component="div">
                    {data.courses.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Courses
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <SchoolIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h5" component="div">
                    {data.courses.reduce((total, course) => total + course.enrollment, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Students
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <PersonIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h5" component="div">
                    {data.courses.reduce((total, course) => total + course.assessmentCount, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Assessments
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <AssessmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h5" component="div">
                    {data.pendingGrading.reduce((total, item) => total + item.submissionCount, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Submissions
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <PendingIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* My Courses */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                My Courses
              </Typography>
              <Button
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/instructor/courses')}
              >
                View All
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Course</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Term</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Students</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Assessments</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Activity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.courses.map((course) => (
                    <TableRow
                      key={course.id}
                      hover
                      onClick={() => navigate(`/instructor/courses/${course.id}`)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography variant="body1">
                          {course.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {course.code}
                        </Typography>
                      </TableCell>
                      <TableCell>{course.term}</TableCell>
                      <TableCell align="right">{course.enrollment}</TableCell>
                      <TableCell align="right">{course.assessmentCount}</TableCell>
                      <TableCell align="right">
                        {course.recentActivity ? (
                          <Chip
                            size="small"
                            label="Active"
                            color="success"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            size="small"
                            label="Quiet"
                            color="default"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Notifications
              </Typography>
              <IconButton>
                <NotificationsIcon />
              </IconButton>
            </Box>

            <List>
              {data.notifications.map((notification) => (
                <React.Fragment key={notification.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemIcon>
                      {notification.type === 'grading' && <AssignmentTurnedInIcon color="primary" />}
                      {notification.type === 'warning' && <ErrorIcon color="warning" />}
                      {notification.type === 'info' && <InfoIcon color="info" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.message}
                      secondary={new Date(notification.date).toLocaleDateString()}
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Assessment Insights */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Assessment Insights
            </Typography>

            <Grid container spacing={3} sx={{ mt: 1 }}>
              {data.insights.map((insight) => (
                <Grid item xs={12} md={4} key={insight.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderLeft: 5,
                      borderColor:
                        insight.type === 'warning' ? 'warning.main' :
                          insight.type === 'success' ? 'success.main' :
                            'info.main'
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {insight.title}
                      </Typography>
                      <Typography variant="body2">
                        {insight.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Recent Assessments */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Recent Assessments
            </Typography>

            <List>
              {data.recentAssessments.map((assessment) => (
                <React.Fragment key={assessment.id}>
                  <ListItem
                    button
                    component={RouterLink}
                    to={`/instructor/student-results/${assessment.id}`}
                  >
                    <ListItemText
                      primary={assessment.title}
                      secondary={`${assessment.courseCode}: ${assessment.courseTitle}`}
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Tooltip title="Submission Rate">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AssignmentTurnedInIcon fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="body2">
                              {assessment.submissionRate}%
                            </Typography>
                          </Box>
                        </Tooltip>
                        <Tooltip title="Average Score">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {assessment.avgScore >= 80 ? (
                              <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                            ) : (
                              <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                            )}
                            <Typography variant="body2">
                              {assessment.avgScore}%
                            </Typography>
                          </Box>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Upcoming Assessments */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Upcoming Assessments
            </Typography>

            <List>
              {data.upcomingAssessments.map((assessment) => (
                <React.Fragment key={assessment.id}>
                  <ListItem
                    button
                    component={RouterLink}
                    to={`/instructor/assessment/${assessment.id}`}
                  >
                    <ListItemIcon>
                      <EventIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={assessment.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" component="span">
                            {assessment.courseCode}: {assessment.courseTitle}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span" color="text.secondary">
                            Due: {new Date(assessment.dueDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        size="small"
                        label={assessment.status}
                        color={assessment.status === 'Published' ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Pending Items */}
        <Grid item xs={12}>
          <Alert
            severity="warning"
            icon={<PendingIcon />}
            sx={{ borderRadius: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                component={RouterLink}
                to="/instructor/student-results"
              >
                Grade Now
              </Button>
            }
          >
            <Typography variant="subtitle2">
              You have {data.pendingGrading.reduce((total, item) => total + item.submissionCount, 0)} submissions waiting to be graded
            </Typography>
            <Typography variant="body2">
              Includes submissions from: {data.pendingGrading.map(item => item.courseCode).join(', ')}
            </Typography>
          </Alert>
        </Grid>

        {/* My Assessments - Full Width Section */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                My Assessments
              </Typography>
              <Button
                variant="contained"
                startIcon={<AssessmentIcon />}
                onClick={() => navigate('/instructor/assessment')}
              >
                Create New
              </Button>
            </Box>

            {myAssessments.length === 0 ? (
              <Alert severity="info">
                You haven't created any assessments yet. Click "Create New" to get started!
              </Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Course ID</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Questions</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Points</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myAssessments.map((assessment) => (
                      <TableRow key={assessment.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {assessment.title}
                          </Typography>
                        </TableCell>
                        <TableCell>{assessment.courseId}</TableCell>
                        <TableCell align="center">{assessment.questionCount}</TableCell>
                        <TableCell align="center">{assessment.totalPoints}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={assessment.status}
                            color={assessment.status === 'published' ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {assessment.createdAt ? new Date(assessment.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit Title">
                            <IconButton
                              size="small"
                              onClick={() => setEditDialog({ open: true, assessment, newTitle: assessment.title })}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteDialog({ open: true, assessment })}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Grading Queue */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <GradingQueue />
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Title Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, assessment: null, newTitle: '' })}>
        <DialogTitle>Edit Assessment Title</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Assessment Title"
            fullWidth
            variant="outlined"
            value={editDialog.newTitle}
            onChange={(e) => setEditDialog(prev => ({ ...prev, newTitle: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, assessment: null, newTitle: '' })}>Cancel</Button>
          <Button onClick={handleEditTitle} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, assessment: null })}>
        <DialogTitle>Delete Assessment?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deleteDialog.assessment?.title}"?
            This action cannot be undone and will also delete all student submissions for this assessment.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, assessment: null })}>Cancel</Button>
          <Button onClick={handleDeleteAssessment} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InstructorDashboard;