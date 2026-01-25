import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../database';

// Generate a random session ID if not exists
const getSessionId = () => {
    let sid = sessionStorage.getItem('ta_session_id');
    if (!sid) {
        sid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('ta_session_id', sid);
    }
    return sid;
};

const AnalyticsTracker: React.FC = () => {
    const location = useLocation();
    const sessionId = getSessionId();
    const user = db.auth.getCurrentUser();

    // Track Page Views
    useEffect(() => {
        const trackPage = async () => {
            try {
                // We use fetch directly to avoid dependency on db.analytics if it's not yet in the file
                await fetch('/api/analytics/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        path: location.pathname + location.search,
                        userId: user?.id
                    })
                });
            } catch (e) {
                // fail silently
            }
        };

        trackPage();
    }, [location.pathname, location.search, user?.id]);

    // Live Heartbeat (Ping)
    useEffect(() => {
        const sendPing = async () => {
            try {
                await fetch('/api/analytics/ping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId,
                        userId: user?.id
                    })
                });
            } catch (e) {
                // fail silently
            }
        };

        // Initial ping
        sendPing();

        // Setup interval for pings (every 1 minute)
        const interval = setInterval(sendPing, 60000);

        return () => clearInterval(interval);
    }, [sessionId, user?.id]);

    return null; // This component doesn't render anything
};

export default AnalyticsTracker;
