import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/index.css';

// Configure axios base URL for production
// REACT_APP_API_URL should be just the domain, e.g., https://navigate-io.onrender.com
const apiUrl = process.env.REACT_APP_API_URL || '';
// Remove trailing /api if present since routes already include /api
axios.defaults.baseURL = apiUrl.replace(/\/api$/, '');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);