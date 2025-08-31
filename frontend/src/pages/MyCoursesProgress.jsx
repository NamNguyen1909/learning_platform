import React, { useEffect, useState } from 'react';
import { fetchCourseProgresses } from '../services/apis';
import { Container, Grid, Card, CardContent, CardMedia, Typography, Box, LinearProgress, Button, Stack } from '@mui/material';

const getProgressLabel = (progress) => {
  if (progress >= 100) return 'Đã hoàn thành';
  if (progress > 0) return 'Học tiếp';
  return 'Vào học';
};

const getButtonColor = (progress) => {
  if (progress >= 100) return 'success';
  if (progress > 0) return 'primary';
  return 'info';
};

const MyCoursesProgress = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseProgresses()
      .then(res => setCourses(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Khóa học của tôi</Typography>
      {loading ? (
        <Typography>Đang tải...</Typography>
      ) : (
        <Grid container spacing={3}>
          {courses.length === 0 && (
            <Grid item xs={12}><Typography>Chưa có khóa học nào.</Typography></Grid>
          )}
          {courses.map((item) => {
            const course = item.course;
            return (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card>
                  {course.image && (
                    <CardMedia
                      component="img"
                      height="160"
                      image={course.image}
                      alt={course.title}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6" gutterBottom>{course.title}</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {course.description?.slice(0, 80)}{course.description?.length > 80 ? '...' : ''}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ flex: 1 }}>
                          <LinearProgress variant="determinate" value={item.progress} sx={{ height: 10, borderRadius: 5 }} />
                        </Box>
                        <Typography variant="body2" sx={{ minWidth: 40 }}>{Math.round(item.progress)}%</Typography>
                      </Stack>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        color={getButtonColor(item.progress)}
                        fullWidth
                        disabled={item.progress >= 100}
                        // TODO: Thêm logic chuyển trang học
                      >
                        {getProgressLabel(item.progress)}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default MyCoursesProgress;
