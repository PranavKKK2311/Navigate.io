import {
  Assignment as AssignmentIcon,
  Dashboard as DashboardIcon,
  Map as MapIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  Grade as GradeIcon,
} from '@mui/icons-material';
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ drawerWidth, mobileOpen, handleDrawerToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  // Get the user's role - either from the currentUser object or from localStorage as fallback
  const userRole = currentUser?.role || localStorage.getItem('userRole');
  console.log('Sidebar - User role:', userRole);
  console.log('Sidebar - Current user:', currentUser);

  // Strict check for instructor role - default to student view if not explicitly an instructor/admin
  const isInstructor = userRole === 'instructor' || userRole === 'admin' || false;
  console.log('Sidebar - Is instructor:', isInstructor);

  // Navigation items for students
  const studentItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'My Grades', icon: <GradeIcon />, path: '/my-grades' },
    { text: 'My Courses', icon: <SchoolIcon />, path: '/dashboard' },
    { text: 'Learning Progress', icon: <TimelineIcon />, path: '/dashboard' },
  ];

  // Navigation items for instructors
  const instructorItems = [
    { text: 'Instructor Dashboard', icon: <DashboardIcon />, path: '/instructor/dashboard' },
    { text: 'Course Management', icon: <SchoolIcon />, path: '/instructor/courses' },
    { text: 'Assessment Creator', icon: <AssignmentIcon />, path: '/instructor/assessment' },
    { text: 'Student Results', icon: <PeopleIcon />, path: '/instructor/student-results' },
    { text: 'Curriculum Mapping', icon: <MapIcon />, path: '/instructor/curriculum' },
  ];

  // Common items for all users
  const commonItems = [
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (mobileOpen) {
      handleDrawerToggle();
    }
  };

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {/* Show appropriate items based on user role */}
        {(isInstructor ? instructorItems : studentItems).map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        {commonItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="navigation menu"
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;