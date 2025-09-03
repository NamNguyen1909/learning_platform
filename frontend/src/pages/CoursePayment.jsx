import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { createCoursePayment, createPaymentUrl } from '../services/apis';
import auth from '../services/auth';
import api, { endpoints } from '../services/apis';

const CoursePayment = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('vnpay');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is authenticated
        if (!auth.isAuthenticated()) {
          navigate('/login');
          return;
        }

        const userInfo = await auth.getCurrentUser();
        setUser(userInfo);

        // Fetch course details
        const courseResponse = await api.get(endpoints.course.detail(courseId));
        setCourse(courseResponse.data);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Không thể tải thông tin khóa học');
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, navigate]);

  const handlePayment = async () => {
    if (!course || !user) return;

    setProcessing(true);
    setError(null);

    try {
      // Create payment record
      const paymentData = {
        course_id: courseId,
        payment_method: paymentMethod,
      };

      console.log('Sending payment data:', paymentData);

      const paymentResponse = await createCoursePayment(paymentData);
      console.log('Payment response:', paymentResponse);

      const paymentId = paymentResponse.data.id;

      // Create VNPay payment URL
      const paymentUrlData = {
        payment_id: paymentId,
        amount: course.price,
        course_name: course.title,
      };

      console.log('Sending payment URL data:', paymentUrlData);

      const paymentUrlResponse = await createPaymentUrl(paymentUrlData);
      console.log('Payment URL response:', paymentUrlResponse);

      // Redirect to VNPay
      window.location.href = paymentUrlResponse.data.payment_url;
    } catch (err) {
      console.error('Payment error:', err);
      console.error('Error response data:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error headers:', err.response?.headers);
      setError('Có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/courses')}>
          Quay lại danh sách khóa học
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Thanh toán khóa học
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{xs:12,md:12,}}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Thông tin khóa học
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {course && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {course.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {course.description}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Typography variant="body2">Giảng viên:</Typography>
                    <Chip label={course.instructor?.full_name || course.instructor?.username || 'N/A'} size="small" />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12,md:12,}}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                Tóm tắt thanh toán
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body1">Giá khóa học:</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {course ? `${course.price.toLocaleString()} VND` : 'N/A'}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body1">Phí giao dịch:</Typography>
                <Typography variant="body1">Miễn phí</Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box display="flex" justifyContent="space-between" mb={3}>
                <Typography variant="h6">Tổng cộng:</Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  {course ? `${course.price.toLocaleString()} VND` : 'N/A'}
                </Typography>
              </Box>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Phương thức thanh toán</InputLabel>
                <Select
                  value={paymentMethod}
                  label="Phương thức thanh toán"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <MenuItem value="vnpay">VNPay</MenuItem>
                  <MenuItem value="momo" disabled>Momo (Sắp có)</MenuItem>
                  <MenuItem value="zalopay" disabled>ZaloPay (Sắp có)</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={handlePayment}
                disabled={processing || !course}
                sx={{ mb: 2 }}
              >
                {processing ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Đang xử lý...
                  </>
                ) : (
                  'Thanh toán với VNPay'
                )}
              </Button>

              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate(`/courses/${courseId}`)}
                disabled={processing}
              >
                Quay lại chi tiết khóa học
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box mt={4}>
        <Alert severity="info">
          <Typography variant="body2">
            Sau khi thanh toán thành công, bạn sẽ được chuyển hướng về trang xác nhận
            và có thể bắt đầu học ngay lập tức.
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
};

export default CoursePayment;
