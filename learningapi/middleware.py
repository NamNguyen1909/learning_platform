from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

@database_sync_to_async
def get_user_from_token(token_key):
    try:
        token = AccessToken(token_key)
        return User.objects.get(id=token["user_id"])
    except Exception as e:
        logger.warning(f"[JWTAuthMiddleware] Invalid or expired token: {e}")
        return AnonymousUser()

class JWTAuthMiddleware:
    """
    Custom ASGI Middleware to authenticate websockets via JWT token in query string.
    Example: ws://api.com/ws/notifications/?token=ey...
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token_list = params.get("token", [])
        
        if token_list:
            scope["user"] = await get_user_from_token(token_list[0])
        else:
            scope["user"] = AnonymousUser()
            
        return await self.inner(scope, receive, send)
