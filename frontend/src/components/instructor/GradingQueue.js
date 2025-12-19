import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Divider
} from '@mui/material';
import GradeIcon from '@mui/icons-material/Grade';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import EditIcon from '@mui/icons-material/Edit';

function GradingQueue() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
    const [newScore, setNewScore] = useState('');
    const [feedback, setFeedback] = useState('');
    const [grading, setGrading] = useState(false);

    // Question Editing State
    const [editQuestionDialogOpen, setEditQuestionDialogOpen] = useState(false);
    const [currentAnswerIndex, setCurrentAnswerIndex] = useState(null);
    const [currentAnswerRating, setCurrentAnswerRating] = useState({ score: 0, feedback: '', correct: false });

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        try {
            console.log('=== FETCHING SUBMISSIONS (FRONTEND) ===');
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/instructor/assessment/submissions', {
                headers: { 'x-auth-token': token }
            });
            setSubmissions(response.data.submissions || []);
        } catch (error) {
            console.error('Error fetching submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGradeClick = (submission) => {
        setSelectedSubmission(submission);
        setNewScore(submission.overallScore || 0);
        setFeedback(submission.feedback || '');
        setGradeDialogOpen(true);
    };

    // Open logic for specific question
    const handleEditQuestion = (index) => {
        const answer = selectedSubmission.answers[index];
        setCurrentAnswerIndex(index);
        setCurrentAnswerRating({
            score: answer.score || 0,
            feedback: answer.feedback || '',
            correct: answer.correct || false,
            maxPoints: answer.maxPoints || 10 // Store max points for validation
        });
        setEditQuestionDialogOpen(true);
    };

    const handleSaveQuestionGrade = () => {
        if (!selectedSubmission || currentAnswerIndex === null) return;

        // Clone answers
        const updatedAnswers = [...selectedSubmission.answers];
        const updatedAnswer = { ...updatedAnswers[currentAnswerIndex] };

        // Update fields
        updatedAnswer.score = parseFloat(currentAnswerRating.score);
        updatedAnswer.feedback = currentAnswerRating.feedback;
        updatedAnswer.correct = currentAnswerRating.correct === 'true' || currentAnswerRating.correct === true;
        updatedAnswer.pendingReview = false; // Mark as reviewed

        updatedAnswers[currentAnswerIndex] = updatedAnswer;

        // Recalculate total score
        const totalScore = updatedAnswers.reduce((sum, ans) => sum + (ans.score || 0), 0);

        // Update state
        setSelectedSubmission({
            ...selectedSubmission,
            answers: updatedAnswers,
            overallScore: totalScore
        });
        setNewScore(totalScore); // Sync with main score input

        setEditQuestionDialogOpen(false);
    };

    const handleGradeSubmit = async () => {
        // Allow any number, including 0
        const score = parseFloat(newScore);
        if (newScore === '' || isNaN(score) || score < 0) {
            alert('Please enter a valid score (0 or higher)');
            return;
        }

        setGrading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `/api/instructor/assessment/submissions/${selectedSubmission._id}/grade`,
                {
                    overallScore: parseInt(newScore),
                    feedback: feedback,
                    answers: selectedSubmission.answers // Send updated answers!
                },
                {
                    headers: { 'x-auth-token': token }
                }
            );

            // Refresh submissions
            await fetchSubmissions();
            setGradeDialogOpen(false);
            setSelectedSubmission(null);
        } catch (error) {
            console.error('Error grading submission:', error);
            alert('Error grading submission');
        } finally {
            setGrading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    const pendingSubmissions = submissions.filter(s => s.hasPendingReview);
    const gradedSubmissions = submissions.filter(s => !s.hasPendingReview);

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Grading Queue
            </Typography>

            {submissions.length === 0 ? (
                <Alert severity="info">No submissions to grade yet.</Alert>
            ) : (
                <>
                    {/* Pending Submissions */}
                    {pendingSubmissions.length > 0 && (
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Pending Review ({pendingSubmissions.length})
                                </Typography>
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Student</TableCell>
                                                <TableCell>Assessment</TableCell>
                                                <TableCell>Submitted</TableCell>
                                                <TableCell>Auto Score</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Action</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {pendingSubmissions.map((sub) => (
                                                <TableRow key={sub._id}>
                                                    <TableCell>{sub.student?.name || 'Unknown'}</TableCell>
                                                    <TableCell>{sub.assessment?.title || 'Unknown'}</TableCell>
                                                    <TableCell>
                                                        {new Date(sub.submissionDate).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>{sub.overallScore}/{sub.maxScore}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            icon={<PendingIcon />}
                                                            label="Pending"
                                                            color="warning"
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            startIcon={<GradeIcon />}
                                                            onClick={() => handleGradeClick(sub)}
                                                        >
                                                            Grade
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    )}

                    {/* Graded Submissions */}
                    {gradedSubmissions.length > 0 && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Graded ({gradedSubmissions.length})
                                </Typography>
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Student</TableCell>
                                                <TableCell>Assessment</TableCell>
                                                <TableCell>Submitted</TableCell>
                                                <TableCell>Final Score</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Action</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {gradedSubmissions.map((sub) => (
                                                <TableRow key={sub._id}>
                                                    <TableCell>{sub.student?.name || 'Unknown'}</TableCell>
                                                    <TableCell>{sub.assessment?.title || 'Unknown'}</TableCell>
                                                    <TableCell>
                                                        {new Date(sub.submissionDate).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>{sub.overallScore}/{sub.maxScore}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            icon={<CheckCircleIcon />}
                                                            label="Graded"
                                                            color="success"
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            onClick={() => handleGradeClick(sub)}
                                                        >
                                                            Edit Grade
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {/* Grading Dialog */}
            <Dialog open={gradeDialogOpen} onClose={() => setGradeDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Grade Submission</DialogTitle>
                <DialogContent>
                    {selectedSubmission && (
                        <Box sx={{ pt: 2 }}>
                            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="body2" gutterBottom>
                                    <strong>Student:</strong> {selectedSubmission.student?.name}
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                    <strong>Assessment:</strong> {selectedSubmission.assessment?.title}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Current Total Score:</strong> {selectedSubmission.overallScore}/{selectedSubmission.maxScore}
                                </Typography>
                            </Box>

                            {/* Student Answers Section */}
                            <Typography variant="h6" gutterBottom>
                                Student Answers
                            </Typography>

                            {Array.isArray(selectedSubmission.answers) && selectedSubmission.answers.length > 0 ? (
                                selectedSubmission.answers.map((answer, index) => (
                                    <Card key={index} variant="outlined" sx={{ mb: 2, p: 2, borderColor: answer.pendingReview ? 'warning.main' : 'divider', borderWidth: answer.pendingReview ? 2 : 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                Question {index + 1}
                                                <Chip
                                                    size="small"
                                                    label={answer.type || 'MCQ'}
                                                    variant="outlined"
                                                    sx={{ ml: 1, fontSize: '0.7rem' }}
                                                />
                                            </Typography>
                                            <Box>
                                                <Chip
                                                    size="small"
                                                    label={answer.pendingReview ? 'Pending Review' : answer.correct ? 'Correct' : 'Incorrect'}
                                                    color={answer.pendingReview ? 'warning' : answer.correct ? 'success' : 'error'}
                                                    sx={{ mr: 1 }}
                                                />
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<EditIcon />}
                                                    onClick={() => handleEditQuestion(index)}
                                                >
                                                    Grade/Edit
                                                </Button>
                                            </Box>
                                        </Box>

                                        {/* Question Text */}
                                        {answer.questionText && (
                                            <Box sx={{
                                                mb: 2,
                                                p: 1.5,
                                                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                                                borderRadius: 1,
                                                borderLeft: 3,
                                                borderColor: 'primary.main'
                                            }}>
                                                <Typography variant="body2" fontWeight="medium" color="text.primary">
                                                    {answer.questionText}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Options Display for Instructor */}
                                        {answer.options && answer.options.length > 0 && (
                                            <Box sx={{ mb: 2 }}>
                                                {answer.options.map((opt, optIdx) => {
                                                    const optionLetter = String.fromCharCode(65 + optIdx);
                                                    const isSelected = String(answer.answer) === opt || String(answer.answer) === optionLetter;
                                                    const isCorrectAnswer = String(answer.correctAnswer) === opt || String(answer.correctAnswer) === optionLetter;

                                                    return (
                                                        <Box key={optIdx} sx={{
                                                            p: 0.75,
                                                            mb: 0.5,
                                                            pl: 1,
                                                            borderRadius: 1,
                                                            bgcolor: isCorrectAnswer ? 'rgba(76, 175, 80, 0.1)' : (isSelected ? 'rgba(244, 67, 54, 0.1)' : 'transparent'),
                                                            border: '1px solid',
                                                            borderColor: isCorrectAnswer ? 'success.main' : (isSelected ? 'error.main' : 'divider'),
                                                            display: 'flex', alignItems: 'center'
                                                        }}>
                                                            <Typography variant="body2" sx={{ fontWeight: isSelected || isCorrectAnswer ? 'bold' : 'normal', fontSize: '0.875rem' }}>
                                                                <span style={{ fontWeight: 'bold', marginRight: 8, opacity: 0.7 }}>{optionLetter}.</span>
                                                                {opt}
                                                                {isCorrectAnswer && <Chip label="Correct" color="success" size="small" sx={{ ml: 1, height: 20, fontSize: '0.65rem' }} />}
                                                                {isSelected && !isCorrectAnswer && <Chip label="Selected" color="error" size="small" sx={{ ml: 1, height: 20, fontSize: '0.65rem' }} />}
                                                            </Typography>
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        )}

                                        {/* Correct Answer Display for Instructor */}
                                        {answer.correctAnswer && (
                                            <Box sx={{ mb: 1 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    <strong>Reference Correct Answer:</strong> {String(answer.correctAnswer)}
                                                </Typography>
                                            </Box>
                                        )}

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            <strong>Student's Answer:</strong>
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            p: 1,
                                            bgcolor: answer.correct ? 'success.light' : answer.pendingReview ? 'warning.light' : 'error.light',
                                            borderRadius: 1,
                                            mb: 1,
                                            opacity: 0.9,
                                            color: 'black'
                                        }}>
                                            {answer.answer || 'No answer provided'}
                                        </Typography>

                                        {/* Grading Info */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                                            <Typography variant="body2" fontWeight="bold">
                                                Score: {answer.score}/{answer.maxPoints || 10}
                                            </Typography>
                                            {answer.feedback && (
                                                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    Feedback: {answer.feedback}
                                                </Typography>
                                            )}
                                        </Box>

                                        {/* AI Grading Help for Short Answer (Pending Review) */}
                                        {answer.pendingReview && (
                                            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'info.light', borderRadius: 1, border: '1px dashed', borderColor: 'info.main' }}>
                                                <Typography variant="body2" fontWeight="bold" color="info.dark" gutterBottom>
                                                    🤖 AI Grading Suggestions:
                                                </Typography>
                                                {answer.aiSuggestedScore !== undefined && (
                                                    <Typography variant="body2" color="info.dark">
                                                        Suggested: {answer.aiSuggestedScore}/{answer.maxPoints || 10}
                                                    </Typography>
                                                )}
                                                <Typography variant="caption" color="text.secondary">
                                                    Please click "Grade/Edit" to confirm score.
                                                </Typography>
                                            </Box>
                                        )}
                                    </Card>
                                ))
                            ) : (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    Answer details not available.
                                </Alert>
                            )}

                            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="h6" gutterBottom>
                                    Final Grade (Calculated Total)
                                </Typography>
                                <TextField
                                    fullWidth
                                    label="Total Score"
                                    type="number"
                                    value={newScore}
                                    onChange={(e) => setNewScore(e.target.value)}
                                    sx={{ mb: 2 }}
                                    helperText={`Sum of individual question scores. You can override this manually if needed.`}
                                />

                                <TextField
                                    fullWidth
                                    label="Overall Feedback"
                                    multiline
                                    rows={3}
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Provide general feedback..."
                                />
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setGradeDialogOpen(false)} disabled={grading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGradeSubmit}
                        variant="contained"
                        disabled={grading}
                        color="primary"
                    >
                        {grading ? 'Saving...' : 'Save All Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Question Editing Dialog */}
            <Dialog
                open={editQuestionDialogOpen}
                onClose={() => setEditQuestionDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Evaluate Question {currentAnswerIndex !== null ? currentAnswerIndex + 1 : ''}</DialogTitle>
                <DialogContent>
                    {currentAnswerIndex !== null && selectedSubmission && (
                        <Box sx={{ pt: 1 }}>
                            <Box sx={{
                                mb: 2,
                                p: 2,
                                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                                borderRadius: 1
                            }}>
                                <Typography variant="subtitle2" gutterBottom>Question:</Typography>
                                <Typography variant="body2" paragraph>
                                    {selectedSubmission.answers[currentAnswerIndex].questionText}
                                </Typography>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="subtitle2" gutterBottom>Student Answer:</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                    {selectedSubmission.answers[currentAnswerIndex].answer}
                                </Typography>
                            </Box>

                            <FormControl component="fieldset" sx={{ mb: 2 }}>
                                <FormLabel component="legend">Evaluation Status</FormLabel>
                                <RadioGroup
                                    row
                                    name="correct"
                                    value={currentAnswerRating.correct}
                                    onChange={(e) => setCurrentAnswerRating({ ...currentAnswerRating, correct: e.target.value === 'true' })}
                                >
                                    <FormControlLabel value={true} control={<Radio />} label="Correct" />
                                    <FormControlLabel value={false} control={<Radio />} label="Incorrect" />
                                </RadioGroup>
                            </FormControl>

                            <TextField
                                fullWidth
                                label={`Points (Max: ${currentAnswerRating.maxPoints})`}
                                type="number"
                                value={currentAnswerRating.score}
                                onChange={(e) => setCurrentAnswerRating({ ...currentAnswerRating, score: e.target.value })}
                                sx={{ mb: 2 }}
                                inputProps={{ min: 0, max: currentAnswerRating.maxPoints }}
                            />

                            <TextField
                                fullWidth
                                label="Question Feedback"
                                multiline
                                rows={2}
                                value={currentAnswerRating.feedback}
                                onChange={(e) => setCurrentAnswerRating({ ...currentAnswerRating, feedback: e.target.value })}
                                placeholder="Good job, but..."
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditQuestionDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveQuestionGrade} variant="contained" color="primary">
                        Update Question
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default GradingQueue;
