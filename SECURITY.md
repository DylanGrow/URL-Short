# Security Policies and Architecture Notes

This platform takes a defensive-first approach. Every layer is built assuming adversarial input.

## Threat Models Addressed

1. **Cross-Site Scripting (XSS)**
   - Mitigation: 100% reliance on `textContent` for DOM injections. Strict CSP headers in `index.html`. No `eval()` or `innerHTML`.

2. **SQL Injection (SQLi)**
   - Mitigation: D1 queries strictly utilize `env.DB.prepare().bind()`. Raw string concatenation is forbidden.

3. **Server-Side Request Forgery (SSRF) / Open Redirects**
   - Mitigation: Aggressive URL parsing via the native `URL()` constructor. Rejection of all schemas except `http:` and `https:`. Rejection of localhost, loopback, and local network IPs for targets.

4. **Brute Force & DoS via Slug Collisions**
   - Mitigation: Rate limiting utilizing D1-backed time windows. Random slug generation collision detection capped at 3 retries.

5. **Data Privacy (GDPR Compliance)**
   - Mitigation: No IPs are stored raw. `CF-Connecting-IP` is hashed using a securely injected salt (`RATE_LIMIT_SALT`) exclusively for rate-limiting. User agents are similarly hashed for analytics. No cookies or tracking beacons are utilized.

6. **Clickjacking**
   - Mitigation: `X-Frame-Options: DENY` and `Content-Security-Policy: frame-ancestors 'none'` headers emitted by the Edge router.

## Incident Response
If a vulnerability is found, immediately revoke `CF_API_TOKEN` and update `.github/workflows` secrets. Rotate `ANALYTICS_SALT` and `RATE_LIMIT_SALT` to invalidate existing tracking hashes.
