import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActionArea, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Book from '@mui/icons-material/Book';
import People from '@mui/icons-material/People';
import School from '@mui/icons-material/School';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Chat from '@mui/icons-material/Chat';
import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import auth from '../services/auth';

const adminMenuItems = [
  { text: 'Quản lý khóa học', icon: <Book />, path: '/courses' },
  { text: 'Danh sách khóa học', icon: <Book />, path: '/courses' },
  { text: 'Quản lý người dùng', icon: <People />, path: '/users-management' },
  { text: 'Quản lý giảng viên', icon: <School />, path: '/instructors-management' },
  { text: 'Quản lý học viên', icon: <People />, path: '/learners-management' },
  { text: 'Quản lý trung tâm', icon: <School />, path: '/centers-management' },
  { text: 'Thống kê hệ thống', icon: <DashboardIcon />, path: '/statistics' },
  { text: 'Django Admin', icon: <AdminPanelSettings />, path: `${import.meta.env.VITE_API_URL}/admin`, external: true },
];

const centerMenuItems = [
  { text: 'Danh sách khóa học', icon: <Book />, path: '/courses' },
  { text: 'Quản lý giảng viên', icon: <School />, path: '/instructors-management' },
  { text: 'Quản lý học viên', icon: <People />, path: '/learners-management' },
  { text: 'Thống kê hệ thống', icon: <DashboardIcon />, path: '/statistics' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('guest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const userInfo = await auth.getCurrentUser(true);
      if (userInfo && userInfo.role) {
        setUserRole(userInfo.role);
      } else {
        setUserRole('guest');
      }
      setLoading(false);
    };
    fetchUserRole();
  }, []);

  if (loading) {
    return null; // or a loading spinner if preferred
  }

  const menuItems = userRole === 'admin' ? adminMenuItems : userRole === 'center' ? centerMenuItems : [];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Navigation
      </Typography>
      <Grid container spacing={3}>
        {menuItems.map((item) => (
          <Grid size={{xs:12, sm: 6, md: 4}} key={item.text}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardActionArea
                onClick={() => {
                  if (item.external) {
                    window.open(item.path, '_blank');
                  } else {
                    navigate(item.path);
                  }
                }}
                sx={{ height: '100%', display: 'flex', alignItems: 'flex-start', p: 2 }}
              >
                <CardContent sx={{ p: 0, display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ mr: 2, color: 'primary.main' }}>
                    {item.icon}
                  </Box>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
                    {item.text}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
        {menuItems.length === 0 && (
          <Box sx={{ mt: 2, width: '100%' }}>
            <Typography variant="body1" align="center">
              No additional navigation items available.
            </Typography>
          </Box>
        )}
      </Grid>
    </Container>
  );
};

export default Dashboard;
