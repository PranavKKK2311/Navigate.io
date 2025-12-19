import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import {
  Box,
  Button,
  Card,
  CardActions,
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
  ListItemText,
  Menu,
  MenuItem,
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
import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

// Mock data removed
// Mock data removed
const mockCourses = [];

const CourseManagement = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState('');
  const [dialogItem, setDialogItem] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openCourseFormDialog, setOpenCourseFormDialog] = useState(false);
  const [newCourseData, setNewCourseData] = useState({
    title: '',
    code: '',
    department: 'Computer Science',
    term: 'Fall 2025',
    description: ''
  });

  // Add Student State
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');

  // Add Material State
  const [addMaterialDialogOpen, setAddMaterialDialogOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    week: 1,
    type: 'pdf',
    description: '',
    file: null
  });

  // Function to handle back to courses navigation
  const handleBackToCourses = () => {
    setSelectedCourse(null);
    navigate('/instructor/courses');
  };

  // Handle course form open
  const handleCourseFormOpen = () => {
    setOpenCourseFormDialog(true);
  };

  // Handle course form close
  const handleCourseFormClose = () => {
    setOpenCourseFormDialog(false);
    // Reset form data
    setNewCourseData({
      title: '',
      code: '',
      department: 'Computer Science',
      term: 'Fall 2025',
      description: ''
    });
  };

  // Handle course form change
  const handleCourseFormChange = (e) => {
    const { name, value } = e.target;
    setNewCourseData({
      ...newCourseData,
      [name]: value
    });
  };

  // Handle course form submit
  const handleCourseFormSubmit = async () => {
    // Validate form data
    if (!newCourseData.title || !newCourseData.code) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/courses', newCourseData, {
        headers: { 'x-auth-token': token }
      });

      const createdCourse = { ...response.data, id: response.data._id };
      const updatedCourses = [createdCourse, ...courses];
      setCourses(updatedCourses);

      alert(`Course "${createdCourse.title}" created successfully!`);
      handleCourseFormClose();

      // Navigate to the new course
      setTimeout(() => {
        navigate(`/instructor/courses/${createdCourse.id}`);
      }, 100);

    } catch (err) {
      console.error('Error creating course:', err);
      alert('Failed to create course. Please try again.');
    }
  };

  // Load courses
  useEffect(() => {
    setLoading(true);

    // Fetch course data from API
    const fetchCourseData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await axios.get('/api/courses', {
          headers: { 'x-auth-token': token }
        });

        const realCourses = response.data.courses || [];
        // Map _id to id for frontend compatibility
        const mappedCourses = realCourses.map(c => ({
          ...c,
          id: c._id,
          enrollment: c.students ? c.students.length : 0,
          assessmentCount: c.assessments ? c.assessments.length : 0
        }));
        setCourses(mappedCourses);

        if (courseId) {
          // Fetch detailed course
          try {
            const detailRes = await axios.get(`/api/courses/${courseId}`, {
              headers: { 'x-auth-token': token }
            });
            const detailCourse = detailRes.data.course;
            if (detailCourse) {
              setSelectedCourse({
                ...detailCourse,
                id: detailCourse._id,
                students: detailCourse.students || [],
                assessments: detailCourse.assessments || [],
                materials: detailCourse.materials || [],
                enrollment: detailCourse.students ? detailCourse.students.length : 0,
                assessmentCount: detailCourse.assessments ? detailCourse.assessments.length : 0
              });
            }
          } catch (e) {
            console.error("Error fetching course detail", e);
          }
        }

      } catch (error) {
        console.error('Error fetching course data:', error);
        setCourses([]);
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

  // Handle course selection
  const handleSelectCourse = (course) => {
    navigate(`/instructor/courses/${course.id}`);
  };

  // Handle create new course
  const handleCreateCourse = () => {
    handleCourseFormOpen();
  };

  // Handle menu open
  const handleMenuOpen = (event, course) => {
    setAnchorEl({ element: event.currentTarget, course: course });
  };

  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle dialog open
  const handleOpenDialog = (action, item) => {
    setDialogAction(action);
    setDialogItem(item);
    setOpenDialog(true);
    handleMenuClose();
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Handle dialog confirm
  const handleConfirmDialog = async () => {
    // Handle different actions based on dialogAction
    switch (dialogAction) {
      case 'delete-course':
        try {
          const token = localStorage.getItem('token');
          const courseIdToDelete = dialogItem._id || dialogItem.id;

          await axios.delete(`/api/courses/${courseIdToDelete}`, {
            headers: { 'x-auth-token': token }
          });

          const updatedCourses = courses.filter(c => c.id !== courseIdToDelete && c._id !== courseIdToDelete);
          setCourses(updatedCourses);

          alert(`Course "${dialogItem.title}" has been deleted.`);
          navigate('/instructor/courses');

        } catch (err) {
          console.error('Error deleting course:', err);
          alert('Failed to delete course.');
        }
        break;
      case 'delete-assessment':
        console.log('Delete assessment:', dialogItem);
        // API call to delete assessment would go here
        alert('Assessment deletion not yet implemented on backend.');
        break;
      case 'delete-material':
        console.log('Delete material:', dialogItem);
        // API call to delete material would go here
        alert('Material deletion not yet implemented on backend.');
        break;
      case 'remove-student':
        try {
          const token = localStorage.getItem('token');
          const studentIdToRemove = dialogItem._id || dialogItem.id;

          await axios.delete(`/api/courses/${selectedCourse.id}/enroll/${studentIdToRemove}`, {
            headers: { 'x-auth-token': token }
          });

          // Update local state
          const newStudents = selectedCourse.students.filter(s => (s._id || s.id) !== studentIdToRemove);
          const updatedCourse = {
            ...selectedCourse,
            students: newStudents,
            enrollment: newStudents.length
          };

          setSelectedCourse(updatedCourse);

          // Update in main list too
          setCourses(courses.map(c => c.id === selectedCourse.id ? { ...c, enrollment: newStudents.length } : c));

          alert(`Student "${dialogItem.name}" removed from course.`);
        } catch (err) {
          console.error('Error removing student:', err);
          alert('Failed to remove student from course.');
        }
        break;
      default:
        break;
    }

    handleCloseDialog();
  };

  // Handle create assessment
  const handleCreateAssessment = () => {
    navigate('/instructor/assessment');
  };

  // Handle edit assessment
  const handleEditAssessment = (assessmentId) => {
    navigate(`/instructor/assessment/${assessmentId}`);
  };

  // Handle view assessment results
  const handleViewResults = (assessmentId) => {
    navigate(`/instructor/student-results/${selectedCourse.id}?assessment=${assessmentId}`);
  };

  // Handle Add Student
  const handleAddStudentOpen = () => {
    setAddStudentDialogOpen(true);
  };

  const handleAddStudentClose = () => {
    setAddStudentDialogOpen(false);
    setStudentEmail('');
  };

  const handleAddStudentSubmit = async () => {
    if (!studentEmail) {
      alert('Please enter a student email.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/courses/${selectedCourse.id}/enroll`,
        { email: studentEmail },
        { headers: { 'x-auth-token': token } }
      );

      // Update local state with returned course
      const updatedCourse = {
        ...response.data,
        id: response.data._id,
        students: response.data.students || [],
        enrollment: response.data.students ? response.data.students.length : 0,
        assessments: selectedCourse.assessments, // Keep existing assessments if not populated
        materials: selectedCourse.materials // Keep existing materials
      };

      // Ensure we keep other props of selectedCourse that might not be in response or fetch logic
      setSelectedCourse(prev => ({ ...prev, ...updatedCourse }));

      // Update courses list
      setCourses(courses.map(c => c.id === updatedCourse.id ? { ...c, enrollment: updatedCourse.enrollment } : c));

      alert('Student added successfully!');
      handleAddStudentClose();
    } catch (err) {
      console.error('Error adding student:', err);
      alert(err.response?.data?.msg || 'Failed to add student. Ensure email is correct.');
    }
  };

  // Handle Add Material
  const handleAddMaterialOpen = () => {
    setAddMaterialDialogOpen(true);
  };

  const handleAddMaterialClose = () => {
    setAddMaterialDialogOpen(false);
    setNewMaterial({
      title: '',
      week: 1,
      type: 'pdf',
      description: '',
      file: null
    });
  };

  const handleMaterialChange = (e) => {
    const { name, value } = e.target;
    setNewMaterial({ ...newMaterial, [name]: value });
  };

  const handleFileChange = (e) => {
    setNewMaterial({ ...newMaterial, file: e.target.files[0] });
  };

  const handleAddMaterialSubmit = async () => {
    if (!newMaterial.title || (!newMaterial.file && newMaterial.type === 'pdf')) {
      alert('Please provide a title and select a file.');
      return;
    }

    // In a real app, we would upload the file here using FormData
    // const formData = new FormData();
    // formData.append('file', newMaterial.file);
    // ...

    // For now, we'll simulate adding the material metadata
    const materialToAdd = {
      id: `mat-${Date.now()}`,
      title: newMaterial.title,
      week: newMaterial.week,
      type: newMaterial.type,
      description: newMaterial.description,
      url: newMaterial.file ? URL.createObjectURL(newMaterial.file) : '#', // Temporary local URL
      fileName: newMaterial.file ? newMaterial.file.name : 'resource.pdf'
    };

    try {
      const token = localStorage.getItem('token');

      // Use FormData for file upload
      const formData = new FormData();
      formData.append('title', newMaterial.title);
      formData.append('week', newMaterial.week);
      formData.append('type', newMaterial.type);
      formData.append('description', newMaterial.description);

      if (newMaterial.file) {
        formData.append('file', newMaterial.file);
      }

      // If authenticating with x-auth-token header, axios handles multipart boundary automatically
      const response = await axios.post(`/api/courses/${selectedCourse.id}/materials`,
        formData,
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Update local state with returned course data
      if (response.data.course) {
        // Ensure we preserve other properties
        const updatedCourse = {
          ...selectedCourse,
          ...response.data.course,
          id: response.data.course._id
        };
        setSelectedCourse(updatedCourse);

        // Update courses list
        setCourses(courses.map(c => c.id === updatedCourse.id ? { ...c, enrollment: updatedCourse.enrollment } : c));

        alert('Material added successfully!');
        handleAddMaterialClose();
      }
    } catch (err) {
      console.error('Error adding material:', err);
      // Log more details if available
      if (err.response) {
        console.error('Server response:', err.response.data);
        alert(`Failed to add material: ${err.response.data.msg || err.response.statusText}`);
      } else {
        alert('Failed to add material. Please try again.');
      }
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

  // If no course is selected, show the course list
  if (!selectedCourse) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Course Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateCourse}
          >
            Create New Course
          </Button>
        </Box>

        <Grid container spacing={3}>
          {courses.map(course => (
            <Grid item xs={12} md={6} lg={4} key={course.id}>
              <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                      {course.title}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(event) => handleMenuOpen(event, course)}
                      aria-label="course options"
                    >
                      <MoreVertIcon />
                    </IconButton>
                    <Menu
                      anchorEl={anchorEl?.element}
                      open={Boolean(anchorEl)}
                      onClose={handleMenuClose}
                    >
                      <MenuItem onClick={() => handleOpenDialog('delete-course', anchorEl?.course)}>
                        <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                        Delete Course
                      </MenuItem>
                    </Menu>
                  </Box>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    {course.code} • {course.department}
                  </Typography>
                  {course.description && course.description.length > 5 && (
                    <Typography variant="body2" paragraph>
                      {course.description}
                    </Typography>
                  )}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonAddIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {course.enrollment} Students
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AssessmentIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {course.assessmentCount} Assessments
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {course.term}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleSelectCourse(course)}
                  >
                    Manage Course
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
          {courses.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No courses found. create one to get started.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Confirm Delete Dialog */}
        <Dialog
          open={openDialog && dialogAction === 'delete-course'}
          onClose={handleCloseDialog}
        >
          <DialogTitle>Delete Course</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the course "{dialogItem?.title}"? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleConfirmDialog} color="error">Delete</Button>
          </DialogActions>
        </Dialog>

        {/* Course Form Dialog */}
        <Dialog
          open={openCourseFormDialog}
          onClose={handleCourseFormClose}
        >
          <DialogTitle>Create New Course</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="title"
              label="Course Title"
              type="text"
              fullWidth
              value={newCourseData.title}
              onChange={handleCourseFormChange}
            />
            <TextField
              margin="dense"
              name="code"
              label="Course Code"
              type="text"
              fullWidth
              value={newCourseData.code}
              onChange={handleCourseFormChange}
            />
            <TextField
              margin="dense"
              name="department"
              label="Department"
              type="text"
              fullWidth
              value={newCourseData.department}
              onChange={handleCourseFormChange}
            />
            <TextField
              margin="dense"
              name="term"
              label="Term"
              type="text"
              fullWidth
              value={newCourseData.term}
              onChange={handleCourseFormChange}
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={4}
              value={newCourseData.description}
              onChange={handleCourseFormChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCourseFormClose}>Cancel</Button>
            <Button onClick={handleCourseFormSubmit} color="primary">Create</Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

  // Course detail view
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToCourses}
          variant="outlined"
          sx={{ mb: 2 }}
        >
          Back to Courses
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            {selectedCourse.title}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AutoGraphIcon />}
            component={RouterLink}
            to={`/instructor/curriculum/${selectedCourse.id}`}
            onClick={() => {
              // Store the course details in localStorage before navigating
              localStorage.setItem('currentCourse', JSON.stringify({
                id: selectedCourse.id,
                title: selectedCourse.title,
                code: selectedCourse.code,
                description: selectedCourse.description,
                topics: selectedCourse.topics || []
              }));
            }}
          >
            Curriculum Mapping
          </Button>
        </Box>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {selectedCourse.code} • {selectedCourse.department} • {selectedCourse.term}
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab icon={<AssessmentIcon />} label="Assessments" iconPosition="start" />
          <Tab icon={<PersonAddIcon />} label="Students" iconPosition="start" />
          <Tab icon={<MenuBookIcon />} label="Course Materials" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Assessments Tab */}
      <Box hidden={activeTab !== 0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Assessments
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateAssessment}
          >
            Create Assessment
          </Button>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>              <TableRow>
              <TableCell>Assessment Title</TableCell>
              <TableCell>Syllabus Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Pattern</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell align="right">Submissions</TableCell>
              <TableCell align="right">Avg. Score</TableCell>
              <TableCell align="right">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
            </TableHead>
            <TableBody>
              {selectedCourse.assessments.map((assessment) => (
                <TableRow key={assessment.id || assessment._id}>
                  <TableCell component="th" scope="row">
                    {assessment.title}
                  </TableCell>                  <TableCell>
                    {assessment.syllabusTitle || 'N/A'}
                  </TableCell>
                  <TableCell>{assessment.type}</TableCell>
                  <TableCell>
                    {assessment.visibility && assessment.visibility.pattern ? (
                      <Tooltip title={assessment.visibility.pattern.description || 'No description available'}>
                        <span>{assessment.visibility.pattern.name} • {assessment.visibility.pattern.difficulty}</span>
                      </Tooltip>
                    ) : assessment.pattern ? (
                      <Tooltip title={assessment.pattern.description || 'No description available'}>
                        <span>{assessment.pattern.name} • {assessment.pattern.difficulty}</span>
                      </Tooltip>
                    ) : 'Standard'}
                  </TableCell>
                  <TableCell>{new Date(assessment.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    {assessment.submissions}/{selectedCourse.enrollment}
                  </TableCell>
                  <TableCell align="right">
                    {assessment.avgScore > 0 ? `${assessment.avgScore}%` : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      size="small"
                      label={assessment.assignToAllStudents ? 'Assigned' : 'Draft'}
                      color={assessment.assignToAllStudents ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleEditAssessment(assessment.id)}
                      aria-label="edit assessment"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleViewResults(assessment.id)}
                      aria-label="view results"
                      sx={{ ml: 1 }}
                    >
                      <AssessmentIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog('delete-assessment', assessment)}
                      aria-label="delete assessment"
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {selectedCourse.assessments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No assessments created yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Students Tab */}
      <Box hidden={activeTab !== 1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Students
          </Typography>
          <Box>
            <Button
              startIcon={<PersonAddIcon />}
              sx={{ mr: 2 }}
              onClick={handleAddStudentOpen}
            >
              Add Students
            </Button>
            <Button
              variant="contained"
              component={RouterLink}
              to={`/instructor/student-results/${selectedCourse.id}`}
            >
              View Student Results
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Average Score</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedCourse.students.map((student) => (
                <TableRow key={student.id || student._id}>
                  <TableCell component="th" scope="row">
                    {student.name}
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${student.avgScore || 0}%`}
                      color={
                        (student.avgScore || 0) >= 90 ? 'success' :
                          (student.avgScore || 0) >= 70 ? 'primary' :
                            (student.avgScore || 0) >= 60 ? 'warning' : 'error'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog('remove-student', student)}
                      aria-label="remove student"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {selectedCourse.students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No students enrolled yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Course Materials Tab */}
      <Box hidden={activeTab !== 2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Course Materials
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddMaterialOpen}
          >
            Add Material
          </Button>
        </Box>

        <List>
          {selectedCourse.materials.map((material) => (
            <React.Fragment key={material.id}>
              <ListItem
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      aria-label="edit material"
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete material"
                      onClick={() => handleOpenDialog('delete-material', material)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
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
              </ListItem>
              {material.fileName && (
                <ListItem sx={{ pl: 9, pt: 0, pb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    File: {material.fileName}
                  </Typography>
                </ListItem>
              )}
              <Divider component="li" />
            </React.Fragment>
          ))}
          {selectedCourse.materials.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No course materials added yet."
                sx={{ textAlign: 'center', color: 'text.secondary' }}
              />
            </ListItem>
          )}
        </List>
      </Box>

      {/* Add Student Dialog */}
      <Dialog open={addStudentDialogOpen} onClose={handleAddStudentClose}>
        <DialogTitle>Enroll Student</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the email address of the student you wish to enroll in this course.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Student Email"
            type="email"
            fullWidth
            variant="outlined"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddStudentClose}>Cancel</Button>
          <Button onClick={handleAddStudentSubmit} variant="contained">Enroll</Button>
        </DialogActions>
      </Dialog>

      {/* Add Material Dialog */}
      <Dialog open={addMaterialDialogOpen} onClose={handleAddMaterialClose}>
        <DialogTitle>Add Course Material</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Upload study materials, lecture notes, or assignments for your students.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="Material Title"
            type="text"
            fullWidth
            required
            value={newMaterial.title}
            onChange={handleMaterialChange}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                name="week"
                label="Week"
                type="number"
                fullWidth
                value={newMaterial.week}
                onChange={handleMaterialChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                margin="dense"
                name="type"
                label="Type"
                fullWidth
                value={newMaterial.type}
                onChange={handleMaterialChange}
              >
                <MenuItem value="pdf">PDF Document</MenuItem>
                <MenuItem value="document">Notes</MenuItem>
                <MenuItem value="link">Link</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={2}
            value={newMaterial.description}
            onChange={handleMaterialChange}
          />

          {newMaterial.type === 'pdf' && (
            <Box sx={{ mt: 2, p: 2, border: '1px dashed grey', borderRadius: 1, textAlign: 'center' }}>
              <Button
                variant="outlined"
                component="label"
              >
                Upload PDF
                <input
                  type="file"
                  hidden
                  accept=".pdf"
                  onChange={handleFileChange}
                />
              </Button>
              {newMaterial.file && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected: {newMaterial.file.name}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddMaterialClose}>Cancel</Button>
          <Button onClick={handleAddMaterialSubmit} variant="contained">Add Material</Button>
        </DialogActions>
      </Dialog>

      {/* Dialogs */}
      <Dialog
        open={openDialog && dialogAction === 'delete-assessment'}
        onClose={handleCloseDialog}
      >
        <DialogTitle>Delete Assessment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the assessment "{dialogItem?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleConfirmDialog} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDialog && dialogAction === 'delete-material'}
        onClose={handleCloseDialog}
      >
        <DialogTitle>Delete Course Material</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the material "{dialogItem?.title}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleConfirmDialog} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDialog && dialogAction === 'remove-student'}
        onClose={handleCloseDialog}
      >
        <DialogTitle>Remove Student</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {dialogItem?.name} from this course?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleConfirmDialog} color="error">Remove</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CourseManagement;