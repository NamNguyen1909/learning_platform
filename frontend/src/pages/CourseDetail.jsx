import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, Grid, CircularProgress, Snackbar, Alert } from '@mui/material';
import api, { endpoints } from '../services/apis';
import authUtils from '../services/auth';

const CourseDetail = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(endpoints.course.detail(id)),
      api.get(endpoints.document.list({ course: id }))
    ])
      .then(([courseRes, docRes]) => {
        setCourse(courseRes.data);
        setDocuments(docRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  // Xử lý click document: nếu chưa đăng nhập thì redirect login, nếu đã đăng nhập thì sang trang chi tiết document (sau này kiểm tra quyền ở BE)
  const handleDocumentClick = async (doc) => {
    if (!authUtils.isAuthenticated()) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    // Chuyển sang trang chi tiết document (có thể kiểm tra quyền ở đó)
    navigate(`/documents/${doc.id}`);
  };

  // Xử lý click đăng ký: nếu chưa đăng nhập thì redirect login, nếu đã đăng nhập thì (sau này) chuyển sang trang thanh toán
  const handleRegisterClick = async () => {
    if (!authUtils.isAuthenticated()) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    // Sau này: chuyển sang trang thanh toán
    setRegistering(true);
    api.post(endpoints.course.register(id))
      .then(() => {
        setSnackbar({ open: true, message: 'Đăng ký thành công!', severity: 'success' });
      })
      .catch(() => {
        setSnackbar({ open: true, message: 'Đăng ký thất bại!', severity: 'error' });
      })
      .finally(() => setRegistering(false));
  };

  const handleRegister = () => {
    setRegistering(true);
    api.post(endpoints.course.register(id))
      .then(() => {
        setSnackbar({ open: true, message: 'Đăng ký thành công!', severity: 'success' });
      })
      .catch(() => {
        setSnackbar({ open: true, message: 'Đăng ký thất bại!', severity: 'error' });
      })
      .finally(() => setRegistering(false));
  };

  if (loading) return <Container maxWidth="lg"><Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box></Container>;
  if (!course) return <Container maxWidth="lg"><Typography>Không tìm thấy khóa học.</Typography></Container>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container columns={12} rowSpacing={4} columnSpacing={4} alignItems="stretch">
            <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ width: '100%', height: { xs: 220, md: 320 }, bgcolor: '#f5f5f5', borderRadius: 3, overflow: 'hidden', boxShadow: 2 }}>
                {course.image ? (
                    <img src={course.image} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'grey.400' }}>
                    Không có hình ảnh
                    </Box>
                )}
                </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>{course.title}</Typography>
                <Typography variant="subtitle1" color="primary" fontWeight={600} gutterBottom>
                Giá: {course.price.toLocaleString()} VNĐ
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{course.description}</Typography>
                {course.instructor && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                    Giảng viên: <b>{course.instructor.full_name || course.instructor.username}</b>
                </Typography>
                )}
                <Button variant="contained" color="primary" onClick={handleRegisterClick} disabled={registering} sx={{ mb: 3, minWidth: 180 }}>
                {registering ? 'Đang đăng ký...' : 'Đăng ký khóa học'}
                </Button>
        </Grid>


      </Grid>
              <Box sx={{ mt: 4 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>Tài liệu khóa học</Typography>
            {documents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Chưa có tài liệu cho khóa học này.</Typography>
            ) : (
              <Box sx={{ width: '100%' }}>
                <Box sx={{ bgcolor: '#fafafa', borderRadius: 2, boxShadow: 1, p: 2 }}>
                  {documents.map(doc => (
                    <Box key={doc.id} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 1, borderBottom: '1px solid #eee', cursor: 'pointer', '&:hover': { bgcolor: '#e3eafc' } }}
                      onClick={() => handleDocumentClick(doc)}
                    >
                      <Typography variant="subtitle1" fontWeight={500} color="primary" sx={{ textDecoration: 'underline' }}>
                        {doc.title}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default CourseDetail;
