import { Box } from '@mui/material'
import { Route } from 'react-router-dom'
import { BrowserRouter as Router, Routes } from 'react-router-dom';
import theme from './themes/MainTheme';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import Login from './pages/Login';
import Register from './pages/Register';
import InstructorManagement from './pages/InstructorManagement';
import LearnerManagement from './pages/LearnerManagement';
import UserManagement from './pages/UserManagement';
import Header from './components/Header';
import Footer from './components/Footer';

const AppContent = () => {
  return (
  <Box sx={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      <Header />
      <Box sx={{ flex: 1, width: '100%' }}>
        <Routes>
          {/* <Route path="/" element={<Home />} /> */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/instructors-management" element={<InstructorManagement />} />
          <Route path="/learners-management" element={<LearnerManagement />} />
          <Route path="/users-management" element={<UserManagement />} />
        </Routes>
      </Box>
      <Footer />
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