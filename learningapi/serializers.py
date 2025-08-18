from rest_framework import serializers
from .models import User, Course, Document, CourseProgress, Tag, Question, Answer, Payment, Review, Notification, UserNotification

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone', 'avatar', 'is_active', 'is_staff', 'created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['avatar'] = instance.avatar.url if instance.avatar else ''
        return data

class CourseSerializer(serializers.ModelSerializer):
    teacher = UserSerializer(read_only=True)
    center = UserSerializer(read_only=True)
    tags = serializers.StringRelatedField(many=True)

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'image', 'teacher', 'center', 'start_date', 'end_date', 'is_active', 'tags', 'created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['image'] = instance.image.url if instance.image else ''
        return data

class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    class Meta:
        model = Document
        fields = ['id', 'course', 'title', 'file', 'uploaded_by', 'uploaded_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['file'] = instance.file.url if instance.file else ''
        return data

class CourseProgressSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    class Meta:
        model = CourseProgress
        fields = ['id', 'student', 'course', 'enrolled_at', 'is_paid', 'payment', 'start_time', 'completed_at', 'progress', 'is_completed']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']

class QuestionSerializer(serializers.ModelSerializer):
    asked_by = UserSerializer(read_only=True)
    class Meta:
        model = Question
        fields = ['id', 'course', 'asked_by', 'content', 'created_at']

class AnswerSerializer(serializers.ModelSerializer):
    answered_by = UserSerializer(read_only=True)
    parent = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = Answer
        fields = ['id', 'question', 'answered_by', 'content', 'is_ai', 'parent', 'created_at']

class PaymentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Payment
        fields = ['id', 'user', 'amount', 'payment_method', 'is_paid', 'paid_at', 'transaction_id', 'created_at']

class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    parent_review = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = Review
        fields = ['id', 'course', 'user', 'rating', 'comment', 'parent_review', 'created_at']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'course', 'notification_type', 'title', 'message', 'created_at']

class UserNotificationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    notification = NotificationSerializer(read_only=True)
    class Meta:
        model = UserNotification
        fields = ['id', 'user', 'notification', 'is_read', 'read_at', 'created_at']
