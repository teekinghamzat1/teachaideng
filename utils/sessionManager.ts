// Session timeout manager
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
let inactivityTimer: NodeJS.Timeout | null = null;

export const sessionManager = {
    // Initialize session timeout tracking
    init() {
        this.resetTimer();
        this.setupActivityListeners();
    },

    // Reset the inactivity timer
    resetTimer() {
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
        }

        inactivityTimer = setTimeout(() => {
            this.logout();
        }, SESSION_TIMEOUT);

        // Update last activity timestamp
        localStorage.setItem('lastActivity', Date.now().toString());
    },

    // Check if session is still valid
    isSessionValid(): boolean {
        const lastActivity = localStorage.getItem('lastActivity');
        if (!lastActivity) return false;

        const timeSinceActivity = Date.now() - parseInt(lastActivity);
        return timeSinceActivity < SESSION_TIMEOUT;
    },

    // Logout due to inactivity
    logout() {
        console.log('Session expired due to inactivity');
        localStorage.removeItem('teachaide_session');
        localStorage.removeItem('lastActivity');
        window.dispatchEvent(new Event('auth-change'));
        window.location.href = '/login?reason=timeout';
    },

    // Setup listeners for user activity
    setupActivityListeners() {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

        events.forEach(event => {
            document.addEventListener(event, () => {
                if (localStorage.getItem('teachaide_session')) {
                    this.resetTimer();
                }
            }, { passive: true });
        });
    },

    // Cleanup
    destroy() {
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
        }
    }
};

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
    sessionManager.init();
}
