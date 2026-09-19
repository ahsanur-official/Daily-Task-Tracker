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
  type?: 'timer_complete' | 'deadline_reached' | 'goal_reminder' | 'system';
  taskId?: string;
  goalId?: string;
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

  // 2. Trigger physical vibration on mobile phones if supported
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch {
      // vibration non-fatal
    }
  }

  // 3. Dispatch native OS/Browser notification if supported and granted
  if (!isNotificationSupported()) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  // On Mobile Phones / PWA app mode, serviceWorker.showNotification is required
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        return registration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/pwa-192x192.png',
          badge: options.badge || '/icon.svg',
          tag: options.tag || `notif-${options.type || 'general'}-${Date.now()}`,
          requireInteraction: options.requireInteraction ?? true,
          silent: false,
          data: {
            taskId: options.taskId,
            goalId: options.goalId,
          },
        } as NotificationOptions);
      })
      .catch(() => {
        // Fallback to Notification constructor if service worker ready fails
        tryDirectNotification(options);
      });
    return true;
  }

  return tryDirectNotification(options);
}

function tryDirectNotification(options: AppNotificationOptions): boolean {
  try {
    const nativeNotification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/pwa-192x192.png',
      badge: options.badge || '/icon.svg',
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
 * Triggers a daily goal reminder notification using the Notifications API.
 */
export function notifyGoalReminder(
  goalTitle: string,
  reminderTime: string,
  goalId: string,
  pendingTaskCount?: number
): boolean {
  const detailText =
    pendingTaskCount !== undefined && pendingTaskCount > 0
      ? `You have ${pendingTaskCount} pending task${pendingTaskCount > 1 ? 's' : ''} to complete today.`
      : `Time for your daily tasks to keep your streak intact!`;

  return triggerBrowserNotification({
    title: `⏰ Daily Goal Reminder: ${goalTitle}`,
    body: `It's ${reminderTime}! ${detailText}`,
    icon: '/logo.svg',
    badge: '/logo.svg',
    tag: `goal-reminder-${goalId}-${new Date().toISOString().split('T')[0]}`,
    type: 'goal_reminder',
    goalId,
    requireInteraction: true,
  });
}

/**
 * Triggers a notification when a timer focus session ends / target is achieved.
 */
export function notifyTimerSessionComplete(taskTitle: string, durationMinutes: number): boolean {
  const durationLabel = durationMinutes > 0 ? `${durationMinutes}m ` : '';
  return triggerBrowserNotification({
    title: '🎯 Focus Session Complete!',
    body: `Awesome work! You completed your ${durationLabel}target for "${taskTitle}". Your streak progress has been updated.`,
    icon: '/logo.svg',
    badge: '/logo.svg',
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
    icon: '/logo.svg',
    badge: '/logo.svg',
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
    body: 'Browser notifications are enabled. You will be alerted for focus timers, deadlines, and daily goal reminders.',
    icon: '/logo.svg',
    badge: '/logo.svg',
    tag: 'test-notification',
    type: 'system',
    requireInteraction: false,
  });
}
