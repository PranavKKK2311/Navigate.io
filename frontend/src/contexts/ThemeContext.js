import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(() => {
        const savedMode = localStorage.getItem('themeMode');
        return savedMode || 'dark';
    });

    const toggleTheme = () => {
        setMode((prevMode) => {
            const newMode = prevMode === 'dark' ? 'light' : 'dark';
            localStorage.setItem('themeMode', newMode);
            return newMode;
        });
    };

    const theme = useMemo(() => {
        return createTheme({
            palette: {
                mode,
                primary: {
                    main: '#EC4899', // Barbie Pink (Pink-500)
                    light: '#F472B6',
                    dark: '#DB2777',
                    contrastText: '#ffffff',
                },
                secondary: {
                    main: '#06B6D4', // Electric Cyan (Cyan-500)
                    light: '#22D3EE',
                    dark: '#0891B2',
                    contrastText: '#ffffff',
                },
                background: {
                    default: mode === 'dark' ? '#1a0b16' : '#FFF0F5', // Deep Pinkish Void vs Lavender Blush
                    paper: mode === 'dark' ? 'rgba(50, 20, 40, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                },
                text: {
                    primary: mode === 'dark' ? '#FDF2F8' : '#831843', // Pink-50 vs Pink-900
                    secondary: mode === 'dark' ? '#FBCFE8' : '#9D174D', // Pink-200 vs Pink-800
                },
                action: {
                    hover: 'rgba(236, 72, 153, 0.15)',
                },
            },
            typography: {
                fontFamily: '"Outfit", sans-serif',
                h1: {
                    fontFamily: '"Space Grotesk", sans-serif',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    background: mode === 'dark'
                        ? 'linear-gradient(to right, #EC4899, #8B5CF6, #06B6D4)'
                        : 'linear-gradient(to right, #BE185D, #7C3AED, #0891B2)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'gradient-x 3s ease infinite',
                    backgroundSize: '200% auto',
                },
                h2: {
                    fontFamily: '"Space Grotesk", sans-serif',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    background: mode === 'dark'
                        ? 'linear-gradient(to right, #F472B6, #A78BFA)'
                        : 'linear-gradient(to right, #DB2777, #8B5CF6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                },
                h3: { fontFamily: '"Space Grotesk", sans-serif' },
                h4: {
                    fontFamily: '"Space Grotesk", sans-serif',
                    fontWeight: 700,
                    color: '#EC4899',
                    letterSpacing: '-0.01em',
                },
                h5: { fontFamily: '"Space Grotesk", sans-serif' },
                h6: { fontFamily: '"Space Grotesk", sans-serif' },
                button: {
                    fontFamily: '"Outfit", sans-serif',
                    fontWeight: 700,
                    textTransform: 'none',
                    letterSpacing: '0.02em',
                },
            },
            shape: {
                borderRadius: 24,
            },
            components: {
                MuiCssBaseline: {
                    styleOverrides: {
                        body: {
                            backgroundImage: mode === 'dark'
                                ? 'radial-gradient(circle at 20% 40%, rgba(236, 72, 153, 0.25), transparent 40%), radial-gradient(circle at 80% 60%, rgba(6, 182, 212, 0.2), transparent 40%)'
                                : 'radial-gradient(circle at 20% 40%, rgba(251, 207, 232, 0.4), transparent 40%), radial-gradient(circle at 80% 60%, rgba(165, 243, 252, 0.4), transparent 40%)',
                            backgroundAttachment: 'fixed',
                            scrollbarWidth: 'thin',
                            '&::-webkit-scrollbar': {
                                width: '10px',
                            },
                            '&::-webkit-scrollbar-track': {
                                background: mode === 'dark' ? '#1a0b16' : '#FFF0F5',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                backgroundColor: '#EC4899',
                                borderRadius: '20px',
                                border: mode === 'dark' ? '2px solid #1a0b16' : '2px solid #FFF0F5',
                            },
                        },
                    },
                },
                MuiButton: {
                    styleOverrides: {
                        root: {
                            borderRadius: 50,
                            padding: '12px 30px',
                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            '&:hover': {
                                transform: 'scale(1.05) translateY(-2px)',
                                boxShadow: '0 0 20px rgba(236, 72, 153, 0.5)',
                            },
                        },
                        containedPrimary: {
                            background: 'linear-gradient(45deg, #EC4899, #8B5CF6)',
                            boxShadow: '0 4px 15px rgba(236, 72, 153, 0.4)',
                        },
                        containedSecondary: {
                            background: 'linear-gradient(45deg, #06B6D4, #3B82F6)',
                            color: '#ffffff',
                        },
                    },
                },
                MuiCard: {
                    styleOverrides: {
                        root: {
                            backdropFilter: 'blur(16px)',
                            background: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.6)',
                            border: '1px solid rgba(236, 72, 153, 0.2)',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            '&:hover': {
                                transform: 'translateY(-8px) scale(1.01)',
                                boxShadow: '0 20px 40px -10px rgba(236, 72, 153, 0.3)',
                                borderColor: '#EC4899',
                            },
                        },
                    },
                },
                MuiPaper: {
                    styleOverrides: {
                        root: {
                            backgroundImage: 'none',
                            backgroundColor: mode === 'dark' ? 'rgba(50, 20, 40, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                        },
                    },
                },
                MuiAppBar: {
                    styleOverrides: {
                        root: {
                            backdropFilter: 'blur(20px)',
                            backgroundColor: mode === 'dark' ? 'rgba(26, 11, 22, 0.7)' : 'rgba(255, 240, 245, 0.8)',
                            borderBottom: '1px solid rgba(236, 72, 153, 0.2)',
                            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)',
                            color: mode === 'dark' ? '#fff' : '#831843',
                        },
                    },
                },
            },
        });
    }, [mode]);

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme }}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};
