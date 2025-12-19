import {
    MenuBook as ArticleIcon,
    Check as CheckIcon,
    Assignment as ExerciseIcon,
    Lightbulb as LightbulbIcon,
    TrendingUp as TrendingUpIcon,
    VideoLibrary as VideoIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    LinearProgress,
    Link,
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
import { useParams } from 'react-router-dom';

const LearningPath = () => {
  const { courseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [learningPath, setLearningPath] = useState(null);
  const [course, setCourse] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchLearningPath = async () => {
      try {
        setLoading(true);
        
        // Fetch learning path data
        const learningPathRes = await axios.get(`/api/adaptive-learning/${courseId}`);
        setLearningPath(learningPathRes.data.learningPath);
        
        // Fetch course data
        const courseRes = await axios.get(`/api/courses/${courseId}`);
        setCourse(courseRes.data.course);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching learning path:', err);
        setError(err.response?.data?.message || 'Error loading your learning path');
        setLoading(false);
      }
    };
    
    fetchLearningPath();
  }, [courseId]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getResourceIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'video':
        return <VideoIcon color="primary" />;
      case 'article':
        return <ArticleIcon color="primary" />;
      case 'exercise':
        return <ExerciseIcon color="primary" />;
      default:
        return <ArticleIcon color="primary" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        <Typography variant="body1" gutterBottom>
          Complete an assessment to generate your personalized learning path.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Your Learning Path
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {course?.title}
        </Typography>
      </Box>

      {/* Overview Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">Current Level</Typography>
                <Chip 
                  label={learningPath?.currentLevel?.toUpperCase() || 'Beginner'} 
                  color="primary" 
                  sx={{ mt: 1, fontWeight: 'bold' }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">Overall Progress</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress 
                      variant="determinate" 
                      value={learningPath?.progressHistory?.slice(-1)[0]?.overallProgress || 0} 
                      color="success"
                      size={60}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="body2" component="div" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                        {`${learningPath?.progressHistory?.slice(-1)[0]?.overallProgress || 0}%`}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">Assessments Completed</Typography>
                <Typography variant="h4" color="primary" sx={{ mt: 1 }}>
                  {learningPath?.progressHistory?.reduce((acc, entry) => acc + entry.assessmentsCompleted.length, 0) || 0}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="learning path tabs">
                <Tab label="Recommendations" id="tab-0" />
                <Tab label="Mastered Concepts" id="tab-1" />
                <Tab label="Areas to Improve" id="tab-2" />
              </Tabs>
            </Box>
            
            {/* Recommendations Tab */}
            <Box role="tabpanel" hidden={tabValue !== 0} id="tabpanel-0" sx={{ py: 3 }}>
              {learningPath?.learningRecommendations?.length > 0 ? (
                <Grid container spacing={3}>
                  {learningPath.learningRecommendations.map((recommendation, index) => (
                    <Grid item xs={12} key={index}>
                      <Paper sx={{ p: 2 }}>
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LightbulbIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h6">{recommendation.concept}</Typography>
                          </Box>
                          <Divider />
                        </Box>
                        
                        <Typography variant="subtitle1" gutterBottom>Suggested Resources:</Typography>
                        <List dense>
                          {recommendation.resources.map((resource, resourceIndex) => (
                            <ListItem key={resourceIndex}>
                              <ListItemIcon>
                                {getResourceIcon(resource.type)}
                              </ListItemIcon>
                              <ListItemText 
                                primary={
                                  <Link href={resource.url} target="_blank" rel="noopener">
                                    {resource.title || `${resource.type} resource for ${recommendation.concept}`}
                                  </Link>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                        
                        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Learning Activities:</Typography>
                        <List dense>
                          {recommendation.suggestedActivities.map((activity, activityIndex) => (
                            <ListItem key={activityIndex}>
                              <ListItemIcon>
                                <TrendingUpIcon color="secondary" />
                              </ListItemIcon>
                              <ListItemText primary={activity} />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No recommendations available yet. Complete an assessment to receive personalized recommendations.
                </Alert>
              )}
            </Box>
            
            {/* Mastered Concepts Tab */}
            <Box role="tabpanel" hidden={tabValue !== 1} id="tabpanel-1" sx={{ py: 3 }}>
              {learningPath?.masteredConcepts?.length > 0 ? (
                <Grid container spacing={2}>
                  {learningPath.masteredConcepts.map((concept, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <CheckIcon color="success" sx={{ mr: 1 }} />
                            <Typography variant="h6">{concept.concept}</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Mastery Level:
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={concept.masteryLevel} 
                            color="success" 
                            sx={{ height: 10, borderRadius: 5, mb: 1 }}
                          />
                          <Typography variant="body2" sx={{ textAlign: 'right' }}>
                            {concept.masteryLevel}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Last assessed: {new Date(concept.lastAssessed).toLocaleDateString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">
                  No mastered concepts yet. Complete assessments to track your progress.
                </Alert>
              )}
            </Box>
            
            {/* Areas to Improve Tab */}
            <Box role="tabpanel" hidden={tabValue !== 2} id="tabpanel-2" sx={{ py: 3 }}>
              {learningPath?.weakConcepts?.length > 0 ? (
                <Grid container spacing={2}>
                  {learningPath.weakConcepts.map((concept, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <WarningIcon color="warning" sx={{ mr: 1 }} />
                            <Typography variant="h6">{concept.concept}</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Current Understanding:
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={concept.masteryLevel} 
                            color="warning" 
                            sx={{ height: 10, borderRadius: 5, mb: 2 }}
                          />
                          <Typography variant="body2" sx={{ textAlign: 'right', mb: 1 }}>
                            {concept.masteryLevel}%
                          </Typography>
                          
                          <Typography variant="subtitle2" gutterBottom>Recommended Resources:</Typography>
                          <List dense>
                            {concept.recommendedResources?.map((resource, resourceIndex) => (
                              <ListItem key={resourceIndex} disableGutters>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  {getResourceIcon(resource.resourceType)}
                                </ListItemIcon>
                                <ListItemText 
                                  primary={
                                    <Link href={resource.url} target="_blank" rel="noopener">
                                      {resource.resourceType.charAt(0).toUpperCase() + resource.resourceType.slice(1)} Resource
                                    </Link>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">
                  No areas of improvement identified yet. Complete more assessments for personalized feedback.
                </Alert>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Next Assessment Recommendation */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Recommended Next Steps
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={{ mt: 2 }}
          onClick={() => window.location.href = `/api/adaptive-learning/next-assessment/${courseId}`}
        >
          Take Recommended Assessment
        </Button>
      </Box>
    </>
  );
};

export default LearningPath;