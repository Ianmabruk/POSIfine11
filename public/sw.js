/**
 * POSIFINE Service Worker
 * Placeholder: push notifications are not currently enabled.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  event.waitUntil(self.registration.showNotification('POSIFINE', {
    body: 'You have a new notification',
    icon: '/posifine-logo.png',
    badge: '/favicon-32x32.png'
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/'));
});
