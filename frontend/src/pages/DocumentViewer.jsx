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
import { Document, Page, pdfjs } from 'react-pdf';
import api, { endpoints } from '../services/apis';
import authUtils from '../services/auth';

// Configure PDF.js worker
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'; // Sử dụng tệp local .mjs
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const DocumentViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [pdfBlob, setPdfBlob] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  useEffect(() => {
    if (documentData && documentData.file && documentData.file.toLowerCase().endsWith('.pdf')) {
      loadPdf();
    }
  }, [documentData]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      if (!authUtils.isAuthenticated()) {
        setError('Vui lòng đăng nhập để xem tài liệu.');
        return;
      }

      const response = await api.get(endpoints.document.detail(id));
      setDocumentData(response.data);
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
    navigate(-1);
  };

  const loadPdf = async () => {
    try {
      setPdfLoading(true);
      const response = await api.get(endpoints.document.download(id), {
        responseType: 'blob',
      });
      console.log('Response headers:', response.headers);
      console.log('Blob size:', response.data.size);
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
      if (blob.size === 0) {
        setSnackbar({
          open: true,
          message: 'Tài liệu tải xuống bị trống. Vui lòng thử lại.',
          severity: 'error',
        });
        return;
      }
      setPdfBlob(blob);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setSnackbar({
        open: true,
        message: 'Không thể tải PDF. Vui lòng thử lại.',
        severity: 'error',
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const renderDocumentContent = () => {
    if (!documentData) return null;

    if (documentData.url) {
      const videoId = getYouTubeVideoId(documentData.url);
      if (videoId) {
        return (
          <Box sx={{ width: '100%', maxWidth: '800px', mx: 'auto' }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              {documentData.title}
            </Typography>
            <Box
              sx={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                overflow: 'hidden',
                borderRadius: 2,
                boxShadow: 3,
              }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={documentData.title}
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
            {documentData.uploaded_by && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Được tải lên bởi: {documentData.uploaded_by.full_name || documentData.uploaded_by.username}
              </Typography>
            )}
          </Box>
        );
      } else {
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              {documentData.title}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Link YouTube không hợp lệ
            </Typography>
            <Button
              variant="contained"
              href={documentData.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Mở trong tab mới
            </Button>
          </Box>
        );
      }
    }

    if (documentData.file) {
      const isPDF = documentData.file.toLowerCase().endsWith('.pdf');
      if (isPDF) {
        return (
          <Box sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5">
                {documentData.title}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={async () => {
                  try {
                    const response = await api.get(endpoints.document.download(id), {
                      responseType: 'blob',
                    });
                    const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
                    if (blob.size === 0) {
                      setSnackbar({
                        open: true,
                        message: 'Tài liệu tải xuống bị trống. Vui lòng thử lại.',
                        severity: 'error',
                      });
                      return;
                    }
                    const url = window.URL.createObjectURL(blob);
                    const link = window.document.createElement('a');
                    link.href = url;
                    link.download = documentData.file;
                    window.document.body.appendChild(link);
                    link.click();
                    window.document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Error downloading document:', error);
                    setSnackbar({
                      open: true,
                      message: 'Không thể tải tài liệu. Vui lòng thử lại.',
                      severity: 'error',
                    });
                  }
                }}
              >
                Tải xuống PDF
              </Button>
            </Box>
            <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
              PDF Document
            </Typography>
            {pdfLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : pdfBlob ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Document
                  file={pdfBlob}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  onLoadError={(error) => {
                    console.error('Error loading PDF document:', error);
                    setSnackbar({
                      open: true,
                      message: 'Không thể tải PDF. Vui lòng thử lại.',
                      severity: 'error',
                    });
                  }}
                  loading={
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <CircularProgress />
                    </Box>
                  }
                >
                  <Page
                    pageNumber={pageNumber}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    scale={1.2}
                  />
                </Document>
                {numPages && numPages > 1 && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                      disabled={pageNumber <= 1}
                    >
                      Trước
                    </Button>
                    <Typography variant="body2">
                      Trang {pageNumber} / {numPages}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                      disabled={pageNumber >= numPages}
                    >
                      Sau
                    </Button>
                  </Box>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Đang tải PDF...
              </Typography>
            )}
            {documentData.uploaded_by && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
                Được tải lên bởi: {documentData.uploaded_by.full_name || documentData.uploaded_by.username}
              </Typography>
            )}
          </Box>
        );
      } else {
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              {documentData.title}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              File không thể xem trực tiếp. Vui lòng tải xuống để xem.
            </Typography>
            <Button
              variant="contained"
              onClick={async () => {
                try {
                  const response = await api.get(endpoints.document.download(id), {
                    responseType: 'blob',
                  });
                  const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
                  const url = window.URL.createObjectURL(blob);
                  const link = window.document.createElement('a');
                  link.href = url;
                  link.download = documentData.title;
                  window.document.body.appendChild(link);
                  link.click();
                  window.document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                } catch (error) {
                  console.error('Error downloading document:', error);
                  setSnackbar({
                    open: true,
                    message: 'Không thể tải tài liệu. Vui lòng thử lại.',
                    severity: 'error',
                  });
                }
              }}
            >
              Tải xuống file
            </Button>
            {documentData.uploaded_by && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Được tải lên bởi: {documentData.uploaded_by.full_name || documentData.uploaded_by.username}
              </Typography>
            )}
          </Box>
        );
      }
    }

    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" gutterBottom>
          {documentData.title}
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
      <Box sx={{ mb: 3 }}>
        <IconButton
          onClick={handleBack}
          sx={{
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': { bgcolor: 'grey.100' },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Box>
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