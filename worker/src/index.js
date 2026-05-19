import { handleRequest } from './router.js';
import { addSecurityHeaders } from './utils/security.js';

export default {
    async fetch(request, env, ctx) {
        try {
            // 1. Process Request
            let response = await handleRequest(request, env, ctx);
            
            // 2. Add Security Headers
            response = addSecurityHeaders(response);
            
            return response;
        } catch (error) {
            console.error('Unhandled Edge Error:', error);
            // Don't leak stack traces in production
            const errorResponse = new Response(JSON.stringify({
                error: 'Internal Server Error'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
            return addSecurityHeaders(errorResponse);
        }
    }
};
