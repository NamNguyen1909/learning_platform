import React, { useEffect, useState } from 'react';
import { Container, Grid, Card, CardContent, Typography, Button, CardActions, CircularProgress, Box, Alert, TablePagination } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api, { endpoints } from '../services/apis';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(9);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const fetchCourses = async () => {
    setLoading(true);
    const params = { limit: rowsPerPage, page: page + 1 };
    try {
      const res = await api.get(endpoints.course.list, { params });
      setCourses(Array.isArray(res.data.results) ? res.data.results : []);
      setTotal(typeof res.data.count === 'number' ? res.data.count : 0);
    } catch {
      setCourses([]);
      setTotal(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line
  }, [page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight={700} sx={{ textAlign: 'center', mb: 4, color: '#1976d2' }}>
        Danh sách khóa học
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress size={48} thickness={5} />
        </Box>
      ) : courses.length === 0 ? (
        <Alert severity="info" sx={{ mt: 4, borderRadius: 3, textAlign: 'center' }}>Không có khóa học nào.</Alert>
      ) : (
        <>
          <Grid container spacing={4} alignItems="stretch">
            {courses.map(course => (
              <Grid key={course.id} size={{sm: 6, md: 4, lg: 4}}>
                <Card
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    borderRadius: 4,
                    overflow: 'hidden',
                    boxShadow: '0 6px 24px rgba(25, 118, 210, 0.12)',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': { transform: 'scale(1.04)', boxShadow: '0 12px 32px rgba(25, 118, 210, 0.18)' },
                    bgcolor: '#F5F7FA',
                  }}
                >
                  <Box sx={{ height: 140, overflow: 'hidden', bgcolor: '#e3eafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {course.image && course.image !== '' ? (
                      <img src={course.image} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0 0 16px 16px' }} />
                    ) : (
                      <Typography variant="subtitle2" color="text.secondary">Không có hình ảnh</Typography>
                    )}
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', minHeight: 120 }}>
                    <Typography variant="h6" fontWeight={700} noWrap sx={{ color: '#1976d2', mb: 1 }}>
                      {course.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, minHeight: 40, maxHeight: 40, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {course.description}
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'space-between', alignItems: 'center', pb: 2, px: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#388e3c', ml: 1 }}>
                      Giá: {course.price.toLocaleString()} VNĐ
                    </Typography>
                    <Button
                      variant="contained"
                      size="medium"
                      onClick={() => navigate(`/courses/${course.id}`)}
                      sx={{ bgcolor: '#1976d2', color: '#fff', fontWeight: 600, borderRadius: 2, px: 2, py: 1, boxShadow: 'none', '&:hover': { bgcolor: '#1565c0' } }}
                    >
                      Xem chi tiết
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ mt: 2, mb: 1 }}
          />
        </>
      )}
    </Container>
  );
};

export default CourseList;
