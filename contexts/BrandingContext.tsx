import React, { createContext, useContext, useState, useEffect } from 'react';

interface BrandingSettings {
    siteName: string;
    siteTagline: string;
    siteLogo: string;
    siteLogoDark: string;
    siteFavicon: string;
    brandPrimaryColor: string;
    brandSecondaryColor: string;
    brandAccentColor: string;
    brandFont: string;
}

const defaultBranding: BrandingSettings = {
    siteName: 'TeachAide AI',
    siteTagline: 'AI Lesson Notes & Teaching Assistant for Nigerian Educators',
    siteLogo: '',
    siteLogoDark: '',
    siteFavicon: '',
    brandPrimaryColor: '#1F4FD8',
    brandSecondaryColor: '#16A34A',
    brandAccentColor: '#FBBF24',
    brandFont: 'Inter'
};

const BrandingContext = createContext<BrandingSettings>(defaultBranding);

export const useBranding = () => useContext(BrandingContext);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);

    useEffect(() => {
        // Fetch branding settings from API
        fetch('/api/branding')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    setBranding(data.data);

                    // Apply favicon dynamically
                    if (data.data.siteFavicon) {
                        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
                        link.type = 'image/x-icon';
                        link.rel = 'shortcut icon';
                        link.href = data.data.siteFavicon;
                        document.getElementsByTagName('head')[0].appendChild(link);
                    }

                    // Apply site title
                    if (data.data.siteName) {
                        document.title = `${data.data.siteName} | ${data.data.siteTagline}`;
                    }

                    // Apply font
                    if (data.data.brandFont && data.data.brandFont !== 'Inter') {
                        const fontLink = document.createElement('link');
                        fontLink.href = `https://fonts.googleapis.com/css2?family=${data.data.brandFont.replace(' ', '+')}:wght@300;400;500;600;700&display=swap`;
                        fontLink.rel = 'stylesheet';
                        document.head.appendChild(fontLink);
                        document.body.style.fontFamily = `'${data.data.brandFont}', sans-serif`;
                    }
                }
            })
            .catch(err => {
                console.error('Failed to load branding settings:', err);
            });
    }, []);

    return (
        <BrandingContext.Provider value={branding}>
            {children}
        </BrandingContext.Provider>
    );
};
