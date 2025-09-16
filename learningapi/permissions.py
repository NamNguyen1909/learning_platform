from rest_framework import permissions

class IsAdmin(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'admin'

class IsInstructor(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'instructor'

class IsLearner(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'learner'

class IsCenter(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'center'

class CanCURDCourse(permissions.BasePermission):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role in ['admin', 'center', 'instructor']

class IsAdminOrCenter(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role in ['admin', 'center']

class CanCRUDDocument(permissions.BasePermission):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role in ['admin', 'instructor']
    
class CanViewDocument(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        # Admin hoặc instructor hoặc người upload thì cho phép
        if user.is_superuser or getattr(user, 'role', None) == 'admin':
            return True
        if getattr(user, 'role', None) == 'instructor' and obj.uploaded_by_id == user.id:
            return True
        # Learner: kiểm tra CourseProgress
        if getattr(user, 'role', None) == 'learner':
            return obj.course.course_progress.filter(learner=user).exists()
        return False