# SecureLink | Static-First Serverless URL Shortener

A high-performance, **100% serverless, zero-cost, GitHub-native** URL shortener platform. Hosted entirely on **GitHub Pages**, it eliminates third-party backend servers, databases, or subscriptions, operating completely within your browser and GitHub repository.

---

## ⚡ Architecture & How It Works

This platform leverages unique features of GitHub's static infrastructure to act as a dynamic, secure database and router:

1. **The Static Datastore (`db.json`)**: All shortened link mappings are saved in a simple, version-controlled JSON file at the root of the repository.
2. **Dynamic Redirection Routing (`404.html`)**: When a visitor requests a short URL (e.g., `yoursite.com/slug`), GitHub Pages automatically serves the custom `404.html` fallback. Within `<50ms`, this optimized fallback parses the requested path, fetches the CDN-cached `db.json` from the same origin, performs the mapping lookup, and initiates an instant redirection via `window.location.replace()`. Dead links fall back to an elegant, interactive 404 card.
3. **Client-Side Management Console (`index.html` / `app.js`)**: Administrators manage short URLs through a beautiful glassmorphic management dashboard. Security is guaranteed via a GitHub Personal Access Token (PAT) stored strictly in the client's local storage (never transmitted to third parties). Clicking "Shorten" uses the GitHub REST API to securely commit the updated `db.json` directly back to the repo, triggering a swift static rebuild.

---

## ✨ Features

- **🛡️ 100% Client-Side Security**: Authentication tokens are kept entirely within local browser storage. No servers, no databases, no external API endpoints.
- **⚡ Extreme Performance**: Edge redirection operates in milliseconds via the high-speed GitHub Pages CDN.
- **🎨 Glassmorphic Dark UI**: Premium, responsive user experience utilizing fluid animations, neon glow accents, loading skeletons, and interactive state indicators.
- **📱 PWA Enabled**: Service worker caching and offline-reliability configurations for standard mobile web app installs.
- **📈 Real-Time Click Counter**: Client-side click aggregation tracking built right into the dashboard stats panel.
- **💸 100% Free Hosting**: Runs indefinitely on GitHub Pages' standard free tier.

---

## 🚀 Getting Started

### 1. Setup GitHub Pages
1. Push this repository to your GitHub account as `URL-Short`.
2. Navigate to your repository's **Settings** -> **Pages**.
3. Under **Build and deployment** -> **Source**, select **GitHub Actions** from the dropdown menu.
4. On push, the included GitHub workflow `.github/workflows/deploy.yml` will automatically build and publish the application to the edge.

### 2. Generate a Personal Access Token (PAT)
To allow the management console to write updates to `db.json`:
1. Go to your GitHub profile **Settings** -> **Developer Settings** -> **Personal Access Tokens** -> **Fine-grained tokens**.
2. Click **Generate new token**.
3. Set name (e.g., `SecureLink-Console`), select **Only select repositories**, and choose **`URL-Short`**.
4. Under **Repository permissions**, find **Contents** and set it to **Read and Write**.
5. Generate the token and keep it safe!

### 3. Open the Console & Shorten Links
1. Visit your deployed site (e.g., `https://<your-username>.github.io/URL-Short/`).
2. Navigate to the **Admin Panel** tab.
3. Enter your generated Personal Access Token (PAT) to unlock the console. Your avatar and profile details will load directly from the GitHub API.
4. Enter target destinations, optional custom slugs, and generate your links!

---

## 🛠️ Local Development & Testing

Since this platform has **zero runtime dependencies**, local development is simple and lightweight:

1. Clone your repository locally.
2. Run any local HTTP static server in the root directory:
   ```bash
   # Using Python 3
   python -m http.server 3000
   
   # Using Node.js (npx)
   npx serve .
   ```
3. Open `http://localhost:3000` in your web browser.
4. To test dynamic redirections locally, go to any non-existent subpath (e.g., `http://localhost:3000/welcome`). The server will fallback to `404.html` and trigger the redirect mechanism!

---

## 🔒 Security Hardening

- **Content Security Policy (CSP)**: Enforced via a strict meta tag in `index.html`. Restricts execution to local assets (`'self'`), Google Fonts, and direct calls to `https://api.github.com` and `https://raw.githubusercontent.com`.
- **Private Data Storage**: Your Personal Access Token stays locked in `localStorage`. There is no tracking script, third-party backend database, or server logging.
