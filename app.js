// GitHub Repository Configuration
const OWNER = 'DylanGrow';
const REPO = 'URL-Short';
const DB_PATH = 'db.json';

document.addEventListener('DOMContentLoaded', () => {
    // Set footer year
    document.getElementById('year').textContent = new Date().getFullYear();

    // Elements
    const tabDashboard = document.getElementById('tab-dashboard');
    const tabAdmin = document.getElementById('tab-admin');
    const panelDashboard = document.getElementById('panel-dashboard');
    const panelAdmin = document.getElementById('panel-admin');

    const authCard = document.getElementById('admin-auth');
    const adminConsole = document.getElementById('admin-console');
    const authForm = document.getElementById('authForm');
    const githubTokenInput = document.getElementById('githubToken');
    const authSubmitBtn = document.getElementById('authSubmitBtn');

    const userName = document.getElementById('user-name');
    const userAvatar = document.getElementById('user-avatar');
    const logoutBtn = document.getElementById('logoutBtn');

    const shortenForm = document.getElementById('shortenForm');
    const targetUrlInput = document.getElementById('targetUrl');
    const customSlugInput = document.getElementById('customSlug');
    const submitBtn = document.getElementById('submitBtn');
    const resultContainer = document.getElementById('resultContainer');
    const resultUrl = document.getElementById('resultUrl');
    const copyBtn = document.getElementById('copyBtn');
    const errorContainer = document.getElementById('errorContainer');

    const statCount = document.getElementById('stat-count');
    const statClicks = document.getElementById('stat-clicks');
    const linksCountBadge = document.getElementById('links-count');
    const linksTableBody = document.getElementById('linksTableBody');

    // State Variables
    let currentDatabase = {};
    let githubToken = localStorage.getItem('gh_pat') || '';

    // --- Tab Navigation ---
    tabDashboard.addEventListener('click', () => {
        switchTab('dashboard');
    });

    tabAdmin.addEventListener('click', () => {
        switchTab('admin');
    });

    function switchTab(tab) {
        if (tab === 'dashboard') {
            tabDashboard.classList.add('active');
            tabDashboard.setAttribute('aria-selected', 'true');
            tabAdmin.classList.remove('active');
            tabAdmin.setAttribute('aria-selected', 'false');
            panelDashboard.style.display = 'block';
            panelAdmin.style.display = 'none';
            loadPublicStats();
        } else {
            tabAdmin.classList.add('active');
            tabAdmin.setAttribute('aria-selected', 'true');
            tabDashboard.classList.remove('active');
            tabDashboard.setAttribute('aria-selected', 'false');
            panelAdmin.style.display = 'block';
            panelDashboard.style.display = 'none';
            
            if (githubToken) {
                initializeAdminView();
            } else {
                showAuthScreen();
            }
        }
    }

    // --- Public Statistics loader ---
    async function loadPublicStats() {
        try {
            // Fetch cached db.json from Pages origin to present summary figures
            const res = await fetch(`./${DB_PATH}?t=${Date.now()}`);
            if (!res.ok) throw new Error('Database loading failed');
            const db = await res.json();
            
            currentDatabase = db;
            const slugs = Object.keys(db);
            const activeCount = slugs.length;
            
            let totalClicks = 0;
            slugs.forEach(slug => {
                totalClicks += db[slug].clicks || 0;
            });

            statCount.textContent = activeCount;
            statClicks.textContent = totalClicks;
        } catch (e) {
            console.error('Stats loading failed:', e);
            statCount.textContent = '0';
            statClicks.textContent = '0';
        }
    }

    // --- Authentication Locks & Disconnections ---
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = githubTokenInput.value.trim();
        if (!token) return;

        authSubmitBtn.disabled = true;
        authSubmitBtn.querySelector('.btn-text').textContent = 'Validating Token...';

        const isValid = await verifyGitHubToken(token);
        if (isValid) {
            githubToken = token;
            localStorage.setItem('gh_pat', token);
            initializeAdminView();
        } else {
            alert('Invalid GitHub Access Token. Please verify token scopes and permissions.');
            authSubmitBtn.disabled = false;
            authSubmitBtn.querySelector('.btn-text').textContent = 'Authenticate Console';
        }
    });

    logoutBtn.addEventListener('click', () => {
        githubToken = '';
        localStorage.removeItem('gh_pat');
        showAuthScreen();
    });

    function showAuthScreen() {
        authCard.style.display = 'block';
        adminConsole.style.display = 'none';
        authSubmitBtn.disabled = false;
        authSubmitBtn.querySelector('.btn-text').textContent = 'Authenticate Console';
        githubTokenInput.value = '';
    }

    async function verifyGitHubToken(token) {
        try {
            const res = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            return res.ok;
        } catch (e) {
            return false;
        }
    }

    // --- Admin Panel Views Loader ---
    async function initializeAdminView() {
        authCard.style.display = 'none';
        adminConsole.style.display = 'block';
        
        loadGitHubUserProfile();
        loadLinksTable();
    }

    async function loadGitHubUserProfile() {
        try {
            const res = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (res.ok) {
                const user = await res.json();
                userName.textContent = user.name || user.login;
                userAvatar.src = user.avatar_url;
            }
        } catch (e) {
            console.error('Failed to load GitHub user profile', e);
        }
    }

    async function loadLinksTable() {
        renderTableSkeleton();
        
        try {
            // Fetch fresh database from GitHub content to avoid caching latency
            const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${DB_PATH}?t=${Date.now()}`, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3.raw'
                }
            });
            if (!res.ok) throw new Error('Database fetch failed');
            const db = await res.json();
            currentDatabase = db;
            
            renderLinksList(db);
        } catch (e) {
            console.error(e);
            linksTableBody.innerHTML = `<tr><td colspan="5" class="center-align error-text">Failed to fetch links database from GitHub contents. Please verify repository existence and write permissions.</td></tr>`;
        }
    }

    function renderTableSkeleton() {
        linksTableBody.innerHTML = Array(3).fill(0).map(() => `
            <tr class="skeleton-row">
                <td><div class="skeleton-wave"></div></td>
                <td><div class="skeleton-wave"></div></td>
                <td class="center-align"><div class="skeleton-wave wave-sm"></div></td>
                <td class="right-align"><div class="skeleton-wave wave-md"></div></td>
                <td class="center-align"><div class="skeleton-wave wave-sm"></div></td>
            </tr>
        `).join('');
    }

    function renderLinksList(db) {
        const slugs = Object.keys(db);
        linksCountBadge.textContent = `${slugs.length} Total`;
        
        if (slugs.length === 0) {
            linksTableBody.innerHTML = `<tr><td colspan="5" class="center-align empty-text">No active short links configured.</td></tr>`;
            return;
        }

        // Sort by creation date descending
        slugs.sort((a, b) => (db[b].created_at || 0) - (db[a].created_at || 0));

        const originUrl = window.location.origin + window.location.pathname.replace(/\/index\.html$/, '');
        const cleanOrigin = originUrl.replace(/\/$/, '');

        linksTableBody.innerHTML = slugs.map(slug => {
            const item = db[slug];
            const shortLink = `${cleanOrigin}/${slug}`;
            const dateStr = item.created_at ? new Date(item.created_at * 1000).toLocaleDateString() : 'Unknown';
            const safeTarget = escapeHtml(item.url);
            
            return `
                <tr>
                    <td class="slug-cell">
                        <span class="slug-bold">${escapeHtml(slug)}</span>
                    </td>
                    <td class="target-cell" title="${safeTarget}">${safeTarget}</td>
                    <td class="center-align click-badge-cell">
                        <span class="click-badge">${item.clicks || 0}</span>
                    </td>
                    <td class="right-align date-cell">${dateStr}</td>
                    <td class="center-align actions-cell">
                        <div class="action-buttons">
                            <button type="button" class="table-btn copy-link-btn" data-link="${shortLink}" aria-label="Copy short link">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                            </button>
                            <button type="button" class="table-btn delete-link-btn" data-slug="${slug}" aria-label="Delete short link">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Attach listeners to table buttons
        document.querySelectorAll('.copy-link-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const link = btn.getAttribute('data-link');
                navigator.clipboard.writeText(link);
                const originalSvg = btn.innerHTML;
                btn.innerHTML = `<span style="font-size: 10px; font-weight: bold; color: #10b981;">Copied</span>`;
                setTimeout(() => {
                    btn.innerHTML = originalSvg;
                }, 1500);
            });
        });

        document.querySelectorAll('.delete-link-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const slug = btn.getAttribute('data-slug');
                if (confirm(`Are you sure you want to delete the slug "${slug}"?`)) {
                    deleteSlug(slug);
                }
            });
        });
    }

    // --- Shorten Link Submit ---
    shortenForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        errorContainer.classList.add('hidden');
        resultContainer.classList.add('hidden');
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').textContent = 'Generating Link...';

        const targetUrl = targetUrlInput.value.trim();
        let slug = customSlugInput.value.trim().toLowerCase();

        // 1. Basic URL Validations
        if (!validateUrl(targetUrl)) {
            showError('Invalid URL. Only HTTP/HTTPS destinations allowed.');
            return;
        }

        // 2. Slug Generation or validation
        if (slug) {
            if (!validateSlug(slug)) {
                showError('Slug must be 3-32 characters, letters, numbers, hyphens, and underscores only.');
                return;
            }
            if (currentDatabase[slug]) {
                showError('This slug is already in use. Please enter a different custom slug.');
                return;
            }
        } else {
            slug = generateRandomSlug(6);
            // Handle collisions
            let attempts = 0;
            while (currentDatabase[slug] && attempts < 5) {
                slug = generateRandomSlug(6);
                attempts++;
            }
            if (attempts === 5) {
                showError('Slug collision. Please try generating again.');
                return;
            }
        }

        // 3. GitHub API Committer Flow
        try {
            submitBtn.querySelector('.btn-text').textContent = 'Uploading to GitHub...';
            
            // Get database SHA
            const { fileSha, db } = await fetchDatabaseSha();
            
            // Append new slug to mapping
            db[slug] = {
                url: targetUrl,
                clicks: 0,
                created_at: Math.floor(Date.now() / 1000)
            };

            const updatedContent = JSON.stringify(db, null, 2);
            const base64Content = btoa(unescape(encodeURIComponent(updatedContent)));

            const commitRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${DB_PATH}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: `Add short slug: ${slug}`,
                    content: base64Content,
                    sha: fileSha
                })
            });

            if (!commitRes.ok) {
                const errDetails = await commitRes.json();
                throw new Error(errDetails.message || 'GitHub commit failed');
            }

            // Success UI update
            const originUrl = window.location.origin + window.location.pathname.replace(/\/index\.html$/, '');
            const cleanOrigin = originUrl.replace(/\/$/, '');
            const finalShortUrl = `${cleanOrigin}/${slug}`;

            resultUrl.value = finalShortUrl;
            resultContainer.classList.remove('hidden');
            shortenForm.reset();

            // Refresh table state
            currentDatabase = db;
            renderLinksList(db);

        } catch (err) {
            console.error(err);
            showError(`Failed to save short link: ${err.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.querySelector('.btn-text').textContent = 'Generate Short Link';
        }
    });

    // --- Copy Success Result ---
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(resultUrl.value);
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        } catch (err) {
            console.error(err);
        }
    });

    // --- Delete Slug Handler ---
    async function deleteSlug(slug) {
        try {
            // Get database SHA
            const { fileSha, db } = await fetchDatabaseSha();
            
            if (!db[slug]) {
                alert('Slug already deleted.');
                return;
            }

            // Delete key
            delete db[slug];

            const updatedContent = JSON.stringify(db, null, 2);
            const base64Content = btoa(unescape(encodeURIComponent(updatedContent)));

            const commitRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${DB_PATH}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: `Delete short slug: ${slug}`,
                    content: base64Content,
                    sha: fileSha
                })
            });

            if (!commitRes.ok) {
                const errDetails = await commitRes.json();
                throw new Error(errDetails.message || 'GitHub commit failed');
            }

            // Success, reload view
            currentDatabase = db;
            renderLinksList(db);
        } catch (e) {
            console.error(e);
            alert(`Failed to delete link: ${e.message}`);
        }
    }

    // --- Common GitHub Database Helpers ---
    async function fetchDatabaseSha() {
        const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${DB_PATH}?t=${Date.now()}`, {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (!res.ok) throw new Error('Could not fetch links database files metadata from GitHub.');
        const fileMeta = await res.json();
        
        // Base64 decode raw content safely with utf-8 character support
        const decodedContent = decodeURIComponent(escape(atob(fileMeta.content.replace(/\s/g, ''))));
        const db = JSON.parse(decodedContent);

        return {
            fileSha: fileMeta.sha,
            db: db
        };
    }

    // --- Validators & Utilities ---
    function validateUrl(urlStr) {
        try {
            const url = new URL(urlStr);
            if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
            
            const host = url.hostname;
            if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false;
            
            return true;
        } catch (e) {
            return false;
        }
    }

    // Local validator matching target pattern
    function validateSlug(slug) {
        const slugRegex = /^[a-zA-Z0-9_-]{3,32}$/;
        if (!slugRegex.test(slug)) return false;

        const reserved = new Set([
            'api', 'admin', 'dashboard', 'login', 'assets', 'db.json',
            'favicon.ico', 'sw.js', 'robots.txt', 'sitemap.xml', 'index.html', '404.html'
        ]);
        return !reserved.has(slug.toLowerCase());
    }

    function generateRandomSlug(length) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    function showError(msg) {
        errorContainer.textContent = msg;
        errorContainer.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = 'Generate Short Link';
    }

    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    // Initialize public stats display
    loadPublicStats();

    // Register Service Worker for PWA support
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((reg) => console.log('Service Worker registered:', reg.scope))
                .catch((err) => console.error('Service Worker registration failed:', err));
        });
    }
});

