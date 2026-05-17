import React, { useState, useEffect, useCallback } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Dashboard from '@mui/icons-material/Dashboard';
import Book from '@mui/icons-material/Book';
import People from '@mui/icons-material/People';
import School from '@mui/icons-material/School';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import auth from '../services/auth';
import { getUnreadNotifications } from '../services/apis';
import { useUnreadNotificationsPolling } from '../hooks/useSmartPolling';
import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import useNotification from '../hooks/useNotification';

const fullMenuItemsByRole = {
  admin: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Quản lý khóa học', icon: <Book />, path: '/courses' },
    { text: 'Danh sách khóa học', icon: <Book />, path: '/courses' },
    { text: 'Quản lý người dùng', icon: <People />, path: '/users-management' },
    { text: 'Quản lý giảng viên', icon: <School />, path: '/instructors-management' },
    { text: 'Quản lý học viên', icon: <People />, path: '/learners-management' },
    { text: 'Quản lý trung tâm', icon: <School />, path: '/centers-management' },
    { text: 'Thống kê hệ thống', icon: <Dashboard />, path: '/statistics' },
    { text: 'Django Admin', icon: <AdminPanelSettings />, path: `${import.meta.env.VITE_API_URL}/admin`, external: true },
  ],
  center: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Danh sách khóa học', icon: <Book />, path: '/courses' },
    { text: 'Quản lý giảng viên', icon: <School />, path: '/instructors-management' },
    { text: 'Quản lý học viên', icon: <People />, path: '/learners-management' },
    { text: 'Thống kê hệ thống', icon: <Dashboard />, path: '/statistics' },
  ],
  instructor: [
    { text: 'Danh sách khóa học', icon: <Book />, path: '/courses' },
    { text: 'Khóa học của tôi', icon: <Book />, path: '/my-courses' },
    { text: 'Học viên', icon: <People />, path: '/students' },
  ],
  learner: [
    { text: 'Trang chủ', icon: <School />, path: '/' },
    { text: 'Khóa học', icon: <Book />, path: '/courses' },
    { text: 'Khóa học của tôi', icon: <Book />, path: '/my-coursesprogress' },
  ],
  guest: [
    { text: 'Trang chủ', icon: <School />, path: '/' },
    { text: 'Khóa học', icon: <Book />, path: '/courses' },
  ],
};

const menuItemsByRole = {
  admin: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  ],
  center: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  ],
  instructor: fullMenuItemsByRole.instructor,
  learner: fullMenuItemsByRole.learner,
  guest: fullMenuItemsByRole.guest,
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorElUser, setAnchorElUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('guest');

  // WS real-time notifications (array of notification objects)
  const wsNotifications = useNotification();

  // HTTP-polled unread count (integer badge)
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadNotifications();
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error);
      setUnreadCount(0);
    }
  };

  // Kiểm tra login và lấy user info thực tế
  useEffect(() => {
    const fetchUser = async () => {
      if (auth?.isAuthenticated()) {
        const userInfo = await auth.getCurrentUser(true);
        if (userInfo) {
          setUser(userInfo);
          setUserRole(userInfo.role || 'learner');
          await fetchUnreadCount();
        } else {
          setUser(null);
          setUserRole('guest');
          setUnreadCount(0);
        }
      } else {
        setUser(null);
        setUserRole('guest');
        setUnreadCount(0);
      }
    };
    fetchUser();
    window.addEventListener('authChanged', fetchUser);
    return () => window.removeEventListener('authChanged', fetchUser);
  }, []);

  // Smart polling for unread notifications - every 30 seconds when user is authenticated
  useUnreadNotificationsPolling(fetchUnreadCount, !!user);

  // Handlers
  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleNavigation = (path, external = false) => {
    if (external) {
      window.open(path, '_blank');
    } else {
      navigate(path);
      setMobileOpen(false);
      handleCloseUserMenu();
    }
  };

  const handleLogout = async () => {
    if (auth) await auth.logout();
    setUser(null);
    setUserRole('guest');
    setUnreadCount(0);
    handleNavigation('/');
  };

  // Menu tuỳ theo role
  const menuItems = menuItemsByRole[userRole] || menuItemsByRole.guest;

  const userMenuItems = user
    ? [
        { text: 'Hồ sơ', action: () => handleNavigation('/profile') },
        { text: 'Cài đặt', action: () => handleNavigation('/account-settings') },
        ...(userRole === 'admin' ? [{ text: 'Django Admin', action: () => window.open(`${import.meta.env.VITE_API_URL}/admin`, '_blank') }] : []),
        { text: 'Đăng xuất', action: handleLogout },
      ]
    : [
        { text: 'Đăng nhập', action: () => handleNavigation('/login') },
        { text: 'Đăng ký', action: () => handleNavigation('/register') },
      ];

  const drawerMenuItems = fullMenuItemsByRole[userRole] || fullMenuItemsByRole.guest;

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2, color: 'primary.main', fontWeight: 'bold' }}>
        🎓 Smart Learning
      </Typography>
      <Divider />
      <List>
        {drawerMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path, item.external)}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  '&:hover': { backgroundColor: 'primary.main' },
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" elevation={2} sx={{ width: '100%' ,padding: '0 32px' }}>
        <Toolbar disableGutters sx={{ width: '100%' }}>
          {/* Logo desktop */}
          <Typography
            variant="h6"
            noWrap
            onClick={() => handleNavigation('/')}
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              cursor: 'pointer',
              color: 'inherit',
            }}
          >
            🎓 Smart Learning
          </Typography>

          {/* Nút menu mobile */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton size="large" onClick={handleDrawerToggle} color="inherit">
              <MenuIcon />
            </IconButton>
          </Box>

          {/* Logo mobile */}
          <Typography
            variant="h5"
            noWrap
            onClick={() => handleNavigation('/')}
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontWeight: 700,
              cursor: 'pointer',
              color: 'inherit',
            }}
          >
            🎓 Learning
          </Typography>

          {/* Menu desktop */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {menuItems.map((item) => (
              <Button
                key={item.text}
                onClick={() => handleNavigation(item.path, item.external)}
                startIcon={item.icon}
                sx={{
                  my: 2,
                  mx: 1,
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 500,
                  backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                }}
              >
                {item.text}
              </Button>
            ))}
          </Box>

          {/* Account + Notification */}
          <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}>
            {user && wsNotifications.length > 0 && (
              <Menu
                sx={{ mt: '45px' }}
                anchorEl={anchorElUser}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                {wsNotifications.map((notification, index) => (
                  <MenuItem key={notification.notification_id ?? index}>
                    <Typography variant="body2" color="text.primary">
                      {notification.message}
                    </Typography>
                  </MenuItem>
                ))}
              </Menu>
            )}
            <Tooltip title="Tài khoản">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                {user?.avatar ? (
                  <Avatar alt={user.username} src={user.avatar} />
                ) : (
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    {user?.full_name?.charAt(0)?.toUpperCase() || <AccountCircle />}
                  </Avatar>
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
            background: 'linear-gradient(145deg, #ffffff 0%, #f7fafd 100%)',
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Header;
