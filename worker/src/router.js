import { handleRedirect } from './api/redirect.js';
import { handleShorten } from './api/shorten.js';
import { checkRateLimit } from './utils/security.js';

export async function handleRequest(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS Preflight
    if (request.method === 'OPTIONS') {
        return handleCors(request);
    }

    // Rate Limiting Check
    const allowed = await checkRateLimit(request, env);
    if (!allowed) {
        return new Response(JSON.stringify({ error: 'Too Many Requests' }), { 
            status: 429, 
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // API Routes
    if (path.startsWith('/api/')) {
        if (path === '/api/shorten' && request.method === 'POST') {
            return handleShorten(request, env);
        }
        return new Response(JSON.stringify({ error: 'Not Found' }), { 
            status: 404, 
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Redirect Route (Matches /slug)
    if (path.length > 1 && path.indexOf('/', 1) === -1) {
        const slug = path.substring(1);
        if (request.method === 'GET') {
            return handleRedirect(slug, request, env, ctx);
        }
    }

    // Default 404
    return new Response('Not Found', { status: 404 });
}

function handleCors(request) {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*', // IMPORTANT: Restrict this to frontend domain in prod
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        }
    });
}
