/**
 * Utility to strip common markdown character patterns and HTML tags from text.
 * Especially useful for platforms that don't render markdown or where users prefer plain text.
 */
export const stripFormatting = (text: string | null | undefined): string => {
    if (!text || typeof text !== 'string') return '';

    return text
        // Strip HTML tags
        .replace(/<[^>]*>?/gm, '')
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
