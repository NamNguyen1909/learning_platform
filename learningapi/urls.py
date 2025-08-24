from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

#Định nghĩa
router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'courses', views.CourseViewSet, basename='course')

urlpatterns = [
    path('',include(router.urls)),
]
