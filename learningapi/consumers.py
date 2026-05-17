"""
learningapi/consumers.py

AsyncWebSocketConsumer for real-time notification system.

Data flow architecture:
    [Backend signal / view] → channel_layer.group_send(group_name, event)
        → NotificationConsumer.send_notification(event)
            → self.send(text_data=JSON)
                → [Browser WebSocket client]

Required packages:
    pip install channels channels-redis

CHANNEL_LAYERS configuration in settings.py:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {"hosts": [os.environ.get("REDIS_URL", "redis://127.0.0.1:6379")]},
        }
    }

Middleware stack (asgi.py):
    application = ProtocolTypeRouter({
        "http": get_asgi_application(),
        "websocket": AllowedHostsOriginValidator(
            JWTAuthMiddleware(
                URLRouter(websocket_urlpatterns)
            )
        ),
    })
"""

import json
import logging
from typing import Any

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.exceptions import DenyConnection, StopConsumer

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _group_name(user_id: int | str) -> str:
    """
    Generate a Channels Group name for a specific user.

    Channels limits group names to ≤ 100 characters, containing only [a-zA-Z0-9._-].
    Use this function instead of manual string concatenation to ensure consistency.

    Args:
        user_id: PK of the User (int or str).

    Returns:
        Group name in the format of "user_<id>", e.g., "user_42".
    """
    return f"user_{user_id}"


# ---------------------------------------------------------------------------
# Consumer
# ---------------------------------------------------------------------------

class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer handling real-time notification channels for each user.

    Each authenticated user joins a unique Channels Group named `user_<user_id>`.
    Any backend component (view, signal, Celery task) can send events to this group
    to push notifications to all open tabs/devices of that user.

    Lifecycle:
        connect()            → authenticate, join group, accept
        receive()            → (optional) process messages from client
        send_notification()  → handler receiving events from Channel Layer, sending to client
        disconnect()         → leave group, clean up

    Group naming convention:
        `user_<user_id>`  — unique per user, avoiding collisions with other
        consumers as long as they do not use the same prefix.
    """

    # ------------------------------------------------------------------
    # Lifecycle: connect
    # ------------------------------------------------------------------

    async def connect(self) -> None:
        """
        Handle incoming WebSocket handshake.

        Process:
            1. Extract user from scope (injected by JWTAuthMiddleware).
            2. Validate authentication and activity status.
            3. Generate group name.
            4. Join the group using channel_layer.group_add().
            5. Accept the connection with self.accept().

        Handled Errors:
            - Unauthenticated user / anonymous → close connection immediately (code 4001).
            - Deactivated user (is_active=False) → close (code 4003).
            - Channel layer not configured (None) → close (code 5000).
            - Any unexpected exceptions → log and close safely.

        Note:
            Calling self.close() before accept() is valid in Django Channels 4+.
            Channels will send a close frame immediately after the open frame without raising errors.
          """
        try:
            user = self.scope.get("user")

            # --- Guard 1: channel layer must be configured ---
            if self.channel_layer is None:
                logger.critical(
                    "[WS] channel_layer is None. "
                    "CHANNEL_LAYERS is not configured in settings.py."
                )
                await self.close(code=5000)
                return

            # --- Guard 2: user must exist and be authenticated ---
            if user is None or not user.is_authenticated:
                logger.warning(
                    "[WS] Unauthenticated connection attempt from %s",
                    self.scope.get("client"),
                )
                await self.close(code=4001)
                return

            # --- Guard 3: account must be active ---
            if not getattr(user, "is_active", True):
                logger.warning(
                    "[WS] Deactivated user %s attempted to connect.", user.id
                )
                await self.close(code=4003)
                return

            # --- Join group ---
            self.user = user
            self.group_name = _group_name(user.id)

            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()

            logger.info(
                "[WS] User %s (id=%s) connected → group '%s' | channel '%s'",
                user.username,
                user.id,
                self.group_name,
                self.channel_name,
            )

            # Send ACK immediately after a successful connection so the client
            # can display "connected" status without waiting for the first notification.
            await self._send_json({
                "type": "connection_established",
                "message": "Notification connection established successfully.",
                "user_id": user.id,
            })

        except Exception as exc:
            logger.exception("[WS] Unexpected error during connect(): %s", exc)
            # Attempt to close the socket safely; close() still works even if accept() hasn't been called.
            await self.close(code=5000)

    # ------------------------------------------------------------------
    # Lifecycle: disconnect
    # ------------------------------------------------------------------

    async def disconnect(self, close_code: int) -> None:
        """
        Clean up when WebSocket closes (either initiated by client or server).

        Args:
            close_code: WebSocket close code (RFC 6455).
                        Common codes:
                          1000 - normal closure
                          1001 - endpoint going away
                          4001 - rejected due to lack of authentication (custom)
                          4003 - rejected due to locked account (custom)

        Note:
            Always check `self.group_name` before calling group_discard()
            since connect() might have returned early before assigning group_name.
        """
        try:
            group_name = getattr(self, "group_name", None)
            if group_name and getattr(self, "channel_layer", None) is not None:
                await self.channel_layer.group_discard(
                    group_name, self.channel_name
                )
                logger.info(
                    "[WS] User %s disconnected from group '%s' (code=%s)",
                    getattr(self, "user", "unknown"),
                    group_name,
                    close_code,
                )
        except Exception as exc:
            logger.exception("[WS] Error during disconnect(): %s", exc)

    # ------------------------------------------------------------------
    # Lifecycle: receive (client → server)
    # ------------------------------------------------------------------

    async def receive(self, text_data: str | None = None, bytes_data: bytes | None = None) -> None:
        """
        Handle message sent from the client (optional, currently only logged).

        This consumer is primarily server-push (one-way). If we need to support
        marking notifications as read via WebSockets in the future, implement the logic here.

        Args:
            text_data:  Text data from client.
            bytes_data: Binary data from client (unused).
        """
        if not text_data:
            return

        try:
            data = json.loads(text_data)
            msg_type = data.get("type")
            logger.debug(
                "[WS] Received from user %s: type='%s'",
                getattr(self, "user", "?"),
                msg_type,
            )

            # Extension point: handle different message types from client
            if msg_type == "ping":
                await self._send_json({"type": "pong"})

            # Example extension: mark notification as read via WS
            # elif msg_type == "mark_read":
            #     notification_id = data.get("notification_id")
            #     await self._handle_mark_read(notification_id)

        except json.JSONDecodeError:
            logger.warning("[WS] Received text_data that is not valid JSON.")
        except Exception as exc:
            logger.exception("[WS] Error in receive(): %s", exc)

    # ------------------------------------------------------------------
    # Channel Layer Event Handler
    # ------------------------------------------------------------------

    async def send_notification(self, event: dict[str, Any]) -> None:
        """
        Handler that receives event from Channel Layer and sends it to the WebSocket client.

        Called automatically by Channels when `group_send()` is executed with
        `"type": "send_notification"` (Channels maps dots '.' to underscores '_').

        How to send from backend (view, signal, Celery task):
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{user_id}",
                {
                    "type": "send_notification",        # maps to send_notification()
                    "notification_id": notification.id,
                    "notification_type": notification.notification_type,
                    "title": notification.title,
                    "message": notification.message,
                    "course_id": notification.course_id,
                    "created_at": notification.created_at.isoformat(),
                    "is_read": False,
                }
            )

        Args:
            event: Dict forwarded by Channel Layer. Must have a "type" key;
                   remaining keys are custom payload.

        Payload sent to client (JSON):
            {
                "type":              "notification",
                "notification_id":   int,
                "notification_type": str,   # 'payment_success' | 'course_enrollment' | ...
                "title":             str,
                "message":           str,
                "course_id":         int | null,
                "created_at":        str (ISO 8601),
                "is_read":           bool
            }
        """
        try:
            payload = {
                "type":              "notification",
                "notification_id":   event.get("notification_id"),
                "notification_type": event.get("notification_type"),
                "title":             event.get("title", ""),
                "message":           event.get("message", ""),
                "course_id":         event.get("course_id"),
                "created_at":        event.get("created_at"),
                "is_read":           event.get("is_read", False),
            }
            await self._send_json(payload)
            logger.debug(
                "[WS] Pushed notification id=%s to user %s",
                event.get("notification_id"),
                getattr(self, "user", "?"),
            )
        except Exception as exc:
            logger.exception("[WS] Failed to push notification to client: %s", exc)

    # ------------------------------------------------------------------
    # Private utilities
    # ------------------------------------------------------------------

    async def _send_json(self, data: dict[str, Any]) -> None:
        """
        Serialize dict to JSON and send it over WebSocket.

        Small wrapper to centralize serialization and encoding error handling
        in one place, avoiding repeating json.dumps() everywhere.

        Args:
            data: Dict to be serialized as a JSON string.

          Raises:
              Exception: Logs and suppresses serialization errors instead of propagating,
                         preventing consumer crash due to a single bad payload.
        """
        try:
            await self.send(text_data=json.dumps(data, ensure_ascii=False))
        except Exception as exc:
            logger.exception("[WS] _send_json failed: %s | data=%s", exc, data)

