import { useState } from 'react'
import './App.css'
import { Box } from '@mui/material'
import { Route } from 'react-router-dom'
import { BrowserRouter as Router, Routes } from 'react-router-dom';
import theme from './themes/MainTheme';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import Login from './pages/Login';
import Register from './pages/Register';

const AppContent = () => {

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      bgcolor: 'background.default',
    }}>
      <Box sx={{ flex: 1 }}>
        <Routes>
          {/* <Route path="/" element={<Home />} /> */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Box>
    </Box>
  )
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App
