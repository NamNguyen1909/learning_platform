from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets,generics
from .permissions import *
from .serializers import *
from rest_framework.filters import SearchFilter,OrderingFilter
from rest_framework import permissions
from rest_framework.decorators import action

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


class UserViewSet(viewsets.ViewSet,generics.CreateAPIView,generics.UpdateAPIView,generics.ListAPIView):
	serializer_class = UserSerializer
	queryset = User.objects.all()
	filter_backends=[SearchFilter,OrderingFilter]
	search_fields = ['username', 'email','phone']
	ordering_fields = [ 'created_at', 'username']
	ordering = ['-created_at']

	def get_permissions(self):
		if self.action in ['create']:
			return [permissions.AllowAny()]
		return [permissions.IsAuthenticated()]

	#chỉ có thể tạo account với role là learner hoặc instructor
	def create(self, request, *args, **kwargs):
		role = request.data.get("role")
		if role not in ["learner", "instructor"]:
			return Response({"error": "Invalid role. Only 'learner' and 'instructor' roles are allowed."}, status=400)
		password = request.data.pop('password')
		user = User(**request.data)
		user.set_password(password)
		user.save()
		return Response({"success": "User created successfully."}, status=201)

	@action(detail=False, methods=['get'])
	def current_user(self, request):
		serializer = self.get_serializer(request.user)
		return Response(serializer.data)
	
class CourseViewSet(viewsets.ViewSet,generics.CreateAPIView,generics.UpdateAPIView,generics.ListAPIView):
	serializer_class = CourseSerializer
	queryset = Course.objects.all()
	filter_backends=[SearchFilter,OrderingFilter]
	search_fields = ['title', 'description','tags__name']
	ordering_fields = [ 'created_at', 'title']
	ordering = ['-created_at']

	def get_permissions(self):
		if self.action in ['create', 'update', 'partial_update']:
			return [CanCURDCourse()]
		return [permissions.IsAuthenticated()]
	
