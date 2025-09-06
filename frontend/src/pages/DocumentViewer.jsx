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

  // Component Video chỉ nhận props, không khai báo lại state/hàm
  const Video = ({ videoId, completion, handleMarkComplete }) => {
    const playerRef = React.useRef(null);
    const [duration, setDuration] = useState(0);
    const [completed, setCompleted] = useState(false);

    React.useEffect(() => {
      playerRef.current = null;
      setDuration(0);
      setCompleted(false);
    }, [videoId]);

    useSmartPolling(async () => {
      const player = playerRef.current;
      if (!player) {
        console.log('Polling: player chưa sẵn sàng');
        return;
      }
      if (duration <= 0) {
        console.log('Polling: duration chưa có');
        return;
      }
      if (completed) {
        console.log('Polling: đã hoàn thành, không cần check');
        return;
      }
      // if (!completion || completion.is_complete) {
      //   console.log('Polling: completion chưa có hoặc đã hoàn thành');
      //   return;
      // }
      const currentTime = player.getCurrentTime();
      console.log(`Video current time: ${currentTime}s / ${duration}s`);
      if (currentTime / duration >= 0.8) {
        setCompleted(true);
        await handleMarkComplete();
      }
    }, 10000);


    const onReady = (event) => {
      playerRef.current = event.target;
      setDuration(event.target.getDuration());
      console.log('onReady: player đã sẵn sàng', event.target);

    };
    const onStateChange = (event) => {
      if (event.data === window.YT.PlayerState.PLAYING) {
        // Có thể lấy currentTime nếu cần
      }
      if (event.data === window.YT.PlayerState.ENDED) {
        if (!completed && completion && !completion.is_complete) {
          setCompleted(true);
          handleMarkComplete();
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
  };



  // Đánh dấu hoàn thành tài liệu
  const handleMarkComplete = async () => {
    try {
      setCompletionLoading(true);
      // Gửi user info và document id cho backend
      const user = await authUtils.getCurrentUser();
      console.log('Marking document complete for user:', user);
      console.log('Document ID being marked complete:', id);
      const res = await api.post(endpoints.documentCompletion.markComplete(id), {
        user: user?.id,
        document: id,
      });
      console.log('Mark complete response:', res.data);
      setCompletion(res.data);
      setSnackbar({ open: true, message: 'Đã đánh dấu hoàn thành tài liệu!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Không thể đánh dấu hoàn thành.', severity: 'error' });
    } finally {
      setCompletionLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [id]);

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
      // Kiểm tra quyền truy cập: user phải có CourseProgress với course_id tương ứng
      const courseId = response.data.course?.id || response.data.course;
      if (!courseId) {
        setError('Tài liệu không có thông tin khóa học.');
        return;
      }
      // Gọi API lấy danh sách progress của user cho course này
      try {
        const progressRes = await api.get(endpoints.courseProgress.list + `?course=${courseId}`);
        if (Array.isArray(progressRes.data) && progressRes.data.length > 0) {
          setHasCourseAccess(true);
        } else {
          setHasCourseAccess(false);
          setError('Bạn chưa đăng ký hoặc chưa được cấp quyền truy cập tài liệu này.');
        }
      } catch (progressErr) {
        setHasCourseAccess(false);
        setError('Không thể kiểm tra quyền truy cập tài liệu.');
      }
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

    if (!hasCourseAccess) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Bạn chưa đăng ký hoặc chưa được cấp quyền truy cập tài liệu này.
          </Alert>
          <Button variant="outlined" onClick={handleBack}>Quay lại</Button>
        </Box>
      );
    }

    if (documentData.url) {
      const videoId = getYouTubeVideoId(documentData.url);
      if (videoId) {
        return (
          <Box sx={{ width: '100%', maxWidth: '800px', mx: 'auto' }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              {documentData.title}
            </Typography>
            <Box sx={{ mb: 2 }}>
                <Video
                  videoId={videoId}
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