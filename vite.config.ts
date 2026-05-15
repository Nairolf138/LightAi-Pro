import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const commonCspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "form-action 'self'"
];

const productionCsp = [
  ...commonCspDirectives,
  "script-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co"
].join('; ');

const devCsp = [
  ...commonCspDirectives,
  "script-src 'self' 'sha256-8ZgGo/nOlaDknQkDUYiedLuFRSGJwIz6LAzsOrNxhmU='",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co http://localhost:* http://127.0.0.1:* ws:"
].join('; ');

const securityHeaders = (contentSecurityPolicy: string) => ({
  'Content-Security-Policy': contentSecurityPolicy,
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY'
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  server: {
    headers: securityHeaders(devCsp)
  },
  preview: {
    headers: securityHeaders(productionCsp)
  }
});
