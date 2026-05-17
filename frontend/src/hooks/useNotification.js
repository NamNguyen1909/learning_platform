import { useEffect, useRef, useState, useCallback } from 'react';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

const useNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectDelayRef = useRef(1000); // Start at 1 second
  const isMountedRef = useRef(true);     // Tracks whether the component is still mounted

  const cleanup = useCallback(() => {
    // Clear timers first to prevent any pending callbacks from firing
    clearInterval(heartbeatIntervalRef.current);
    heartbeatIntervalRef.current = null;
    clearTimeout(reconnectTimeoutRef.current);
    reconnectTimeoutRef.current = null;

    // Null out all event handlers before closing to prevent onclose
    // from scheduling a reconnect on an unmounted component
    if (socketRef.current) {
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      if (
        socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING
      ) {
        socketRef.current.close(1000, 'Component unmounted');
      }
      socketRef.current = null;
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    // Bail out if already unmounted or a socket is already open/connecting
    if (!isMountedRef.current) return;
    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return; // Prevent duplicate connections
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      // No token available — do not connect; avoids a 4001 rejection spam loop
      return;
    }

    const ws = new WebSocket(`${WS_BASE_URL}/ws/notifications/?token=${token}`);
    socketRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) { ws.close(1000, 'Component unmounted'); return; }
      console.log('[WS] Connected to notification channel');
      reconnectDelayRef.current = 1000; // Reset exponential backoff on success

      // Start heartbeat ping every 30 seconds
      heartbeatIntervalRef.current = setInterval(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      if (!isMountedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        // Ignore protocol-level control messages
        if (data.type === 'connection_established' || data.type === 'pong') return;
        setNotifications((prev) => [data, ...prev]);
      } catch (error) {
        console.error('[WS] Error parsing message:', error);
      }
    };

    ws.onclose = (event) => {
      // Stop heartbeat immediately on disconnect
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;

      // Intentional close or component unmounted — do not reconnect
      if (!isMountedRef.current || event.code === 1000) return;

      // Auth failures — no retry to avoid infinite rejection loops
      if (event.code === 4001 || event.code === 4003) {
        console.warn(`[WS] Auth rejected (code=${event.code}). Will not reconnect.`);
        return;
      }

      // FIX: Capture and advance delay BEFORE scheduling, not after connect()
      const currentDelay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(currentDelay * 2, 16000); // Cap at 16s

      console.log(`[WS] Disconnected (code=${event.code}). Reconnecting in ${currentDelay}ms...`);

      reconnectTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) connectWebSocket();
      }, currentDelay);
    };

    ws.onerror = (error) => {
      // onerror is always followed by onclose, so no manual close needed here
      console.error('[WS] Socket error:', error);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    isMountedRef.current = true;
    connectWebSocket();

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [connectWebSocket, cleanup]);

  return notifications;
};

export default useNotification;