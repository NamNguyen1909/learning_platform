from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

#Định nghĩa

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'courses', views.CourseViewSet, basename='course')
router.register(r'tags', views.TagViewSet, basename='tag')
router.register(r'course-progress', views.CourseProgressViewSet, basename='courseprogress')
router.register(r'documents', views.DocumentViewSet, basename='document')
router.register(r'document-completions', views.DocumentCompletionViewSet, basename='documentcompletion')
router.register(r'reviews', views.ReviewViewSet, basename='review')
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'user-notifications', views.UserNotificationViewSet, basename='usernotification')
router.register(r'payments', views.PaymentViewSet, basename='payment')


urlpatterns = [
    path('courses/hot/', views.CourseViewSet.as_view({'get': 'hot_courses'}), name='course-hot'),
    path('courses/suggested/', views.CourseViewSet.as_view({'get': 'suggested_courses'}), name='course-suggested'),
    path('statistics/courses/', views.CourseStatisticsView.as_view(), name='course-statistics'),
    path('statistics/instructors/', views.InstructorStatisticsView.as_view(), name='instructor-statistics'),
    path('statistics/learners/', views.LearnerStatisticsView.as_view(), name='learner-statistics'),

    path('vnpay/create_payment_url/', views.create_payment_url, name='create-payment-url'),
    path('vnpay/redirect/', views.vnpay_redirect, name='vnpay-redirect'),
    path('',include(router.urls)),
]
