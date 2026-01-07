// Normalize NEXT_PUBLIC_API_URL so consumers always get a single canonical API base URL
const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const normalizedOrigin = raw.replace(/\/$/, '').replace(/\/api$/, '');

// Exported API base will be the origin (no trailing slash)
// (e.g. 'http://localhost:8000')
export const API_BASE_URL = normalizedOrigin;

// Helper to safely join base and endpoint and avoid duplicated slashes
export function buildApiUrl(base, endpoint = '') {
  const b = String(base || API_BASE_URL).replace(/\/$/, '');
  const e = String(endpoint || '').replace(/^\/+/, '');
  const combined = e ? `${b}/${e}` : b;
  // Collapse duplicate slashes while preserving protocol (e.g. keep 'http://')
  return combined.replace(/(^https?:)\/+/, '$1//').replace(/([^:]\/)\/+/g, '$1/');
}

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined');
} 
