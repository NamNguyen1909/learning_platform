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
    documents: [], // Array of documents (local for new course, fetched for edit)
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

  // Document modal states
  const [openDocumentModal, setOpenDocumentModal] = useState(false);
  const [documentForm, setDocumentForm] = useState({
    id: null,
    title: '',
    type: 'file',
    file: null,
    youtube_url: '',
    original_type: 'file',
    file_url: '',
  });
  const [isDocumentEdit, setIsDocumentEdit] = useState(false);

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

  const fetchCourseDocuments = async (courseId) => {
    try {
      const response = await api.get(endpoints.document.list({ course: courseId }));
      let documentsData = [];
      if (Array.isArray(response.data)) {
        documentsData = response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        documentsData = response.data.results;
      }
      const existingDocuments = documentsData.map(doc => ({
        id: doc.id,
        title: doc.title,
        file: null, // Can't prefill file input
        isNew: false,
        toDelete: false,
        file_url: doc.file, // Keep original file URL
        type: doc.url ? 'youtube' : 'file', // Set type based on content
        youtube_url: doc.url || '',
        uploaded_by: doc.uploaded_by || null, // Add uploaded_by field if available
      }));
      setFormData(prev => ({ ...prev, documents: existingDocuments }));
    } catch (error) {
      console.error('Error fetching documents:', error);
      setFormData(prev => ({ ...prev, documents: [] }));
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
        // Handle new documents for newly created course
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

  // Handle document operations (only for new courses)
  const handleDocumentOperations = async (courseId) => {
    try {
      for (const doc of formData.documents) {
        const docFormData = new FormData();
        docFormData.append('course', courseId);
        docFormData.append('title', doc.title);

        if (doc.type === 'file') {
          if (doc.file instanceof File) {
            docFormData.append('file', doc.file);
          }
        } else if (doc.type === 'youtube') {
          if (doc.youtube_url.trim()) {
            docFormData.append('url', doc.youtube_url);
          }
        }

        // For new course, all docs are new
        await api.post(endpoints.document.create, docFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
    } catch (error) {
      console.error('Error handling document operations:', error);
      setSnackbar({ open: true, message: 'Lỗi xử lý tài liệu: ' + error.message, severity: 'error' });
    }
  };

  const handleEditClick = async (course) => {
    setEditMode(true);
    setEditingCourseId(course.id);
    // Convert tag names to tag objects for Autocomplete
    const courseTagObjects = tags.filter(tag => course.tags.includes(tag.name));

    setFormData({
      title: course.title || '',
      description: course.description || '',
      image: null, // image file cannot be prefilled, user can upload new image if needed
      price: course.price || 0,
      start_date: course.start_date ? dayjs(course.start_date) : null,
      end_date: course.end_date ? dayjs(course.end_date) : null,
      tags: courseTagObjects,
      is_published: course.is_published || false,
      documents: [], // Will be fetched
    });
    await fetchCourseDocuments(course.id);
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

  // Document modal handlers
  const handleOpenDocumentModal = (doc = null) => {
    if (doc) {
      setDocumentForm({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        original_type: doc.type,
        file: null,
        youtube_url: doc.youtube_url || '',
        file_url: doc.file_url,
      });
      setIsDocumentEdit(true);
    } else {
      setDocumentForm({
        id: null,
        title: '',
        type: 'file',
        original_type: 'file',
        file: null,
        youtube_url: '',
        file_url: '',
      });
      setIsDocumentEdit(false);
    }
    setOpenDocumentModal(true);
  };

  const handleCloseDocumentModal = () => {
    setOpenDocumentModal(false);
  };

  const handleDocumentFormChange = (e) => {
    const { name, value } = e.target;
    setDocumentForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDocumentFileChange = (e) => {
    setDocumentForm(prev => ({ ...prev, file: e.target.files[0] }));
    const file = e.target.files[0];
    if (file && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setSnackbar({ open: true, message: 'Chỉ được phép tải lên file PDF (.pdf)', severity: 'warning' });
      return;
    }
    setDocumentForm(prev => ({ ...prev, file }));
  };

  const handleSubmitDocument = async () => {
    if (!documentForm.title.trim()) {
      setSnackbar({ open: true, message: 'Vui lòng nhập tiêu đề tài liệu.', severity: 'warning' });
      return;
    }
    if (documentForm.type === 'file' && !documentForm.file && !isDocumentEdit) {
      setSnackbar({ open: true, message: 'Vui lòng chọn file cho tài liệu.', severity: 'warning' });
      return;
    }
    if (documentForm.type === 'file' && documentForm.file) {
      const file = documentForm.file;
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setSnackbar({ open: true, message: 'Chỉ được phép tải lên file PDF (.pdf)', severity: 'warning' });
        return;
      }
    }
    if (documentForm.type === 'youtube' && !documentForm.youtube_url.trim()) {
      setSnackbar({ open: true, message: 'Vui lòng nhập URL YouTube.', severity: 'warning' });
      return;
    }

    const docData = new FormData();
    docData.append('title', documentForm.title);

    if (documentForm.type === 'file') {
      // Only append file if there's a new file to upload
      if (documentForm.file) {
        docData.append('file', documentForm.file);
      }
      // For editing: if no new file is selected, don't send file field
      // Backend will keep the existing file
    } else if (documentForm.type === 'youtube') {
      if (documentForm.youtube_url.trim()) {
        docData.append('url', documentForm.youtube_url);
      }
      // For editing: if no new URL is provided, don't send url field
      // Backend will keep the existing URL
    }

    try {
      if (editMode) {
        // Existing course: call API immediately
        docData.append('course', editingCourseId);
        if (isDocumentEdit) {
          await api.patch(endpoints.document.update(documentForm.id), docData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          await api.post(endpoints.document.create, docData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
        // Refetch documents after operation
        await fetchCourseDocuments(editingCourseId);
      } else {
        // New course: handle in local state
        const newDoc = {
          id: documentForm.id || Date.now(),
          title: documentForm.title,
          type: documentForm.type,
          file: documentForm.file,
          youtube_url: documentForm.youtube_url,
          isNew: !isDocumentEdit,
          file_url: documentForm.file ? URL.createObjectURL(documentForm.file) : (documentForm.file_url || ''),
        };
        setFormData(prev => {
          if (isDocumentEdit) {
            const updatedDocs = prev.documents.map(d => d.id === newDoc.id ? newDoc : d);
            return { ...prev, documents: updatedDocs };
          } else {
            return { ...prev, documents: [...prev.documents, newDoc] };
          }
        });
      }
      setSnackbar({ open: true, message: 'Tài liệu đã được lưu thành công!', severity: 'success' });
      handleCloseDocumentModal();
    } catch (error) {
      console.error('Error saving document:', error);
      setSnackbar({ open: true, message: 'Có lỗi xảy ra khi lưu tài liệu!', severity: 'error' });
    }
  };

  const handleDeleteDocument = async (doc) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return;

    try {
      if (editMode) {
        // Existing course: delete via API
        await api.delete(endpoints.document.delete(doc.id));
        await fetchCourseDocuments(editingCourseId);
      } else {
        // New course: remove from local state
        setFormData(prev => ({
          ...prev,
          documents: prev.documents.filter(d => d.id !== doc.id)
        }));
      }
      setSnackbar({ open: true, message: 'Tài liệu đã được xóa thành công!', severity: 'success' });
    } catch (error) {
      console.error('Error deleting document:', error);
      setSnackbar({ open: true, message: 'Có lỗi xảy ra khi xóa tài liệu!', severity: 'error' });
    }
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
                  onClick={() => handleOpenDocumentModal()}
                  sx={{ mb: 2 }}
                >
                  Thêm tài liệu
                </Button>
                {formData.documents.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Chưa có tài liệu cho khóa học này.
                  </Typography>
                ) : (
                  <Box sx={{ bgcolor: "#fafafa", borderRadius: 2, boxShadow: 1, p: 2 }}>
                    {formData.documents.map((doc) => (
                      <Box
                        key={doc.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          mb: 2,
                          p: 1,
                          borderBottom: "1px solid #eee",
                          cursor: "pointer",
                          "&:hover": { bgcolor: "#e3eafc" },
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          fontWeight={500}
                          color="primary"
                          sx={{ flex: 1, textDecoration: "underline" }}
                        >
                          {doc.title}
                        </Typography>
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDocumentModal(doc)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteDocument(doc)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
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

      {/* Document Modal */}
      <Dialog open={openDocumentModal} onClose={handleCloseDocumentModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isDocumentEdit ? 'Chỉnh sửa tài liệu' : 'Thêm tài liệu mới'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Tiêu đề tài liệu"
            name="title"
            value={documentForm.title}
            onChange={handleDocumentFormChange}
            margin="normal"
            required
          />
          <TextField
            select
            fullWidth
            label="Loại tài liệu"
            name="type"
            value={documentForm.type}
            onChange={handleDocumentFormChange}
            margin="normal"
          >
            <MenuItem value="file">File PDF</MenuItem>
            <MenuItem value="youtube">YouTube Link</MenuItem>
          </TextField>
          {documentForm.type === 'file' ? (
            <>
              <TextField
                fullWidth
                type="file"
                label={isDocumentEdit ? "Thay đổi file (tùy chọn)" : "Chọn file"}
                InputLabelProps={{ shrink: true }}
                onChange={handleDocumentFileChange}
                margin="normal"
                inputProps={{ accept: '.pdf,.doc,.docx,.txt,.ppt,.pptx' }}
              />
              {isDocumentEdit && documentForm.file_url && (
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                  File hiện tại: {documentForm.file_url.split('/').pop()}
                </Typography>
              )}
            </>
          ) : (
            <TextField
              fullWidth
              label="YouTube URL"
              name="youtube_url"
              value={documentForm.youtube_url}
              onChange={handleDocumentFormChange}
              margin="normal"
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDocumentModal}>Hủy</Button>
          <Button variant="contained" onClick={handleSubmitDocument}>
            {isDocumentEdit ? 'Cập nhật' : 'Thêm'}
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