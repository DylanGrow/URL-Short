# SecureLink Platform

A production-grade, cybersecure, Lighthouse-optimized URL shortener platform designed for extreme performance and minimal operational cost. 

## Architecture
- **Frontend**: Static site hosted on GitHub Pages (Vanilla HTML/CSS/JS). No framework bloat.
- **Backend Edge**: Cloudflare Workers for lightning-fast routing at the network edge.
- **Database**: Cloudflare D1 (Serverless SQLite) for ultra-low-latency distributed data.

## Key Features
- **Security First**: 
  - Prepared statements for D1 (100% immune to SQL injection).
  - Robust input validation to prevent SSRF and Open Redirect abuse.
  - Secure Headers: Content-Security-Policy (CSP), HSTS, and X-Frame-Options.
  - XSS Protection: DOM manipulations strictly use `textContent`.
  - Rate limiting enforced at the edge via database tracking.
- **Lighthouse 100**: Zero render-blocking resources, tiny JS footprint (~2KB), no runtime dependencies.
- **Adblock Friendly**: Clean asset naming conventions without tracking keywords.
- **Offline Capable**: PWA Service Worker caching core static shell.
- **Privacy Respecting**: Hash-based analytics using crypto-salts. No raw IP logging long-term. GDPR-friendly device tracking.

## Repository Structure
- `/frontend/` - Static frontend assets (HTML, CSS, Vanilla JS, PWA manifests).
- `/worker/` - Cloudflare Worker source code, API routes, D1 database schema.
- `/.github/` - GitHub Actions CI/CD workflows for automated, secure deployments.

## Deployment Instructions

### 1. Database Setup (Cloudflare D1)
1. Install Wrangler CLI: `npm install -g wrangler`
2. Authenticate: `wrangler login`
3. Create D1 Database: 
   ```bash
   wrangler d1 create url-shortener-db
   ```
4. Copy the output `database_id` and paste it into `worker/wrangler.toml`.
5. Apply Schema:
   ```bash
   wrangler d1 execute url-shortener-db --file=worker/schema.sql --remote
   ```

### 2. Edge Worker Deployment
1. Set up environment secrets:
   ```bash
   wrangler secret put ANALYTICS_SALT
   wrangler secret put RATE_LIMIT_SALT
   wrangler secret put API_KEY # Optional: for authenticated shortening
   ```
2. Deploy the worker:
   ```bash
   cd worker
   wrangler deploy
   ```
3. Take note of your assigned `.workers.dev` domain or configure a custom domain in Cloudflare. Update `API_URL` in `frontend/app.js` with this URL.

### 3. Frontend Deployment (GitHub Pages)
1. Update `frontend/app.js` API endpoint to point to your deployed Cloudflare Worker.
2. Push to the `main` branch. 
3. The included GitHub Actions workflow (`deploy-frontend.yml`) will automatically deploy the `/frontend` directory to GitHub Pages.

## Hardening Recommendations
- **Custom Domains**: Always map both the Worker and the GitHub Pages site to custom domains under the same root (e.g., `short.com` for Pages, `api.short.com` for Worker).
- **CORS Constraints**: Update `Access-Control-Allow-Origin` in `worker/src/router.js` to strictly match your production frontend domain.
- **CSP Fine-tuning**: Adjust `Content-Security-Policy` in `frontend/index.html` `meta` tag to strictly allow `connect-src` only to your specific worker domain.
- **WAF**: Ensure Cloudflare WAF is enabled for your zone to block basic threat signatures before they hit the Worker.

## Scalability on the Free Tier
This architecture is extremely cost-effective on Cloudflare's free tier:
- **Workers**: 100,000 requests per day (free).
- **D1**: 5 million read rows / 100k write rows per day (free).
- **Pages**: Unlimited bandwidth for the frontend shell.
