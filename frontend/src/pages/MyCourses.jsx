import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Typography,
  CircularProgress,
  Box,
  Alert,
  TablePagination,
  TextField,
  Autocomplete,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import CourseCard from '../components/CourseCard';
import { useNavigate } from 'react-router-dom';
import api, { endpoints, getMyCourses } from '../services/apis';
import authUtils from '../services/auth';

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(9);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: null,
    price: 0,
    start_date: null,
    end_date: null,
    tags: [],
    is_published: false,
    documents: [], // Array of {id, title, file, isNew, toDelete}
  });
  const [formLoading, setFormLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [editMode, setEditMode] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

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
      const res = await getMyCourses(params);
      setCourses(Array.isArray(res.data.results) ? res.data.results : []);
      setTotal(typeof res.data.count === 'number' ? res.data.count : 0);
    } catch {
      setCourses([]);
      setTotal(0);
    }
    setLoading(false);
  };

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
  }, [page, rowsPerPage, search, selectedTags]);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const user = await authUtils.getCurrentUser();
        setUserRole(user ? user.role : null);
      } catch {
        setUserRole(null);
      }
    };
    fetchUserRole();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenModal = () => {
    setEditMode(false);
    setEditingCourseId(null);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditMode(false);
    setEditingCourseId(null);
    setFormData({
      title: '',
      description: '',
      image: null,
      price: 0,
      start_date: null,
      end_date: null,
      tags: [],
      is_published: false,
      documents: [],
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setFormData(prev => ({ ...prev, image: e.target.files[0] }));
  };

  const handleTagsChange = (event, value) => {
    setFormData(prev => ({ ...prev, tags: value }));
  };

  const handleStartDateChange = (newValue) => {
    setFormData(prev => ({ ...prev, start_date: newValue }));
  };

  const handleEndDateChange = (newValue) => {
    setFormData(prev => ({ ...prev, end_date: newValue }));
  };

  // Document management functions
  const handleAddDocument = () => {
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, { id: Date.now(), title: '', file: null, type: 'file', youtube_url: '', isNew: true }]
    }));
  };

  const handleDocumentTitleChange = (index, title) => {
    setFormData(prev => {
      const newDocuments = [...prev.documents];
      newDocuments[index].title = title;
      return { ...prev, documents: newDocuments };
    });
  };

  const handleDocumentFileChange = (index, file) => {
    setFormData(prev => {
      const newDocuments = [...prev.documents];
      newDocuments[index].file = file;
      return { ...prev, documents: newDocuments };
    });
  };

  const handleDocumentTypeChange = (index, type) => {
    setFormData(prev => {
      const newDocuments = [...prev.documents];
      newDocuments[index].type = type;
      if (type === 'youtube') {
        newDocuments[index].file = null; // Clear file if switching to YouTube
      } else {
        newDocuments[index].youtube_url = ''; // Clear YouTube URL if switching to file
      }
      return { ...prev, documents: newDocuments };
    });
  };

  const handleDocumentYouTubeChange = (index, youtube_url) => {
    setFormData(prev => {
      const newDocuments = [...prev.documents];
      newDocuments[index].youtube_url = youtube_url;
      return { ...prev, documents: newDocuments };
    });
  };

  const handleRemoveDocument = (index) => {
    setFormData(prev => {
      const newDocuments = [...prev.documents];
      const doc = newDocuments[index];
      if (!doc.isNew) {
        // Mark for deletion
        newDocuments[index].toDelete = true;
      } else {
        // Remove from array
        newDocuments.splice(index, 1);
      }
      return { ...prev, documents: newDocuments };
    });
  };

  const handleEditDocument = (index) => {
    // For now, just allow editing title and file
    // Could add a separate edit mode if needed
  };

  const handleSubmit = async (isPublished) => {
    setFormLoading(true);

    // Validate date range
    if (formData.start_date && formData.end_date) {
      if (formData.end_date.isBefore(formData.start_date) || formData.end_date.isSame(formData.start_date)) {
        setSnackbar({
          open: true,
          message: 'Ngày kết thúc phải sau ngày bắt đầu!',
          severity: 'error',
        });
        setFormLoading(false);
        return;
      }
    }

    // Get current user to set as instructor
    const currentUser = await authUtils.getCurrentUser();
    if (!currentUser) {
      console.error('No current user found');
      setFormLoading(false);
      return;
    }

    const data = new FormData();
    if (editMode && editingCourseId) {
      // For update, only send non-empty fields to avoid validation errors
      if (formData.title.trim()) data.append('title', formData.title);
      if (formData.description.trim()) data.append('description', formData.description);
      data.append('price', formData.price);
      if (formData.start_date) data.append('start_date', formData.start_date.format('YYYY-MM-DD'));
      if (formData.end_date) data.append('end_date', formData.end_date.format('YYYY-MM-DD'));
      data.append('is_published', isPublished);
      if (formData.tags.length > 0) formData.tags.forEach(tag => data.append('tags', tag.id));
      if (formData.image) data.append('image', formData.image);
    } else {
      // For create, send all fields
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('price', formData.price);
      if (formData.start_date) data.append('start_date', formData.start_date.format('YYYY-MM-DD'));
      if (formData.end_date) data.append('end_date', formData.end_date.format('YYYY-MM-DD'));
      data.append('is_published', isPublished);
      formData.tags.forEach(tag => data.append('tags', tag.id));
      if (formData.image) data.append('image', formData.image);
    }

    try {
      let courseId = editingCourseId;
      if (editMode && editingCourseId) {
        // Update existing course using PATCH for partial update
        console.log('Updating course with ID:', editingCourseId);
        console.log('Data:', data);
        await api.patch(endpoints.course.detail(editingCourseId), data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSnackbar({
          open: true,
          message: 'Khóa học đã được cập nhật thành công!',
          severity: 'success',
        });
      } else {
        // Create new course
        const response = await api.post(endpoints.course.create, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        courseId = response.data.id; // Get the new course ID
        setSnackbar({
          open: true,
          message: 'Khóa học đã được tạo thành công!',
          severity: 'success',
        });
      }

      // Handle document operations after course is saved
      if (courseId) {
        await handleDocumentOperations(courseId);
      }

      handleCloseModal();
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      setSnackbar({
        open: true,
        message: editMode ? 'Có lỗi xảy ra khi cập nhật khóa học!' : 'Có lỗi xảy ra khi tạo khóa học!',
        severity: 'error',
      });
    }
    setFormLoading(false);
  };

  // Handle document operations (create, update, delete)
  const handleDocumentOperations = async (courseId) => {
    try {
      // Handle deletions first
      const documentsToDelete = formData.documents.filter(doc => doc.toDelete && !doc.isNew);
      for (const doc of documentsToDelete) {
        await api.delete(endpoints.document.detail(doc.id));
      }

      // Handle updates and creations
      const documentsToProcess = formData.documents.filter(doc => !doc.toDelete);
      for (const doc of documentsToProcess) {
        const docData = new FormData();
        docData.append('title', doc.title);
        docData.append('course', courseId);
        if (doc.type === 'file' && doc.file) {
          docData.append('file', doc.file);
        } else if (doc.type === 'youtube' && doc.youtube_url) {
          docData.append('url', doc.youtube_url);
        }

        if (doc.isNew) {
          // Create new document
          await api.post(endpoints.document.create, docData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          // Update existing document
          await api.patch(endpoints.document.detail(doc.id), docData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }
    } catch (error) {
      console.error('Error handling document operations:', error);
      setSnackbar({
        open: true,
        message: 'Khóa học đã được lưu nhưng có lỗi khi xử lý tài liệu!',
        severity: 'warning',
      });
    }
  };

  const handleEditClick = async (course) => {
    setEditMode(true);
    setEditingCourseId(course.id);
    // Convert tag names to tag objects for Autocomplete
    const courseTagObjects = tags.filter(tag => course.tags.includes(tag.name));

    // Fetch existing documents for this course
    let existingDocuments = [];
    try {
      const response = await api.get(endpoints.document.list({ course: course.id }));
      existingDocuments = response.data.results.map(doc => ({
        id: doc.id,
        title: doc.title,
        file: null, // Can't prefill file input
        isNew: false,
        toDelete: false,
        file_url: doc.file, // Keep original file URL
        type: doc.url ? 'youtube' : 'file', // Set type based on content
        youtube_url: doc.url || '',
      }));
    } catch (error) {
      console.error('Error fetching documents:', error);
    }

    setFormData({
      title: course.title || '',
      description: course.description || '',
      image: null, // image file cannot be prefilled, user can upload new image if needed
      price: course.price || 0,
      start_date: course.start_date ? dayjs(course.start_date) : null,
      end_date: course.end_date ? dayjs(course.end_date) : null,
      tags: courseTagObjects,
      is_published: course.is_published || false,
      documents: existingDocuments.map(doc => ({
        ...doc,
        uploaded_by: doc.uploaded_by || null, // Add uploaded_by field if available
      })),
    });
    setOpenModal(true);
  };

  const handleDeleteClick = (course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    try {
      await api.delete(endpoints.course.detail(courseToDelete.id));
      setSnackbar({
        open: true,
        message: 'Khóa học đã được xóa thành công!',
        severity: 'success',
      });
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      setSnackbar({
        open: true,
        message: 'Có lỗi xảy ra khi xóa khóa học!',
        severity: 'error',
      });
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setCourseToDelete(null);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700} sx={{ color: '#1976d2' }}>
          Khóa học của tôi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenModal}
          sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}
        >
          Tạo khóa học mới
        </Button>
      </Box>
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
        <Alert severity="info" sx={{ mt: 4, borderRadius: 3, textAlign: 'center' }}>Bạn chưa có khóa học nào.</Alert>
      ) : (
        <>
          <Grid container spacing={4} alignItems="stretch">
            {courses.map(course => (
              <Grid key={course.id} size={{xs:12,sm:6,md:4,lg:4}} sx={{ position: 'relative' }}>
                <CourseCard course={course} onClick={() => navigate(`/courses/${course.id}`)} userRole={userRole} />
                {userRole === 'instructor' && (
                  <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                    <IconButton
                      aria-label="edit"
                      size="small"
                      color="primary"
                      onClick={() => handleEditClick(course)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      aria-label="delete"
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(course)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
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

      {/* Modal for creating/editing course */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}
          <IconButton
            aria-label="close"
            onClick={handleCloseModal}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box component="form" sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Tiêu đề"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Mô tả"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                margin="normal"
                multiline
                rows={4}
                required
              />
              <TextField
                fullWidth
                label="Giá (VNĐ)"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleFormChange}
                margin="normal"
              />
              <DatePicker
                label="Ngày bắt đầu"
                value={formData.start_date}
                onChange={handleStartDateChange}
                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
              />
              <DatePicker
                label="Ngày kết thúc"
                value={formData.end_date}
                onChange={handleEndDateChange}
                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
              />
              <Autocomplete
                multiple
                options={tags}
                getOptionLabel={option => option.name}
                value={formData.tags}
                onChange={handleTagsChange}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option.name} {...getTagProps({ index })} key={option.id} />
                  ))
                }
                renderInput={params => (
                  <TextField {...params} variant="outlined" label="Tags" margin="normal" />
                )}
              />
              <TextField
                fullWidth
                type="file"
                label="Hình ảnh"
                InputLabelProps={{ shrink: true }}
                onChange={handleImageChange}
                margin="normal"
                inputProps={{ accept: 'image/*' }}
              />

              {/* Document Management Section */}
              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Tài liệu khóa học
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddDocument}
                  sx={{ mb: 2 }}
                >
                  Thêm tài liệu
                </Button>
                {formData.documents.map((doc, index) => (
                  !doc.toDelete && (
                    <Box key={doc.id} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TextField
                          label="Tiêu đề tài liệu"
                          value={doc.title}
                          onChange={(e) => handleDocumentTitleChange(index, e.target.value)}
                          size="small"
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          select
                          label="Loại tài liệu"
                          value={doc.type || 'file'}
                          onChange={(e) => handleDocumentTypeChange(index, e.target.value)}
                          size="small"
                          sx={{ minWidth: 120 }}
                        >
                          <MenuItem value="file">File PDF</MenuItem>
                          <MenuItem value="youtube">YouTube Link</MenuItem>
                        </TextField>
                        <IconButton
                          color="primary"
                          onClick={() => handleEditDocument(index)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveDocument(index)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      {doc.type === 'file' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <TextField
                            type="file"
                            label={doc.isNew ? "Chọn file" : "Thay đổi file"}
                            InputLabelProps={{ shrink: true }}
                            onChange={(e) => handleDocumentFileChange(index, e.target.files[0])}
                            size="small"
                            inputProps={{ accept: '.pdf,.doc,.docx,.txt,.ppt,.pptx' }}
                            sx={{ flex: 1 }}
                          />
                          {!doc.isNew && doc.file_url && (
                            <Typography variant="body2" sx={{ flex: 1, color: 'text.secondary' }}>
                              File hiện tại: {doc.file_url.split('/').pop()}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <TextField
                          label="YouTube URL"
                          value={doc.youtube_url || ''}
                          onChange={(e) => handleDocumentYouTubeChange(index, e.target.value)}
                          size="small"
                          sx={{ flex: 1 }}
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      )}
                    </Box>
                  )
                ))}
              </Box>
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} disabled={formLoading}>
            Hủy
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            variant="outlined"
            disabled={formLoading}
          >
            Lưu nháp
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            variant="contained"
            disabled={formLoading}
          >
            {editMode ? 'Cập nhật' : 'Xuất bản'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
      >
        <DialogTitle>Xác nhận xóa khóa học</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc chắn muốn xóa khóa học "{courseToDelete?.title}" không?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Hủy</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">Xóa</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MyCourses;
