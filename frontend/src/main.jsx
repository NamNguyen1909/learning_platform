import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from '@mui/material/styles';
import theme from './themes/MainTheme';
import authUtils from './services/auth';

// Bootstrap the single authoritative JWT refresh interceptor.
// Must be called once before any API requests are made.
authUtils.setupInterceptors();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </StrictMode>
);
