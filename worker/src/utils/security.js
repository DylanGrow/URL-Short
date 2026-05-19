export function addSecurityHeaders(response) {
    const newHeaders = new Headers(response.headers);
    
    // Core Security Headers
    newHeaders.set('X-Frame-Options', 'DENY');
    newHeaders.set('X-Content-Type-Options', 'nosniff');
    newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    newHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    
    // Content Security Policy for API Responses (Stricter than frontend)
    newHeaders.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none';");
    
    // Permissions Policy
    newHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

    // Add CORS headers if not already present
    if (!newHeaders.has('Access-Control-Allow-Origin')) {
        newHeaders.set('Access-Control-Allow-Origin', '*');
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
    });
}

export async function hashData(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Basic rate limiting implementation using D1
export async function checkRateLimit(request, env) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (ip === 'unknown') return true;

    // Use a salt if provided in env to prevent dictionary attacks on hashes
    const salt = env.RATE_LIMIT_SALT || 'default-salt';
    const ipHash = await hashData(ip + salt);
    
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % 60); // 1 minute windows

    await env.DB.prepare(
        `INSERT INTO rate_limits (ip_hash, window_start, request_count) 
         VALUES (?, ?, 1) 
         ON CONFLICT(ip_hash) DO UPDATE SET 
         request_count = CASE WHEN window_start = ? THEN request_count + 1 ELSE 1 END,
         window_start = ?`
    ).bind(ipHash, windowStart, windowStart, windowStart).run();

    const current = await env.DB.prepare(`SELECT request_count FROM rate_limits WHERE ip_hash = ?`).bind(ipHash).first();
    
    if (current && current.request_count > 60) { // 60 requests per minute limit
        return false; // Rate limited
    }
    return true;
}

export async function verifyTurnstile(token, env) {
    if (!token) return false;
    
    const secret = env.TURNSTILE_SECRET;
    if (!secret) {
        // If no secret configured, bypass (useful for local dev)
        console.warn('TURNSTILE_SECRET not configured, skipping validation');
        return true; 
    }

    const formData = new FormData();
    formData.append('secret', secret);
    formData.append('response', token);

    try {
        const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            body: formData,
            method: 'POST',
        });

        const outcome = await result.json();
        return outcome.success;
    } catch (err) {
        console.error('Turnstile verification failed:', err);
        return false;
    }
}
