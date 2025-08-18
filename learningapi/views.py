from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

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
