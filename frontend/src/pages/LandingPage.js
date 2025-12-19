import React from 'react';
import { Box, Button, Container, Grid, Typography, Paper, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import { keyframes } from '@emotion/react';

// Animations
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
`;

const LandingPage = () => {
  const theme = useTheme();

  return (
    <Box sx={{ bgcolor: '#1a0b16', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          py: 12,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, rgba(26, 11, 22, 0) 70%)',
            borderRadius: '50%',
            zIndex: 0,
            animation: `${float} 6s ease-in-out infinite`
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '-10%',
            left: '-10%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, rgba(26, 11, 22, 0) 70%)',
            borderRadius: '50%',
            zIndex: 0,
            animation: `${float} 8s ease-in-out infinite reverse`
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h1"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '3rem', md: '4.5rem' },
                  background: 'linear-gradient(45deg, #EC4899 30%, #06B6D4 90%)',
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2
                }}
              >
                Navigate.io
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: '#fb7185', // lighter pink
                  mb: 3,
                  fontWeight: 500,
                  letterSpacing: '1px'
                }}
              >
                AI-POWERED ASSESSMENT & ADAPTIVE LEARNING
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'grey.400',
                  mb: 5,
                  fontSize: '1.2rem',
                  lineHeight: 1.8
                }}
              >
                Revolutionize education with personalized learning paths,
                intelligent assessments, and data-driven insights.
                Experience the future of learning in style.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: '#EC4899',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    borderRadius: '50px',
                    boxShadow: '0 0 20px rgba(236, 72, 153, 0.5)',
                    '&:hover': {
                      bgcolor: '#be185d',
                      transform: 'scale(1.05)',
                      boxShadow: '0 0 30px rgba(236, 72, 153, 0.8)',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  Get Started
                </Button>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: '#06B6D4',
                    color: '#06B6D4',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    borderRadius: '50px',
                    borderWidth: '2px',
                    '&:hover': {
                      borderColor: '#22d3ee',
                      color: '#22d3ee',
                      bgcolor: 'rgba(6, 182, 212, 0.1)',
                      transform: 'scale(1.05)',
                      boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  Log In
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 350,
                }}
              >
                {/* Decorative gradient orbs */}
                <Box
                  sx={{
                    position: 'absolute',
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(236, 72, 153, 0.6) 0%, rgba(236, 72, 153, 0) 70%)',
                    animation: `${float} 4s ease-in-out infinite`,
                    top: '10%',
                    right: '20%',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    width: 250,
                    height: 250,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(6, 182, 212, 0.5) 0%, rgba(6, 182, 212, 0) 70%)',
                    animation: `${float} 5s ease-in-out infinite reverse`,
                    bottom: '15%',
                    left: '15%',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(168, 85, 247, 0) 70%)',
                    animation: `${float} 6s ease-in-out infinite`,
                    top: '40%',
                    left: '30%',
                  }}
                />
                {/* Logo text */}
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '4rem', md: '6rem' },
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #EC4899 0%, #06B6D4 50%, #A855F7 100%)',
                    backgroundClip: 'text',
                    textFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 80px rgba(236, 72, 153, 0.5)',
                    letterSpacing: '-0.02em',
                    zIndex: 1,
                  }}
                >
                  N
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 10, position: 'relative', zIndex: 1 }}>
        <Typography
          variant="h3"
          component="h2"
          align="center"
          gutterBottom
          sx={{
            color: 'white',
            fontWeight: 'bold',
            textShadow: '0 0 20px rgba(236, 72, 153, 0.5)',
            mb: 2
          }}
        >
          Key Features
        </Typography>
        <Typography
          variant="h6"
          align="center"
          sx={{ color: 'grey.400', mb: 8, maxWidth: '800px', mx: 'auto' }}
        >
          A comprehensive suite of tools designed to enhance the educational experience
        </Typography>

        <Grid container spacing={4}>
          {[
            {
              icon: <SchoolIcon sx={{ fontSize: 50, color: '#EC4899' }} />,
              title: "AI-Powered Assessment",
              desc: "Create, administer, and grade assessments with intelligent AI assistance.",
              gradient: "linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(26, 11, 22, 0.4) 100%)",
              border: "#EC4899"
            },
            {
              icon: <AutoGraphIcon sx={{ fontSize: 50, color: '#06B6D4' }} />,
              title: "Adaptive Learning Paths",
              desc: "Personalized learning journeys that adapt to each student's unique strengths.",
              gradient: "linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(26, 11, 22, 0.4) 100%)",
              border: "#06B6D4"
            },
            {
              icon: <AssessmentIcon sx={{ fontSize: 50, color: '#A855F7' }} />,
              title: "Expert Feedback Panel",
              desc: "Receive comprehensive feedback from AI-simulated subject matter experts.",
              gradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(26, 11, 22, 0.4) 100%)",
              border: "#A855F7"
            }
          ].map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 5,
                  height: '100%',
                  borderRadius: 4,
                  background: feature.gradient,
                  border: '1px solid',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.4s ease',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    borderColor: feature.border,
                    boxShadow: `0 10px 40px ${feature.border}33`
                  }
                }}
              >
                <Box sx={{ mb: 3 }}>{feature.icon}</Box>
                <Typography variant="h5" component="h3" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body1" sx={{ color: 'grey.400' }}>
                  {feature.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Call to Action */}
      <Box sx={{ py: 10, position: 'relative', overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #1a0b16 0%, #290f23 50%, #1a0b16 100%)',
            zIndex: 0
          }}
        />
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(to right, #fff, #fb7185)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Ready to transform your educational experience?
          </Typography>
          <Typography variant="h6" paragraph sx={{ mb: 5, color: 'grey.400' }}>
            Join Navigate today and discover a new approach to teaching and learning.
          </Typography>
          <Button
            component={RouterLink}
            to="/register"
            variant="contained"
            size="large"
            sx={{
              bgcolor: 'white',
              color: '#EC4899',
              px: 6,
              py: 2,
              borderRadius: '50px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: '#fce7f3',
                transform: 'scale(1.05)',
                boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)'
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            Create an Account
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: '#0f050d', // even darker
          color: 'white',
          py: 6,
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom sx={{ color: '#EC4899', fontWeight: 'bold' }}>
                Navigate
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.500' }}>
                AI-Powered Assessment & Adaptive Learning Platform
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                Quick Links
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', pl: 0 }}>
                {[
                  { text: 'Log In', to: '/login' },
                  { text: 'Register', to: '/register' }
                ].map((item, idx) => (
                  <Box component="li" key={idx} sx={{ mb: 1 }}>
                    <Button
                      component={RouterLink}
                      to={item.to}
                      sx={{
                        color: 'grey.400',
                        p: 0,
                        minWidth: 0,
                        '&:hover': { color: '#06B6D4' }
                      }}
                    >
                      {item.text}
                    </Button>
                  </Box>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                Contact
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.500' }}>
                support@navigate-learning.com
              </Typography>
            </Grid>
          </Grid>
          <Box sx={{ mt: 6, textAlign: 'center', pt: 4, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Typography variant="body2" sx={{ color: 'grey.600' }}>
              © {new Date().getFullYear()} Navigate. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
