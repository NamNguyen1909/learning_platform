import React, { useEffect, useState } from "react";
import { Container, Grid, Box, Typography, Paper, CircularProgress, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert } from "@mui/material";
import { getCourseStatistics, getInstructorStatistics, getLearnerStatistics } from "../services/apis";

function StatTable({ title, columns, rows }) {
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
                  <TableCell key={col}>{row[col]}</TableCell>
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
                  <Grid size={{xs:6,sm:4,md:2}}><b>Tổng số:</b> {courseStats.total_courses}</Grid>
                  <Grid size={{xs:6,sm:4,md:2}}><b>Đang hoạt động:</b> {courseStats.active_courses}</Grid>
                  <Grid size={{xs:6,sm:4,md:2}}><b>Nháp:</b> {courseStats.draft_courses}</Grid>
                  <Grid size={{xs:6,sm:4,md:2}}><b>Đã publish:</b> {courseStats.published_courses}</Grid>
                  <Grid size={{xs:6,sm:4,md:2}}><b>Miễn phí:</b> {courseStats.free_courses}</Grid>
                  <Grid size={{xs:6,sm:4,md:2}}><b>Có phí:</b> {courseStats.paid_courses}</Grid>
                </Grid>
                <Box mt={2}>
                  <Typography variant="subtitle1">Tỷ lệ hoàn thành: <b>{courseStats.completion_rate}%</b></Typography>
                </Box>
                <StatTable
                  title="Top 5 khóa học nhiều học viên nhất"
                  columns={["title", "reg_count", "price", "is_active", "is_published"]}
                  rows={courseStats.top_courses}
                />
                <StatTable
                  title="Số lượng tài liệu/video mỗi khóa học"
                  columns={["course", "count"]}
                  rows={courseStats.doc_counts}
                />
                <StatTable
                  title="Doanh thu từng khóa học"
                  columns={["course", "total"]}
                  rows={courseStats.payments}
                />
              </Paper>
            </Grid>
          )}
          {tab === 1 && instructorStats && (
            <Grid size={{xs:12}}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" mb={2}>Tổng quan giảng viên</Typography>
                <Grid container spacing={2}>
                  <Grid size={{xs:6,sm:4,md:3}}><b>Tổng số:</b> {instructorStats.total_instructors}</Grid>
                  <Grid size={{xs:6,sm:4,md:3}}><b>Đang hoạt động:</b> {instructorStats.active_instructors}</Grid>
                  <Grid size={{xs:6,sm:4,md:3}}><b>Bị khóa:</b> {instructorStats.locked_instructors}</Grid>
                </Grid>
                <StatTable
                  title="Số lượng khóa học mỗi giảng viên"
                  columns={["id", "username", "course_count"]}
                  rows={instructorStats.instructor_courses}
                />
                <StatTable
                  title="Số lượng học viên đã dạy qua từng giảng viên"
                  columns={["id", "username", "learner_count"]}
                  rows={instructorStats.instructor_learners}
                />
                <StatTable
                  title="Đánh giá trung bình các khóa học do giảng viên phụ trách"
                  columns={["id", "username", "avg_rating"]}
                  rows={instructorStats.instructor_ratings}
                />
                <StatTable
                  title="Top giảng viên nhiều học viên nhất"
                  columns={["id", "username", "learner_count"]}
                  rows={instructorStats.top_instructors}
                />
              </Paper>
            </Grid>
          )}
          {tab === 2 && learnerStats && (
            <Grid size={{xs:12}}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" mb={2}>Tổng quan học viên</Typography>
                <Grid container spacing={2}>
                  <Grid size={{xs:6,sm:4,md:3}}><b>Tổng số:</b> {learnerStats.total_learners}</Grid>
                  <Grid size={{xs:6,sm:4,md:3}}><b>Đang hoạt động:</b> {learnerStats.active_learners}</Grid>
                  <Grid size={{xs:6,sm:4,md:3}}><b>Bị khóa:</b> {learnerStats.locked_learners}</Grid>
                  <Grid size={{xs:6,sm:4,md:3}}><b>Tỷ lệ hoàn thành TB:</b> {learnerStats.avg_completion}%</Grid>
                </Grid>
                <StatTable
                  title="Thống kê từng học viên"
                  columns={["id", "username", "registered", "completed", "in_progress", "review_count", "question_count"]}
                  rows={learnerStats.learner_stats}
                />
                <StatTable
                  title="Top học viên tích cực"
                  columns={["id", "username", "completed", "review_count", "question_count"]}
                  rows={learnerStats.top_learners}
                />
              </Paper>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
}
