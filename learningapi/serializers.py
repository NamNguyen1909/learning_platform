from rest_framework import serializers
from .models import *
import cloudinary.utils

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'role', 'phone', 'avatar', 'is_active', 'created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['avatar'] = instance.avatar.url if instance.avatar else ''
        return data

class CourseSerializer(serializers.ModelSerializer):
    instructor = UserSerializer(read_only=True)
    tags = serializers.PrimaryKeyRelatedField(queryset=Tag.objects.all(), many=True, required=False)

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'image', 'instructor', 'price', 'start_date', 'end_date', 'is_active', 'is_published', 'tags', 'created_at', 'updated_at']

    
    def update(self, instance, validated_data):
        # Giữ nguyên is_active nếu không truyền lên
        if 'is_active' not in validated_data:
            validated_data['is_active'] = instance.is_active
            print("is_active not in validated_data, keeping existing value:", instance.is_active)
        return super().update(instance, validated_data)
    
    def validate_title(self, value):
        # Check for duplicate title only on create, not on update
        if self.instance is None:  # Creating new course
            if Course.objects.filter(title=value).exists():
                raise serializers.ValidationError("A course with this title already exists.")
        else:  # Updating existing course
            if Course.objects.filter(title=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("A course with this title already exists.")
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['image'] = instance.image.url if instance.image else ''
        data['tags'] = [tag.name for tag in instance.tags.all()]
        return data

class DocumentSerializer(serializers.ModelSerializer):
    file = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    uploaded_by = UserSerializer(read_only=True)
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all(), required=True)
    class Meta:
        model = Document
        fields = ['id', 'course', 'title', 'file', 'url', 'uploaded_by', 'uploaded_at']

    def validate(self, data):
        file = data.get('file')
        url = data.get('url')
        if self.instance:  # Update: Kết hợp data + instance
            file = file if 'file' in data else self.instance.file
            url = url if 'url' in data else self.instance.url
        if not file and (not url or url == ''):
            raise serializers.ValidationError("Either 'file' or a non-empty 'url' must be provided.")
        return data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.file:
            # If file is a string (Supabase URL), use it directly
            if isinstance(instance.file, str):
                data['file'] = instance.file
        else:
            data['file'] = ''
        return data


class DocumentCompletionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    document = DocumentSerializer(read_only=True)
    class Meta:
        model = DocumentCompletion
        fields = ['id', 'user', 'document', 'is_complete', 'completed_at']


class CourseProgressSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    class Meta:
        model = CourseProgress
        fields = ['id', 'student', 'course', 'enrolled_at', 'completed_at', 'progress', 'is_completed', 'updated_at']

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
    course = CourseSerializer(read_only=True)
    class Meta:
        model = Payment
        fields = ['id', 'user', 'course', 'amount', 'payment_method', 'is_paid', 'paid_at', 'transaction_id', 'created_at']

class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    parent_review = serializers.PrimaryKeyRelatedField(queryset=Review.objects.all(), required=False, allow_null=True)
    class Meta:
        model = Review
        fields = ['id', 'course', 'user', 'rating', 'comment', 'parent_review', 'created_at']
        read_only_fields = ['user']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            validated_data['user'] = request.user
        else:
            raise serializers.ValidationError('Authentication required')
        return super().create(validated_data)

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

class NoteSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    document = DocumentSerializer(read_only=True)
    class Meta:
        model = Note
        fields = ['id', 'user', 'course', 'document', 'video_id', 'timestamp', 'content', 'created_at']


class ChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chunk
        fields = ['id', 'course', 'document', 'text', 'meta']

class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField()
    allow_web = serializers.BooleanField(default=False)

class ChatResponseSerializer(serializers.Serializer):
    answer = serializers.CharField()
    sources = serializers.ListField(child=serializers.CharField())