import React, { useState } from 'react';
import { Container, Typography, Paper, Box, Switch, FormControlLabel, Button, Alert } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
    const { mode, toggleTheme } = useTheme();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            setError('Failed to log out');
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Account Settings
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Preferences
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="Email Notifications"
                    />
                    <FormControlLabel
                        control={<Switch checked={mode === 'dark'} onChange={toggleTheme} />}
                        label={`Dark Mode (${mode === 'dark' ? 'On' : 'Off'})`}
                    />
                    <FormControlLabel
                        control={<Switch />}
                        label="Compact View"
                    />
                </Box>
            </Paper>

            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Account Management
                </Typography>
                <Box sx={{ mt: 2 }}>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={handleLogout}
                    >
                        Sign Out
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default Settings;
