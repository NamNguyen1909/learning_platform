import React, { useState } from "react";
import {
  Button,
  TextField,
  Card,
  Typography,
  Box,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import api, { endpoints } from "../services/apis";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "learner",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }
    setLoading(true);
    try {
      await api.post(endpoints.user.create, {
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      setSuccess("Đăng ký thành công! Vui lòng đăng nhập.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError("Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
    }
    setLoading(false);
  };

  return (
    <Box
      minHeight="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="background.default"
      sx={{ px: 2, m: 3 }}
    >
      <Card sx={{ p: 4, width: "100%", maxWidth: 400, boxShadow: 3 }}>
        <Typography
          variant="h4"
          fontWeight={700}
          mb={2}
          color="primary.main"
          align="center"
        >
          Đăng ký tài khoản
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
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            type="email"
          />
          <TextField
            label="Mật khẩu"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                  >
                    {showPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            value={form.confirmPassword}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirm((v) => !v)}
                    edge="end"
                  >
                    {showConfirm ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            label="Vai trò"
            name="role"
            value={form.role}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          >
            <MenuItem value="learner">Học viên</MenuItem>
            <MenuItem value="instructor">Giảng viên</MenuItem>
          </TextField>
          {error && (
            <Typography color="error" variant="body2" mt={1} align="center">
              {error}
            </Typography>
          )}
          {success && (
            <Typography
              color="success.main"
              variant="body2"
              mt={1}
              align="center"
            >
              {success}
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
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </Button>
        </form>
        <Divider sx={{ my: 2 }}>Đã có tài khoản?</Divider>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => navigate("/login")}
          sx={{ textTransform: "none", color: '#000000', backgroundColor: '#ffffff', borderColor: '#cccccc', textDecoration: 'underline' }}
        >
          Đăng nhập
        </Button>
      </Card>
    </Box>
  );
};

export default Register;
