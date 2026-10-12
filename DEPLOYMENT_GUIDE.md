# Deployment Guide

## Edge Functions CORS Security

This app uses **origin-based CORS whitelisting** for enhanced security. Only requests from approved domains are allowed.

### Adding Your Production Domain

When deploying to production, update the allowed origins in `supabase/functions/_shared/cors.ts`:

```typescript
const ALLOWED_ORIGINS = new Set([
  'https://your-production-domain.com',
  'https://www.your-production-domain.com',
  'https://id-preview--9c6d3547-6c06-4153-8b16-b9dd6cd14714.lovable.app',
  'http://localhost:5173',
]);
```

### Using CORS in Edge Functions

```typescript
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle preflight
  const preflightResponse = handleCorsPreFlight(req);
  if (preflightResponse) return preflightResponse;

  // Get origin-specific headers
  const origin = req.headers.get('origin');
  const headers = getCorsHeaders(origin);

  try {
    // Your function logic here
    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...headers, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...headers, 'Content-Type': 'application/json' } 
    });
  }
});
```

## Production Deployment with Nginx

If you plan to deploy this application behind an Nginx reverse proxy, use the configuration below to ensure proper CORS, security headers, and preflight handling.

### Nginx Configuration

Add this configuration inside your `server { }` block:

```nginx
# Map allowed origins for CORS
map $http_origin $cors_allow_origin {
    default "";
    "https://yourdomain.com"  "https://yourdomain.com";
    "https://www.yourdomain.com"  "https://www.yourdomain.com";
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Handle CORS preflight requests
    if ($request_method = OPTIONS) {
        add_header 'Access-Control-Allow-Origin' $cors_allow_origin always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Requested-With, Accept, X-Client-Info, ApiKey' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Max-Age' 86400 always;
        add_header 'Vary' 'Origin' always;
        return 204;
    }

    location / {
        # CORS Headers
        add_header 'Access-Control-Allow-Origin' $cors_allow_origin always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Requested-With, Accept, X-Client-Info, ApiKey' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Vary' 'Origin' always;

        # Security Headers
        add_header 'Permissions-Policy' 'ambient-light-sensor=(), battery=(), vr=()' always;
        add_header 'Referrer-Policy' 'no-referrer-when-downgrade' always;
        add_header 'X-Frame-Options' 'SAMEORIGIN' always;
        add_header 'X-Content-Type-Options' 'nosniff' always;
        add_header 'Strict-Transport-Security' 'max-age=31536000; includeSubDomains; preload' always;

        # Proxy to your app
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Key Security Features

1. **CORS Protection**: Only allows specific origins (configure your domains)
2. **Security Headers**: Prevents common web vulnerabilities
3. **Permissions-Policy**: Disables deprecated browser features that cause console warnings
4. **HSTS**: Enforces HTTPS connections
5. **X-Frame-Options**: Prevents clickjacking attacks

### Deployment Checklist

- [ ] Update `$cors_allow_origin` map with your actual domains
- [ ] Configure SSL certificates
- [ ] Test CORS with your frontend origin
- [ ] Verify security headers using [securityheaders.com](https://securityheaders.com)
- [ ] Set up SSL certificate auto-renewal (Let's Encrypt recommended)
- [ ] Configure firewall rules (allow 80, 443)
- [ ] Set up monitoring and logging
- [ ] Test preflight OPTIONS requests

## Direct Deployment (Lovable)

This app is already configured to deploy directly on Lovable. Click the **Publish** button to deploy:
- Frontend updates require clicking "Update" in the publish dialog
- Backend changes (edge functions, migrations) deploy automatically

## Environment Variables

The app uses Supabase secrets for sensitive data. No `.env` files are needed. All secrets are managed through:
- Supabase Dashboard → Settings → Edge Functions → Secrets

## Database Migrations

Database changes are applied automatically through Supabase migrations. All migration files are in `supabase/migrations/`.

## Monitoring

### Production Health Checks
- Monitor edge function logs: [Supabase Dashboard](https://supabase.com/dashboard/project/rutxafzivumqnyxqtdsa/functions)
- Check database performance: Supabase Dashboard → Database → Query Performance
- Review auth logs: Supabase Dashboard → Authentication → Logs

### Key Metrics to Monitor
- Session booking success rate
- Payment completion rate
- Edge function error rates
- Database query performance
- WebRTC connection success rate
