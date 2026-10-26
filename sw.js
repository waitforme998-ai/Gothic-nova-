// GOTHIC NOVA — Service Worker for Web Push & Order Alerts
const CACHE_NAME = 'gn-sw-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Handle incoming push or background message events
self.addEventListener('push', (event) => {
    let payload = {
        title: 'GOTHIC NOVA — ORDER ALERT',
        body: 'New order received. Tap to inspect details.',
        orderId: null
    };

    if (event.data) {
        try {
            payload = Object.assign(payload, event.data.json());
        } catch(e) {
            payload.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(payload.title, {
            body: payload.body,
            icon: '/favicon-192x192.png',
            badge: '/favicon-48x48.png',
            vibrate: [200, 100, 200, 100, 300],
            tag: 'gn-order-alert',
            renotify: true,
            data: { orderId: payload.orderId }
        })
    );
});

// Handle notification click: Focus or open admin.html directly to the order
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const orderId = event.notification.data?.orderId;
    const targetUrl = orderId ? `/admin.html?order=${orderId}` : '/admin.html';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes('admin.html') && 'focus' in client) {
                    if (orderId && 'navigate' in client) {
                        return client.navigate(targetUrl).then(c => c.focus());
                    }
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
