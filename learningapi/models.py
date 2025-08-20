from django.db import models
from cloudinary.models import CloudinaryField
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

# User Manager
class UserManager(BaseUserManager):
	def create_user(self, username, email, password=None, **extra_fields):
		if not username and not email:
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
	role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.LEARNER)
	phone = models.CharField(max_length=15, null=True, blank=True)
	avatar = CloudinaryField('avatar', folder='user_avatars', null=True, blank=True)
	is_active = models.BooleanField(default=True)
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
	title = models.CharField(max_length=255, db_index=True)
	description = models.TextField()
	image = CloudinaryField('image', folder='course_images', null=True, blank=True)
	instructor = models.ForeignKey('User', on_delete=models.CASCADE, related_name='courses', limit_choices_to={'role': UserRole.INSTRUCTOR})
	price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], default=0)
	start_date = models.DateField()
	end_date = models.DateField()
	is_active = models.BooleanField(default=True)
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

	class Meta:
		unique_together = ('learner', 'course')

	def __str__(self):
		return f"{self.learner} - {self.course}"


# Document Model
class Document(models.Model):
	course = models.ForeignKey('Course', on_delete=models.CASCADE, related_name='documents')
	title = models.CharField(max_length=255)
	file = CloudinaryField('file', folder='course_documents', null=True, blank=True)
	uploaded_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='uploaded_documents')
	uploaded_at = models.DateTimeField(auto_now_add=True)
	def __str__(self):
		return self.title


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
		('momo', 'MoMo'),
		('vnpay', 'VNPay'),
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
	rating = models.PositiveIntegerField(validators=[MinValueValidator(0), MaxValueValidator(5)], default=0)
	comment = models.TextField(null=True, blank=True)
	parent_review = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"{self.user} - {self.rating} sao cho {self.course}"

# Notification Model
class Notification(models.Model):
	NOTIFICATION_TYPES = (
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
	course = models.ForeignKey('Course', on_delete=models.SET_NULL, related_name='notes')
	document = models.ForeignKey('Document', on_delete=models.SET_NULL, related_name='notes', null=True, blank=True)
	video_id = models.CharField(max_length=100)  # id video YouTube
	timestamp = models.FloatField()  # thời gian (giây)
	content = models.TextField()
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"Note by {self.user} at {self.timestamp}s"
