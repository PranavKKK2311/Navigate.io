import { Box } from '@mui/material';
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Layout Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

// Public Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import LandingPage from './pages/LandingPage';
import Settings from './pages/Settings';

// Student Pages
import AssessmentTake from './pages/student/AssessmentTake';
import CourseView from './pages/student/CourseView';
import Dashboard from './pages/student/Dashboard';
import LearningPath from './pages/student/LearningPath';
import SubmissionResults from './pages/student/SubmissionResults';
import MyGrades from './pages/student/MyGrades';

// Instructor Pages
import AssessmentCreation from './pages/instructor/AssessmentCreation';
import CourseManagement from './pages/instructor/CourseManagement';
import CurriculumMapping from './pages/instructor/CurriculumMapping';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import StudentResults from './pages/instructor/StudentResults';

function App() {
  const { currentUser, loading } = useAuth();

  // Show loading state when checking authentication
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        Loading...
      </Box>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          {/* Student Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/course/:courseId" element={<CourseView />} />
          <Route path="/assessment/:assessmentId" element={<AssessmentTake />} />
          <Route path="/results/:submissionId" element={<SubmissionResults />} />
          <Route path="/learning-path/:courseId" element={<LearningPath />} />
          <Route path="/my-grades" element={<MyGrades />} />

          {/* Instructor Routes */}
          <Route
            path="/instructor/dashboard"
            element={
              currentUser?.role === 'instructor' ?
                <InstructorDashboard /> :
                <Navigate to="/dashboard" />
            }
          />
          <Route
            path="/instructor/courses/:courseId?"
            element={
              currentUser?.role === 'instructor' ?
                <CourseManagement /> :
                <Navigate to="/dashboard" />
            }
          />
          <Route
            path="/instructor/assessment/:assessmentId?"
            element={
              currentUser?.role === 'instructor' ?
                <AssessmentCreation /> :
                <Navigate to="/dashboard" />
            }
          />
          <Route
            path="/instructor/student-results/:courseId?"
            element={
              currentUser?.role === 'instructor' ?
                <StudentResults /> :
                <Navigate to="/dashboard" />
            }
          />
          <Route
            path="/instructor/curriculum/:courseId"
            element={
              currentUser?.role === 'instructor' ?
                <CurriculumMapping /> :
                <Navigate to="/dashboard" />
            }
          />
          <Route
            path="/instructor/curriculum"
            element={
              currentUser?.role === 'instructor' ?
                <Navigate to="/instructor/courses" replace /> :
                <Navigate to="/dashboard" />
            }
          />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Catch all - 404 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;