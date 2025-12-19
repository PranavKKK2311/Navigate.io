import axios from 'axios';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Function to refresh access token
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) return false;

    try {
      const response = await axios.post('/api/auth/refresh-token', { refreshToken });
      const newToken = response.data.token;

      // Update access token
      localStorage.setItem('token', newToken);
      setToken(newToken);
      return true;
    } catch (err) {
      console.error('Failed to refresh token:', err);
      // Clear tokens on refresh failure
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setRefreshToken(null);
      setCurrentUser(null);
      setError('Your session has expired. Please log in again.');
      return false;
    }
  }, [refreshToken]);

  // Setup axios interceptor for handling token expiration
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      async (error) => {
        const originalRequest = error.config;

        // If error is 401 and not from a refresh token request
        if (error.response && error.response.status === 401 &&
          !originalRequest._retry && refreshToken) {
          originalRequest._retry = true;

          // Attempt to refresh the token
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            // Retry the original request with the new token
            originalRequest.headers['x-auth-token'] = localStorage.getItem('token');
            return axios(originalRequest);
          }
        }

        // If token refresh didn't work or error is a different type
        if (error.response && error.response.status === 401) {
          if (localStorage.getItem('token') || localStorage.getItem('refreshToken')) {
            console.log('Authentication error - logging out');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            setToken(null);
            setRefreshToken(null);
            setCurrentUser(null);
            setError('Your session has expired. Please log in again.');
          }
        }
        return Promise.reject(error);
      }
    );

    // Clean up interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [refreshToken, refreshAccessToken]);
  // Function to register a new user
  const register = async (name, email, password, role = 'student') => {
    try {
      setError('');
      const response = await axios.post('/api/auth/register', {
        name,
        email,
        password,
        role
      });

      const { token: authToken, refreshToken: authRefreshToken, user } = response.data;

      // Save tokens to localStorage and state
      localStorage.setItem('token', authToken);
      localStorage.setItem('refreshToken', authRefreshToken);
      localStorage.setItem('userRole', user.role); // Store role separately for direct access
      setToken(authToken);
      setRefreshToken(authRefreshToken);
      setCurrentUser(user);
      localStorage.setItem('token', authToken);
      localStorage.setItem('refreshToken', authRefreshToken);
      setToken(authToken);
      setRefreshToken(authRefreshToken);
      setCurrentUser(user);

      return user;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      throw new Error(message);
    }
  };
  // Function to login
  const login = async (email, password) => {
    try {
      setError('');
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      const { token: authToken, refreshToken: authRefreshToken, user } = response.data;

      // Save tokens to localStorage and state
      localStorage.setItem('token', authToken);
      localStorage.setItem('refreshToken', authRefreshToken);
      localStorage.setItem('userRole', user.role); // Store role separately for direct access
      setToken(authToken);
      setRefreshToken(authRefreshToken);
      setCurrentUser(user);

      return user;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      throw new Error(message);
    }
  };

  // Function to logout
  const logout = async () => {
    try {
      // Send logout request to invalidate refresh token on server
      if (refreshToken) {
        await axios.post('/api/auth/logout', { refreshToken });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clean up local storage and state regardless of server response
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole'); // Also remove user role
      setToken(null);
      setRefreshToken(null);
      setCurrentUser(null);
    }
  };

  // Configure axios to use the token for all requests
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
    }
  }, [token]);
  // Load user data on app startup
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('/api/auth/me');
        setCurrentUser(res.data.user);

        // Also store the user role in localStorage for direct access
        if (res.data.user && res.data.user.role) {
          localStorage.setItem('userRole', res.data.user.role);
        }
      } catch (err) {
        console.error('Error loading user', err);
        // Error will be handled by the interceptor
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Context values to be provided
  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    refreshAccessToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};