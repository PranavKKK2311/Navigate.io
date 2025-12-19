import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    Alert,
    CircularProgress,
    Divider,
    Chip,
    Card,
    CardContent
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HomeIcon from '@mui/icons-material/Home';
import GradeIcon from '@mui/icons-material/Grade';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';

function SubmissionResults() {
    const { submissionId } = useParams();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSubmissionResults();
    }, [submissionId]);

    const fetchSubmissionResults = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/assessment/results/${submissionId}`, {
                headers: { 'x-auth-token': token }
            });
            setSubmission(response.data.submission);
        } catch (err) {
            console.error('Error fetching results:', err);
            setError(err.response?.data?.message || 'Failed to load submission results.');
            setSubmission(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Loading results...</Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">
                    {error}
                </Alert>
                <Button variant="contained" onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
                    Go to Dashboard
                </Button>
            </Container>
        );
    }

    if (!submission) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">
                    Submission not found.
                </Alert>
                <Button variant="contained" onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
                    Go to Dashboard
                </Button>
            </Container>
        );
    }

    const isGraded = submission.status === 'graded';
    const hasPendingReview = submission.hasPendingReview;
    const answers = submission.answers || [];

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box sx={{ mb: 2 }}>
                        <CheckCircleIcon
                            sx={{ fontSize: 64, color: 'success.main' }}
                        />
                    </Box>

                    <Typography variant="h4" gutterBottom fontWeight="bold">
                        Assessment Submitted
                    </Typography>

                    {/* Score Section */}
                    {isGraded && !hasPendingReview ? (
                        <Box sx={{ mt: 3, p: 3, bgcolor: 'success.light', borderRadius: 2, display: 'inline-block', minWidth: 200 }}>
                            <GradeIcon sx={{ fontSize: 40, color: 'success.dark', mb: 1 }} />
                            <Typography variant="h3" fontWeight="bold" color="success.dark">
                                {submission.overallScore} / {submission.maxScore}
                            </Typography>
                            <Typography variant="h6" color="success.dark">
                                {Math.round((submission.overallScore / submission.maxScore) * 100)}%
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ mt: 3, p: 3, bgcolor: 'warning.light', borderRadius: 2 }}>
                            <PendingIcon sx={{ fontSize: 40, color: 'warning.dark', mb: 1 }} />
                            <Typography variant="h5" color="warning.dark" fontWeight="bold">
                                Grading in Progress
                            </Typography>
                            {/* Auto-score hidden until finalized */}
                        </Box>
                    )}
                </Box>

                <Divider sx={{ my: 4 }} />

                {/* Only show detailed results if grading is complete */}
                {isGraded && !hasPendingReview ? (
                    <>
                        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                            Detailed Results
                        </Typography>

                        {answers.length > 0 ? (
                            <Box>
                                {answers.map((answer, index) => (
                                    <Card key={index} variant="outlined" sx={{ mb: 3 }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                                                    Question {index + 1}
                                                    <Chip
                                                        label={answer.type || 'Question'}
                                                        size="small"
                                                        sx={{ ml: 1, textTransform: 'uppercase', fontSize: '0.7rem' }}
                                                    />
                                                </Typography>
                                                <Chip
                                                    icon={answer.correct ? <CheckCircleIcon /> : <CancelIcon />}
                                                    label={answer.correct ? 'Correct' : 'Incorrect'}
                                                    color={answer.correct ? 'success' : 'error'}
                                                    variant={answer.correct ? 'filled' : 'outlined'}
                                                />
                                            </Box>

                                            {/* Question Text - Theme Aware Box */}
                                            <Box sx={{
                                                mb: 2,
                                                p: 2,
                                                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                                                borderRadius: 1,
                                                borderLeft: 4,
                                                borderColor: 'primary.main'
                                            }}>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {answer.questionText || 'Question text unavailable'}
                                                </Typography>
                                            </Box>

                                            {/* Options (for MCQ) */}
                                            {answer.options && answer.options.length > 0 && (
                                                <Box sx={{ mb: 2, ml: 1 }}>
                                                    {answer.options.map((opt, optIdx) => {
                                                        const optionLetter = String.fromCharCode(65 + optIdx);
                                                        const isSelected = String(answer.answer) === opt || String(answer.answer) === optionLetter;
                                                        const isCorrectAnswer = String(answer.correctAnswer) === opt || String(answer.correctAnswer) === optionLetter;

                                                        // Highlight if it's the correct answer (green) OR if it's the user's wrong selection (red)
                                                        let bgcolor = 'transparent';
                                                        let borderColor = 'grey.300';

                                                        if (isCorrectAnswer) {
                                                            bgcolor = 'success.light';
                                                            borderColor = 'success.main';
                                                        } else if (isSelected && !answer.correct) {
                                                            bgcolor = 'error.light';
                                                            borderColor = 'error.main';
                                                        }

                                                        return (
                                                            <Box key={optIdx} sx={{
                                                                p: 1,
                                                                mb: 1,
                                                                borderRadius: 1,
                                                                border: 1,
                                                                borderColor: borderColor,
                                                                bgcolor: bgcolor,
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}>
                                                                <Typography variant="body2" sx={{ fontWeight: isSelected || isCorrectAnswer ? 'bold' : 'normal' }}>
                                                                    {optionLetter}. {opt}
                                                                    {isCorrectAnswer && <Chip label="Correct Answer" color="success" size="small" sx={{ ml: 1, height: 20 }} />}
                                                                    {isSelected && !isCorrectAnswer && <Chip label="Your Answer" color="error" size="small" sx={{ ml: 1, height: 20 }} />}
                                                                    {isSelected && isCorrectAnswer && <Chip label="Your Answer" color="success" size="small" sx={{ ml: 1, height: 20 }} />}
                                                                </Typography>
                                                            </Box>
                                                        );
                                                    })}
                                                </Box>
                                            )}

                                            {/* User Answer (Non-MCQ or fallback) */}
                                            {(!answer.options || answer.options.length === 0) && (
                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="subtitle2" color="text.secondary">Your Answer:</Typography>
                                                    <Typography variant="body1" sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                                                        {String(answer.answer || 'No answer provided')}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {/* Correct Answer Display (if not shown in options) */}
                                            {(!answer.options || answer.options.length === 0) && !answer.correct && answer.correctAnswer && (
                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="subtitle2" color="text.secondary">Correct Answer:</Typography>
                                                    <Typography variant="body1" sx={{ p: 1.5, bgcolor: 'success.light', borderRadius: 1 }}>
                                                        {String(answer.correctAnswer)}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {/* Feedback */}
                                            {answer.feedback && (
                                                <Alert severity={answer.correct ? "success" : "info"} sx={{ mt: 2 }}>
                                                    {answer.feedback}
                                                </Alert>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        ) : (
                            <Alert severity="info">Detailed results are not available for this assessment.</Alert>
                        )}
                    </>
                ) : (
                    <Box sx={{ mt: 4, p: 3, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 2, border: '1px dashed grey' }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Detailed Results Hidden
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Specific questions and correct answers will be available after the instructor has completed grading.
                        </Typography>
                    </Box>
                )}

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<HomeIcon />}
                        onClick={() => navigate('/dashboard')}
                    >
                        Back to Dashboard
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}

export default SubmissionResults;