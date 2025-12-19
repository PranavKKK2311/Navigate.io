import React, { useEffect, useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Button,
    CircularProgress,
    Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Assessment as AssessmentIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';

const MyGrades = () => {
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchGrades = async () => {
            setLoading(true);
            try {
                const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
                const token = localStorage.getItem('token');
                const api = axios.create({
                    baseURL: API_URL,
                    headers: { 'x-auth-token': token }
                });

                const response = await api.get('/student/assessment/my-grades');
                if (response.data.success) {
                    setGrades(response.data.submissions || []);
                } else {
                    setError('Failed to fetch grades.');
                }
            } catch (err) {
                console.error('Error fetching grades:', err);
                setError('Failed to load grades. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchGrades();
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom component="h1" sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
                <AssessmentIcon fontSize="large" sx={{ mr: 2, color: 'primary.main' }} />
                My Grades
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                {grades.length > 0 ? (
                    <TableContainer>
                        <Table sx={{ minWidth: 650 }} aria-label="grades table">
                            <TableHead sx={{ bgcolor: 'grey.50' }}>
                                <TableRow>
                                    <TableCell>Assessment</TableCell>
                                    <TableCell>Course</TableCell>
                                    <TableCell>Submitted On</TableCell>
                                    <TableCell align="center">Status</TableCell>
                                    <TableCell align="right">Score</TableCell>
                                    <TableCell align="right">Percentage</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {grades.map((grade) => (
                                    <TableRow
                                        key={grade._id}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: 'action.hover' } }}
                                    >
                                        <TableCell component="th" scope="row">
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                {grade.assessmentTitle}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{grade.courseCode}</TableCell>
                                        <TableCell>
                                            {new Date(grade.submissionDate).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={grade.status ? grade.status.charAt(0).toUpperCase() + grade.status.slice(1) : 'Unknown'}
                                                color={grade.status === 'graded' ? 'success' : 'warning'}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {grade.status === 'graded' ? (
                                                <Typography fontWeight="medium">
                                                    {grade.overallScore} / {grade.maxScore}
                                                </Typography>
                                            ) : (
                                                <Typography color="text.secondary">-</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            {grade.status === 'graded' ? (
                                                <Chip
                                                    label={`${grade.percentage}%`}
                                                    size="small"
                                                    color={
                                                        grade.percentage >= 90 ? 'success' :
                                                            grade.percentage >= 70 ? 'primary' :
                                                                grade.percentage >= 60 ? 'warning' : 'error'
                                                    }
                                                />
                                            ) : (
                                                <Typography color="text.secondary">-</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            {grade.status === 'graded' && (
                                                <Button
                                                    size="small"
                                                    endIcon={<ArrowForwardIcon />}
                                                    onClick={() => navigate(`/results/${grade._id}`)}
                                                >
                                                    View Results
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No graded submissions found.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Once your assessments are graded, they will appear here.
                        </Typography>
                        <Button
                            variant="contained"
                            sx={{ mt: 2 }}
                            onClick={() => navigate('/dashboard')}
                        >
                            Go to Dashboard
                        </Button>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default MyGrades;
