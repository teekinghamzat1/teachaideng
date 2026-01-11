import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SEO: React.FC = () => {
    const location = useLocation();

    useEffect(() => {
        // Only run on the client side
        if (typeof window === 'undefined') return;

        // Base URL for the site (consistent with index.html)
        const baseUrl = 'https://www.teachaide.ng';

        // Construct the canonical URL
        // We trim trailing slashes to ensure uniqueness
        let path = location.pathname;
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }

        const canonicalUrl = `${baseUrl}${path}`;

        // Find or create the canonical link tag
        let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');

        if (!link) {
            link = document.createElement('link');
            link.setAttribute('rel', 'canonical');
            document.head.appendChild(link);
        }

        link.setAttribute('href', canonicalUrl);

        // Optional: Update title if needed, but we focus on Canonical for now
    }, [location.pathname]);

    return null; // This component doesn't render anything
};

export default SEO;
