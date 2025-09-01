import React, { useEffect, useState } from 'react';
import { Container, Grid, Card, CardContent, Typography, Button, CardActions, CircularProgress, Box, Alert, TablePagination, TextField, Autocomplete, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api, { endpoints } from '../services/apis';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(9);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [tags, setTags] = useState([]); // all tags
  const [selectedTags, setSelectedTags] = useState([]); // selected tags
  const navigate = useNavigate();

  const fetchCourses = async () => {
    setLoading(true);
    const params = {
      limit: rowsPerPage,
      page: page + 1,
      search: search.trim() || undefined,
      tags: selectedTags.map(t => t.name).join(",") || undefined,
    };
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

  // Fetch all tags for filter
  const fetchTags = async () => {
    try {
      const res = await api.get(endpoints.tag.list);
      setTags(Array.isArray(res.data) ? res.data : []);
    } catch {
      setTags([]);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line
  }, [page, rowsPerPage, search, selectedTags]);

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
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
        <TextField
          label="Tìm kiếm khóa học"
          variant="outlined"
          size="medium"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          sx={{ minWidth: 320, height: 56, '& .MuiInputBase-root': { height: 56, fontSize: 18 } }}
        />
        <Autocomplete
          multiple
          options={tags}
          getOptionLabel={option => option.name}
          value={selectedTags}
          onChange={(_, value) => { setSelectedTags(value); setPage(0); }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip label={option.name} {...getTagProps({ index })} key={option.id} sx={{ fontSize: 15, height: 32 }} />
            ))
          }
          renderInput={params => (
            <TextField {...params} variant="outlined" label="Lọc theo tag" size="small" sx={{ minWidth: 220, mt: 1 }} />
          )}
          sx={{ minWidth: 220, mt: 1 }}
        />
      </Box>
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
