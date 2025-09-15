import React, { useEffect, useState } from 'react';
import YouTube from 'react-youtube';
import { useSmartPolling } from '../hooks/useSmartPolling';
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

// Move Video outside DocumentViewer to prevent re-mount
const Video = React.memo(({ videoId, fetchCompletionStatus, completion, handleMarkComplete }) => {
  const playerRef = React.useRef(null);
  const [duration, setDuration] = useState(0);
  const [localCompleted, setLocalCompleted] = useState(false);

  React.useEffect(() => {
    playerRef.current = null;
    setDuration(0);
    setLocalCompleted(false);
  }, [videoId]);

  // Polling: check video progress and always fetch completion status from backend
  useSmartPolling(async () => {
    const player = playerRef.current;
    if (!player) return;
    if (duration <= 0) return;
    if (localCompleted) return;
    await fetchCompletionStatus(); // always fetch from backend
    if (completion?.is_complete) return;
    const currentTime = player.getCurrentTime();
    if (currentTime / duration >= 0.8) {
      setLocalCompleted(true);
      await handleMarkComplete();
      await fetchCompletionStatus();
    }
  }, 10000);

  const onReady = (event) => {
    playerRef.current = event.target;
    setDuration(event.target.getDuration());
  };
  const onStateChange = async (event) => {
    if (event.data === window.YT.PlayerState.ENDED) {
      if (!localCompleted && !completion?.is_complete) {
        setLocalCompleted(true);
        await handleMarkComplete();
        await fetchCompletionStatus();
      }
    }
  };
  return (
    <YouTube
      videoId={videoId}
      opts={{ width: '100%', height: '390' }}
      onReady={onReady}
      onStateChange={onStateChange}
    />
  );
});

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
  const [hasCourseAccess, setHasCourseAccess] = useState(false);
  const [completion, setCompletion] = useState(null); // DocumentCompletion object
  const [completionLoading, setCompletionLoading] = useState(false);




  // Đánh dấu hoàn thành tài liệu
  const fetchCompletionStatus = async () => {
    try {
      const user = await authUtils.getCurrentUser();
      if (!user) return;
      const res = await api.get(endpoints.documentCompletion.list + `?user=${user.id}&document=${id}`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setCompletion(res.data[0]);
      } else {
        setCompletion(null);
      }
    } catch (err) {
      setCompletion(null);
    }
  };

  const handleMarkComplete = async () => {
    try {
      setCompletionLoading(true);
      const user = await authUtils.getCurrentUser();
      const res = await api.post(endpoints.documentCompletion.markComplete(id), {
        user: user?.id,
        document: id,
      });
      setCompletion(res.data);
      await fetchCompletionStatus();
    } catch (err) {
      console.error('Error marking document complete:', err);
    } finally {
      setCompletionLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [id]);

  // Luôn kiểm tra trạng thái hoàn thành khi documentData hoặc id thay đổi
  useEffect(() => {
    if (documentData) {
      fetchCompletionStatus();
    }
  }, [documentData, id]);

  useEffect(() => {
    if (documentData && hasCourseAccess) {
      if (documentData.file && documentData.file.toLowerCase().endsWith('.pdf')) {
        loadPdf();
      }
    }
  }, [documentData, hasCourseAccess]);

const fetchDocument = async () => {
  try {
    setLoading(true);
    if (!authUtils.isAuthenticated()) {
      setError('Vui lòng đăng nhập để xem tài liệu.');
      return;
    }
    // Lấy thông tin document
    const response = await api.get(endpoints.document.detail(id));
    setDocumentData(response.data);

    // Kiểm tra quyền truy cập
    const courseId = response.data.course?.id || response.data.course;
    const user = await authUtils.getCurrentUser();
    let allowAccess = false;

    // Instructor hoặc admin hoặc người upload thì cho phép truy cập
    if (
      user?.role === 'admin' ||
      user?.role === 'instructor' ||
      user?.id === response.data.uploaded_by?.id
    ) {
      allowAccess = true;
    } else {
      // Learner: kiểm tra CourseProgress
      try {
        const progressRes = await api.get(endpoints.courseProgress.list + `?course=${courseId}`);
        if (Array.isArray(progressRes.data) && progressRes.data.length > 0) {
          allowAccess = true;
        }
      } catch (progressErr) {
        allowAccess = false;
      }
    }

    setHasCourseAccess(allowAccess);
    if (!allowAccess) {
      setError('Bạn chưa đăng ký hoặc chưa được cấp quyền truy cập tài liệu này.');
    }
  } catch (err) {
    // ...existing error handling...
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


  // Tách Video ra ngoài, chỉ render khi có videoId
  const videoId = documentData?.url ? getYouTubeVideoId(documentData.url) : null;

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
      {/* Inline document rendering logic */}
      {!documentData ? null :
        !hasCourseAccess ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              Bạn chưa đăng ký hoặc chưa được cấp quyền truy cập tài liệu này.
            </Alert>
            <Button variant="outlined" onClick={handleBack}>Quay lại</Button>
          </Box>
        ) : videoId ? (
          <Box sx={{ width: '100%', maxWidth: '800px', mx: 'auto' }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              {documentData.title}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Video
                videoId={videoId}
                fetchCompletionStatus={fetchCompletionStatus}
                completion={completion}
                handleMarkComplete={handleMarkComplete}
              />
            </Box>
            {documentData.uploaded_by && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Được tải lên bởi: {documentData.uploaded_by.full_name || documentData.uploaded_by.username}
              </Typography>
            )}
          </Box>
        ) : documentData.file ? (
          (() => {
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
                    {/* Nút hoàn thành tài liệu */}
                    <Button
                      variant="contained"
                      color="success"
                      disabled={completion?.is_complete || completionLoading}
                      onClick={handleMarkComplete}
                      sx={{ ml: 2 }}
                    >
                      {completion?.is_complete ? 'Đã hoàn thành' : 'Hoàn thành tài liệu'}
                    </Button>
                  </Box>
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
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                          scale={1.2}
                          position="relative"
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
          })()
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              {documentData.title}
            </Typography>
            <Typography variant="body1">
              Không có nội dung để hiển thị
            </Typography>
          </Box>
        )
      }
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