import React, { useEffect, useState } from "react";
import {
  Container, Paper, Box, Typography, Avatar, IconButton, Button, TextField, Grid, Divider, Snackbar, Alert, CircularProgress, Tooltip, Chip
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import api, { endpoints } from "../services/apis";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', avatar: '' });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await api.get(endpoints.auth.userInfo);
        setUser(res.data);
        setFormData({
          full_name: res.data.full_name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          avatar: res.data.avatar || '',
        });
      } catch (err) {
        setSnackbar({ open: true, message: 'Không thể tải thông tin người dùng', severity: 'error' });
        console.error(err);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = () => setEditing(true);
  const handleCancel = () => {
    setFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      avatar: user.avatar || '',
    });
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch(endpoints.auth.updateProfile, formData);
      setUser(res.data);
      setSnackbar({ open: true, message: 'Cập nhật thành công!', severity: 'success' });
      setEditing(false);
    } catch (err) {
      setSnackbar({ open: true, message: 'Cập nhật thất bại!', severity: 'error' });
    }
    setSaving(false);
  };

  // Avatar upload (Cloudinary or base64)
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append('avatar', avatarFile);
      const res = await api.patch(endpoints.auth.updateProfile, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(res.data);
      setFormData((prev) => ({ ...prev, avatar: res.data.avatar }));
      setSnackbar({ open: true, message: 'Cập nhật avatar thành công!', severity: 'success' });
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      setSnackbar({ open: true, message: 'Cập nhật avatar thất bại!', severity: 'error' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <Box position="relative" display="inline-block">
            <Tooltip title="Đổi ảnh đại diện">
              <Avatar src={avatarPreview || formData.avatar} sx={{ width: 120, height: 120, mb: 2, border: '2px solid #1976d2' }} />
            </Tooltip>
            <IconButton
              component="label"
              sx={{ position: 'absolute', bottom: 8, right: -8, backgroundColor: 'white', color: 'primary.main', boxShadow: 2 }}
            >
              <PhotoCamera />
              <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
            </IconButton>
          </Box>
          {avatarFile && (
            <Button variant="contained" size="small" onClick={handleAvatarUpload} disabled={saving} sx={{ mt: 1 }}>
              {saving ? <CircularProgress size={16} /> : 'Cập nhật avatar'}
            </Button>
          )}
          <Typography variant="h5" fontWeight="bold" mt={2}>
            {user?.full_name || user?.username}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            @{user?.username}
          </Typography>
          <Chip
            icon={<VerifiedUserIcon />}
            label={user?.role ? user.role.toUpperCase() : 'USER'}
            color="primary"
            size="small"
            sx={{ mb: 1 }}
          />
          <Chip
            label={user?.is_active ? "Hoạt động" : "Không hoạt động"}
            color={user?.is_active ? "success" : "warning"}
            size="small"
            sx={{ mb: 1, ml: 1 }}
          />
          {user?.date_joined && (
            <Chip
              icon={<CalendarTodayIcon />}
              label={`Tham gia: ${new Date(user.date_joined).toLocaleDateString()}`}
              size="small"
              sx={{ mb: 1, ml: 1 }}
            />
          )}
        </Box>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Họ và tên"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              fullWidth
              disabled={!editing}
              InputProps={{
                startAdornment: <PersonIcon sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
              disabled
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1 }} />,
              }}
              helperText="Email không thể thay đổi"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Số điện thoại"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              fullWidth
              disabled={!editing}
              InputProps={{
                startAdornment: <PhoneIcon sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
        </Grid>
        <Box display="flex" justifyContent="flex-end" gap={1} mt={3}>
          {!editing ? (
            <Button variant="contained" startIcon={<EditIcon />} onClick={handleEdit}>Chỉnh sửa</Button>
          ) : (
            <>
              <Button variant="outlined" startIcon={<CancelIcon />} onClick={handleCancel} disabled={saving}>Hủy</Button>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
            </>
          )}
        </Box>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile;