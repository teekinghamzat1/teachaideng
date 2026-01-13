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

export const parseMarkdown = (text: string | null | undefined): string => {
    if (!text || typeof text !== 'string') return '';

    let html = text
        // Headers
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2 text-slate-800 dark:text-slate-100">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3 text-slate-900 dark:text-slate-100">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-100">$1</h1>')

        // Bold
        .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-slate-900 dark:text-slate-100">$1</strong>')

        // Italic
        .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')

        // Lists
        .replace(/^\s*[\-\*]\s+(.*$)/gim, '<li class="ml-4 list-disc text-slate-700 dark:text-slate-300">$1</li>');

    // Handle newlines
    // We replace newlines with <br/> but we try to avoid double spacing around block elements
    // Handle literal escaped newlines which might come from JSON stringification
    html = html.replace(/\\n/g, '<br />');
    html = html.replace(/\n/gim, '<br />');

    // Clean up unnecessary breaks after block elements
    html = html.replace(/(<\/h[1-6]>)(<br \/>)+/gim, '$1');
    html = html.replace(/(<\/li>)(<br \/>)+/gim, '$1');

    return html;
};
