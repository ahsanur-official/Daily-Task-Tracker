/**
 * Browser Notification Utility
 * Handles Web Notifications API permissions, dispatching native browser notifications,
 * and broadcasting in-app events for visual toast indicators.
 */

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface AppNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  type?: 'timer_complete' | 'deadline_reached' | 'system';
  taskId?: string;
  onClick?: () => void;
  requireInteraction?: boolean;
}

/**
 * Check if the current browser environment supports the Notifications API.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get the current notification permission state.
 */
export function getNotificationPermission(): NotificationPermissionStatus {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionStatus;
}

/**
 * Prompt the user for notification permissions using the standard Notifications API.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionStatus;
  } catch (error) {
    console.warn('[Notifications] Error requesting notification permission:', error);
    return getNotificationPermission();
  }
}

/**
 * Broadcasts an in-app visual notification event (for toast feedback)
 * and dispatches a native browser notification if permission has been granted.
 */
export function triggerBrowserNotification(options: AppNotificationOptions): boolean {
  // 1. Dispatch custom event for reactive in-app toast display
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('app-notification-event', {
          detail: {
            ...options,
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            timestamp: Date.now(),
          },
        })
      );
    } catch (e) {
      console.warn('[Notifications] Failed to dispatch in-app event', e);
    }
  }

  // 2. Dispatch native OS/Browser notification if supported and granted
  if (!isNotificationSupported()) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const nativeNotification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      badge: options.badge || '/favicon.ico',
      tag: options.tag || `notif-${options.type || 'general'}-${Date.now()}`,
      requireInteraction: options.requireInteraction ?? true,
      silent: false,
    });

    nativeNotification.onclick = () => {
      try {
        window.focus();
        if (options.onClick) {
          options.onClick();
        }
        nativeNotification.close();
      } catch {
        // window focus restriction in some sandboxes
      }
    };

    return true;
  } catch (err) {
    console.warn('[Notifications] Native browser notification creation failed:', err);
    return false;
  }
}

/**
 * Triggers a notification when a timer focus session ends / target is achieved.
 */
export function notifyTimerSessionComplete(taskTitle: string, durationMinutes: number): boolean {
  const durationLabel = durationMinutes > 0 ? `${durationMinutes}m ` : '';
  return triggerBrowserNotification({
    title: '🎯 Focus Session Complete!',
    body: `Awesome work! You completed your ${durationLabel}target for "${taskTitle}". Your streak progress has been updated.`,
    tag: `timer-complete-${taskTitle}-${Date.now()}`,
    type: 'timer_complete',
    requireInteraction: true,
  });
}

/**
 * Triggers a notification when a task reaches its scheduled deadline.
 */
export function notifyTaskDeadlineReached(taskTitle: string, deadlineTime: string, taskId?: string): boolean {
  return triggerBrowserNotification({
    title: '⏰ Task Deadline Reached!',
    body: `"${taskTitle}" has reached its deadline (${deadlineTime}). Hop in to log your focus session and keep your streak!`,
    tag: `task-deadline-${taskId || taskTitle}-${deadlineTime}`,
    type: 'deadline_reached',
    taskId,
    requireInteraction: true,
  });
}

/**
 * Triggers a test notification so the user can verify their browser settings.
 */
export function sendTestNotification(): boolean {
  return triggerBrowserNotification({
    title: '🔔 Notifications Active!',
    body: 'Browser notifications are enabled. You will be alerted when focus timers finish and tasks reach their deadlines.',
    tag: 'test-notification',
    type: 'system',
    requireInteraction: false,
  });
}
