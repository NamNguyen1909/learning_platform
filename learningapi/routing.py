"""
learningapi/routing.py

WebSocket URL routing for Django Channels 4+.

Mounted under ProtocolTypeRouter in asgi.py, NOT standard Django urlpatterns.

Integration in asgi.py:
    # myproject/asgi.py
    import os
    from django.core.asgi import get_asgi_application
    from channels.routing import ProtocolTypeRouter, URLRouter
    from channels.security.websocket import AllowedHostsOriginValidator
    from learningapi.middleware import JWTAuthMiddleware

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")

    django_asgi_app = get_asgi_application()

    from learningapi.routing import websocket_urlpatterns   # import AFTER get_asgi_application()

    application = ProtocolTypeRouter({
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(  # block origins not in ALLOWED_HOSTS
            JWTAuthMiddleware(                     # inject user into scope from JWT
                URLRouter(websocket_urlpatterns)
            )
        ),
    })

URL pattern:
    ws://host/ws/notifications/

    JavaScript connection example (with JWT token in query param - see note below):
        const token  = localStorage.getItem("access_token");
        const socket = new WebSocket(`wss://api.example.com/ws/notifications/?token=${token}`);

JWT Authentication note:
    Channels' standard AuthMiddlewareStack uses Django session cookie, suitable for
    monolithic applications. If the frontend uses JWT (Bearer token), custom middleware
    like JWTAuthMiddleware is required.

    Simple JWT Middleware (implemented in middleware.py):
        Refer to learningapi/middleware.py.
"""

from django.urls import re_path

from .consumers import NotificationConsumer

# ---------------------------------------------------------------------------
# WebSocket URL patterns
# ---------------------------------------------------------------------------

websocket_urlpatterns = [
    re_path(
        r"^ws/notifications/$",
        NotificationConsumer.as_asgi(),
        name="ws_notifications",
    ),

    # ---------------------------------------------------------------------------
    # Extension point: add other consumers here when needed.
    #
    # Example:
    #   re_path(r"^ws/chat/(?P<room_id>\d+)/$", ChatConsumer.as_asgi()),
    #   re_path(r"^ws/progress/$",              ProgressConsumer.as_asgi()),
    # ---------------------------------------------------------------------------
]
