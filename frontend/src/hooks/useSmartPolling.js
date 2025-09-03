/**
 * Smart Polling Hook với Page Visibility API
 * Tự động tạm dừng polling khi tab bị ẩn để tiết kiệm tài nguyên
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for smart polling with Page Visibility API
 * @param {Function} callback - Function to call on each poll
 * @param {number} interval - Polling interval in milliseconds
 * @param {boolean} enabled - Whether polling should be enabled
 * @param {Array} dependencies - Dependencies array for effect
 * @param {Object} options - Additional options
 */
export const useSmartPolling = (
  callback,
  interval = 60000,
  enabled = true,
  dependencies = [],
  options = {}
) => {
  const {
    enableLogs = false,
    pollingName = 'Smart Polling',
  } = options;

  const intervalRef = useRef(null);
  const isVisibleRef = useRef(true);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const startPolling = useCallback(() => {
    if (enabled && isVisibleRef.current) {
      // Call immediately
      callbackRef.current();

      // Setup interval
      intervalRef.current = setInterval(() => {
        callbackRef.current();
      }, interval);

      if (enableLogs) {
        console.log(`🚀 ${pollingName} started (${interval/1000}s interval)`);
      }
    }
  }, [enabled, interval, pollingName, enableLogs]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;

      if (enableLogs) {
        console.log(`⏹️ ${pollingName} stopped`);
      }
    }
  }, [pollingName, enableLogs]);

  const handleVisibilityChange = useCallback(() => {
    isVisibleRef.current = !document.hidden;

    if (document.hidden) {
      if (enableLogs) {
        console.log(`📱 Tab hidden - Pausing ${pollingName}`);
      }
      stopPolling();
    } else {
      if (enableLogs) {
        console.log(`👀 Tab visible - Resuming ${pollingName}`);
      }
      startPolling();
    }
  }, [startPolling, stopPolling, pollingName, enableLogs]);

  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    // Setup visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, startPolling, stopPolling, handleVisibilityChange, ...dependencies]);

  return {
    start: startPolling,
    stop: stopPolling,
    isRunning: intervalRef.current !== null,
  };
};

/**
 * Simplified hook for basic polling
 * @param {Function} callback - Function to call on each poll
 * @param {number} interval - Polling interval in milliseconds
 * @param {boolean} enabled - Whether polling should be enabled
 */
export const usePolling = (callback, interval = 60000, enabled = true) => {
  return useSmartPolling(callback, interval, enabled, [], { enableLogs: false });
};


/**
 * Hook for unread notification count polling - every 30 seconds
 * @param {Function} fetchUnreadCount - Function to fetch unread notification count
 * @param {boolean} enabled - Whether polling should be enabled
 */
export const useUnreadNotificationsPolling = (fetchUnreadCount, enabled = true) => {
  return useSmartPolling(
    fetchUnreadCount,
    30000, // 30 seconds
    enabled,
    [],
    {
      enableLogs: true,
      pollingName: 'Unread Notifications Count Polling'
    }
  );
};


export default useSmartPolling;
