import React, { useState } from 'react';
import { Button, TextField, Card, Typography, Box, Divider, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff, GitHub, Google } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import auth from '../services/auth';
import api, { endpoints } from '../services/apis';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await auth.login(form.username, form.password);
      navigate('/');
    } catch (err) {
      setError('Sai tài khoản hoặc mật khẩu!');
    }
    setLoading(false);
  };

  const handleSocialLogin = (provider) => {
    
    window.location.href = endpoints.social_auth[provider];
    console.log(endpoints.social_auth[provider])
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="background.default">
      <Card sx={{ p: 4, minWidth: 350, maxWidth: 400, boxShadow: 3 }}>
        <Typography variant="h4" fontWeight={700} mb={2} color="primary.main" align="center">
          Đăng nhập
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Tên đăng nhập"
            name="username"
            value={form.username}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            autoFocus
          />
          <TextField
            label="Mật khẩu"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((v) => !v)} edge="end">
                    {showPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {error && (
            <Typography color="error" variant="body2" mt={1} align="center">
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2, mb: 1 }}
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </form>
        <Divider sx={{ my: 2 }}>Hoặc</Divider>
        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          startIcon={<Google />}
          sx={{ mb: 1, textTransform: 'none' }}
          onClick={() => handleSocialLogin('google-oauth2')}
        >
          Đăng nhập với Google
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          startIcon={<GitHub />}
          sx={{ textTransform: 'none' }}
          onClick={() => handleSocialLogin('github')}
        >
          Đăng nhập với GitHub
        </Button>
        <Box mt={2} textAlign="center">
          <Typography variant="body2">
            Chưa có tài khoản?{' '}
            <Button variant="text" onClick={() => navigate('/register')} sx={{ p: 0, minWidth: 0 }}>
              Đăng ký
            </Button>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default Login;

