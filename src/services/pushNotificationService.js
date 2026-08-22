/**
 * Push Notification Service
 * Handles Web Push API subscription, permission requests, and service worker registration.
 */

import { cacheClear } from '../utils/apiCache';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export const PushNotificationService = {
  registration: null,
  subscription: null,

  async init() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { supported: false, reason: 'Push notifications not supported' };
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('✅ Service Worker registered for push notifications');
      return { supported: true };
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      return { supported: false, reason: 'Service Worker registration failed' };
    }
  },

  async getPermissionStatus() {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  },

  async requestPermission() {
    if (!('Notification' in window)) {
      return { granted: false, status: 'unsupported' };
    }

    const currentStatus = Notification.permission;
    if (currentStatus === 'granted') {
      return { granted: true, status: 'granted' };
    }

    if (currentStatus === 'denied') {
      return { granted: false, status: 'denied' };
    }

    try {
      const permission = await Notification.requestPermission();
      return { granted: permission === 'granted', status: permission };
    } catch (error) {
      console.error('Permission request failed:', error);
      return { granted: false, status: 'error' };
    }
  },

  async subscribe() {
    if (!this.registration) {
      await this.init();
    }

    if (!this.registration) {
      return { success: false, error: 'Service Worker not available' };
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        this.subscription = subscription;
        return { success: true, subscription };
      }

      const vapidKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const newSubscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey
      });

      this.subscription = newSubscription;
      return { success: true, subscription: newSubscription.toJSON() };
    } catch (error) {
      console.error('Push subscription failed:', error);
      return { success: false, error: error.message };
    }
  },

  async unsubscribe() {
    if (this.subscription) {
      try {
        await this.subscription.unsubscribe();
        this.subscription = null;
        return { success: true };
      } catch (error) {
        console.error('Unsubscribe failed:', error);
        return { success: false, error: error.message };
      }
    }
    return { success: true };
  },

  async getSubscriptionJSON() {
    if (!this.subscription) {
      const sub = await this.registration?.pushManager?.getSubscription();
      if (sub) {
        this.subscription = sub;
      }
    }

    if (!this.subscription) {
      return null;
    }

    return {
      endpoint: this.subscription.endpoint,
      keys: {
        p256dh: this.btoa(this.subscription.toJSON().keys?.p256dh || ''),
        auth: this.btoa(this.subscription.toJSON().keys?.auth || '')
      }
    };
  },

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },

  btoa(str) {
    if (typeof btoa !== 'undefined') {
      return btoa(str);
    }
    return Buffer.from(str).toString('base64');
  },

  async registerWithBackend() {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const subscription = await this.getSubscriptionJSON();
    if (!subscription) {
      return { success: false, error: 'No push subscription' };
    }

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || '/api';
      const response = await fetch(`${API_BASE}/notifications/devices/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription,
          device_name: this.getDeviceName(),
          platform: this.getPlatform(),
          browser: this.getBrowser(),
          permission_status: await this.getPermissionStatus()
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Registration failed' }));
        return { success: false, error: error.error || error.message || 'Registration failed' };
      }

      const device = await response.json();
      return { success: true, device };
    } catch (error) {
      console.error('Backend registration failed:', error);
      return { success: false, error: error.message };
    }
  },

  async unregisterFromBackend(deviceId) {
    const token = localStorage.getItem('token');
    if (!token || !deviceId) {
      return { success: false };
    }

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || '/api';
      const response = await fetch(`${API_BASE}/notifications/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Backend unregister failed:', error);
      return false;
    }
  },

  getDeviceName() {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Mac')) return 'Mac';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android Device';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS Device';
    return 'Unknown Device';
  },

  getPlatform() {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'windows';
    if (ua.includes('Mac')) return 'macos';
    if (ua.includes('Linux')) return 'linux';
    if (ua.includes('Android')) return 'android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'ios';
    return 'unknown';
  },

  getBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'chrome';
    if (ua.includes('Firefox')) return 'firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'safari';
    if (ua.includes('Edg')) return 'edge';
    return 'unknown';
  },

  async enableNotifications() {
    const initResult = await this.init();
    if (!initResult.supported) {
      return { success: false, error: initResult.reason };
    }

    const permissionResult = await this.requestPermission();
    if (!permissionResult.granted) {
      return {
        success: false,
        error: permissionResult.status === 'denied'
          ? 'Notification permission denied. Please enable in browser settings.'
          : 'Notification permission not granted.',
        status: permissionResult.status
      };
    }

    const subscribeResult = await this.subscribe();
    if (!subscribeResult.success) {
      return { success: false, error: subscribeResult.error };
    }

    const registerResult = await this.registerWithBackend();
    if (!registerResult.success) {
      return { success: false, error: registerResult.error };
    }

    try {
      cacheClear('^api_cache_/notifications');
    } catch {}

    return { success: true, device: registerResult.device };
  },

  async disableNotifications(deviceId) {
    const unsubResult = await this.unsubscribe();
    const backendResult = await this.unregisterFromBackend(deviceId);
    return { success: unsubResult.success || backendResult };
  }
};

export default PushNotificationService;
