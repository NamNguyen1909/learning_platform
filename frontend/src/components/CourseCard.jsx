import React from 'react';
import { Card, CardContent, Typography, Box, CardActions, Button, Chip } from '@mui/material';


const CourseCard = ({ course, onClick, userRole }) => (
  <Card
    sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderRadius: 4,
      overflow: 'hidden',
      boxShadow: 'none',
      transition: 'transform 0.3s',
      '&:hover': { transform: 'scale(1.04)' },
      cursor: 'pointer',
    }}
    onClick={onClick}
  >
    <Box sx={{ height: 140, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {course.image && course.image !== '' ? (
        <img src={course.image} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0 0 16px 16px' }} />
      ) : (
        <Typography variant="subtitle2" color="text.secondary">Không có hình ảnh</Typography>
      )}
    </Box>
    <CardContent sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', minHeight: 120 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" fontWeight={700} noWrap sx={{ flex: 1 }}>
          {course.title}
        </Typography>
        {userRole === 'instructor' && (
          <Chip
            label={course.is_published ? 'Đã xuất bản' : 'Nháp'}
            size="small"
            sx={{
              ml: 1,
              bgcolor: course.is_published ? 'secondary.main' : 'text.disabled',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 24,
              '& .MuiChip-label': { px: 1 }
            }}
          />
        )}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, minHeight: 40, maxHeight: 40, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {course.description}
      </Typography>
      <Box sx={{ flexGrow: 1 }} />
    </CardContent>
    <CardActions sx={{ justifyContent: 'space-between', alignItems: 'center', pb: 2, px: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ ml: 1 }}>
        Giá: {course.price ? course.price.toLocaleString() : 'Miễn phí'} VNĐ
      </Typography>
      <Button
        variant="contained"
        size="medium"
        onClick={onClick}
        sx={{ fontWeight: 600, borderRadius: 2, px: 2, py: 1 }}
      >
        Xem chi tiết
      </Button>
    </CardActions>
  </Card>
);

export default CourseCard;
