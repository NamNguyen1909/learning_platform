import React, { useState, useEffect } from 'react';
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
import Chat from '@mui/icons-material/Chat';
import School from '@mui/icons-material/School';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import auth from '../services/auth';

const menuItemsByRole = {
  admin: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Quản lý khóa học', icon: <Book />, path: '/courses' },
    { text: 'Quản lý người dùng', icon: <People />, path: '/users' },
    { text: 'AI Tutor', icon: <Chat />, path: '/ai-tutor' },
  ],
  instructor: [
    { text: 'Khóa học của tôi', icon: <Book />, path: '/my-courses' },
    { text: 'Học viên', icon: <People />, path: '/students' },
    { text: 'AI Tutor', icon: <Chat />, path: '/ai-tutor' },
  ],
  learner: [
    { text: 'Trang chủ', icon: <School />, path: '/' },
    { text: 'Khóa học', icon: <Book />, path: '/courses' },
    { text: 'AI Tutor', icon: <Chat />, path: '/ai-tutor' },
  ],
  guest: [
    { text: 'Trang chủ', icon: <School />, path: '/' },
    { text: 'Khóa học', icon: <Book />, path: '/courses' },
    { text: 'AI Tutor', icon: <Chat />, path: '/ai-tutor' },
  ],
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
  const [notifications, setNotifications] = useState(0);

  // Kiểm tra login
  useEffect(() => {
    if (auth?.isAuthenticated()) {
      setUser({ username: 'user', full_name: 'User', email: 'user@email.com', avatar: '' });
      setUserRole('learner');
      setNotifications(2);
    } else {
      setUser(null);
      setUserRole('guest');
      setNotifications(0);
    }
  }, []);

  // Handlers
  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
    handleCloseUserMenu();
  };

  const handleLogout = async () => {
    if (auth) await auth.logout();
    setUser(null);
    setUserRole('guest');
    setNotifications(0);
    handleNavigation('/');
  };

  // Menu tuỳ theo role
  const menuItems = menuItemsByRole[userRole] || menuItemsByRole.guest;

  const userMenuItems = user
    ? [
        { text: 'Hồ sơ', action: () => handleNavigation('/profile') },
        { text: 'Cài đặt', action: () => handleNavigation('/account-settings') },
        { text: 'Đăng xuất', action: handleLogout },
      ]
    : [
        { text: 'Đăng nhập', action: () => handleNavigation('/login') },
        { text: 'Đăng ký', action: () => handleNavigation('/register') },
      ];

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2, color: 'primary.main', fontWeight: 'bold' }}>
        🎓 Smart Learning
      </Typography>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
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
                onClick={() => handleNavigation(item.path)}
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
            {user && (
              <NotificationDropdown
                notificationCount={notifications}
                onNotificationUpdate={setNotifications}
              />
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
            <Menu
              sx={{ mt: '45px' }}
              anchorEl={anchorElUser}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {user && (
                <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #eee' }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {user.full_name || user.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                  <Typography variant="caption" color="primary.main" fontWeight="bold">
                    {userRole.toUpperCase()}
                  </Typography>
                </Box>
              )}
              {userMenuItems.map((item, index) => (
                <MenuItem key={index} onClick={item.action}>
                  <Typography textAlign="center">{item.text}</Typography>
                </MenuItem>
              ))}
            </Menu>
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
