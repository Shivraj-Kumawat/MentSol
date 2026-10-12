// Allowed origins for CORS
const ALLOWED_ORIGINS = new Set([
  'https://id-preview--9c6d3547-6c06-4153-8b16-b9dd6cd14714.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
  // Add your production domain here when deployed
]);

/**
 * Get CORS headers based on request origin
 * Only allows requests from whitelisted origins
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'Permissions-Policy': 'ambient-light-sensor=(), battery=(), vr=()',
    'Referrer-Policy': 'no-referrer-when-downgrade',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
  };

  // Only set Access-Control-Allow-Origin if origin is in whitelist
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else if (!origin) {
    // For same-origin requests or when origin is not provided
    headers['Access-Control-Allow-Origin'] = '*';
  }

  return headers;
}

/**
 * Legacy: Permissive CORS headers for backward compatibility
 * Use getCorsHeaders() for better security
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin',
};

export const securityHeaders = {
  'Referrer-Policy': 'no-referrer-when-downgrade',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'ambient-light-sensor=(), battery=(), vr=()',
};

export const allHeaders = {
  ...corsHeaders,
  ...securityHeaders,
};

/**
 * Handle CORS preflight requests
 * Returns a Response if it's an OPTIONS request, otherwise null
 */
export function handleCorsPreFlight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin');
    const headers = getCorsHeaders(origin);
    return new Response(null, { status: 204, headers });
  }
  return null;
}
