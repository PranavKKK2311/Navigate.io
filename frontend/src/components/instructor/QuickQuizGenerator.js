import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Spinner, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';

const QuickQuizGenerator = ({ onNavigateToPatternSelector }) => {
  const [selectedSyllabusId, setSelectedSyllabusId] = useState('');
  const [syllabusOptions, setSyllabusOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [error, setError] = useState(null);
  const [iterationHistory, setIterationHistory] = useState([]);
  const [showIterationModal, setShowIterationModal] = useState(false);
  const [iterationFeedback, setIterationFeedback] = useState('');
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  
  // Quiz parameter state
  const [quizParameters, setQuizParameters] = useState({
    questionCount: 10,
    difficulty: 'medium',
    timeLimit: 15,
    questionTypes: ['multiple-choice', 'true-false', 'short-answer']
  });

  useEffect(() => {
    // Load available syllabi
    const fetchSyllabi = async () => {
      try {
        const response = await axios.get('/api/assessment/syllabus/list');
        if (response.data.success) {
          setSyllabusOptions(response.data.syllabi);
        }
      } catch (error) {
        console.error('Error fetching syllabi:', error);
        setError('Failed to load syllabi. Please try again later.');
      }
    };

    fetchSyllabi();
  }, []);

  const handleSyllabusChange = (e) => {
    setSelectedSyllabusId(e.target.value);
  };

  const handleQuizParameterChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle checkbox for question types
    if (type === 'checkbox') {
      const updatedTypes = [...quizParameters.questionTypes];
      const index = updatedTypes.indexOf(name);
      
      if (checked && index === -1) {
        updatedTypes.push(name);
      } else if (!checked && index !== -1) {
        updatedTypes.splice(index, 1);
      }
      setQuizParameters({ ...quizParameters, questionTypes: updatedTypes });
    } else {
      // Handle other inputs
      setQuizParameters({ 
        ...quizParameters, 
        [name]: type === 'number' ? parseInt(value, 10) : value 
      });
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedSyllabusId) {
      toast.warn('Please select a syllabus first');
      return;
    }

    // Ensure at least one question type is selected
    if (quizParameters.questionTypes.length === 0) {
      toast.warn('Please select at least one question type');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedQuiz(null);
    setTimeoutWarning(false);
    // Reset iteration history when generating a new quiz
    setIterationHistory([]);

    // Set a timeout warning if generation takes too long
    const timeoutId = setTimeout(() => {
      setTimeoutWarning(true);
    }, 15000); // 15 seconds

    try {
      // First get the syllabus analysis
      const syllabusResponse = await axios.get(`/api/assessment/syllabus/${selectedSyllabusId}`);
      
      if (!syllabusResponse.data.success || !syllabusResponse.data.syllabusAnalysis) {
        throw new Error('Failed to retrieve syllabus analysis');
      }
      
      const syllabusAnalysis = syllabusResponse.data.syllabusAnalysis;
      
      // Format the pattern based on the quiz parameters for consistent pattern-based generation
      const quizPattern = {
        name: "Quick Quiz",
        description: `A ${quizParameters.difficulty} difficulty quiz with ${quizParameters.questionCount} questions`,
        structure: quizParameters.questionTypes.map(type => {
          // Calculate count per type - distribute questions evenly among selected types
          const count = Math.ceil(quizParameters.questionCount / quizParameters.questionTypes.length);
          return {
            questionType: formatQuestionType(type),  // Format to match backend expectations
            count: count,
            pointsPerQuestion: 1
          };
        }),
        totalPoints: quizParameters.questionCount,
        estimatedTime: quizParameters.timeLimit,
        difficulty: quizParameters.difficulty,
        isQuickQuiz: true
      };

      // Generate quiz using the pattern-based approach
      const response = await axios.post('/api/assessment/generate-questions', {
        syllabusAnalysis: syllabusAnalysis,
        pattern: quizPattern
      });

      clearTimeout(timeoutId);
      
      if (response.data.success) {
        setGeneratedQuiz(response.data.assessment);
        toast.success('Quiz generated successfully!');
      } else {
        setError(response.data.message || 'Failed to generate quiz');
        toast.error('Failed to generate quiz');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      setError(error.response?.data?.message || error.message || 'Failed to generate quiz');
      toast.error(error.response?.data?.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
      clearTimeout(timeoutId);
    }
  };

  // Helper function to format question type
  const formatQuestionType = (type) => {
    switch(type) {
      case 'multiple-choice': return 'Multiple Choice';
      case 'true-false': return 'True/False';
      case 'short-answer': return 'Short Answer';
      default: return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };

  const handleIterateQuizModal = () => {
    setShowIterationModal(true);
  };

  const handleIterationFeedbackChange = (e) => {
    setIterationFeedback(e.target.value);
  };

  const handleIterateQuiz = async () => {
    if (!iterationFeedback.trim()) {
      toast.warn('Please provide some feedback for improvement');
      return;
    }
    
    setLoading(true);
    
    try {
      // Add current quiz to history before iteration
      setIterationHistory(prev => [...prev, {...generatedQuiz}]);
      
      const response = await axios.post('/api/assessment/iterate-quiz', {
        syllabusId: selectedSyllabusId,
        currentQuiz: generatedQuiz,
        feedback: iterationFeedback,
        parameters: quizParameters
      });
      
      if (response.data.success) {
        setGeneratedQuiz(response.data.iteratedQuiz);
        setShowIterationModal(false);
        setIterationFeedback('');
        toast.success('Quiz improved successfully!');
      } else {
        toast.error('Failed to improve quiz. Please try again.');
      }
    } catch (error) {
      console.error('Error iterating quiz:', error);
      toast.error('Failed to improve quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUndoIteration = () => {
    if (iterationHistory.length === 0) {
      toast.info('No previous versions available');
      return;
    }
    
    // Get the last quiz from history
    const previousQuiz = iterationHistory[iterationHistory.length - 1];
    
    // Remove it from history
    setIterationHistory(prev => prev.slice(0, -1));
    
    // Set it as the current quiz
    setGeneratedQuiz(previousQuiz);
    toast.info('Reverted to previous version');
  };

  return (
    <div>
      <h2>Quick Quiz Generator</h2>
      <Form>
        <Form.Group>
          <Form.Label>Select Syllabus</Form.Label>
          <Form.Control as="select" value={selectedSyllabusId} onChange={handleSyllabusChange}>
            <option value="">-- Select a syllabus --</option>
            {syllabusOptions.map(syllabus => (
              <option key={syllabus.id} value={syllabus.id}>
                {syllabus.name}
              </option>
            ))}
          </Form.Control>
        </Form.Group>
        <Form.Group>
          <Form.Label>Number of Questions</Form.Label>
          <Form.Control 
            type="number" 
            name="questionCount" 
            value={quizParameters.questionCount} 
            onChange={handleQuizParameterChange} 
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Difficulty</Form.Label>
          <Form.Control 
            as="select" 
            name="difficulty" 
            value={quizParameters.difficulty} 
            onChange={handleQuizParameterChange}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Form.Control>
        </Form.Group>
        <Form.Group>
          <Form.Label>Time Limit (minutes)</Form.Label>
          <Form.Control 
            type="number" 
            name="timeLimit" 
            value={quizParameters.timeLimit} 
            onChange={handleQuizParameterChange} 
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Question Types</Form.Label>
          <div>
            <Form.Check 
              type="checkbox" 
              label="Multiple Choice" 
              name="multiple-choice" 
              checked={quizParameters.questionTypes.includes('multiple-choice')} 
              onChange={handleQuizParameterChange} 
            />
            <Form.Check 
              type="checkbox" 
              label="True/False" 
              name="true-false" 
              checked={quizParameters.questionTypes.includes('true-false')} 
              onChange={handleQuizParameterChange} 
            />
            <Form.Check 
              type="checkbox" 
              label="Short Answer" 
              name="short-answer" 
              checked={quizParameters.questionTypes.includes('short-answer')} 
              onChange={handleQuizParameterChange} 
            />
          </div>
        </Form.Group>
        <Button onClick={handleGenerateQuiz} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Quiz'}
        </Button>
      </Form>
      {timeoutWarning && <Alert variant="warning">Quiz generation is taking longer than expected...</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      {generatedQuiz && (
        <Card>
          <Card.Body>
            <h5>{generatedQuiz.title}</h5>
            <p>{generatedQuiz.description}</p>
            <Button onClick={handleIterateQuizModal}>Improve Quiz</Button>
            <Button onClick={handleUndoIteration}>Undo</Button>
          </Card.Body>
        </Card>
      )}
      <Modal show={showIterationModal} onHide={() => setShowIterationModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Improve Quiz</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Feedback</Form.Label>
            <Form.Control 
              as="textarea" 
              value={iterationFeedback} 
              onChange={handleIterationFeedbackChange} 
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setShowIterationModal(false)}>Cancel</Button>
          <Button onClick={handleIterateQuiz}>Submit</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default QuickQuizGenerator;