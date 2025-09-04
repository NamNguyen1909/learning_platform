from django.db import models
from cloudinary.models import CloudinaryField
from cloudinary.uploader import upload
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

# User Manager
class UserManager(BaseUserManager):
	def create_user(self, username, email, password=None, **extra_fields):
		if not username and not email:
			print('Phải cung cấp username hoặc email.')
			raise ValueError('Phải cung cấp username hoặc email.')

		if email:
			email = self.normalize_email(email)
		user = self.model(username=username, email=email, **extra_fields)
		user.set_password(password)
		user.save(using=self._db)
		return user

	def create_superuser(self, username, email, password=None, **extra_fields):
		extra_fields.setdefault('role', 'admin')
		extra_fields.setdefault('is_active', True)
		extra_fields.setdefault('is_staff', True)
		extra_fields.setdefault('is_superuser', True)
		return self.create_user(username, email, password, **extra_fields)

# User Roles
class UserRole(models.TextChoices):
	ADMIN = 'admin', 'Admin'
	LEARNER = 'learner', 'Learner'
	INSTRUCTOR = 'instructor', 'Instructor'
	CENTER = 'center', 'Training Center'


# User Model
class User(AbstractBaseUser, PermissionsMixin):
	username = models.CharField(max_length=255, unique=True, db_index=True)
	email = models.EmailField(max_length=255, unique=True, db_index=True)
	full_name = models.CharField(max_length=255, null=True, blank=True)
	role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.LEARNER)
	phone = models.CharField(max_length=15, null=True, blank=True)
	avatar = CloudinaryField('avatar', folder='learning_platform/user_avatars', null=True, blank=True)
	is_active = models.BooleanField(default=True)
	is_staff = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	objects = UserManager()

	USERNAME_FIELD = 'username'
	REQUIRED_FIELDS = ['email']

	def __str__(self):
		return self.username or self.email

# Tag Model
class Tag(models.Model):
	name = models.CharField(max_length=50, unique=True, db_index=True)
	def __str__(self):
		return self.name


# Course Model
class Course(models.Model):
	title = models.CharField(max_length=255, db_index=True, unique=True)
	description = models.TextField()
	image = CloudinaryField('image', folder='learning_platform/course_images', null=True, blank=True)
	instructor = models.ForeignKey('User', on_delete=models.CASCADE, related_name='courses', limit_choices_to={'role': UserRole.INSTRUCTOR})
	price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], default=0)
	start_date = models.DateField(null=True, blank=True)
	end_date = models.DateField(null=True, blank=True)
	is_active = models.BooleanField(default=True) # thể hiện còn hoạt động/còn có thể đăng ký học không
	is_published = models.BooleanField(default=False) #giảng viên khi tạo có thể lưu nháp hoặc công khai 
	tags = models.ManyToManyField('Tag', blank=True, related_name='courses')
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return self.title

# CourseProgress Model 
class CourseProgress(models.Model):
	learner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='course_progress', limit_choices_to={'role': UserRole.LEARNER})
	course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='course_progress')
	enrolled_at = models.DateTimeField(auto_now_add=True)
	completed_at = models.DateTimeField(null=True, blank=True)
	progress = models.FloatField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])  # % hoàn thành
	is_completed = models.BooleanField(default=False)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		unique_together = ('learner', 'course')

	def __str__(self):
		return f"{self.learner} - {self.course}"


# Document Model
class Document(models.Model):
	course = models.ForeignKey('Course', on_delete=models.CASCADE, related_name='documents')
	title = models.CharField(max_length=255)
	file = CloudinaryField('file', folder='learning_platform/course_documents', resource_type='raw', null=True, blank=True)
	url = models.URLField(max_length=500, null=True, blank=True)
	uploaded_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='uploaded_documents')
	uploaded_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return self.title
	

class DocumentCompletion(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='document_completions')
	document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='completions')
	is_complete = models.BooleanField(default=False)
	completed_at = models.DateTimeField(null=True, blank=True)

	def mark_complete(self):
		self.is_complete = True
		self.completed_at = timezone.now()
		self.save()
		# Cập nhật progress cho CourseProgress liên quan
		from .models import CourseProgress
		learner = self.user
		course = self.document.course
		try:
			progress = CourseProgress.objects.get(learner=learner, course=course)
		except CourseProgress.DoesNotExist:
			return
		# Tổng số document của khoá học
		total_docs = course.documents.count()
		if total_docs == 0:
			progress.progress = 0
			progress.is_completed = False
			progress.save()
			return
		# Số document learner đã hoàn thành
		completed_docs = DocumentCompletion.objects.filter(user=learner, document__course=course, is_complete=True).count()
		progress.progress = round(completed_docs / total_docs * 100, 2) 
		progress.is_completed = progress.progress >= 100
		progress.save()

	class Meta:
		unique_together = ('user', 'document')

	


# Question/Answer Model: mỗi question như 1 box chat, answer là các reply giữa người học và AI tích hợp
class Question(models.Model):
	course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='questions')
	asked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='questions')
	content = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"Q: {self.content[:30]}..."

class Answer(models.Model):
	question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
	answered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='answers')
	content = models.TextField()
	is_ai = models.BooleanField(default=False)
	parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"A: {self.content[:30]}..."

# Payment Model
class Payment(models.Model):
	PAYMENT_METHOD_CHOICES = (
		('vnpay', 'VNPay'),
		('momo', 'MoMo'),
	)
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
	course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='payments')
	amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
	payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
	is_paid = models.BooleanField(default=False)
	paid_at = models.DateTimeField(null=True, blank=True)
	transaction_id = models.CharField(max_length=255, unique=True)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"Payment {self.transaction_id}"

# Review Model
class Review(models.Model):
	course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='reviews')
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='course_reviews')
	rating = models.PositiveIntegerField(validators=[MinValueValidator(0), MaxValueValidator(5)], default=0,null=True, blank=True)
	comment = models.TextField(null=True, blank=True)
	parent_review = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"{self.user} - {self.rating} sao cho {self.course}"

# Notification Model
class Notification(models.Model):
	NOTIFICATION_TYPES = (
		('payment_success', 'Payment Success'),
		('payment_failed', 'Payment Failed'),
		('course_enrollment', 'Course Enrollment'),
		('warning', 'Warning'),
		('reminder', 'Reminder'),
		('update', 'Update'),
	)
	course = models.ForeignKey(Course, on_delete=models.CASCADE, null=True, blank=True, related_name='course_notifications')
	notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='reminder')
	title = models.CharField(max_length=255)
	message = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return self.title

	def send_to_user(self, user, send_email=False):
		"""Send this notification to a specific user"""
		user_notification = UserNotification.objects.create(
			user=user,
			notification=self
		)
		if send_email:
			self._send_email_to_user(user)
		return user_notification

	def send_to_users(self, users, send_email=False):
		"""Send this notification to multiple users"""
		user_notifications = []
		for user in users:
			un = UserNotification.objects.create(
				user=user,
				notification=self
			)
			user_notifications.append(un)
		if send_email:
			for user in users:
				self._send_email_to_user(user)
		return user_notifications

	def _send_email_to_user(self, user):
		"""Send email to user with notification details"""
		from django.core.mail import send_mail
		from django.conf import settings

		subject = self.title
		html_message = f"""
		<html>
		<head>
			<style>
				body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
				.container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }}
				.header {{ background-color: #007bff; color: #ffffff; padding: 10px; text-align: center; border-radius: 8px 8px 0 0; }}
				.content {{ padding: 20px; }}
				.footer {{ text-align: center; padding: 10px; font-size: 12px; color: #666; }}
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h2>{self.title}</h2>
				</div>
				<div class="content">
					<p>Xin chào {user.full_name or user.username},</p>
					<p>{self.message}</p>
					<p>Trân trọng,<br>Đội ngũ Learning Platform</p>
				</div>
				<div class="footer">
					<p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
				</div>
			</div>
		</body>
		</html>
		"""
		send_mail(
			subject,
			self.message,  # plain text fallback
			settings.DEFAULT_FROM_EMAIL,
			[user.email],
			html_message=html_message,
			fail_silently=True
		)

# UserNotification Model
class UserNotification(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_notifications')
	notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='user_notifications')
	is_read = models.BooleanField(default=False)
	read_at = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		unique_together = ('user', 'notification')

# Note Model
class Note(models.Model):
	user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='notes')
	course = models.ForeignKey('Course', on_delete=models.SET_NULL, related_name='notes',null=True, blank=True)
	document = models.ForeignKey('Document', on_delete=models.SET_NULL, related_name='notes', null=True, blank=True)
	video_id = models.CharField(max_length=100)  # id video YouTube
	timestamp = models.FloatField()  # thời gian (giây)
	content = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"Note by {self.user} at {self.timestamp}s"
