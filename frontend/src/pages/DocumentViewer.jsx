import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Snackbar,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import api, { endpoints } from '../services/apis';
import authUtils from '../services/auth';

const DocumentViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      // Check if user is authenticated before making API call
      if (!authUtils.isAuthenticated()) {
        setError('Vui lòng đăng nhập để xem tài liệu.');
        return;
      }

      const response = await api.get(endpoints.document.detail(id));
      setDocument(response.data);
    } catch (err) {
      console.error('Error fetching document:', err);
      if (err.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (err.response?.status === 403) {
        setError('Bạn không có quyền truy cập tài liệu này.');
      } else if (err.response?.status === 404) {
        setError('Không tìm thấy tài liệu.');
      } else {
        setError('Không thể tải tài liệu. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const renderDocumentContent = () => {
    if (!document) return null;

    // Check if it's a YouTube URL
    if (document.url) {
      const videoId = getYouTubeVideoId(document.url);
      if (videoId) {
        return (
          <Box sx={{ width: '100%', maxWidth: '800px', mx: 'auto' }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              {document.title}
            </Typography>
            <Box
              sx={{
                position: 'relative',
                paddingBottom: '56.25%', // 16:9 aspect ratio
                height: 0,
                overflow: 'hidden',
                borderRadius: 2,
                boxShadow: 3,
              }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={document.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                }}
              />
            </Box>
            {document.uploaded_by && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Được tải lên bởi: {document.uploaded_by.full_name || document.uploaded_by.username}
              </Typography>
            )}
          </Box>
        );
      } else {
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              {document.title}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Link YouTube không hợp lệ
            </Typography>
            <Button
              variant="contained"
              href={document.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Mở trong tab mới
            </Button>
          </Box>
        );
      }
    }

    // Check if it's a PDF file
    if (document.file) {
      const fileUrl = document.file;
      const isPDF = fileUrl.toLowerCase().endsWith('.pdf');

      if (isPDF) {
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              {document.title}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              PDF Document
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ minWidth: 150 }}
              >
                Xem PDF
              </Button>
              <Button
                variant="outlined"
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                sx={{ minWidth: 150 }}
              >
                Tải xuống
              </Button>
            </Box>
            {document.uploaded_by && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                Được tải lên bởi: {document.uploaded_by.full_name || document.uploaded_by.username}
              </Typography>
            )}
          </Box>
        );
      } else {
        // For other file types, provide download link
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              {document.title}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              File không thể xem trực tiếp. Vui lòng tải xuống để xem.
            </Typography>
            <Button
              variant="contained"
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              Tải xuống file
            </Button>
            {document.uploaded_by && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Được tải lên bởi: {document.uploaded_by.full_name || document.uploaded_by.username}
              </Typography>
            )}
          </Box>
        );
      }
    }

    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" gutterBottom>
          {document.title}
        </Typography>
        <Typography variant="body1">
          Không có nội dung để hiển thị
        </Typography>
      </Box>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="outlined" onClick={handleBack}>
            Quay lại
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      {/* Back button */}
      <Box sx={{ mb: 3 }}>
        <IconButton
          onClick={handleBack}
          sx={{
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': { bgcolor: 'grey.100' }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Box>

      {/* Document content */}
      {renderDocumentContent()}

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

export default DocumentViewer;
