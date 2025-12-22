import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { db } from '../database';
import { Loader2 } from './Icons';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = () => {
            const user = db.auth.getCurrentUser();
            setIsAuthenticated(!!user);
        };

        checkAuth();

        // Listen for auth changes
        window.addEventListener('auth-change', checkAuth);
        return () => {
            window.removeEventListener('auth-change', checkAuth);
        };
    }, []);

    if (isAuthenticated === null) {
        // Initial check state, could show a loader or nothing
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login, saving the location they were trying to go to
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
