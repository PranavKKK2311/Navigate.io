import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PersonIcon from '@mui/icons-material/Person';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';

const CourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Load course data
  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token
          }
        };

        const res = await axios.get(`http://localhost:5000/api/courses/${courseId}`, config);
        let courseData = res.data.course;

        // Ensure arrays exist
        courseData.assessments = courseData.assessments || [];
        courseData.materials = courseData.materials || [];
        courseData.syllabus = courseData.syllabus || { learningOutcomes: [], weeklyTopics: [] };
        courseData.progress = courseData.progress || { completedAssessments: 0, totalAssessments: 0 };

        setCourse(courseData);
      } catch (error) {
        console.error('Error fetching course data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!course) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5" color="error">
          Course not found
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Course Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1" gutterBottom>
              {course.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {course.code} • {course.department} • {course.credits} Credits
            </Typography>
            <Typography variant="body1" paragraph>
              {course.description}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Instructor" secondary={course.instructor ? course.instructor.name : 'Unknown Instructor'} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CalendarTodayIcon />
                </ListItemIcon>
                <ListItemText primary="Term" secondary={course.term} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <AutoGraphIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Your Progress"
                  secondary={`${course.progress.completedAssessments}/${course.progress.totalAssessments} assessments completed`}
                />
              </ListItem>
            </List>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                component={RouterLink}
                to={`/learning-path/${course.id}`}
                startIcon={<AutoGraphIcon />}
              >
                Learning Path
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs Navigation */}
      <Box sx={{ width: '100%', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Assessments" icon={<AssignmentIcon />} iconPosition="start" />
          <Tab label="Course Materials" icon={<DescriptionIcon />} iconPosition="start" />
          <Tab label="Syllabus" icon={<MenuBookIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Assessments Tab */}
      <Box hidden={activeTab !== 0}>
        <Typography variant="h5" gutterBottom>
          Assessments
        </Typography>
        <Grid container spacing={3}>
          {course.assessments && course.assessments.length > 0 ? (
            course.assessments.map((assessment) => (
              <Grid item xs={12} sm={6} md={4} key={assessment.id}>
                <Card
                  elevation={3}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: assessment.status === 'upcoming' ? '#f5f5f5' : 'background.paper'
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" gutterBottom>
                        {assessment.title}
                      </Typography>
                      <Chip
                        label={assessment.status === 'available' ? 'Available' : 'Upcoming'}
                        color={assessment.status === 'available' ? 'primary' : 'default'}
                        size="small"
                      />                  </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {assessment.type}
                      {assessment.visibility && assessment.visibility.pattern &&
                        ` • ${assessment.visibility.pattern.name} • ${assessment.visibility.pattern.difficulty}`
                      }
                    </Typography>
                    {assessment.visibility && assessment.visibility.pattern && assessment.visibility.pattern.description && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        {assessment.visibility.pattern.description}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
                      <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Due: {new Date(assessment.dueDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <List dense>
                      <ListItem disablePadding>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <AccessTimeIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={assessment.timeLimit ? `Time Limit: ${assessment.timeLimit} minutes` : 'No time limit'}
                        />
                      </ListItem>
                      <ListItem disablePadding>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={`Points: ${assessment.totalPoints}`} />
                      </ListItem>
                    </List>
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      component={RouterLink}
                      to={`/assessment/${assessment.id}`}
                      disabled={assessment.status !== 'available'}
                    >
                      {assessment.status === 'available' ? 'Start Assessment' : 'Coming Soon'}
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No assessments available for this course.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Course Materials Tab */}
      <Box hidden={activeTab !== 1}>
        <Typography variant="h5" gutterBottom>
          Course Materials
        </Typography>
        <List>
          {course.materials && course.materials.length > 0 ? (
            course.materials.map((material) => (
              <React.Fragment key={material.id}>
                <ListItem
                  component={Paper}
                  elevation={2}
                  sx={{ mb: 2, p: 2, borderRadius: 2 }}
                >
                  <ListItemIcon>
                    <DescriptionIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={material.title}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Chip
                          label={`Week ${material.week}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ mr: 1 }}
                        />
                        <Chip
                          label={material.type}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    component="a"
                    href={material.url && material.url.startsWith('/') ? `http://localhost:5000${material.url}` : material.url}
                    target="_blank"
                  >
                    View
                  </Button>
                </ListItem>
              </React.Fragment>
            ))
          ) : (
            <ListItem>
              <Typography color="text.secondary" sx={{ width: '100%', textAlign: 'center', py: 4 }}>
                No course materials uploaded yet.
              </Typography>
            </ListItem>
          )}
        </List>
      </Box>

      {/* Syllabus Tab */}
      <Box hidden={activeTab !== 2}>
        <Typography variant="h5" gutterBottom>
          Course Syllabus
        </Typography>

        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Learning Outcomes
          </Typography>
          <List>
            {course.syllabus?.learningOutcomes?.length > 0 ? (
              course.syllabus.learningOutcomes.map((outcome, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircleIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={outcome} />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No learning outcomes defined." />
              </ListItem>
            )}
          </List>
        </Paper>

        <Typography variant="h6" gutterBottom>
          Weekly Schedule
        </Typography>
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {course.syllabus?.weeklyTopics?.length > 0 ? (
            course.syllabus.weeklyTopics.map((week, index) => (
              <React.Fragment key={week.week}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: index % 2 === 0 ? 'background.paper' : '#f5f7fa'
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Week {week.week}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={10}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {week.topic}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {week.description}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
                {index < course.syllabus.weeklyTopics.length - 1 && <Divider />}
              </React.Fragment>
            ))
          ) : (
            <Box sx={{ p: 3 }}>
              <Typography color="text.secondary" align="center">
                No weekly schedule available.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default CourseView;