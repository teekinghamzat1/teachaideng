const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateSEOSummaryViaGenAI } = require('../services/genaiService');

// List of common stop words to ignore when extracting keywords
const STOP_WORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves', 'will', 'can', 'just', 'now', 'also', 'like', 'even', 'can', 'make', 'use'
]);

/**
 * Extracts a meta description from the first paragraph of HTML content
 */
function extractMetaDescription(htmlContent) {
    if (!htmlContent) return '';
    try {
        const $ = cheerio.load(htmlContent);
        // Find the first paragraph
        let text = $('p').first().text().trim();

        // If no paragraph, get plain text of the whole content
        if (!text) {
            text = $.text().trim();
        }

        // Return up to ~155 characters (standard SEO length), breaking at the last whole word
        if (text.length > 155) {
            const truncated = text.slice(0, 155);
            return truncated.slice(0, truncated.lastIndexOf(' ')) + '...';
        }
        return text;
    } catch (error) {
        console.error('Error extracting meta description:', error);
        return '';
    }
}

/**
 * Extracts keywords based on word frequency in the content
 */
function extractKeywords(htmlContent, count = 5) {
    if (!htmlContent) return '';
    try {
        const $ = cheerio.load(htmlContent);
        const text = $.text().toLowerCase();

        // Remove punctuation and get words
        const words = text.replace(/[^\w\s\']/g, ' ').split(/\s+/);

        const frequencyMap = {};
        words.forEach(word => {
            // Filter short words and stop words
            if (word.length > 3 && !STOP_WORDS.has(word) && !/^\d+$/.test(word)) {
                frequencyMap[word] = (frequencyMap[word] || 0) + 1;
            }
        });

        // Sort by frequency and get top words
        const sortedWords = Object.entries(frequencyMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(entry => entry[0]);

        return sortedWords.join(', ');
    } catch (error) {
        console.error('Error extracting keywords:', error);
        return '';
    }
}

/**
 * Auto-links keywords in the document body to existing articles based on matches
 * between the source content text and existing articles' Target Keywords or Titles
 * @param {string} htmlContent - The raw HTML of the post
 * @param {string} currentPostId - The ID of the current post (to avoid linking to itself)
 */
async function autoInternalLinkContent(htmlContent, currentPostId = null) {
    if (!htmlContent) return htmlContent;

    try {
        // Find all published posts
        const existingPosts = await prisma.blogPost.findMany({
            where: {
                published: true,
                ...(currentPostId ? { id: { not: currentPostId } } : {})
            },
            select: { id: true, title: true, slug: true, keywords: true }
        });

        if (existingPosts.length === 0) return htmlContent;

        const $ = cheerio.load(htmlContent, null, false); // false avoids adding <html><head> tags

        // Prepare our linking targets
        const linkTargets = [];

        existingPosts.forEach(post => {
            // First, get exact title matches as an option
            if (post.title && post.title.split(' ').length <= 4) { // Don't do huge titles
                linkTargets.push({ phrase: post.title.toLowerCase(), slug: post.slug });
            }

            // Next, extract keywords attached to the post
            if (post.keywords) {
                const keywords = post.keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 3);
                keywords.forEach(kw => {
                    linkTargets.push({ phrase: kw, slug: post.slug });
                });
            }
        });

        // Sort by length descending, so we match longer multi-word phrases before single words
        // e.g. "Artificial Intelligence" before "Intelligence"
        linkTargets.sort((a, b) => b.phrase.length - a.phrase.length);

        // Keep track of what we linked to avoid linking the same keyword multiple times
        // or over-linking to the same post
        const linkedSlugs = new Set();
        const maxLinks = 5; // Don't turn the page into a massive link farm
        let linksAdded = 0;

        // Traverse all text nodes
        const walkTextNodes = () => {
            const textNodes = [];

            // Function to recursively find text nodes
            const findTextNodes = (element) => {
                const elName = element.tagName ? element.tagName.toLowerCase() : '';

                // Skip script, style, and already linked tags to avoid nested links
                if (elName === 'a' || elName === 'script' || elName === 'style' || elName === 'code' || elName === 'pre') {
                    return;
                }

                element.childNodes.forEach(child => {
                    if (child.type === 'text') {
                        if (child.data.trim().length > 0) {
                            textNodes.push(child);
                        }
                    } else if (child.type === 'tag') {
                        findTextNodes(child);
                    }
                });
            };

            // Find in body
            findTextNodes($('body')[0] || $.root()[0]);

            return textNodes;
        };

        let nodes = walkTextNodes();

        for (const target of linkTargets) {
            if (linksAdded >= maxLinks) break;

            // Find nodes containing this phrase (case-insensitive)
            // Need a new regex each time. Word boundaries handle exact words.
            // Escape phrase for regex
            const escapedPhrase = target.phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`\\b(${escapedPhrase})\\b`, 'i');

            // Only link to a slug once per post
            if (linkedSlugs.has(target.slug)) continue;

            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (!node || !node.data) continue;

                const match = regex.exec(node.data);
                if (match) {
                    const matchedText = match[1];
                    const before = node.data.substring(0, match.index);
                    const after = node.data.substring(match.index + matchedText.length);

                    // Create strong replacement
                    const linkHTML = `<a href="/blog/${target.slug}" title="${target.phrase}" class="text-brand-600 hover:text-brand-800 underline decoration-brand-200 decoration-2 underline-offset-2 transition-colors">${matchedText}</a>`;

                    // Since Cheerio doesn't have a direct "replace text node with HTML" method cleanly for deep nested text, 
                    // we replace the parent's HTML carefully if it only contains this text,
                    // or we use JS dom manipulation equivalent via Cheerio.

                    // If we found it, replace it and stop searching for this specific phrase
                    // The easiest safe way in Cheerio:
                    $(node).replaceWith(before + linkHTML + after);

                    linkedSlugs.add(target.slug);
                    linksAdded++;

                    // We must refetch nodes because DOM changed
                    nodes = walkTextNodes();
                    break;
                }
            }
        }

        return $.html();
    } catch (error) {
        console.error('Error auto-linking content:', error);
        return htmlContent; // Return original on error
    }
}

/**
 * Main processor function that runs all SEO automation over a post configuration
 */
async function processPostSEO(postData, postId = null) {
    const updatedData = { ...postData };

    // 1. Process meta description and summary using Generative AI for catchy conversion
    if (updatedData.content && (!updatedData.metaDescription || !updatedData.summary)) {
        try {
            const $ = cheerio.load(updatedData.content);
            const rawBodyText = $.text().trim();

            const catchySummary = await generateSEOSummaryViaGenAI({
                title: updatedData.title || 'TeachAide Blog',
                textContent: rawBodyText
            });

            if (catchySummary) {
                if (!updatedData.metaDescription) updatedData.metaDescription = catchySummary;
                if (!updatedData.summary) updatedData.summary = catchySummary;
            } else {
                // strict fallback
                const extractedDesc = extractMetaDescription(updatedData.content);
                if (!updatedData.metaDescription) updatedData.metaDescription = extractedDesc;
                if (!updatedData.summary) updatedData.summary = extractedDesc;
            }
        } catch (error) {
            console.error('Failed to generate GenAI SEO summary:', error);
            // Fallback to basic extraction
            const extractedDesc = extractMetaDescription(updatedData.content);
            if (!updatedData.metaDescription) updatedData.metaDescription = extractedDesc;
            if (!updatedData.summary) updatedData.summary = extractedDesc;
        }
    }

    // Process Meta Title
    if (updatedData.title && !updatedData.metaTitle) {
        updatedData.metaTitle = updatedData.title;
    }

    // 2. Process Keywords
    if (updatedData.content) {
        const defaultKeywords = 'lesson notes, ai lesson note generator, teacher ai, edtech';
        let currentKws = updatedData.keywords || '';

        // If keywords are empty, or they only contain the default ones pre-filled by the frontend,
        // we extract the dynamic ones from the body and append them.
        if (!currentKws || currentKws === defaultKeywords) {
            const extracted = extractKeywords(updatedData.content);

            // Combine default and extracted removing duplicates
            const currentArr = currentKws ? currentKws.split(',').map(k => k.trim()) : [];
            const extractedArr = extracted ? extracted.split(',').map(k => k.trim()) : [];

            const combined = new Set([...currentArr, ...extractedArr].filter(Boolean));

            // Generate the final list, ensuring default keywords are definitely included if missing
            const defaultsArr = defaultKeywords.split(',').map(k => k.trim());
            defaultsArr.forEach(kw => combined.add(kw));

            // Set the final keywords string
            updatedData.keywords = Array.from(combined).join(', ');
        }
    }

    // 3. Process Automatic Internal Links in content body
    if (updatedData.content) {
        updatedData.content = await autoInternalLinkContent(updatedData.content, postId);
    }

    return updatedData;
}

module.exports = {
    extractMetaDescription,
    extractKeywords,
    autoInternalLinkContent,
    processPostSEO
};
