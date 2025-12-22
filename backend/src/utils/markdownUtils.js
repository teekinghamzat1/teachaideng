/**
 * Utility to strip common markdown character patterns from AI generated text.
 * Especially useful for platforms that don't render markdown or where users prefer plain text.
 */
const stripMarkdown = (text) => {
    if (!text || typeof text !== 'string') return text;

    return text
        // Strip bold markers **text** or __text__
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')
        // Strip italic markers *text* or _text_
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/_(.*?)_/g, '$1')
        // Strip header markers # Header
        .replace(/^#+\s+/gm, '')
        // Strip list markers * Item or - Item (only at start of line)
        .replace(/^\s*[\*\-]\s+/gm, '• ')
        // Strip horizontal rules
        .replace(/^\s*[\*\-_]{3,}\s*$/gm, '');
};

/**
 * Recursively sanitize an object or array to remove markdown markers from string values.
 */
const sanitizeObjectMarkdown = (obj) => {
    if (!obj) return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObjectMarkdown(item));
    }

    if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObjectMarkdown(value);
        }
        return sanitized;
    }

    if (typeof obj === 'string') {
        return stripMarkdown(obj);
    }

    return obj;
};

module.exports = {
    stripMarkdown,
    sanitizeObjectMarkdown
};
