import { hashData } from '../utils/security.js';
import { validateSlug } from '../utils/validation.js';

export async function handleRedirect(slug, request, env, ctx) {
    if (!validateSlug(slug)) {
        return new Response('Invalid Link Format', { status: 400 });
    }

    // Fetch link from DB using parameterized query
    const link = await env.DB.prepare(
        `SELECT * FROM links WHERE slug = ? AND is_active = 1`
    ).bind(slug).first();

    if (!link) {
        return new Response('Link Not Found', { status: 404 });
    }

    // Check expiration
    if (link.expires_at && link.expires_at < Math.floor(Date.now() / 1000)) {
        return new Response('Link Expired', { status: 410 });
    }

    // Record Analytics asynchronously without blocking redirect
    ctx.waitUntil(recordAnalytics(link.id, request, env));

    // Redirect to target (302 protects against permanent hijacking by caching)
    return Response.redirect(link.target_url, 302);
}

async function recordAnalytics(linkId, request, env) {
    try {
        const country = request.cf?.country || 'Unknown';
        const timestamp = Math.floor(Date.now() / 1000);
        const referrer = request.headers.get('Referer') || null;
        const userAgent = request.headers.get('User-Agent') || 'Unknown';
        
        // Privacy-respecting device type detection
        let deviceType = 'desktop';
        if (/mobile/i.test(userAgent)) deviceType = 'mobile';
        if (/tablet/i.test(userAgent)) deviceType = 'tablet';

        // Anonymized UA hash to avoid storing direct fingerprints
        const salt = env.ANALYTICS_SALT || 'default-analytics-salt';
        const uaHash = await hashData(userAgent + salt);
        
        const id = crypto.randomUUID();

        // Increment clicks in links table
        await env.DB.prepare(
            `UPDATE links SET clicks = clicks + 1 WHERE id = ?`
        ).bind(linkId).run();

        // Insert analytics record
        await env.DB.prepare(
            `INSERT INTO analytics (id, link_id, timestamp, country, device_type, referrer, ua_hash)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(id, linkId, timestamp, country, deviceType, referrer, uaHash).run();

    } catch (e) {
        console.error('Analytics Recording Error:', e);
    }
}
