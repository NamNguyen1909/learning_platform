import { Box } from '@mui/material'
import { Route, useLocation, useNavigate, BrowserRouter as Router, Routes } from 'react-router-dom';
import React, { useEffect } from 'react';
import theme from './themes/MainTheme';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import Login from './pages/Login';
import Register from './pages/Register';
import CenterManagement from './pages/CenterManagement';
import InstructorManagement from './pages/InstructorManagement';
import LearnerManagement from './pages/LearnerManagement';
import UserManagement from './pages/UserManagement';
import Header from './components/Header';
import Footer from './components/Footer';
import Profile from './pages/Profile';
import MyCoursesProgress from './pages/MyCoursesProgress';
import Home from './pages/Home';
import Statistics from './pages/Statistics';
import Dashboard from './pages/Dashboard';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import CoursePayment from './pages/CoursePayment';
import PaymentResult from './pages/PaymentResult';
import MyCourses from './pages/MyCourses';
import DocumentViewer from './pages/DocumentViewer';

// Custom hook: lấy access/refresh token từ URL sau khi social login
function useSocialAuthToken() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const access = params.get("access");
    const refresh = params.get("refresh");
    if (access && refresh) {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      // Xóa token khỏi URL
      navigate("/", { replace: true });
      // Có thể gọi hàm loadUserInfo() hoặc setAuthState(true) ở đây nếu có
    }
  }, [location, navigate]);
}

const AppContent = () => {
  useSocialAuthToken();
  return (
  <Box sx={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      <Header />
      <Box sx={{ flex: 1, width: '100%' }}>
          <Routes>
            <>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/courses" element={<CourseList />} />
                <Route path="/courses/:id" element={<CourseDetail />} />
                <Route path="/course-payment/:id" element={<CoursePayment />} />
                <Route path="/courses/:id/payment" element={<CoursePayment />} />
                <Route path="/payment/result" element={<PaymentResult />} />
                <Route path="/my-courses" element={<MyCourses />} />
                <Route path="/my-coursesprogress" element={<MyCoursesProgress />} />
                <Route path="/documents/:id" element={<DocumentViewer />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/instructors-management" element={<InstructorManagement />} />
                <Route path="/learners-management" element={<LearnerManagement />} />
                <Route path="/users-management" element={<UserManagement />} />
                <Route path="/centers-management" element={<CenterManagement />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/statistics" element={<Statistics />} />
            </>
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