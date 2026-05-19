import { validateUrl, validateSlug } from '../utils/validation.js';
import { verifyTurnstile } from '../utils/security.js';

export async function handleShorten(request, env) {
    try {
        // Basic API key authentication (optional protection)
        const authHeader = request.headers.get('Authorization');
        if (env.API_KEY && authHeader !== `Bearer ${env.API_KEY}`) {
             return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const body = await request.json();
        
        // Turnstile Validation
        const turnstileValid = await verifyTurnstile(body.turnstileToken, env);
        if (!turnstileValid) {
            return new Response(JSON.stringify({ error: 'Invalid Bot Check (Turnstile)' }), { status: 403 });
        }

        if (!body.url) {
            return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400 });
        }

        const { valid, error, normalizedUrl } = validateUrl(body.url);
        if (!valid) {
            return new Response(JSON.stringify({ error }), { status: 400 });
        }

        let slug = body.slug;
        if (slug) {
            if (!validateSlug(slug)) {
                return new Response(JSON.stringify({ error: 'Invalid custom slug format or reserved path' }), { status: 400 });
            }
            // Check if slug exists
            const existing = await env.DB.prepare(`SELECT id FROM links WHERE slug = ?`).bind(slug).first();
            if (existing) {
                return new Response(JSON.stringify({ error: 'Slug already in use' }), { status: 409 });
            }
        } else {
            // Generate random slug
            slug = generateRandomSlug(6);
            // Handling collisions for random slugs:
            let attempts = 0;
            while(attempts < 3) {
                 const existing = await env.DB.prepare(`SELECT id FROM links WHERE slug = ?`).bind(slug).first();
                 if(!existing) break;
                 slug = generateRandomSlug(6);
                 attempts++;
            }
            if(attempts === 3) {
                 return new Response(JSON.stringify({ error: 'Could not generate unique slug, please try again.' }), { status: 500 });
            }
        }

        const id = crypto.randomUUID();
        const createdAt = Math.floor(Date.now() / 1000);

        // Parameterized insertion to prevent SQL injection
        await env.DB.prepare(
            `INSERT INTO links (id, slug, target_url, created_at) VALUES (?, ?, ?, ?)`
        ).bind(id, slug, normalizedUrl, createdAt).run();

        // Create CORS-friendly response with origin dynamically fetched from request URL
        // In a strictly configured setup, this would use a predefined ENV domain.
        const originUrl = new URL(request.url).origin;
        
        return new Response(JSON.stringify({ 
            success: true, 
            slug: slug, 
            shortUrl: `${originUrl}/${slug}`,
            targetUrl: normalizedUrl
        }), { 
            status: 201,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' // Adjust to strict frontend domain in prod
            }
        });

    } catch (e) {
        console.error('Shorten API Error:', e);
        return new Response(JSON.stringify({ 
            error: e.message || 'Bad Request',
            stack: e.stack
        }), { 
            status: 400,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

function generateRandomSlug(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const randomArray = new Uint8Array(length);
    crypto.getRandomValues(randomArray);
    for (let i = 0; i < length; i++) {
        result += chars[randomArray[i] % chars.length];
    }
    return result;
}
