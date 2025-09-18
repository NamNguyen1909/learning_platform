import React, { useEffect, useState } from "react";
import { Container, Box, Typography, Button, Skeleton, Alert } from "@mui/material";
import { getHotCourses, getSuggestedCourses } from "../services/apis";
import { useNavigate } from "react-router-dom";
import CourseCard from "../components/CourseCard";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import authUtils from "../services/auth";

const Banner = () => (
  <Box sx={{
    backgroundColor: 'primary.main',
    color: '#ffffff',
    py: 6,
    px: 3,
    borderRadius: 3,
    mb: 4,
    textAlign: "center",
  }}>
    <Typography variant="h3" fontWeight={700} mb={2} sx={{color: '#ffffff'}}>
      Smart Learning Platform
    </Typography>
    <Typography variant="h6" mb={2} sx={{color: '#ffffff'}}>
      Nền tảng học trực tuyến hiện đại, kết nối giảng viên, trung tâm và học viên trên toàn quốc.
    </Typography>
    <Button variant="outlined" size="large" href="/register" sx={{ color: 'white', borderColor: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'white' } }}>
      Đăng ký ngay
    </Button>
  </Box>
);

// ...CourseCard đã tách ra component riêng...

const Home = () => {
  const [hotCourses, setHotCourses] = useState(null);
  const [suggestedCourses, setSuggestedCourses] = useState(null);
  const [loadingHot, setLoadingHot] = useState(true);
  const [loadingSuggested, setLoadingSuggested] = useState(true);
  const [errorHot, setErrorHot] = useState("");
  const [errorSuggested, setErrorSuggested] = useState("");
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getHotCourses()
      .then((res) => {
        setHotCourses(res.data);
        setLoadingHot(false);
      })
      .catch(() => {
        setErrorHot("Không thể tải danh sách khoá học hot.");
        setLoadingHot(false);
      });
    getSuggestedCourses()
      .then((res) => {
        setSuggestedCourses(res.data);
        setLoadingSuggested(false);
      })
      .catch(() => {
        setErrorSuggested("Không thể tải khoá học gợi ý.");
        setLoadingSuggested(false);
      });
  }, []);

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

  // Kiểm tra đăng nhập qua localStorage token
  const isLoggedIn = Boolean(localStorage.getItem("access_token"));

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Banner />
      {/* Hot Courses Section */}
      <Box mb={5}>
        <Typography variant="h5" fontWeight={700} mb={2}>
          Hot Courses - Khoá học nổi bật tuần này
        </Typography>
        {loadingHot ? (
          <Box sx={{ width: '100%' }}>
            <Slider slidesToShow={3} slidesToScroll={1} infinite autoplay autoplaySpeed={2500} pauseOnHover responsive={[{breakpoint: 1200, settings: {slidesToShow: 3}}, {breakpoint: 900, settings: {slidesToShow: 2}}, {breakpoint: 600, settings: {slidesToShow: 1}}]}>
              {[...Array(5)].map((_, i) => (
                <Box key={i} sx={{ px: 2 }}>
                  <Skeleton variant="rectangular" height={260} />
                </Box>
              ))}
            </Slider>
          </Box>
        ) : errorHot ? (
          <Alert severity="error">{errorHot}</Alert>
        ) : (
          hotCourses && hotCourses.length > 0 ? (
            <Box sx={{ width: '100%' }}>
              <Slider slidesToShow={3} slidesToScroll={1} infinite autoplay autoplaySpeed={2500} pauseOnHover responsive={[{breakpoint: 1200, settings: {slidesToShow: 3}}, {breakpoint: 900, settings: {slidesToShow: 2}}, {breakpoint: 600, settings: {slidesToShow: 1}}]}>
                {hotCourses.map((course) => (
                  <Box key={course.id} sx={{ px: 2 }}>
                    <CourseCard course={course} onClick={() => navigate(`/courses/${course.id}`)} userRole={userRole} />
                  </Box>
                ))}
              </Slider>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" ml={2}>
              Không có khoá học nổi bật tuần này.
            </Typography>
          )
        )}
      </Box>
      {/* Suggested For You Section */}
      {isLoggedIn && (
        <Box mb={5}>
          <Typography variant="h5" fontWeight={700} mb={2}>
            Suggested For You - Gợi ý cho bạn
          </Typography>
          {loadingSuggested ? (
            <Box sx={{ width: '100%' }}>
              <Slider slidesToShow={3} slidesToScroll={1} infinite autoplay autoplaySpeed={2500} pauseOnHover responsive={[{breakpoint: 1200, settings: {slidesToShow: 3}}, {breakpoint: 900, settings: {slidesToShow: 2}}, {breakpoint: 600, settings: {slidesToShow: 1}}]}>
                {[...Array(5)].map((_, i) => (
                  <Box key={i} sx={{ px: 2 }}>
                    <Skeleton variant="rectangular" height={260} />
                  </Box>
                ))}
              </Slider>
            </Box>
          ) : errorSuggested ? (
            <Alert severity="error">{errorSuggested}</Alert>
          ) : (
            suggestedCourses && suggestedCourses.length > 0 ? (
              <Box sx={{ width: '100%' }}>
                <Slider slidesToShow={3} slidesToScroll={1} infinite autoplay autoplaySpeed={2500} pauseOnHover responsive={[{breakpoint: 1200, settings: {slidesToShow: 3}}, {breakpoint: 900, settings: {slidesToShow: 2}}, {breakpoint: 600, settings: {slidesToShow: 1}}]}>
                  {suggestedCourses.map((course) => (
                    <Box key={course.id} sx={{ px: 2 }}>
                      <CourseCard course={course} onClick={() => navigate(`/courses/${course.id}`)} userRole={userRole} />
                    </Box>
                  ))}
                </Slider>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" ml={2}>
                Không có khoá học gợi ý phù hợp.
              </Typography>
            )
          )}
        </Box>
      )}
      {/* Info Section */}
      <Box mb={5}>
        <Typography variant="h5" fontWeight={700} mb={2}>
          Về Smart Learning Platform
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={1}>
          Smart Learning Platform là hệ thống học trực tuyến hiện đại, kết nối giảng viên, trung tâm đào tạo và học viên trên toàn quốc. Nền tảng hỗ trợ quản lý khoá học, tiến trình học tập, thanh toán, ghi chú, hỏi đáp và nhiều tính năng thông minh khác.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Hãy tham gia ngay để trải nghiệm môi trường học tập linh hoạt, hiệu quả và cá nhân hoá!
        </Typography>
      </Box>
    </Container>
  );
};

export default Home;
