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
  const [hasCourseProgress, setHasCourseProgress] = useState(null); // null: chưa xác định, true/false: đã kiểm tra
  const [courseProgress, setCourseProgress] = useState(null); // lưu object CourseProgress nếu có
  const navigate = useNavigate();

  // Hàm kiểm tra user đã có CourseProgress cho khóa học chưa, trả về true/false và cập nhật state
  const checkCourseProgress = async (courseId) => {
    const token = localStorage.getItem('access_token');
    if (!authUtils.isAuthenticated()) {
      setHasCourseProgress(false);
      setCourseProgress(null);
      console.log('Not authenticated, token:', token);
      return false;
    }
    try {
      console.log('Checking course progress for user...', 'token:', token);
  const res = await api.get(endpoints.courseProgress.list, { params: { course: courseId } });
      console.log('API /api/course-progress response:', res);
      if (Array.isArray(res.data) && res.data.length > 0) {
        console.log('User has course progress:', res.data[0]);
        setCourseProgress(res.data[0]);
        setHasCourseProgress(true);
        return true;
      }
      console.log('User does not have course progress, data:', res.data);
      setCourseProgress(null);
      setHasCourseProgress(false);
      return false;
    } catch (err) {
      setCourseProgress(null);
      setHasCourseProgress(false);
      console.error('Error checking course progress:', err);
      return false;
    }
  };

  // Hàm load toàn bộ dữ liệu (course, documents, progress)
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [courseRes, docRes] = await Promise.all([
        api.get(endpoints.course.detail(id)),
        api.get(endpoints.document.list({ course: id }))
      ]);
      setCourse(courseRes.data);
      setDocuments(docRes.data);
    } finally {
      setLoading(false);
    }
    await checkCourseProgress(id);
  };

  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line
  }, [id]);

  // Xử lý click document: nếu chưa đăng nhập thì redirect login, nếu đã đăng nhập thì sang trang chi tiết document (sau này kiểm tra quyền ở BE)
  const handleDocumentClick = async (doc) => {
    if (!authUtils.isAuthenticated()) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    // Kiểm tra lại quyền truy cập tài liệu (tái sử dụng hàm)
    const hasProgress = hasCourseProgress ?? (await checkCourseProgress(id));
    if (!hasProgress) {
      setSnackbar({ open: true, message: 'Bạn cần đăng ký khóa học để xem tài liệu!', severity: 'warning' });
      return;
    }
    // Đã đăng ký, cho phép xem tài liệu
    navigate(`/documents/${doc.id}`);
  };

  // Xử lý click đăng ký hoặc vào học
  const handleRegisterOrLearnClick = async () => {
    if (!authUtils.isAuthenticated()) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    if (hasCourseProgress && courseProgress) {
      // Đã đăng ký, vào học: tìm document đầu tiên chưa hoàn thành hoặc đầu tiên
      let nextDoc = null;
      // Nếu có trường document_completion hoặc cần fetch thêm, có thể mở rộng ở đây
      // Hiện tại, mặc định vào document đầu tiên
      if (documents && documents.length > 0) {
        nextDoc = documents[0];
      }
      if (nextDoc) {
        navigate(`/documents/${nextDoc.id}`);
      } else {
        setSnackbar({ open: true, message: 'Không tìm thấy tài liệu để học.', severity: 'info' });
      }
      return;
    }
    // Chưa đăng ký: đăng ký khóa học
    setRegistering(true);
    api.post(endpoints.course.register(id))
      .then(() => {
        setSnackbar({ open: true, message: 'Đăng ký thành công!', severity: 'success' });
        // Cập nhật state tạm thời để disable nút ngay lập tức
        setHasCourseProgress(true);
        setCourseProgress({ is_completed: false });
        // Đăng ký xong, reload lại toàn bộ dữ liệu để cập nhật trạng thái nút và quyền truy cập
        loadAllData();
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
                {hasCourseProgress && courseProgress ? (
                  <Button
                    variant="contained"
                    color={courseProgress.is_completed ? 'success' : 'primary'}
                    onClick={courseProgress.is_completed ? undefined : handleRegisterOrLearnClick}
                    disabled={courseProgress.is_completed}
                    sx={{ mb: 3, minWidth: 180 }}
                  >
                    {courseProgress.is_completed ? 'Đã hoàn thành' : 'Vào học'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleRegisterOrLearnClick}
                    disabled={registering}
                    sx={{ mb: 3, minWidth: 180 }}
                  >
                    {registering ? 'Đang đăng ký...' : 'Đăng ký khóa học'}
                  </Button>
                )}
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
