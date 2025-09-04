import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  TextField,
  Rating,
  Avatar,
  IconButton,
  Collapse,
  Chip,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ReplyIcon from "@mui/icons-material/Reply";

import api, { endpoints } from "../services/apis";
import authUtils from "../services/auth";

// Helper: format date (đặt ngoài component để không ảnh hưởng đến hooks)
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const CourseDetail = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [hasCourseProgress, setHasCourseProgress] = useState(null); // null: chưa xác định, true/false: đã kiểm tra
  const [courseProgress, setCourseProgress] = useState(null); // lưu object CourseProgress nếu có
  const navigate = useNavigate();

  // Review state
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [replyForm, setReplyForm] = useState({}); // { [reviewId]: { comment: '' } }
  const [replying, setReplying] = useState({}); // { [reviewId]: true/false }
  const [showReplyBox, setShowReplyBox] = useState({}); // { [reviewId]: true/false }
  const [currentUser, setCurrentUser] = useState(null);

  // --- All hooks must be here, before any return or conditional ---
  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (course) fetchReviews(1);
    // eslint-disable-next-line
  }, [course]);

  useEffect(() => {
    const fetchUser = async () => {
      if (authUtils.isAuthenticated()) {
        try {
          const user = await authUtils.getCurrentUser();
          setCurrentUser(user);
        } catch {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  // Handle payment result from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentResult = urlParams.get('payment_result');
    const message = urlParams.get('message');
    const autoRefresh = urlParams.get('auto_refresh');

    if (paymentResult && message) {
      // Decode the message from URL encoding
      const decodedMessage = decodeURIComponent(message);

      setSnackbar({
        open: true,
        message: decodedMessage,
        severity: paymentResult === 'success' ? 'success' : 'error',
      });

      // If auto_refresh is true, reload course progress after showing message
      if (autoRefresh === 'true' && paymentResult === 'success') {
        setTimeout(() => {
          checkCourseProgress(id);
        }, 1000); // Small delay to ensure message is shown
      }

      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [id]);
  // --- End move hooks ---

  // Hàm kiểm tra user đã có CourseProgress cho khóa học chưa, trả về true/false và cập nhật state
  const checkCourseProgress = async (courseId) => {
    const token = localStorage.getItem("access_token");
    if (!authUtils.isAuthenticated()) {
      setHasCourseProgress(false);
      setCourseProgress(null);
      console.log("Not authenticated, token:", token);
      return false;
    }
    try {
      // console.log("Checking course progress for user...", "token:", token);
      const res = await api.get(endpoints.courseProgress.list, {
        params: { course: courseId },
      });
      console.log("API /api/course-progress response:", res);
      if (Array.isArray(res.data) && res.data.length > 0) {
        console.log("User has course progress:", res.data[0]);
        setCourseProgress(res.data[0]);
        setHasCourseProgress(true);
        return true;
      }
      console.log("User does not have course progress, data:", res.data);
      setCourseProgress(null);
      setHasCourseProgress(false);
      return false;
    } catch (err) {
      setCourseProgress(null);
      setHasCourseProgress(false);
      console.error("Error checking course progress:", err);
      return false;
    }
  };

  // Hàm load toàn bộ dữ liệu (course, documents, progress)
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [courseRes, docRes] = await Promise.all([
        api.get(endpoints.course.detail(id)),
        api.get(endpoints.document.list({ course: id })),
      ]);
      setCourse(courseRes.data);
      setDocuments(docRes.data);
    } finally {
      setLoading(false);
    }
    await checkCourseProgress(id);
  };

  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line
  }, [id]);

  // Xử lý click document: nếu chưa đăng nhập thì redirect login, nếu đã đăng nhập thì sang trang chi tiết document (sau này kiểm tra quyền ở BE)
  const handleDocumentClick = async (doc) => {
    if (!authUtils.isAuthenticated()) {
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }
    // Kiểm tra lại quyền truy cập tài liệu (tái sử dụng hàm)
    const hasProgress = hasCourseProgress ?? (await checkCourseProgress(id));
    if (!hasProgress) {
      setSnackbar({
        open: true,
        message: "Bạn cần đăng ký khóa học để xem tài liệu!",
        severity: "warning",
      });
      return;
    }
    // Đã đăng ký, cho phép xem tài liệu
    if (doc.url) {
      // If document is a YouTube link, open DocumentViewer page
      navigate(`/documents/${doc.id}`);
    } else if (doc.file) {
      // If document is a file (e.g. PDF), open DocumentViewer page
      navigate(`/documents/${doc.id}`);
    } else {
      // Fallback: just navigate to document page
      navigate(`/documents/${doc.id}`);
    }
  };

  // Xử lý click đăng ký hoặc vào học
  const handleRegisterOrLearnClick = async () => {
    if (!authUtils.isAuthenticated()) {
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }
    if (hasCourseProgress && courseProgress) {
      // Đã đăng ký, vào học: tìm document đầu tiên chưa hoàn thành hoặc đầu tiên
      let nextDoc = null;
      // Nếu có trường document_completion hoặc cần fetch thêm, có thể mở rộng ở đây
      // Hiện tại, mặc định vào document đầu tiên
      if (documents && documents.length > 0) {
        nextDoc = documents[0];
      }
      if (nextDoc) {
        navigate(`/documents/${nextDoc.id}`);
      } else {
        setSnackbar({
          open: true,
          message: "Không tìm thấy tài liệu để học.",
          severity: "info",
        });
      }
      return;
    }
    // Chưa đăng ký: chuyển sang trang chọn phương thức thanh toán
    navigate(`/course-payment/${id}`);
  };

  const handleRegister = () => {
    setRegistering(true);
    api
      .post(endpoints.course.register(id))
      .then(() => {
        setSnackbar({
          open: true,
          message: "Đăng ký thành công!",
          severity: "success",
        });
      })
      .catch(() => {
        setSnackbar({
          open: true,
          message: "Đăng ký thất bại!",
          severity: "error",
        });
      })
      .finally(() => setRegistering(false));
  };

  if (loading)
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  if (!course)
    return (
      <Container maxWidth="lg">
        <Typography>Không tìm thấy khóa học.</Typography>
      </Container>
    );

  // Lấy review theo course, phân trang
  const fetchReviews = async (page = 1) => {
    setReviewLoading(true);
    try {
      const res = await api.get(endpoints.review.listByCourse(id, page));
      setReviews(
        page === 1 ? res.data.results : [...reviews, ...res.data.results]
      );
      setReviewCount(res.data.count);
      setReviewPage(page);
    } catch (e) {
      setReviews([]);
      setReviewCount(0);
    } finally {
      setReviewLoading(false);
    }
  };

  // Tạo hoặc cập nhật review (chỉ 1 review/user/course)
  const myReview = reviews.find(
    (r) => String(r.user?.id) === String(currentUser?.id)
  );
  const handleCreateOrUpdateReview = async () => {
    if (!authUtils.isAuthenticated()) {
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }
    if (!reviewForm.comment.trim()) {
      setSnackbar({
        open: true,
        message: "Vui lòng nhập nội dung đánh giá.",
        severity: "warning",
      });
      return;
    }
    try {
      if (myReview) {
        // Update review
        await api.put(endpoints.review.update(myReview.id), {
          course: id,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        });
        setSnackbar({
          open: true,
          message: "Đã cập nhật đánh giá!",
          severity: "success",
        });
      } else {
        // Create review
        await api.post(endpoints.review.create, {
          course: id,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        });
        setSnackbar({
          open: true,
          message: "Đã gửi đánh giá!",
          severity: "success",
        });
      }
      setReviewForm({ rating: 0, comment: "" });
      fetchReviews(1);
    } catch (e) {
      setSnackbar({
        open: true,
        message:
          e?.response?.data?.detail || e?.message || "Gửi đánh giá thất bại.",
        severity: "error",
      });
    }
  };

  // Xóa review của mình
  const handleDeleteReview = async () => {
    if (!myReview) return;
    try {
      await api.delete(endpoints.review.delete(myReview.id));
      setSnackbar({
        open: true,
        message: "Đã xóa đánh giá!",
        severity: "success",
      });
      setReviewForm({ rating: 0, comment: "" });
      fetchReviews(1);
    } catch (e) {
      setSnackbar({
        open: true,
        message: e?.response?.data?.detail || "Xóa đánh giá thất bại.",
        severity: "error",
      });
    }
  };

  // Tạo reply review
  const handleCreateReply = async (parentId) => {
    if (!authUtils.isAuthenticated()) {
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }
    const content = replyForm[parentId]?.comment?.trim();
    if (!content) {
      setSnackbar({
        open: true,
        message: "Vui lòng nhập nội dung trả lời.",
        severity: "warning",
      });
      return;
    }
    setReplying((r) => ({ ...r, [parentId]: true }));
    try {
      await api.post(endpoints.review.create, {
        course: id,
        comment: content,
        parent_review: parentId,
      });
      setReplyForm((f) => ({ ...f, [parentId]: { comment: "" } }));
      setShowReplyBox((b) => ({ ...b, [parentId]: false }));
      fetchReviews(1);
      setSnackbar({
        open: true,
        message: "Đã gửi trả lời!",
        severity: "success",
      });
    } catch (e) {
      setSnackbar({
        open: true,
        message:
          e?.response?.data?.detail || e?.message || "Gửi trả lời thất bại.",
        severity: "error",
      });
    }
    setReplying((r) => ({ ...r, [parentId]: false }));
  };
  // Điều kiện được reply: đã đăng nhập và đã mua khóa học
  const canReply = () => authUtils.isAuthenticated() && hasCourseProgress;
  // Render reply review (chỉ 1 cấp, không cho reply cho reply review)
  const renderReplies = (replies, parentId, parentUser) => (
    <Box sx={{ mt: 1 }}>
      {replies.map((reply) => (
        <Card
          key={reply.id}
          sx={{ mb: 1, bgcolor: "#f9f6f2", borderRadius: 2 }}
        >
          <CardContent sx={{ pb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Avatar
                src={reply.user?.avatar}
                sx={{ width: 32, height: 32, mr: 1 }}
              />
              <Typography fontWeight={600}>
                {reply.user?.full_name || reply.user?.username}
              </Typography>
              <Typography
                variant="caption"
                sx={{ ml: 2, color: "text.secondary" }}
              >
                {formatDate(reply.created_at)}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <b>Reply @{parentUser}:</b> {reply.comment}
            </Typography>
            {/* Không cho reply tiếp cho reply */}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
  // Render review gốc và reply
  const renderReviews = () => (
    <Box sx={{ mt: 4 }}>
      {/* DEBUG LOGS */}
      {/* {console.log("[DEBUG] currentUser:", currentUser)}
      {console.log("[DEBUG] reviews:", reviews)}
      {reviews.forEach((r) =>
        console.log("[DEBUG] review user id:", r.user?.id, "full:", r)
      )}
      {console.log("[DEBUG] myReview:", myReview)} */}
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Đánh giá khóa học
      </Typography>
      {reviewLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
          <CircularProgress />
        </Box>
      ) : reviews.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Chưa có đánh giá cho khóa học này.
        </Typography>
      ) : (
        <Box>
          {reviews.map((review) => (
            <Card
              key={review.id}
              sx={{ mb: 2, bgcolor: "background.paper", borderRadius: 2, boxShadow: 2, border: '1px solid #e3eaf2' }}
            >
              <CardContent sx={{ pb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Avatar
                    src={review.user?.avatar}
                    sx={{ width: 36, height: 36, mr: 1 }}
                  />
                  <Typography fontWeight={700}>
                    {review.user?.full_name || review.user?.username}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ ml: 2, color: "text.secondary" }}
                  >
                    {formatDate(review.created_at)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Rating
                    value={review.rating || 0}
                    readOnly
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {review.rating !== null && (
                    <Typography
                      variant="body2"
                      sx={{ color: "#8B4513", fontWeight: 600 }}
                    >
                      {/* {review.rating} sao */}
                    </Typography>
                  )}
                </Box>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {review.comment}
                </Typography>
                {/* Reply cho review gốc */}
                {canReply() && (
                  <Box>
                    <Button
                      size="small"
                      startIcon={<ReplyIcon />}
                      sx={{ textTransform: "none", fontSize: 14 }}
                      onClick={() =>
                        setShowReplyBox((b) => ({
                          ...b,
                          [review.id]: !b[review.id],
                        }))
                      }
                    >
                      Trả lời
                    </Button>
                    <Collapse in={!!showReplyBox[review.id]}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mt: 1 }}
                      >
                        <TextField
                          size="small"
                          placeholder="Nhập trả lời..."
                          value={replyForm[review.id]?.comment || ""}
                          onChange={(e) =>
                            setReplyForm((f) => ({
                              ...f,
                              [review.id]: { comment: e.target.value },
                            }))
                          }
                          sx={{ flex: 1, mr: 1 }}
                        />
                        <IconButton
                          color="primary"
                          onClick={() => handleCreateReply(review.id)}
                          disabled={replying[review.id]}
                        >
                          <SendIcon />
                        </IconButton>
                      </Box>
                    </Collapse>
                  </Box>
                )}
                {/* Hiển thị reply review */}
                {review.replies &&
                  review.replies.length > 0 &&
                  renderReplies(
                    review.replies,
                    review.id,
                    review.user?.full_name || review.user?.username
                  )}
              </CardContent>
            </Card>
          ))}
          {/* Nút xem thêm */}
          {reviewCount > reviews.length && (
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => fetchReviews(reviewPage + 1)}
                disabled={reviewLoading}
              >
                Xem thêm đánh giá
              </Button>
            </Box>
          )}
        </Box>
      )}
      {/* Form tạo/sửa review */}
      {authUtils.isAuthenticated() &&
        hasCourseProgress &&
        courseProgress &&
        (courseProgress.progress >= 50 || myReview) && (
          <Card sx={{ mt: 3, bgcolor: "#f5f5f5", borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {myReview
                  ? "Chỉnh sửa đánh giá của bạn"
                  : "Viết đánh giá của bạn"}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Rating
                  value={reviewForm.rating}
                  onChange={(_, v) =>
                    setReviewForm((f) => ({ ...f, rating: v }))
                  }
                  size="large"
                  sx={{ mr: 2 }}
                />
                <TextField
                  label="Nội dung đánh giá"
                  value={reviewForm.comment}
                  onChange={(e) =>
                    setReviewForm((f) => ({ ...f, comment: e.target.value }))
                  }
                  multiline
                  minRows={2}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ ml: 2, height: 48 }}
                  onClick={handleCreateOrUpdateReview}
                >
                  {myReview ? "Cập nhật" : "Gửi"}
                </Button>
                {myReview && (
                  <Button
                    variant="outlined"
                    color="error"
                    sx={{ ml: 2, height: 48 }}
                    onClick={handleDeleteReview}
                  >
                    Xóa
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid
        container
        columns={12}
        rowSpacing={4}
        columnSpacing={4}
        alignItems="stretch"
      >
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              width: "100%",
              height: { xs: 220, md: 320 },
              bgcolor: "#f5f5f5",
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: 2,
            }}
          >
            {course.image ? (
              <img
                src={course.image}
                alt={course.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "grey.400",
                }}
              >
                Không có hình ảnh
              </Box>
            )}
          </Box>
        </Grid>

        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{ display: "flex", flexDirection: "column" }}
        >
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {course.title}
          </Typography>
          {/* Hiển thị rating trung bình */}
          {reviews.length > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Rating
                value={
                  reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
                  reviews.length
                }
                precision={0.1}
                readOnly
                size="medium"
                sx={{ mr: 1 }}
              />
              <Typography
                variant="body2"
                sx={{ color: "#8B4513", fontWeight: 600 }}
              >
                {(
                  reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
                  reviews.length
                ).toFixed(1)}
                /5 ({reviews.length} đánh giá)
              </Typography>
            </Box>
          )}
          <Typography
            variant="subtitle1"
            color="primary"
            fontWeight={600}
            gutterBottom
          >
            Giá: {course.price.toLocaleString()} VNĐ
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {course.description}
          </Typography>
          {course.instructor && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Giảng viên: {" "}
              <b>{course.instructor.full_name || course.instructor.username}</b>
            </Typography>
          )}
          {course.tags && course.tags.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                Tags:
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {course.tags.map((tag, idx) => (
                  <Chip key={idx} label={tag} color="primary" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}
          {hasCourseProgress && courseProgress ? (
            <Button
              variant="contained"
              color={courseProgress.is_completed ? "success" : "primary"}
              onClick={
                courseProgress.is_completed
                  ? undefined
                  : handleRegisterOrLearnClick
              }
              disabled={courseProgress.is_completed}
              sx={{ mb: 3, minWidth: 180 }}
            >
              {courseProgress.is_completed ? "Đã hoàn thành" : "Vào học"}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleRegisterOrLearnClick}
              disabled={registering}
              sx={{ mb: 3, minWidth: 180 }}
            >
              {registering ? "Đang đăng ký..." : "Đăng ký khóa học"}
            </Button>
          )}
        </Grid>
      </Grid>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Tài liệu khóa học
        </Typography>
        {documents.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Chưa có tài liệu cho khóa học này.
          </Typography>
        ) : (
          <Box sx={{ width: "100%" }}>
            <Box
              sx={{ bgcolor: "#fafafa", borderRadius: 2, boxShadow: 1, p: 2 }}
            >
              {documents.map((doc) => (
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
                  onClick={() => handleDocumentClick(doc)}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight={500}
                    color="primary"
                    sx={{ textDecoration: "underline" }}
                  >
                    {doc.title}
                  </Typography>
                  {doc.uploaded_by && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      Được tải lên bởi: {doc.uploaded_by.full_name || doc.uploaded_by.username}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
      {/* Review section */}
      {renderReviews()}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default CourseDetail;
