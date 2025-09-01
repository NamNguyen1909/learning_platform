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
from rest_framework.exceptions import ValidationError

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
		if self.action in ['list', 'retrieve','hot_courses']:
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

	@action(detail=False, methods=['get'], url_path='hot')
	def hot_courses(self, request):
		from django.utils import timezone
		from datetime import timedelta
		from .models import CourseProgress, Course
		week_ago = timezone.now() - timedelta(days=7)
		# Đếm số lượt đăng ký mới mỗi khoá học trong tuần
		hot_courses = (
			Course.objects.filter(is_active=True, is_published=True)
			.annotate(new_reg_count=models.Count('course_progress', filter=models.Q(course_progress__enrolled_at__gte=week_ago)))
			.order_by('-new_reg_count')[:5]
		)
		serializer = CourseSerializer(hot_courses, many=True)
		return Response(serializer.data)

	@action(detail=False, methods=['get'], url_path='suggested')
	def suggested_courses(self, request):
		user = request.user
		if not user.is_authenticated:
			return Response([], status=200)
		from .models import CourseProgress, Course, Tag
		# Lấy các tag của các khoá học user đã học
		user_courses = Course.objects.filter(course_progress__learner=user)
		user_tags = Tag.objects.filter(courses__in=user_courses).distinct()
		# Lấy các khoá học có tag liên quan, loại trừ khoá học user đã học
		suggested = (
			Course.objects.filter(tags__in=user_tags, is_active=True, is_published=True)
			.exclude(course_progress__learner=user)
			.distinct()
			.annotate(tag_match_count=models.Count('tags'))
			.order_by('-tag_match_count', '-created_at')[:5]
		)
		serializer = CourseSerializer(suggested, many=True)
		return Response(serializer.data)
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
			qs = CourseProgress.objects.filter(learner=user)
			course_id = self.request.query_params.get('course')
			if course_id:
				qs = qs.filter(course_id=course_id)
			return qs.order_by('-updated_at')
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
	pagination_class = ReviewPagination

	def get_permissions(self):
		if self.action in ['create', 'update', 'partial_update', 'destroy']:
			return [IsLearner()]
		return [permissions.AllowAny()]

	def get_queryset(self):
		# Chỉ cho phép user xem review của course hoặc của mình
		qs = super().get_queryset()
		return qs

	def perform_update(self, serializer):
		# Chỉ cho phép update review của mình
		instance = self.get_object()
		if instance.user != self.request.user:
			from rest_framework.exceptions import PermissionDenied
			raise PermissionDenied('Bạn chỉ được sửa review của chính mình.')
		serializer.save()

	def destroy(self, request, *args, **kwargs):
		instance = self.get_object()
		if instance.user != request.user:
			from rest_framework.exceptions import PermissionDenied
			raise PermissionDenied('Bạn chỉ được xóa review của chính mình.')
		# Nếu là review gốc, xóa luôn các reply con
		if instance.parent_review is None:
			instance.replies.all().delete()
		return super().destroy(request, *args, **kwargs)

	def perform_create(self, serializer):
		user = self.request.user
		course = self.request.data.get('course')
		parent_review = self.request.data.get('parent_review')
		print(f"[REVIEW] user={user.id} course={course} parent_review={parent_review} data={self.request.data}")
		# Xác định review gốc hay reply: parent_review là None, '', 'null', 'None' => review gốc
		if not parent_review or str(parent_review).lower() in ['', 'null', 'none']:
			print(f"[REVIEW] Xử lý review gốc cho user={user.id} course={course}")
			if Review.objects.filter(user=user, course_id=course, parent_review=None).exists():
				print(f"[REVIEW] User {user.id} đã review course {course} rồi!")
				raise ValidationError({'detail': 'Bạn chỉ được review 1 lần cho mỗi khóa học. Hãy chỉnh sửa hoặc xóa review cũ.'})
		else:
			print(f"[REVIEW] Xử lý reply cho user={user.id} course={course} parent_review={parent_review}")
			from django.utils import timezone
			from datetime import timedelta
			today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
			tomorrow_start = today_start + timedelta(days=1)
			reply_qs = Review.objects.filter(user=user, course_id=course, parent_review__isnull=False, created_at__gte=today_start, created_at__lt=tomorrow_start)
			reply_count = reply_qs.count()
			print(f"[REVIEW] reply_count={reply_count} (user={user.id}, course={course}, today_start={today_start}, tomorrow_start={tomorrow_start})")
			print(f"[REVIEW] reply_qs_ids={[r.id for r in reply_qs]}")
			for r in reply_qs:
				print(f"[REVIEW] reply_obj id={r.id} created_at={r.created_at} user={r.user_id} course={r.course_id} parent_review={r.parent_review_id}")
			if reply_count >= 3:
				print(f"[REVIEW] User {user.id} vượt quá giới hạn reply cho course {course} trong ngày!")
				raise ValidationError({'detail': 'Bạn chỉ được reply tối đa 3 lần/ngày cho mỗi khóa học.'})
		serializer.save()


	@action(detail=False, methods=['get'], url_path='by-course/(?P<course_id>[^/.]+)')
	def list_by_course(self, request, course_id=None):
		# Lấy review gốc (parent_review=None) của course này, phân trang
		root_reviews = Review.objects.filter(course_id=course_id, parent_review=None).order_by('-created_at')
		page = self.paginate_queryset(root_reviews)
		if page is not None:
			data = self._with_replies(page)
			return self.get_paginated_response(data)
		data = self._with_replies(root_reviews)
		return Response(data)

	def _with_replies(self, reviews):
		# Lấy tất cả id review gốc
		root_ids = [r.id for r in reviews]
		# Lấy tất cả reply review liên quan
		replies = Review.objects.filter(parent_review_id__in=root_ids).order_by('created_at')
		reply_map = {}
		for reply in replies:
			reply_map.setdefault(reply.parent_review_id, []).append(self.get_serializer(reply).data)
		result = []
		for review in reviews:
			item = self.get_serializer(review).data
			item['replies'] = reply_map.get(review.id, [])
			result.append(item)
		return result

class NotificationViewSet(viewsets.ViewSet,generics.ListAPIView,generics.RetrieveAPIView,generics.CreateAPIView,generics.UpdateAPIView,generics.DestroyAPIView):
	serializer_class = NotificationSerializer
	queryset = Notification.objects.all()

class UserNotificationViewSet(viewsets.ViewSet,generics.ListAPIView,generics.RetrieveAPIView,generics.CreateAPIView,generics.UpdateAPIView,generics.DestroyAPIView):
	serializer_class = UserNotificationSerializer
	queryset = UserNotification.objects.all()
