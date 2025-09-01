import React, { useEffect, useState } from 'react';
import { Container, Grid, Typography, CircularProgress, Box, Alert, TablePagination, TextField, Autocomplete, Chip } from '@mui/material';
import CourseCard from '../components/CourseCard';
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
              <Grid key={course.id} size={{xs: 12, sm: 6, md: 4, lg: 4}}>
                <CourseCard course={course} onClick={() => navigate(`/courses/${course.id}`)} />
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
