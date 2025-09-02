import React, { useEffect, useState } from "react";
import { Container, Grid, Box, Typography, Paper, CircularProgress, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { getCourseStatistics, getInstructorStatistics, getLearnerStatistics } from "../services/apis";


function StatTable({ title, columns, rows, customRender }) {
  return (
    <Box mb={3}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col}>{col}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={idx}>
                {columns.map((col) => (
                  <TableCell key={col}>
                    {customRender && customRender[col]
                      ? customRender[col](row[col], row)
                      : row[col]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}


export default function Statistics() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [courseStats, setCourseStats] = useState(null);
  const [instructorStats, setInstructorStats] = useState(null);
  const [learnerStats, setLearnerStats] = useState(null);

  // tab nhỏ cho từng nhóm
  const [courseSubTab, setCourseSubTab] = useState(0);
  const [instructorSubTab, setInstructorSubTab] = useState(0);
  const [learnerSubTab, setLearnerSubTab] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      getCourseStatistics(),
      getInstructorStatistics(),
      getLearnerStatistics(),
    ])
      .then(([courseRes, instructorRes, learnerRes]) => {
        setCourseStats(courseRes.data);
        setInstructorStats(instructorRes.data);
        setLearnerStats(learnerRes.data);
      })
      .catch((err) => {
        setError("Không thể tải dữ liệu thống kê. Vui lòng thử lại.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container maxWidth="lg">
      <Box mt={4} mb={2}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Thống kê hệ thống
        </Typography>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Khóa học" />
          <Tab label="Giảng viên" />
          <Tab label="Học viên" />
        </Tabs>
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Grid container spacing={3}>
          {tab === 0 && courseStats && (
            <Grid size={{xs:12}}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" mb={2}>Tổng quan khóa học</Typography>
                <Grid container spacing={2}>
                  <Grid Size={{xs:6, sm:4, md:2}}><b>Tổng số:</b> {courseStats.total_courses}</Grid>
                  <Grid Size={{xs:6, sm:4, md:2}}><b>Đang hoạt động:</b> {courseStats.active_courses}</Grid>
                  <Grid Size={{xs:6, sm:4, md:2}}><b>Nháp:</b> {courseStats.draft_courses}</Grid>
                  <Grid Size={{xs:6, sm:4, md:2}}><b>Đã publish:</b> {courseStats.published_courses}</Grid>
                  <Grid Size={{xs:6, sm:4, md:2}}><b>Miễn phí:</b> {courseStats.free_courses}</Grid>
                  <Grid Size={{xs:6, sm:4, md:2}}><b>Có phí:</b> {courseStats.paid_courses}</Grid>
                </Grid>
                <Box mt={2}>
                  <Typography variant="subtitle1">Tỷ lệ hoàn thành: <b>{courseStats.completion_rate}%</b></Typography>
                </Box>
                <Tabs value={courseSubTab} onChange={(_, v) => setCourseSubTab(v)} sx={{ mb: 2 }}>
                  <Tab label="Thống kê khóa học theo số lượng học viên" />
                  <Tab label="Số lượng tài liệu/video" />
                  <Tab label="Doanh thu từng khóa học" />
                </Tabs>
                {courseSubTab === 0 && (
                  <StatTable
                    title="Thống kê khóa học theo số lượng học viên"
                    columns={["Tên khóa học", "Số lượng học viên", "Giá tiền", "Trạng thái"]}
                    rows={courseStats.course_stats.map(row => ({
                      "Tên khóa học": row.title,
                      "Số lượng học viên": row.reg_count,
                      "Giá tiền": row.price,
                      "Trạng thái": row.is_active
                    }))}
                    customRender={{
                      "Trạng thái": (val) => val ? <CheckCircleIcon color="success" titleAccess="Đang hoạt động"/> : <CancelIcon color="error" titleAccess="Đã đóng"/>
                    }}
                  />
                )}
                {courseSubTab === 1 && (
                  <StatTable
                    title="Số lượng tài liệu/video mỗi khóa học"
                    columns={["Tên khóa học", "Số lượng tài liệu/video"]}
                    rows={courseStats.doc_counts.map(row => ({
                      "Tên khóa học": row.course,
                      "Số lượng tài liệu/video": row.count
                    }))}
                  />
                )}
                {courseSubTab === 2 && (
                  <StatTable
                    title="Doanh thu từng khóa học"
                    columns={["Tên khóa học", "Tổng doanh thu"]}
                    rows={courseStats.payments.map(row => ({
                      "Tên khóa học": row.course,
                      "Tổng doanh thu": row.total
                    }))}
                  />
                )}
              </Paper>
            </Grid>
          )}
          {tab === 1 && instructorStats && (
            <Grid size={{xs:12}}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" mb={2}>Tổng quan giảng viên</Typography>
                <Grid container spacing={2}>
                  <Grid Size={{xs:6, sm:4, md:3}}><b>Tổng số:</b> {instructorStats.total_instructors}</Grid>
                  <Grid Size={{xs:6, sm:4, md:3}}><b>Đang hoạt động:</b> {instructorStats.active_instructors}</Grid>
                  <Grid Size={{xs:6, sm:4, md:3}}><b>Bị khóa:</b> {instructorStats.locked_instructors}</Grid>
                </Grid>
                <Tabs value={instructorSubTab} onChange={(_, v) => setInstructorSubTab(v)} sx={{ mb: 2 }}>
                  <Tab label="Số lượng khóa học" />
                  <Tab label="Số lượng học viên" />
                  <Tab label="Đánh giá trung bình" />
                </Tabs>
                {instructorSubTab === 0 && (
                  <StatTable
                    title="Số lượng khóa học mỗi giảng viên"
                    columns={["Mã giảng viên", "Tên giảng viên", "Số lượng khóa học"]}
                    rows={instructorStats.instructor_courses.map(row => ({
                      "Mã giảng viên": row.id,
                      "Tên giảng viên": row.username,
                      "Số lượng khóa học": row.course_count
                    }))}
                  />
                )}
                {instructorSubTab === 1 && (
                  <StatTable
                    title="Số lượng học viên đã dạy qua từng giảng viên"
                    columns={["Mã giảng viên", "Tên giảng viên", "Số lượng khóa học", "Số lượng học viên"]}
                    rows={instructorStats.instructor_learners.map(row => ({
                      "Mã giảng viên": row.id,
                      "Tên giảng viên": row.username,
                      "Số lượng khóa học": row.course_count,
                      "Số lượng học viên": row.learner_count
                    }))}
                  />
                )}
                {instructorSubTab === 2 && (
                  <StatTable
                    title="Đánh giá trung bình các khóa học do giảng viên phụ trách"
                    columns={["Mã giảng viên", "Tên giảng viên", "Đánh giá trung bình"]}
                    rows={instructorStats.instructor_ratings.map(row => ({
                      "Mã giảng viên": row.id,
                      "Tên giảng viên": row.username,
                      "Đánh giá trung bình": row.avg_rating
                    }))}
                  />
                )}
              </Paper>
            </Grid>
          )}
          {tab === 2 && learnerStats && (
            <Grid size={{xs:12}}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" mb={2}>Tổng quan học viên</Typography>
                <Grid container spacing={2}>
                  <Grid Size={{xs:6, sm:4, md:3}}><b>Tổng số:</b> {learnerStats.total_learners}</Grid>
                  <Grid Size={{xs:6, sm:4, md:3}}><b>Đang hoạt động:</b> {learnerStats.active_learners}</Grid>
                  <Grid Size={{xs:6, sm:4, md:3}}><b>Bị khóa:</b> {learnerStats.locked_learners}</Grid>
                  <Grid Size={{xs:6, sm:4, md:3}}><b>Tỷ lệ hoàn thành TB:</b> {learnerStats.avg_completion}%</Grid>
                </Grid>
                <Tabs value={learnerSubTab} onChange={(_, v) => setLearnerSubTab(v)} sx={{ mb: 2 }}>
                  <Tab label="Thống kê từng học viên" />
                  <Tab label="Top học viên tích cực" />
                </Tabs>
                {learnerSubTab === 0 && (
                  <StatTable
                    title="Thống kê từng học viên"
                    columns={["Mã học viên", "Tên học viên", "Số khóa học đã đăng ký", "Số khóa học đã hoàn thành", "Đang học", "Số lượng review", "Số lượng câu hỏi"]}
                    rows={learnerStats.learner_stats.map(row => ({
                      "Mã học viên": row.id,
                      "Tên học viên": row.username,
                      "Số khóa học đã đăng ký": row.registered,
                      "Số khóa học đã hoàn thành": row.completed,
                      "Đang học": row.in_progress,
                      "Số lượng review": row.review_count,
                      "Số lượng câu hỏi": row.question_count
                    }))}
                  />
                )}
                {learnerSubTab === 1 && (
                  <StatTable
                    title="Top học viên tích cực"
                    columns={["Mã học viên", "Tên học viên", "Số khóa học đã hoàn thành", "Số lượng review", "Số lượng câu hỏi"]}
                    rows={learnerStats.top_learners.map(row => ({
                      "Mã học viên": row.id,
                      "Tên học viên": row.username,
                      "Số khóa học đã hoàn thành": row.completed,
                      "Số lượng review": row.review_count,
                      "Số lượng câu hỏi": row.question_count
                    }))}
                  />
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
}
