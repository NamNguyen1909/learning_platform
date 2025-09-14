import logging

from httpcore import request

logger = logging.getLogger(__name__)
from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets, generics
import urllib
from .paginators import *
from .permissions import *
from .serializers import *
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework import permissions
from rest_framework.decorators import action
from django.db import models
from rest_framework.exceptions import ValidationError
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.utils.timezone import localtime
from datetime import datetime
import os,hashlib,hmac
import uuid

from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .rag_service import generate_ai_answer

from learningapi.tasks import ingest_document_task

# Health check endpoint for Render deployment
@csrf_exempt
@require_http_methods(["GET", "HEAD", "OPTIONS"])
def health_check(request):
	"""Simple health check endpoint for Render.com deployment"""
	return JsonResponse({'status': 'healthy'}, status=200)

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

# Create your views here.

# --- STATISTICS API ---
from rest_framework.views import APIView
from .models import Course, User, CourseProgress, Payment, Review, Document, Notification
from .services.supabase_service import upload_file, get_public_url
from rest_framework import status



class CourseStatisticsView(APIView):
	permission_classes = [IsAdminOrCenter]
	parser_classes = [StatisticsPagination]

	def get(self, request):
		total_courses = Course.objects.count()
		active_courses = Course.objects.filter(is_active=True).count()
		draft_courses = Course.objects.filter(is_published=False).count()
		published_courses = Course.objects.filter(is_published=True).count()
		paid_courses = Course.objects.filter(price__gt=0).count()
		free_courses = Course.objects.filter(price=0).count()
		course_registrations = CourseProgress.objects.values('course').annotate(count=models.Count('id'))
		completed = CourseProgress.objects.filter(is_completed=True).count()
		total_progress = CourseProgress.objects.count()
		completion_rate = round(completed / total_progress * 100, 2) if total_progress else 0

		# Phân trang cho course_stats
		course_stats_qs = Course.objects.annotate(reg_count=models.Count('course_progress')).order_by('-reg_count')
		paginator = StatisticsPagination()
		paginator.page_query_param = 'page'
		paged_course_stats = paginator.paginate_queryset(course_stats_qs, request)
		course_stats_data = [
			{
				'id': c.id,
				'title': c.title,
				'reg_count': c.reg_count,
				'price': float(c.price),
				'is_active': c.is_active,
			} for c in paged_course_stats
		]

		# Phân trang cho doc_counts
		doc_counts_qs = Document.objects.values('course').annotate(count=models.Count('id')).order_by('-count')
		paginator_doc = StatisticsPagination()
		paginator_doc.page_query_param = 'doc_page'
		paged_doc_counts = paginator_doc.paginate_queryset(doc_counts_qs, request)
		doc_counts_data = [
			{
				'course': Course.objects.get(id=d['course']).title if d['course'] else '',
				'count': d['count']
			} for d in paged_doc_counts
		]

		# Phân trang cho payments
		payments_qs = Payment.objects.filter(is_paid=True).values('course').annotate(total=models.Sum('amount')).order_by('-total')
		paginator_pay = StatisticsPagination()
		paginator_pay.page_query_param = 'pay_page'
		paged_payments = paginator_pay.paginate_queryset(payments_qs, request)
		payments_data = list(paged_payments)

		# Trả về dữ liệu phân trang cho course_stats
		response_data = {
			'total_courses': total_courses,
			'active_courses': active_courses,
			'draft_courses': draft_courses,
			'published_courses': published_courses,
			'paid_courses': paid_courses,
			'free_courses': free_courses,
			'course_registrations': list(course_registrations),
			'completion_rate': completion_rate,
		}
		paginated = paginator.get_paginated_response(course_stats_data)
		for k, v in paginated.data.items():
			response_data['course_stats_' + k if k != 'results' else 'course_stats'] = v

		# Phân trang cho doc_counts
		paginated_doc = paginator_doc.get_paginated_response(doc_counts_data)
		for k, v in paginated_doc.data.items():
			response_data['doc_counts_' + k if k != 'results' else 'doc_counts'] = v

		# Phân trang cho payments
		paginated_pay = paginator_pay.get_paginated_response(payments_data)
		for k, v in paginated_pay.data.items():
			response_data['payments_' + k if k != 'results' else 'payments'] = v

		return Response(response_data, status=status.HTTP_200_OK)

class InstructorStatisticsView(APIView):
	permission_classes = [IsAdminOrCenter]
	parser_classes = [StatisticsPagination]

	def get(self, request):
		total_instructors = User.objects.filter(role="instructor").count()
		active_instructors = User.objects.filter(role="instructor", is_active=True).count()
		locked_instructors = User.objects.filter(role="instructor", is_active=False).count()

		# Phân trang cho instructor_courses
		instructor_courses_qs = User.objects.filter(role="instructor").annotate(course_count=models.Count('courses')).order_by('-course_count')
		paginator = StatisticsPagination()
		paged_instructor_courses = paginator.paginate_queryset(instructor_courses_qs, request)
		instructor_courses_data = [
			{'id': ins.id, 'username': ins.username, 'course_count': ins.course_count}
			for ins in paged_instructor_courses
		]

		# Phân trang cho instructor_learners
		instructor_learners_qs = User.objects.filter(role="instructor").annotate(
			course_count=models.Count('courses'),
			learner_count=models.Count('courses__course_progress')
		).order_by('-learner_count')
		paginator_learners = StatisticsPagination()
		paged_instructor_learners = paginator_learners.paginate_queryset(instructor_learners_qs, request)
		instructor_learners_data = [
			{
				'id': ins.id,
				'username': ins.username,
				'course_count': ins.course_count,
				'learner_count': ins.learner_count,
			} for ins in paged_instructor_learners
		]

		# Phân trang cho instructor_ratings
		instructor_ratings_qs = User.objects.filter(role="instructor").annotate(
			avg_rating=models.Avg('courses__reviews__rating')
		).order_by('-avg_rating')
		paginator_ratings = StatisticsPagination()
		paged_instructor_ratings = paginator_ratings.paginate_queryset(instructor_ratings_qs, request)
		instructor_ratings_data = [
			{
				'id': ins.id,
				'username': ins.username,
				'avg_rating': round(ins.avg_rating or 0, 2)
			} for ins in paged_instructor_ratings
		]

		response_data = {
			'total_instructors': total_instructors,
			'active_instructors': active_instructors,
			'locked_instructors': locked_instructors,
		}
		paginated = paginator.get_paginated_response(instructor_courses_data)
		for k, v in paginated.data.items():
			response_data['instructor_courses_' + k if k != 'results' else 'instructor_courses'] = v

		# Phân trang cho instructor_learners
		paginated_learners = paginator_learners.get_paginated_response(instructor_learners_data)
		for k, v in paginated_learners.data.items():
			response_data['instructor_learners_' + k if k != 'results' else 'instructor_learners'] = v

		# Phân trang cho instructor_ratings
		paginated_ratings = paginator_ratings.get_paginated_response(instructor_ratings_data)
		for k, v in paginated_ratings.data.items():
			response_data['instructor_ratings_' + k if k != 'results' else 'instructor_ratings'] = v

		return Response(response_data, status=status.HTTP_200_OK)

class LearnerStatisticsView(APIView):
	permission_classes = [IsAdminOrCenter]
	parser_classes = [StatisticsPagination]

	def get(self, request):
		total_learners = User.objects.filter(role="learner").count()
		active_learners = User.objects.filter(role="learner", is_active=True).count()
		locked_learners = User.objects.filter(role="learner", is_active=False).count()

		# Phân trang cho learner_stats (explicit ordering)
		learner_qs = User.objects.filter(role="learner").order_by('-id')
		paginator = StatisticsPagination()
		paged_learners = paginator.paginate_queryset(learner_qs, request)
		learner_stats = [
			{
				'id': l.id,
				'username': l.username,
				'registered': l.course_progress.count(),
				'completed': l.course_progress.filter(is_completed=True).count(),
				'in_progress': l.course_progress.filter(is_completed=False).count(),
				'review_count': l.course_reviews.count(),
				'question_count': l.questions.count(),
			} for l in paged_learners
		]
		# Tỷ lệ hoàn thành trung bình
		total_completed = sum(l['completed'] for l in learner_stats)
		total_registered = sum(l['registered'] for l in learner_stats)
		avg_completion = round(total_completed / total_registered * 100, 2) if total_registered else 0
		# Phân trang cho top_learners
		top_learners_qs = User.objects.filter(role="learner").annotate(
			registered=models.Count('course_progress'),
			completed=models.Count('course_progress', filter=models.Q(course_progress__is_completed=True)),
			in_progress=models.Count('course_progress', filter=models.Q(course_progress__is_completed=False)),
			review_count=models.Count('course_reviews'),
			question_count=models.Count('questions')
		).order_by('-completed', '-review_count', '-question_count', '-id')
		paginator_top = StatisticsPagination()
		paged_top_learners = paginator_top.paginate_queryset(top_learners_qs, request)
		top_learners_data = [
			{
				'id': l.id,
				'username': l.username,
				'registered': l.registered,
				'completed': l.completed,
				'in_progress': l.in_progress,
				'review_count': l.review_count,
				'question_count': l.question_count,
			} for l in paged_top_learners
		]

		response_data = {
			'total_learners': total_learners,
			'active_learners': active_learners,
			'locked_learners': locked_learners,
			'avg_completion': avg_completion,
		}
		paginated = paginator.get_paginated_response(learner_stats)
		for k, v in paginated.data.items():
			response_data['learner_stats_' + k if k != 'results' else 'learner_stats'] = v

		# Phân trang cho top_learners
		paginated_top = paginator_top.get_paginated_response(top_learners_data)
		for k, v in paginated_top.data.items():
			response_data['top_learners_' + k if k != 'results' else 'top_learners'] = v

		return Response(response_data, status=status.HTTP_200_OK)


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
			return [IsAdminOrCenter()]
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
	def get_queryset(self):
		queryset = Course.objects.all()
		user = self.request.user
		if self.action in ['list', 'retrieve']:
			# Allow instructors to see their own courses regardless of publish status
			if user.is_authenticated and hasattr(user, 'role') and user.role == 'instructor':
				# For instructors, show all their courses + published courses from others
				queryset = queryset.filter(
					models.Q(is_published=True) | models.Q(instructor=user)
				)
			else:
				# For non-instructors, only show published courses
				queryset = queryset.filter(is_published=True)
		return queryset
	filter_backends = [SearchFilter, OrderingFilter]
	search_fields = ['title', 'description', 'tags__name']
	ordering_fields = ['created_at', 'title']
	ordering = ['-created_at']
	pagination_class = CoursePagination

	def get_permissions(self):
		if self.action in ['create', 'update', 'partial_update', 'destroy', 'deactivate']:
			return [CanCURDCourse()]
		if self.action in ['list', 'retrieve','hot_courses','chat']:
			return [permissions.AllowAny()]
		if self.action == 'my_courses':
			return [IsInstructor()]
		return [permissions.IsAuthenticated()]
	
	def perform_create(self, serializer):
		course = serializer.save(instructor=self.request.user)
		Notification.objects.create(
			course=course,
			notification_type='update',
			title='Khóa học mới đã được tạo',
			message=f'Khóa học "{course.title}" đã được tạo thành công.'
		).send_to_user(course.instructor,send_email=True)


	def update(self, request, *args, **kwargs):
		response = super().update(request, *args, **kwargs)
		course_id = kwargs.get('pk')
		try:
			course = Course.objects.get(pk=course_id)
			Notification.objects.create(
				course=course,
				notification_type='update',
				title='Khóa học đã được chỉnh sửa',
				message=f'Khóa học "{course.title}" đã được chỉnh sửa.'
			).send_to_user(course.instructor)
		except Course.DoesNotExist:
			pass
		return response
	
	@action(detail=False, methods=['get'], url_path='my-courses')
	def my_courses(self, request):
		user = request.user
		if not hasattr(user, 'role') or user.role != 'instructor':
			return Response({"detail": "Only instructors can access this endpoint."}, status=403)
		qs = Course.objects.filter(instructor=user).order_by('-updated_at')
		# Apply search filter
		search = request.query_params.get('search')
		if search:
			qs = qs.filter(models.Q(title__icontains=search) | models.Q(description__icontains=search) | models.Q(tags__name__icontains=search)).distinct()
		# Apply ordering
		ordering = request.query_params.get('ordering', '-updated_at')
		if ordering:
			qs = qs.order_by(ordering)
		# Pagination
		page = self.paginate_queryset(qs)
		if page is not None:
			serializer = self.get_serializer(page, many=True)
			return self.get_paginated_response(serializer.data)
		serializer = self.get_serializer(qs, many=True)
		return Response(serializer.data)

	@action(detail=True, methods=['post'], url_path='deactivate')
	def deactivate(self, request, pk=None):
		course = self.get_object()
		course.is_active = False
		course.save()
		return Response({"success": "Course deactivated."})
	

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
	
	@action(detail=True, methods=['post'], url_path='chat')
	def chat(self, request, pk=None):
		course = self.get_object()
		serializer = ChatRequestSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		question_text = serializer.validated_data['message']
		allow_web = serializer.validated_data.get('allow_web', False)

		# Tạo Question
		question = Question.objects.create(
			course=course,
			asked_by=request.user if request.user.is_authenticated else None,
			content=question_text
		)

		# Sinh câu trả lời từ AI
		answer_text, sources = generate_ai_answer(course, question_text, allow_web=allow_web)

		# Lưu Answer với is_ai=True
		answer = Answer.objects.create(
			question=question,
			answered_by=None,  # AI không phải user
			content=answer_text,
			is_ai=True
		)

		resp_serializer = ChatResponseSerializer({'answer': answer_text, 'sources': sources})
		return Response(resp_serializer.data)

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
	

def generate_file_name(file_obj):
	import time, re
	base_name, ext = os.path.splitext(file_obj.name)
	# Loại bỏ ký tự đặc biệt, thay dấu cách bằng dấu gạch dưới
	base_name = re.sub(r'[^A-Za-z0-9_]', '_', base_name)
	base_name = re.sub(r'_+', '_', base_name)
	timestamp = int(time.time())
	unique_name = f"{base_name}_{timestamp}{ext}"
	print(f"[Document] Original file name: {file_obj.name}, Generated unique name: {unique_name}")
	return unique_name

def run_ingest_document_async(instance):
    ingest_document_task.delay(instance.id)

class DocumentViewSet(viewsets.ViewSet,generics.ListAPIView,generics.RetrieveAPIView,generics.CreateAPIView,generics.UpdateAPIView,generics.DestroyAPIView):

	serializer_class = DocumentSerializer

	def get_permissions(self):
		if self.action in ['create', 'update', 'partial_update', 'destroy', 'upload']:
			return [CanCRUDDocument()]
		if self.action in [ 'retrieve','download']:
			return [permissions.IsAuthenticated()]
		if self.action in ['list']:
			return [permissions.AllowAny()]
		return [permissions.IsAuthenticated()]

	def get_queryset(self):
		queryset = Document.objects.all()
		course_id = self.request.query_params.get('course')
		if course_id:
			queryset = queryset.filter(course_id=course_id).order_by('title')
		return queryset

	def create(self, request, *args, **kwargs):
		print("[Document] create called")

		file_obj = request.FILES.get('file')
		print(file_obj.name if file_obj else "No file uploaded")

		# dict(request.data) có thể trả về list nếu field có nhiều giá trị
		raw_data = dict(request.data)
		data = {}
		for k, v in raw_data.items():
			# Nếu là list, chỉ lấy phần tử đầu tiên
			if isinstance(v, list):
				data[k] = v[0]
			else:
				data[k] = v
		if file_obj:
			file = generate_file_name(file_obj)
			print(f"[Document] Generated file name: {file}")
			saved_name = upload_file(file_obj, file)
			print(f"[Document] Uploaded file to: {saved_name}")
			data['file'] = saved_name
		serializer = self.get_serializer(data=data)
		if not serializer.is_valid():
			print(f"[Document] Serializer errors: {serializer.errors}")
			return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
		instance = serializer.save(uploaded_by=request.user)
		print(f"[Document] Document created with ID: {instance.id}")
		print(f"[Document] Calling ingestion service for document ID: {instance.id}")
		run_ingest_document_async(instance)
		headers = self.get_success_headers(serializer.data)
		return Response(self.get_serializer(instance).data, status=status.HTTP_201_CREATED, headers=headers)

	def update(self, request, *args, **kwargs):
		print("[Document] update called")
		print("request.data:", request.data)
		print("request.FILES:", request.FILES)
		# Chuẩn hóa dữ liệu: chuyển các trường từ list sang giá trị đầu tiên
		raw_data = dict(request.data)
		data = {}
		for k, v in raw_data.items():
			if isinstance(v, list):
				data[k] = v[0]
			else:
				data[k] = v
		# Nếu có file upload, xử lý upload và gán tên file vào data
		uploaded_file = request.FILES.get('file')
		if uploaded_file:
			file_name = generate_file_name(uploaded_file)
			saved_name = upload_file(uploaded_file, file_name)
			print(f"[Document] Uploaded file to: {saved_name}")
			data['file'] = saved_name
		instance = self.get_object()
		serializer = self.get_serializer(instance, data=data, partial=True)
		if not serializer.is_valid():
			print("[Document] Serializer errors:", serializer.errors)
			return Response(serializer.errors, status=400)
		# Chỉ save uploaded_by và file (nếu có) 1 lần duy nhất
		serializer.save(uploaded_by=request.user)
		run_ingest_document_async(instance)
		return Response(serializer.data)
	
	def perform_create(self, serializer):
		print(f"[Document] perform_create called")
		uploaded_file = self.request.FILES.get('file')
		file_path = None
		if uploaded_file:
			print(f"[Document] Uploading file: {uploaded_file.name}")
			file_name = generate_file_name(uploaded_file)
			file_path = upload_file(uploaded_file, file_name)  # Upload to Supabase, get path
			print(f"[Document] File uploaded to: {file_path}")
			serializer.save(
			uploaded_by=self.request.user,
			file=file_path  # Save path, not the file object
		
		)

	# perform_update removed, logic đã gộp vào update

	@action(detail=False, methods=['post'], url_path='upload')
	def upload(self, request):
		file = request.FILES.get("file")
		title = request.data.get("title")
		course_id = request.data.get("course_id")

		print("File size to upload:", file.size)
		print("File type:", type(file))
		if not file:
			return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

		if not course_id:
			return Response({"error": "Course ID is required"}, status=status.HTTP_400_BAD_REQUEST)

		try:
			course = Course.objects.get(id=course_id)
		except Course.DoesNotExist:
			return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)

		# Check if user has permission to upload to this course
		if not (request.user == course.instructor or hasattr(request.user, 'role') and request.user.role in ['admin', 'center','instructor']):
			return Response({"error": "You don't have permission to upload to this course"}, status=status.HTTP_403_FORBIDDEN)

		file_name = f"{request.user.id}_{file.name}"  # tránh trùng tên
		uploaded = upload_file(file, file_name)

		if uploaded:
			doc = Document.objects.create(
				course_id=course_id,
				title=title,
				file=file_name,
				uploaded_by=request.user
			)

			# Gọi ingestion service
			print(f"[Document] Calling ingestion service for document ID: {doc.id}")
			run_ingest_document_async(doc)

			serializer = DocumentSerializer(doc)
			return Response({"message": "Uploaded successfully", "document": serializer.data})
		else:
			return Response({"error": "Upload failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	@action(detail=True, methods=['get'], url_path='download')
	def download(self, request, pk=None):
		"""Serve document file through Django backend to handle authentication"""
		try:
			document = self.get_object()

			# Check if user has permission to access this document
			# (they should be enrolled in the course or be the instructor/center)
			user = request.user
			course = document.course

			has_permission = False
			if user.is_authenticated:
				# Check if user is enrolled in the course
				if CourseProgress.objects.filter(learner=user, course=course).exists():
					has_permission = True
				# Check if user is the instructor of the course
				elif course.instructor == user:
					has_permission = True
				# Check if user is admin/center
				elif hasattr(user, 'role') and user.role in ['admin', 'center']:
					has_permission = True

			if not has_permission:
				return Response({'error': 'You do not have permission to access this document'}, status=403)

			# Get the file from Supabase
			if document.file:
				try:
					from django.http import HttpResponse
					import requests

					# Get the public URL from Supabase
					file_url = get_public_url(document.file)

					if file_url:
						# Get the file content using requests
						response = requests.get(file_url, timeout=30)

						if response.status_code == 200:
							# Create response with file content
							file_response = HttpResponse(
								response.content,
								content_type=response.headers.get('content-type', 'application/octet-stream')
							)

							# Set filename for download
							filename = document.file
							if '.' not in filename and document.title:
								# Try to infer extension from title
								if document.title.lower().endswith('.pdf'):
									filename = f"{document.title}"
								else:
									filename = f"{document.title}.pdf"

							file_response['Content-Disposition'] = f'attachment; filename="{filename}"'
							return file_response
						else:
							return Response({'error': 'Failed to fetch file from storage'}, status=500)
					else:
						return Response({'error': 'Failed to get file URL from Supabase'}, status=500)

				except Exception as supabase_error:
					logger.error(f"Supabase download error: {supabase_error}")
					return Response({'error': 'Failed to download file'}, status=500)
			else:
				return Response({'error': 'No file available'}, status=404)

		except Document.DoesNotExist:
			return Response({'error': 'Document not found'}, status=404)
		except Exception as e:
			logger.error(f"Error downloading document: {e}")
			return Response({'error': 'Internal server error'}, status=500)

# DocumentCompletion ViewSet
class DocumentCompletionViewSet(viewsets.ViewSet,generics.ListAPIView,generics.RetrieveAPIView,):
	serializer_class = DocumentCompletionSerializer
	queryset = DocumentCompletion.objects.all()

	# Override list to always query latest completion from DB
	def list(self, request, *args, **kwargs):
		user_id = request.query_params.get('user')
		document_id = request.query_params.get('document')
		if user_id and document_id:
			completions = DocumentCompletion.objects.filter(user_id=user_id, document_id=document_id)
			serializer = self.get_serializer(completions, many=True)
			return Response(serializer.data)
		return super().list(request, *args, **kwargs)

	# mark_complete logic already uses update_or_create, always returns latest

	@action(detail=True, methods=['post'], url_path='mark_complete', permission_classes=[IsAuthenticated])
	def mark_complete(self, request, pk=None):
		user_id = request.data.get('user')
		document_id = request.data.get('document') or pk
		print(f"[DocumentCompletion] mark_complete called with user_id={user_id}, document_id={document_id}")
		if not user_id or not document_id:
			return Response({'detail': 'Thiếu user hoặc document.'}, status=400)
		from django.contrib.auth import get_user_model
		User = get_user_model()
		try:
			user = User.objects.get(pk=user_id)
		except User.DoesNotExist:
			return Response({'detail': 'Không tìm thấy user.'}, status=404)
		completion, created = DocumentCompletion.objects.update_or_create(user=user, document_id=document_id)
		print(f"[DocumentCompletion] Completion record: {completion}, is_complete={completion.is_complete}, created={created}")
		if completion.is_complete:
			return Response(self.serializer_class(completion).data)
		completion.mark_complete()
		return Response(self.serializer_class(completion).data)

class QuestionViewSet(viewsets.ViewSet,generics.ListAPIView,generics.RetrieveAPIView,generics.CreateAPIView,generics.UpdateAPIView,generics.DestroyAPIView):
	serializer_class = QuestionSerializer
	queryset = Question.objects.all()

class AnswerViewSet(viewsets.ViewSet,generics.ListAPIView,generics.RetrieveAPIView,generics.CreateAPIView,generics.UpdateAPIView,generics.DestroyAPIView):
	serializer_class = AnswerSerializer
	queryset = Answer.objects.all()

class ReviewViewSet(viewsets.ViewSet,generics.ListAPIView,generics.RetrieveAPIView,generics.CreateAPIView,generics.UpdateAPIView,generics.DestroyAPIView):
	def perform_create(self, serializer):
		review = serializer.save()
		Notification.objects.create(
			course=review.course,
			notification_type='update',
			title='Đánh giá mới cho khóa học',
			message=f'{review.user.username} đã gửi đánh giá cho khóa học "{review.course.title}".'
		).send_to_user(review.course.instructor)
		# Nếu là reply cho review khác, gửi notification cho chủ review gốc
		if review.parent_review:
			parent_user = review.parent_review.user
			if parent_user and parent_user != review.user:
				Notification.objects.create(
					course=review.course,
					notification_type='update',
					title='Phản hồi mới cho đánh giá của bạn',
					message=f'{review.user.username} đã phản hồi đánh giá của bạn trong khóa học "{review.course.title}".'
				).send_to_user(parent_user)
	def perform_create(self, serializer):
		answer = serializer.save()
		Notification.objects.create(
			course=answer.question.course,
			notification_type='update',
			title='Trả lời mới cho câu hỏi',
			message=f'{answer.answered_by.username} đã trả lời câu hỏi trong khóa học "{answer.question.course.title}".'
		).send_to_user(answer.question.asked_by)
	def perform_create(self, serializer):
		question = serializer.save()
		Notification.objects.create(
			course=question.course,
			notification_type='update',
			title='Câu hỏi mới trong khóa học',
			message=f'{question.asked_by.username} đã gửi câu hỏi cho khóa học "{question.course.title}".'
		).send_to_user(question.course.instructor)
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

class NotificationViewSet(viewsets.ViewSet,generics.ListAPIView,generics.UpdateAPIView,generics.DestroyAPIView):
	serializer_class = NotificationSerializer
	queryset = Notification.objects.all()
	pagination_class = NotificationPagination

class UserNotificationViewSet(viewsets.ViewSet,generics.ListAPIView,generics.UpdateAPIView,generics.DestroyAPIView):
	serializer_class = UserNotificationSerializer
	queryset = UserNotification.objects.all()
	pagination_class = NotificationPagination

	def get_queryset(self):
		# Chỉ trả về notifications của user hiện tại
		return UserNotification.objects.filter(user=self.request.user).order_by('-created_at')

	def get_permissions(self):
		return [permissions.IsAuthenticated()]

	def destroy(self, request, *args, **kwargs):
		"""Xóa UserNotification và kiểm tra xóa Notification nếu đây là UserNotification cuối cùng"""
		user_notification = self.get_object()
		notification = user_notification.notification

		# Xóa UserNotification trước
		user_notification.delete()

		# Kiểm tra xem còn UserNotification nào khác cho Notification này không
		if not UserNotification.objects.filter(notification=notification).exists():
			# Nếu không còn UserNotification nào, xóa luôn Notification
			notification.delete()

		return Response({"message": "Thông báo đã được xóa thành công"}, status=status.HTTP_204_NO_CONTENT)

	@action(detail=True, methods=['post'])
	def mark_as_read(self, request, pk=None):
		"""Đánh dấu thông báo đã đọc"""
		notification = self.get_object()
		notification.is_read = True
		notification.read_at = localtime(timezone.now())
		notification.save()

		return Response(UserNotificationSerializer(notification).data)

	@action(detail=False, methods=['post'])
	def mark_all_as_read(self, request):
		"""Đánh dấu tất cả thông báo đã đọc"""
		UserNotification.objects.filter(user=request.user, is_read=False).update(
			is_read=True,
			read_at=localtime(timezone.now())
		)

		return Response({"message": "Đã đánh dấu tất cả thông báo đã đọc"})

	@action(detail=False, methods=['get'])
	def unread(self, request):
		"""Lấy số lượng thông báo chưa đọc"""
		unread_count = UserNotification.objects.filter(user=request.user, is_read=False).count()
		return Response({"unread_count": unread_count})
	



class PaymentViewSet(viewsets.ViewSet, generics.CreateAPIView, generics.ListAPIView, generics.RetrieveAPIView):
	serializer_class = PaymentSerializer
	queryset = Payment.objects.all()
	permission_classes = [IsAuthenticated]

	def get_queryset(self):
		user = self.request.user
		# Users can only see their own payments
		return Payment.objects.filter(user=user).order_by('-created_at')
	
	def create(self, request, *args, **kwargs):
		course_id = request.data.get('course_id')
		payment_method = request.data.get('payment_method')
		if not course_id or not payment_method:
			return Response({'error': 'Missing course_id or payment_method'}, status=400)
		try:
			course = Course.objects.get(id=course_id)
		except Course.DoesNotExist:
			return Response({'error': 'Course not found'}, status=400)
		user = request.user
		if CourseProgress.objects.filter(learner=user, course=course).exists():
			return Response({'error': 'Already enrolled'}, status=400)
		txn_ref = str(uuid.uuid4())
		if course.price == 0:
			# Khoá học miễn phí: tạo payment đã thanh toán thành công
			payment = Payment.objects.create(
				user=user,
				course=course,
				amount=0,
				payment_method=payment_method,
				transaction_id=txn_ref,
				is_paid=True,
				paid_at=timezone.now()
			)
			# Tạo CourseProgress cho user
			CourseProgress.objects.create(learner=user, course=course)
			# Tạo notification cho user
			Notification.objects.create(
				course=course,
				notification_type='course_enrollment',
				title='Đăng ký khoá học miễn phí thành công',
				message=f'Bạn đã đăng ký khoá học miễn phí \"{course.title}\" thành công. Hãy bắt đầu học ngay!'
			).send_to_user(user, send_email=True)
			serializer = self.get_serializer(payment)
			return Response(serializer.data, status=201)
		else:
			# Khoá học có phí: tạo payment chưa thanh toán
			payment = Payment.objects.create(
				user=user,
				course=course,
				amount=course.price,
				payment_method=payment_method,
				transaction_id=txn_ref,
				is_paid=False
			)
			payment.transaction_id = txn_ref
			payment.save()
			serializer = self.get_serializer(payment)
			return Response(serializer.data, status=201)
	

# ======================================== VNPay ========================================
def vnpay_encode(value):
	# Encode giống VNPay: dùng quote_plus để chuyển space thành '+'
	from urllib.parse import quote_plus
	return quote_plus(str(value), safe='')

@csrf_exempt
def create_payment_url(request):
	import pytz
	tz = pytz.timezone("Asia/Ho_Chi_Minh")

	vnp_TmnCode = os.environ.get('VNPAY_TMN_CODE')
	vnp_HashSecret = os.environ.get('VNPAY_HASH_SECRET')

	if not vnp_TmnCode or not vnp_HashSecret:
		return JsonResponse({'error': 'VNPay configuration missing. Please set VNPAY_TMN_CODE and VNPAY_HASH_SECRET environment variables.'}, status=500)

	vnp_Url = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
	# Sử dụng environment variable cho backend URL
	backend_base_url = os.environ.get('BACKEND_URL', 'http://127.0.0.1:8000').rstrip('/')
	vnp_ReturnUrl = f'{backend_base_url}/api/vnpay/redirect/'

	#Nhận các thông tin đơn hàng từ request
	amount = request.GET.get("amount", "10000")  # đơn vị VND
	payment_id = request.GET.get("payment_id")
	txn_ref = request.GET.get("txn_ref")
	order_type = "other"

	# Nếu có payment_id, lấy txn_ref từ payment.transaction_id
	if payment_id:
		try:
			payment = Payment.objects.get(id=payment_id)
			txn_ref = payment.transaction_id
		except Payment.DoesNotExist:
			return JsonResponse({'error': 'Payment not found'}, status=400)

	#Tạo mã giao dịch và ngày giờ
	if txn_ref:
		order_id = txn_ref
	else:
		order_id = datetime.now(tz).strftime('%H%M%S')
	create_date = datetime.now(tz).strftime('%Y%m%d%H%M%S')
	ip_address = request.META.get('REMOTE_ADDR')

	#Tạo dữ liệu gửi lên VNPay
	input_data = {
		"vnp_Version": "2.1.0",
		"vnp_Command": "pay",
		"vnp_TmnCode": vnp_TmnCode,
		"vnp_Amount": str(int(float(amount)) * 100),
		"vnp_CurrCode": "VND",
		"vnp_TxnRef": order_id,
		"vnp_OrderInfo": "Thanh toan don hang",
		"vnp_OrderType": order_type,
		"vnp_Locale": "vn",
		"vnp_ReturnUrl": vnp_ReturnUrl,
		"vnp_IpAddr": ip_address,
		"vnp_CreateDate": create_date
	}
	
	#Tạo chữ ký (vnp_SecureHash) để đảm bảo dữ liệu không bị giả mạo
	query_string = '&'.join(
		f"{k}={vnpay_encode(v)}"
		for k, v in sorted(input_data.items())
		if v
	)
	# Chỉ lấy các key có giá trị, không lấy vnp_SecureHash
	hash_data = '&'.join(
		f"{k}={vnpay_encode(v)}"
		for k, v in sorted(input_data.items())
		if v and k != "vnp_SecureHash"
	)

	secure_hash = hmac.new(
		bytes(vnp_HashSecret, 'utf-8'),
		bytes(hash_data, 'utf-8'),
		hashlib.sha512
	).hexdigest()
	# Tạo payment_url đầy đủ để redirect người dùng
	payment_url = f"{vnp_Url}?{query_string}&vnp_SecureHash={secure_hash}"
	#Trả kết quả về frontend
	return JsonResponse({"payment_url": payment_url})

def vnpay_response_message(code):
	mapping = {
		"00": "Giao dịch thành công.",
		"07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
		"09": "Thẻ/Tài khoản chưa đăng ký InternetBanking.",
		"10": "Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.",
		"11": "Hết hạn chờ thanh toán. Vui lòng thực hiện lại giao dịch.",
		"12": "Thẻ/Tài khoản bị khóa.",
		"13": "Sai mật khẩu xác thực giao dịch (OTP).",
		"24": "Khách hàng hủy giao dịch.",
		"51": "Tài khoản không đủ số dư.",
		"65": "Tài khoản vượt quá hạn mức giao dịch trong ngày.",
		"75": "Ngân hàng thanh toán đang bảo trì.",
		"79": "Sai mật khẩu thanh toán quá số lần quy định.",
		"99": "Lỗi khác hoặc không xác định.",
	}
	return mapping.get(code, "Lỗi không xác định.")

def vnpay_redirect(request):
	"""
	Xử lý callback từ VNPay sau khi thanh toán.
	"""
	from_app = request.GET.get('from') == 'app'
	vnp_ResponseCode = request.GET.get('vnp_ResponseCode')
	vnp_TxnRef = request.GET.get('vnp_TxnRef')

	if vnp_ResponseCode is None:
		return HttpResponse("Thiếu tham số vnp_ResponseCode.", status=400)

	message = vnpay_response_message(vnp_ResponseCode)
	payment_success = vnp_ResponseCode == '00'

	payment = None
	try:
		payment = Payment.objects.get(transaction_id=vnp_TxnRef)
		if payment_success:
			payment.is_paid = True
			payment.paid_at = timezone.now()
			payment.save()

			# HOÀN TẤT ENROLLMENT khi VNPay thanh toán thành công
			try:
				course = payment.course
				user = payment.user

				# Tạo CourseProgress nếu chưa tồn tại
				if not CourseProgress.objects.filter(learner=user, course=course).exists():
					CourseProgress.objects.create(learner=user, course=course)

				# Tạo thông báo thanh toán thành công và enrollment
				try:
					Notification.objects.create(
						course=course,
						notification_type='course_enrollment',
						title='Thanh toán VNPay thành công',
						message=f'Thanh toán VNPay thành công và đã đăng ký khóa học "{course.title}". Số tiền: {payment.amount:,.0f} VNĐ'
					).send_to_user(user,send_email=True)
					logger.info(f"Created VNPay success notification for course enrollment {course.id}")
				except Exception as notification_error:
					logger.error(f"Failed to create VNPay success notification: {notification_error}")

				logger.info(f"VNPay payment successful and enrollment completed for course {course.id}")
			except Exception as enrollment_error:
				logger.error(f"Failed to complete enrollment after VNPay payment {vnp_TxnRef}: {enrollment_error}")

			logger.info(f"VNPay payment successful for transaction {vnp_TxnRef}")
		else:
			payment.is_paid = False
			payment.save()

			# Tạo notification cho user về thanh toán thất bại
			try:
				course = payment.course
				user = payment.user
				Notification.objects.create(
					user=user,
					notification_type='payment_failed',
					title='Thanh toán VNPay thất bại',
					message=f'Thanh toán VNPay thất bại cho khóa học "{course.title}". Lý do: {message}. Vui lòng thử lại.'
				)
				logger.info(f"Created VNPay failure notification for course {course.id}")
			except Exception as notification_error:
				logger.error(f"Failed to create VNPay failure notification: {notification_error}")

			logger.warning(f"VNPay payment failed for transaction {vnp_TxnRef}: {message}")
	except Payment.DoesNotExist:
		logger.error(f"Payment not found for transaction {vnp_TxnRef}")

	# Tạo frontend redirect URL với thông tin course để không mất context
	# Sử dụng environment variable cho frontend URL
	frontend_base_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173').rstrip('/')

	if payment_success:
		# Khi thành công: về trang kết quả thanh toán với thông tin course
		course_id = payment.course.id if payment and hasattr(payment, 'course') else ''
		frontend_url = f"{frontend_base_url}/payment/result?payment_result=success&message={urllib.parse.quote(message)}&course_id={course_id}&auto_refresh=true"
	else:
		# Khi thất bại: về trang kết quả thanh toán với thông tin course
		course_id = payment.course.id if payment and hasattr(payment, 'course') else ''
		frontend_url = f"{frontend_base_url}/payment/result?payment_result=failed&message={urllib.parse.quote(message)}&course_id={course_id}"
	
	# Always redirect to frontend
	return HttpResponse(f"""
		<!DOCTYPE html>
		<html lang="vi">
		<head>
			<meta charset="utf-8"/>
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Kết quả thanh toán</title>
			<style>
				* {{ margin: 0; padding: 0; box-sizing: border-box; }}
				body {{ 
					font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					display: flex; 
					align-items: center; 
					justify-content: center; 
					height: 100vh;
					margin: 0;
				}}
				.container {{
					background: white;
					border-radius: 20px;
					box-shadow: 0 20px 40px rgba(0,0,0,0.1);
					padding: 40px;
					text-align: center;
					max-width: 500px;
					width: 90%;
					position: relative;
					overflow: hidden;
				}}
				.container::before {{
					content: '';
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					height: 4px;
					background: {'linear-gradient(90deg, #4CAF50, #81C784)' if payment_success else 'linear-gradient(90deg, #f44336, #ef5350)'};
				}}
				.icon {{
					font-size: 4rem;
					margin-bottom: 20px;
					animation: bounce 1s ease-in-out;
				}}
				.success {{ color: #4CAF50; }}
				.error {{ color: #f44336; }}
				.title {{
					font-size: 1.8rem;
					font-weight: 600;
					margin-bottom: 15px;
					color: #333;
				}}
				.message {{
					font-size: 1.1rem;
					color: #666;
					margin-bottom: 30px;
					line-height: 1.5;
				}}
				.redirect-info {{
					background: #f8f9fa;
					border-radius: 10px;
					padding: 15px;
					color: #6c757d;
					font-size: 0.9rem;
					margin-top: 20px;
				}}
				.loading {{
					display: inline-block;
					width: 20px;
					height: 20px;
					border: 2px solid #f3f3f3;
					border-top: 2px solid #667eea;
					border-radius: 50%;
					animation: spin 1s linear infinite;
					margin-left: 10px;
				}}
				@keyframes bounce {{
					0%, 20%, 60%, 100% {{ transform: translateY(0); }}
					40% {{ transform: translateY(-10px); }}
					80% {{ transform: translateY(-5px); }}
				}}
				@keyframes spin {{
					0% {{ transform: rotate(0deg); }}
					100% {{ transform: rotate(360deg); }}
				}}
				.btn {{
					background: #667eea;
					color: white;
					border: none;
					padding: 12px 30px;
					border-radius: 25px;
					font-size: 1rem;
					cursor: pointer;
					transition: all 0.3s ease;
					text-decoration: none;
					display: inline-block;
					margin-top: 20px;
				}}
				.btn:hover {{
					background: #5a67d8;
					transform: translateY(-2px);
					box-shadow: 0 4px 12px rgba(0,0,0,0.15);
				}}
			</style>
			<script>
				let countdown = 3;
				function updateCountdown() {{
					document.getElementById('countdown').textContent = countdown;
					if (countdown > 0) {{
						countdown--;
						setTimeout(updateCountdown, 1000);
					}} else {{
						window.location.href = "{frontend_url}";
					}}
				}}
				document.addEventListener('DOMContentLoaded', function() {{
					updateCountdown();
				}});
				
				function redirectNow() {{
					window.location.href = "{frontend_url}";
				}}
			</script>
		</head>
		<body>
			<div class="container">
				<div class="icon {'success' if payment_success else 'error'}">
					{'🎉' if payment_success else '😔'}
				</div>
				<div class="title">
					{'Thanh toán thành công!' if payment_success else 'Thanh toán thất bại!'}
				</div>
				<div class="message">
					{message}
				</div>
				<div class="redirect-info">
					<div>Tự động chuyển hướng sau <span id="countdown">3</span> giây...</div>
					<div class="loading"></div>
				</div>
				<button class="btn" onclick="redirectNow()">
					Quay lại ngay
				</button>
			</div>
		</body>
		</html>
	""")
