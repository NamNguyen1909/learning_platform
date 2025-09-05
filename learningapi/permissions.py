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