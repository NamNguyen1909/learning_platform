from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import redirect
import os

def generate_jwt_and_redirect(strategy, backend, user=None, *args, **kwargs):
    if user is None:
        return

    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    # Lấy frontend URL từ settings hoặc hardcode
    frontend_url = os.environ.get("FE_URL", "http://localhost:5173/")
    # Redirect kèm token trên URL
    url = f"{frontend_url}?access={access_token}&refresh={refresh_token}"
    return redirect(url)
