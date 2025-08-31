from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets, generics
from .paginators import *
from .permissions import *
from .serializers import *
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework import permissions
from rest_framework.decorators import action
from django.db import models

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def demo_user_info(request):
	user = request.user
	return Response({
		"id": user.id,
		"username": user.username,
		"email": user.email,
		"role": getattr(user, "role", None),
		"is_authenticated": user.is_authenticated,
	})
from django.shortcuts import render

# Create your views here.


class UserViewSet(viewsets.ViewSet, generics.CreateAPIView, generics.UpdateAPIView, generics.ListAPIView):
	serializer_class = UserSerializer
	queryset = User.objects.all()
	filter_backends = [SearchFilter, OrderingFilter]
	search_fields = ['username', 'email', 'phone']
	ordering_fields = ['created_at', 'username']
	ordering = ['-created_at'] #sắp xếp theo thời gian tạo 

	pagination_class = StandardResultsSetPagination

	def get_permissions(self):
		# Chỉ user role center mới được quản lý instructor/learner
		if self.action in ['list_instructors', 'list_learners', 'deactivate_user', 'activate_user', 'partial_update', 'update']:
			return [IsAdminorCenter()]
		if self.action in ['list']:
			return [IsAdmin()]
		if self.action in ['create']:
			return [permissions.AllowAny()]
		return [permissions.IsAuthenticated()]

	# chỉ có thể tạo account với role là learner hoặc instructor
	def create(self, request, *args, **kwargs):
		role = request.data.get("role")
		if role not in ["learner", "instructor", "center"]:
			return Response({"error": "Invalid role. Only 'learner', 'instructor', 'center' roles are allowed."}, status=400)
		password = request.data.pop('password')
		full_name = request.data.get('full_name', None)
		user = User(**request.data)
		if full_name:
			user.full_name = full_name
		user.set_password(password)
		user.save()
		return Response({"success": "User created successfully."}, status=201)

	@action(detail=False, methods=['get'], url_path='instructors')
	def list_instructors(self, request):
		qs = User.objects.filter(role='instructor').order_by('-created_at')
		search = request.query_params.get('search')
		if search:
			qs = qs.filter(models.Q(username__icontains=search) | models.Q(email__icontains=search) | models.Q(phone__icontains=search))
		is_active = request.query_params.get('is_active')
		if is_active is not None:
			qs = qs.filter(is_active=(is_active == 'true'))
		page = self.paginate_queryset(qs)
		if page is not None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(qs, many=True)
		return Response(serializer.data)

	@action(detail=False, methods=['get'], url_path='learners')
	def list_learners(self, request):
		qs = User.objects.filter(role='learner').order_by('-created_at')
		search = request.query_params.get('search')
		if search:
			qs = qs.filter(models.Q(username__icontains=search) | models.Q(email__icontains=search) | models.Q(phone__icontains=search))
		is_active = request.query_params.get('is_active')
		if is_active is not None:
			qs = qs.filter(is_active=(is_active == 'true'))
		page = self.paginate_queryset(qs)
		if page is not None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(qs, many=True)
		return Response(serializer.data)
	
	@action(detail=False, methods=['get'], url_path='centers')
	def list_centers(self, request):
		qs = User.objects.filter(role='center').order_by('-created_at')
		search = request.query_params.get('search')
		if search:
			qs = qs.filter(models.Q(username__icontains=search) | models.Q(email__icontains=search) | models.Q(phone__icontains=search))
		is_active = request.query_params.get('is_active')
		if is_active is not None:
			qs = qs.filter(is_active=(is_active == 'true'))
		page = self.paginate_queryset(qs)
		if page is not None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(qs, many=True)
		return Response(serializer.data)

	@action(detail=True, methods=['post'], url_path='deactivate')
	def deactivate_user(self, request, pk=None):
		user = self.get_object()
		if user.role not in ['instructor', 'learner']:
			return Response({"error": "Only instructor or learner can be deactivated."}, status=400)
		user.is_active = False
		user.save()
		return Response({"success": "User deactivated."})

	@action(detail=True, methods=['post'], url_path='activate')
	def activate_user(self, request, pk=None):
		user = self.get_object()
		if user.role not in ['instructor', 'learner']:
			return Response({"error": "Only instructor or learner can be activated."}, status=400)
		user.is_active = True
		user.save()
		return Response({"success": "User activated."})


	@action(detail=False, methods=['get', 'put', 'patch'], url_path='current_user')
	def current_user(self, request):
		user = request.user
		if request.method in ['PUT', 'PATCH']:
			serializer = self.get_serializer(user, data=request.data, partial=True)
			serializer.is_valid(raise_exception=True)
			serializer.save()
			return Response(serializer.data)
		serializer = self.get_serializer(user)
		return Response(serializer.data)
	
class CourseViewSet(viewsets.ViewSet,generics.CreateAPIView,generics.UpdateAPIView,generics.ListAPIView,generics.RetrieveAPIView,generics.DestroyAPIView):
	serializer_class = CourseSerializer
	queryset = Course.objects.all()
	filter_backends = [SearchFilter, OrderingFilter]
	search_fields = ['title', 'description', 'tags__name']
	ordering_fields = ['created_at', 'title']
	ordering = ['-created_at']
	pagination_class = CoursePagination

	def get_permissions(self):
		if self.action in ['create', 'update', 'partial_update', 'destroy', 'deactivate']:
			return [CanCURDCourse()]
		if self.action in ['list', 'retrieve']:
			return [permissions.AllowAny()]
		return [permissions.IsAuthenticated()]

	@action(detail=True, methods=['post'], url_path='deactivate')
	def deactivate(self, request, pk=None):
		course = self.get_object()
		course.is_active = False
		course.save()
		return Response({"success": "Course deactivated."})
	@action(detail=True, methods=['post'], url_path='register')
	def register(self, request, pk=None):
		user = request.user
		course = self.get_object()
		from .models import CourseProgress
		if CourseProgress.objects.filter(learner=user, course=course).exists():
			return Response({'error': 'Bạn đã đăng ký khóa học này.'}, status=400)
		CourseProgress.objects.create(learner=user, course=course)
		return Response({'success': 'Đăng ký khóa học thành công.'})
class TagViewSet(viewsets.ViewSet,generics.ListAPIView,generics.CreateAPIView,generics.UpdateAPIView,generics.DestroyAPIView):
	serializer_class = TagSerializer
	queryset = Tag.objects.all()
	ordering = ['name']


class CourseProgressViewSet(viewsets.ViewSet,generics.ListAPIView,generics.RetrieveAPIView,generics.UpdateAPIView):
	serializer_class = CourseProgressSerializer
	ordering = ['-updated_at']

	def get_queryset(self):
		user = self.request.user
		# Chỉ trả về progress của learner hiện tại
		if user.is_authenticated and hasattr(user, 'role') and user.role == 'learner':
			return CourseProgress.objects.filter(learner=user).order_by('-updated_at')
		# Nếu không phải learner, trả về rỗng (hoặc có thể raise PermissionDenied)
		return CourseProgress.objects.none()

	def get_permissions(self):
		return [permissions.IsAuthenticated()]

class DocumentViewSet(viewsets.ViewSet,generics.ListAPIView,generics.RetrieveAPIView,generics.CreateAPIView,generics.UpdateAPIView,generics.DestroyAPIView):
	serializer_class = DocumentSerializer
	queryset = Document.objects.all()

# DocumentCompletion ViewSet
class DocumentCompletionViewSet(viewsets.ViewSet,generics.ListAPIView,generics.RetrieveAPIView,):
	serializer_class = DocumentCompletionSerializer
	queryset = DocumentCompletion.objects.all()

class QuestionViewSet(viewsets.ViewSet,generics.ListAPIView,generics.RetrieveAPIView,generics.CreateAPIView,generics.UpdateAPIView,generics.DestroyAPIView):
	serializer_class = QuestionSerializer
	queryset = Question.objects.all()

class AnswerViewSet(viewsets.ViewSet,generics.ListAPIView,generics.RetrieveAPIView,generics.CreateAPIView,generics.UpdateAPIView,generics.DestroyAPIView):
	serializer_class = AnswerSerializer
	queryset = Answer.objects.all()

class ReviewViewSet(viewsets.ViewSet,generics.ListAPIView,generics.RetrieveAPIView,generics.CreateAPIView,generics.UpdateAPIView,generics.DestroyAPIView):
	serializer_class = ReviewSerializer
	queryset = Review.objects.all()

class NotificationViewSet(viewsets.ViewSet,generics.ListAPIView,generics.RetrieveAPIView,generics.CreateAPIView,generics.UpdateAPIView,generics.DestroyAPIView):
	serializer_class = NotificationSerializer
	queryset = Notification.objects.all()

class UserNotificationViewSet(viewsets.ViewSet,generics.ListAPIView,generics.RetrieveAPIView,generics.CreateAPIView,generics.UpdateAPIView,generics.DestroyAPIView):
	serializer_class = UserNotificationSerializer
	queryset = UserNotification.objects.all()
