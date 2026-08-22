/**
 * POSify Push Notification Service Worker
 * Handles push events, notification clicks, and background sync.
 */

const VAPID_PUBLIC_KEY = import.meta?.env?.VITE_VAPID_PUBLIC_KEY || '';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};

  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch (e) {
    payload = { title: 'POSify', body: 'You have a new notification' };
  }

  const title = payload.title || 'POSify Notification';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/posifine-logo.png',
    badge: payload.badge || '/favicon-32x32.png',
    tag: payload.tag || `posify-${Date.now()}`,
    data: payload.data || {},
    requireInteraction: false,
    renotify: false,
    actions: [
      { action: 'open', title: 'Open POS' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = data.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY
    }).catch((err) => {
      console.error('Push subscription change failed:', err);
    })
  );
});
