import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Chip,
  Paper,
  CircularProgress,
  IconButton as MuiIconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive,
  Circle,
  CheckCircle,
  Info,
  Warning,
  Error,
  MarkEmailRead,
  Delete,
  AccessTime,
  Refresh,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import api, { fetchNotifications, markNotificationAsRead, markAllAsRead, getUnreadNotifications, deleteUserNotification } from '../services/apis';

const NotificationDropdown = ({ notificationCount, onNotificationUpdate, onRefreshUnreadCount }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  
  // Refs for infinite scroll
  const scrollContainerRef = useRef(null);
  const loadingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  const open = Boolean(anchorEl);

  // Cleanup timeout on unmount or close
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Mở dropdown notifications
  const handleClick = async (event) => {
    setAnchorEl(event.currentTarget);
    if (!open) {
      await loadNotifications(true); // Reset và fetch page đầu
    }
  };

  // Đóng dropdown
  const handleClose = () => {
    setAnchorEl(null);
    // Clear any pending scroll timeout when closing
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
  };

  // Fetch notifications từ API
  const loadNotifications = useCallback(async (reset = false) => {
    if (loadingRef.current) {
      return; // Prevent duplicate calls
    }

    loadingRef.current = true;
    setLoading(true);

    try {
      const currentPage = reset ? 1 : page;
      const response = await fetchNotifications(currentPage, 5);

      const newNotifications = response.results || [];

      if (reset) {
        setNotifications(newNotifications);
        setPage(2);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
        setPage(prev => prev + 1);
      }

      // Check hasMore using next field (more reliable than total_pages)
      const hasNextPage = response.next ? true : false;
      setHasMore(hasNextPage);

      // Cập nhật số lượng unread
      if (onNotificationUpdate) {
        // The response may not have unread_count, so fetch it explicitly
        const unreadResponse = await getUnreadNotifications();
        onNotificationUpdate(unreadResponse.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setHasMore(false); // Stop loading on error
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [page, onNotificationUpdate]);

  // Handle scroll event for infinite loading with throttling
  const handleScroll = useCallback((e) => {
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set new timeout for throttling
    scrollTimeoutRef.current = setTimeout(() => {
      const target = e.target;
      const { scrollTop, scrollHeight, clientHeight } = target;

      // Calculate scroll progress
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      const isNearBottom = scrollHeight - (scrollTop + clientHeight) <= 100; // Within 100px of bottom

      // Load more when near bottom OR scrolled to 85% of content
      const shouldLoadMore = (isNearBottom || scrollPercentage >= 0.85) && hasMore && !loading && !loadingRef.current;

      if (shouldLoadMore) {
        loadNotifications();
      }
    }, 200); // 200ms throttle
  }, [hasMore, loading, loadNotifications]);

  // Load more notifications (kept for compatibility)
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadNotifications();
    }
  };

  // Đánh dấu đã đọc một notification
  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);

      // Cập nhật local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, is_read: true }
            : notif
        )
      );

      // Cập nhật count
      if (onNotificationUpdate) {
        const unreadCount = notifications.filter(n => !n.is_read && n.id !== notificationId).length;
        onNotificationUpdate(unreadCount);
      }

      // Refresh unread count from backend
      if (onRefreshUnreadCount) {
        await onRefreshUnreadCount();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Đánh dấu tất cả đã đọc
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();

      // Cập nhật local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );

      // Cập nhật count
      if (onNotificationUpdate) {
        onNotificationUpdate(0);
      }

      // Refresh unread count from backend
      if (onRefreshUnreadCount) {
        await onRefreshUnreadCount();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };



  // Xóa notification
  const deleteNotification = (userNotificationId, event) => {
    // Prevent event bubbling to avoid triggering mark as read
    event.stopPropagation();

    // Close the Menu to avoid aria-hidden focus conflict
    setAnchorEl(null);

    // Open confirmation dialog
    setNotificationToDelete(userNotificationId);
    setDeleteDialogOpen(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!notificationToDelete) return;

    try {
      await deleteUserNotification(notificationToDelete);

      // Cập nhật local state - remove the notification
      setNotifications(prev => prev.filter(notif => notif.id !== notificationToDelete));

      // Cập nhật count
      if (onNotificationUpdate) {
        const unreadResponse = await getUnreadNotifications();
        onNotificationUpdate(unreadResponse.unread_count || 0);
      }

      // Refresh unread count from backend
      if (onRefreshUnreadCount) {
        await onRefreshUnreadCount();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Có lỗi xảy ra khi xóa thông báo. Vui lòng thử lại.');
    } finally {
      // Close dialog
      setDeleteDialogOpen(false);
      setNotificationToDelete(null);
    }
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setNotificationToDelete(null);
  };

  // Icon theo loại notification
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'payment_success':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'reminder':
        return <AccessTime color="secondary" />;
      case 'update':
        return <Refresh color="primary" />;
      default:
        return <Info color="info" />;
    }
  };

  // Format thời gian
  const formatNotificationTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: vi
      });
    } catch (error) {
      return 'Vừa xong';
    }
  };

  return (
    <>
      {/* Notification Bell Icon */}
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{
          ml: 1,
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <Badge badgeContent={notificationCount} color="error">
          {notificationCount > 0 ? (
            <NotificationsActive />
          ) : (
            <NotificationsIcon />
          )}
        </Badge>
      </IconButton>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            overflow: 'visible',
            mt: 1.5,
            '& .MuiList-root': {
              padding: 0
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Thông báo
            </Typography>
            {notifications.some(n => !n.is_read) && (
              <Button
                size="small"
                onClick={handleMarkAllAsRead}
                startIcon={<MarkEmailRead />}
                sx={{ fontSize: '0.75rem' }}
              >
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </Box>
        </Box>

        {/* Notifications List */}
        <Box 
          ref={scrollContainerRef}
          sx={{ 
            maxHeight: 350, 
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#c1c1c1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#a8a8a8',
            },
          }}
          onScroll={handleScroll}
        >
          {loading && notifications.length === 0 ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box textAlign="center" p={3}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
              <Typography color="textSecondary">
                Không có thông báo nào
              </Typography>
            </Box>
          ) : (
            <List>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      backgroundColor: notification.is_read ? 'transparent' : '#f3f4f6',
                      '&:hover': {
                        backgroundColor: '#f8f9fa'
                      },
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: 'background.paper' }}>
                        {getNotificationIcon(notification.notification?.notification_type || notification.notification_type)}
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: notification.is_read ? 400 : 600,
                              mr: 1,
                              flex: 1
                            }}
                          >
                            {notification.notification?.title || notification.title}
                          </Typography>
                          <MuiIconButton
                            size="small"
                            onClick={(e) => deleteNotification(notification.id, e)}
                            sx={{
                              ml: 1,
                              opacity: 0.7,
                              '&:hover': {
                                opacity: 1,
                                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                color: 'error.main'
                              }
                            }}
                          >
                            <Delete fontSize="small" />
                          </MuiIconButton>
                        </Box>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            component="span"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mb: 0.5,
                              lineHeight: 1.4
                            }}
                          >
                            {notification.notification?.message || notification.message}
                          </Typography>
                          <br />
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            component="span"
                            sx={{ mr: 1 }}
                          >
                            {formatNotificationTime(notification.notification?.created_at || notification.created_at)}
                          </Typography>
                          {!notification.is_read && (
                            <Circle sx={{ fontSize: 8, color: 'primary.main', verticalAlign: 'middle' }} />
                          )}
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}

          {/* Loading indicator for infinite scroll */}
          {loading && hasMore && (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={20} />
              <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                Đang tải thêm...
              </Typography>
            </Box>
          )}
        </Box>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Xác nhận xóa thông báo
        </DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelDelete}
            color="inherit"
            variant="outlined"
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            autoFocus
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationDropdown;
