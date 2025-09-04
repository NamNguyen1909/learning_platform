import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
} from '@mui/material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { green, red } from '@mui/material/colors';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processPaymentResult = () => {
      // Get payment result from URL parameters sent by backend
      const paymentResult = searchParams.get('payment_result');
      const message = searchParams.get('message');
      const courseId = searchParams.get('course_id');
      const autoRefresh = searchParams.get('auto_refresh');

      // Check if payment was successful
      const isSuccess = paymentResult === 'success';

      setResult({
        success: isSuccess,
        message: message,
        courseId: courseId,
        autoRefresh: autoRefresh === 'true',
        // Note: Transaction details are not available in these parameters
        // They would need to be fetched from the backend if needed
      });

      setLoading(false);
    };

    processPaymentResult();
  }, [searchParams]);

  const handleContinue = () => {
    if (result?.success) {
      navigate(`/courses/${result.courseId}`);
    } else {
      navigate('/courses');
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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        {result?.success ? (
          <CheckCircleIcon sx={{ fontSize: 80, color: green[500], mb: 2 }} />
        ) : (
          <ErrorIcon sx={{ fontSize: 80, color: red[500], mb: 2 }} />
        )}

        <Typography variant="h4" component="h1" gutterBottom>
          {result?.success ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          {result?.message || (result?.success
            ? 'Chúc mừng! Bạn đã đăng ký khóa học thành công.'
            : 'Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.')}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Chi tiết giao dịch
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Trạng thái:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Chip
                      label={result?.success ? 'Thành công' : 'Thất bại'}
                      color={result?.success ? 'success' : 'error'}
                      size="small"
                    />
                  </Grid>

                  {result?.courseId && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          ID khóa học:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" fontWeight="bold">
                          {result.courseId}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                Tiếp theo
              </Typography>

              {result?.success ? (
                <Box>
                  <Typography variant="body2" paragraph>
                    Bạn có thể bắt đầu học ngay bây giờ. Truy cập vào phần "Khóa học của tôi"
                    để xem tiến độ và bắt đầu các bài học.
                  </Typography>

                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={handleContinue}
                    sx={{ mb: 2 }}
                  >
                    Bắt đầu học
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" paragraph>
                    Vui lòng kiểm tra thông tin thanh toán và thử lại.
                    Nếu vấn đề vẫn tiếp tục, hãy liên hệ với bộ phận hỗ trợ.
                  </Typography>

                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={handleContinue}
                    sx={{ mb: 2 }}
                  >
                    Quay lại danh sách khóa học
                  </Button>
                </Box>
              )}

            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {!result?.success && (
        <Box mt={4}>
          <Alert severity="warning">
            <Typography variant="body2">
              Nếu bạn đã thực hiện thanh toán nhưng vẫn thấy thông báo thất bại,
              vui lòng liên hệ với chúng tôi để được hỗ trợ kiểm tra giao dịch.
            </Typography>
          </Alert>
        </Box>
      )}
    </Container>
  );
};

export default PaymentResult;
