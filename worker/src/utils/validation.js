export function validateUrl(urlStr) {
    try {
        const url = new URL(urlStr);
        // Only allow HTTP and HTTPS
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return { valid: false, error: 'Invalid protocol. Only HTTP/HTTPS allowed.' };
        }
        
        // Block localhost, private IPs (basic check to prevent SSRF)
        const hostname = url.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
            return { valid: false, error: 'Localhost and private networks are not allowed.' };
        }

        return { valid: true, normalizedUrl: url.toString() };
    } catch (e) {
        return { valid: false, error: 'Malformed URL.' };
    }
}

export function validateSlug(slug) {
    // Exact match: 3 to 32 characters, alphanumerics, hyphens, underscores
    const slugRegex = /^[a-zA-Z0-9_-]{3,32}$/;
    if (!slugRegex.test(slug)) {
        return false;
    }

    const reservedPaths = new Set([
        'api', 'admin', 'dashboard', 'login', 'assets', 
        'favicon.ico', 'sw.js', 'robots.txt', 'sitemap.xml'
    ]);
    if (reservedPaths.has(slug.toLowerCase())) {
        return false;
    }

    return true;
}
