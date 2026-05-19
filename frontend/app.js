// API configuration
// NOTE: Change this to your deployed worker URL
const API_URL = 'https://api.yourdomain.com/api/shorten';

document.addEventListener('DOMContentLoaded', () => {
    // Set footer year
    document.getElementById('year').textContent = new Date().getFullYear();

    const form = document.getElementById('shortenForm');
    const submitBtn = document.getElementById('submitBtn');
    const resultContainer = document.getElementById('resultContainer');
    const errorContainer = document.getElementById('errorContainer');
    const resultUrl = document.getElementById('resultUrl');
    const copyBtn = document.getElementById('copyBtn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset state
        errorContainer.classList.add('hidden');
        resultContainer.classList.add('hidden');
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').textContent = 'Shortening...';

        const formData = new FormData(form);
        const url = formData.get('url');
        const slug = formData.get('slug');
        const turnstileToken = formData.get('cf-turnstile-response');

        try {
            const payload = { 
                url, 
                turnstileToken 
            };
            if (slug) payload.slug = slug;

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': 'Bearer YOUR_API_KEY' // Optional auth
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to shorten URL');
            }

            // Success
            resultUrl.value = data.shortUrl;
            resultContainer.classList.remove('hidden');
            form.reset();

        } catch (error) {
            // Safe injection via textContent to prevent XSS
            errorContainer.textContent = error.message;
            errorContainer.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            submitBtn.querySelector('.btn-text').textContent = 'Shorten URL';
        }
    });

    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(resultUrl.value);
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy', err);
            errorContainer.textContent = 'Failed to copy to clipboard';
            errorContainer.classList.remove('hidden');
        }
    });

    // PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('SW registered: ', registration.scope);
            }).catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
        });
    }
});
