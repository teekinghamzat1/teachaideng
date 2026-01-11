import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    canonical?: string;
}

const SEO: React.FC<SEOProps> = ({ title, description, keywords, canonical }) => {
    const location = useLocation();

    useEffect(() => {
        // Only run on the client side
        if (typeof window === 'undefined') return;

        // 1. Canonical URL
        const baseUrl = 'https://www.teachaide.ng';
        let path = location.pathname;
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }

        const canonicalUrl = canonical || `${baseUrl}${path}`;

        let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
        if (!link) {
            link = document.createElement('link');
            link.setAttribute('rel', 'canonical');
            document.head.appendChild(link);
        }
        link.setAttribute('href', canonicalUrl);

        // 2. Title
        if (title) {
            document.title = `${title} | TeachAide AI`;
        }

        // 3. Description
        if (description) {
            let metaDesc: HTMLMetaElement | null = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.setAttribute('name', 'description');
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', description);

            // Also update OpenGraph description
            let ogDesc: HTMLMetaElement | null = document.querySelector('meta[property="og:description"]');
            if (ogDesc) ogDesc.setAttribute('content', description);
        }

        // 4. Keywords
        if (keywords) {
            let metaKeywords: HTMLMetaElement | null = document.querySelector('meta[name="keywords"]');
            if (!metaKeywords) {
                metaKeywords = document.createElement('meta');
                metaKeywords.setAttribute('name', 'keywords');
                document.head.appendChild(metaKeywords);
            }
            metaKeywords.setAttribute('content', keywords);
        }

    }, [location.pathname, title, description, keywords, canonical]);

    return null;
};

export default SEO;
