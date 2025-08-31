
from django.contrib import admin


from django.utils.safestring import mark_safe
from django import forms
from .models import *

# User Admin
class UserAdmin(admin.ModelAdmin):
	list_display = ['id', 'username', 'email', 'role', 'is_active', 'is_staff', 'created_at', 'avatar_view']
	search_fields = ['username', 'email', 'phone']
	list_filter = ['role', 'is_active', 'is_staff', 'created_at']
	readonly_fields = ['avatar_view', 'created_at', 'updated_at']
	list_per_page = 20

	def avatar_view(self, obj):
		if obj.avatar:
			return mark_safe(f"<img src='{obj.avatar.url}' width='80' />")
		return "Không có ảnh"
	avatar_view.short_description = "Avatar"

# Tag Admin
class TagAdmin(admin.ModelAdmin):
	list_display = ['id', 'name']
	search_fields = ['name']
	list_per_page = 20

# Course Admin
class CourseAdmin(admin.ModelAdmin):
	list_display = ['id', 'title', 'instructor', 'price', 'is_active', 'created_at', 'image_view']
	search_fields = ['title', 'description']
	list_filter = ['is_active', 'created_at', 'instructor']
	readonly_fields = ['image_view', 'created_at', 'updated_at']
	filter_horizontal = ['tags']
	list_per_page = 20

	def image_view(self, obj):
		if obj.image:
			return mark_safe(f"<img src='{obj.image.url}' width='120' />")
		return "Không có ảnh"
	image_view.short_description = "Ảnh khoá học"

# CourseProgress Admin
class CourseProgressAdmin(admin.ModelAdmin):
	list_display = ['id', 'learner', 'course', 'progress', 'is_completed', 'enrolled_at', 'completed_at']
	search_fields = ['learner__username', 'course__title']
	list_filter = ['is_completed', 'enrolled_at', 'completed_at']
	list_per_page = 20

# Document Admin
class DocumentAdmin(admin.ModelAdmin):
	list_display = ['id', 'title', 'course', 'uploaded_by', 'uploaded_at', 'file_view']
	search_fields = ['title', 'course__title']
	list_filter = ['course', 'uploaded_at']
	readonly_fields = ['file_view']
	list_per_page = 20

	def file_view(self, obj):
		if obj.file:
			return mark_safe(f"<a href='{obj.file.url}' target='_blank'>Xem file</a>")
		return "Không có file"
	file_view.short_description = "File"

# DocumentCompletion Admin
class DocumentCompletionAdmin(admin.ModelAdmin):
	list_display = ['id', 'user', 'document', 'is_complete', 'completed_at']
	search_fields = ['user__username', 'document__title']
	list_filter = ['is_complete', 'completed_at']
	list_per_page = 20


# Question Admin
class QuestionAdmin(admin.ModelAdmin):
	list_display = ['id', 'course', 'asked_by', 'content_preview', 'created_at']
	search_fields = ['content', 'asked_by__username', 'course__title']
	list_filter = ['course', 'created_at']
	list_per_page = 20

	def content_preview(self, obj):
		return obj.content[:50] + ('...' if len(obj.content) > 50 else '')
	content_preview.short_description = "Nội dung"

# Answer Admin
class AnswerAdmin(admin.ModelAdmin):
	list_display = ['id', 'question', 'answered_by', 'is_ai', 'content_preview', 'created_at']
	search_fields = ['content', 'answered_by__username', 'question__content']
	list_filter = ['is_ai', 'created_at']
	list_per_page = 20

	def content_preview(self, obj):
		return obj.content[:50] + ('...' if len(obj.content) > 50 else '')
	content_preview.short_description = "Nội dung"

# Payment Admin
class PaymentAdmin(admin.ModelAdmin):
	list_display = ['id', 'user', 'course', 'amount', 'payment_method', 'is_paid', 'paid_at', 'transaction_id']
	search_fields = ['user__username', 'course__title', 'transaction_id']
	list_filter = ['payment_method', 'is_paid', 'paid_at']
	readonly_fields = ['transaction_id']
	list_per_page = 20

# Review Admin
class ReviewAdmin(admin.ModelAdmin):
	list_display = ['id', 'course', 'user', 'rating', 'comment_preview', 'created_at']
	search_fields = ['course__title', 'user__username', 'comment']
	list_filter = ['rating', 'created_at']
	list_per_page = 20

	def comment_preview(self, obj):
		return (obj.comment[:50] + '...') if obj.comment and len(obj.comment) > 50 else obj.comment
	comment_preview.short_description = "Bình luận"

# Notification Admin
class NotificationAdmin(admin.ModelAdmin):
	list_display = ['id', 'course', 'notification_type', 'title', 'created_at']
	search_fields = ['title', 'message']
	list_filter = ['notification_type', 'created_at']
	list_per_page = 20

# UserNotification Admin
class UserNotificationAdmin(admin.ModelAdmin):
	list_display = ['id', 'user', 'notification', 'is_read', 'read_at', 'created_at']
	search_fields = ['user__username', 'notification__title']
	list_filter = ['is_read', 'created_at']
	list_per_page = 20

# Note Admin
class NoteAdmin(admin.ModelAdmin):
	list_display = ['id', 'user', 'course', 'document', 'video_id', 'timestamp', 'content_preview', 'created_at']
	search_fields = ['user__username', 'course__title', 'document__title', 'content']
	list_filter = ['course', 'document', 'created_at']
	list_per_page = 20

	def content_preview(self, obj):
		return obj.content[:50] + ('...' if len(obj.content) > 50 else '')
	content_preview.short_description = "Nội dung"

admin.site.register(User, UserAdmin)
admin.site.register(Tag, TagAdmin)
admin.site.register(Course, CourseAdmin)
admin.site.register(CourseProgress, CourseProgressAdmin)
admin.site.register(Document, DocumentAdmin)
admin.site.register(DocumentCompletion, DocumentCompletionAdmin)
admin.site.register(Question, QuestionAdmin)
admin.site.register(Answer, AnswerAdmin)
admin.site.register(Payment, PaymentAdmin)
admin.site.register(Review, ReviewAdmin)
admin.site.register(Notification, NotificationAdmin)
admin.site.register(UserNotification, UserNotificationAdmin)
admin.site.register(Note, NoteAdmin)
