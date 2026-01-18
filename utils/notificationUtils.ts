export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notification');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

export const showBrowserNotification = (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
        // Only show if the page is not in focus or if explicitly desired
        const notification = new Notification(title, {
            icon: '/logo192.png', // Fallback icon path
            ...options,
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
};
