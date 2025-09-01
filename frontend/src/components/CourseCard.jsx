import React from 'react';
import { Card, CardContent, Typography, Box, CardActions, Button } from '@mui/material';

const CourseCard = ({ course, onClick }) => (
  <Card
    sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderRadius: 4,
      overflow: 'hidden',
      boxShadow: '0 6px 24px rgba(25, 118, 210, 0.12)',
      transition: 'transform 0.3s, box-shadow 0.3s',
      '&:hover': { transform: 'scale(1.04)', boxShadow: '0 12px 32px rgba(25, 118, 210, 0.18)' },
      bgcolor: '#F5F7FA',
      cursor: 'pointer',
    }}
    onClick={onClick}
  >
    <Box sx={{ height: 140, overflow: 'hidden', bgcolor: '#e3eafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {course.image && course.image !== '' ? (
        <img src={course.image} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0 0 16px 16px' }} />
      ) : (
        <Typography variant="subtitle2" color="text.secondary">Không có hình ảnh</Typography>
      )}
    </Box>
    <CardContent sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', minHeight: 120 }}>
      <Typography variant="h6" fontWeight={700} noWrap sx={{ color: '#1976d2', mb: 1 }}>
        {course.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, minHeight: 40, maxHeight: 40, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {course.description}
      </Typography>
      <Box sx={{ flexGrow: 1 }} />
    </CardContent>
    <CardActions sx={{ justifyContent: 'space-between', alignItems: 'center', pb: 2, px: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#388e3c', ml: 1 }}>
        Giá: {course.price ? course.price.toLocaleString() : 'Miễn phí'} VNĐ
      </Typography>
      <Button
        variant="contained"
        size="medium"
        onClick={onClick}
        sx={{ bgcolor: '#1976d2', color: '#fff', fontWeight: 600, borderRadius: 2, px: 2, py: 1, boxShadow: 'none', '&:hover': { bgcolor: '#1565c0' } }}
      >
        Xem chi tiết
      </Button>
    </CardActions>
  </Card>
);

export default CourseCard;
