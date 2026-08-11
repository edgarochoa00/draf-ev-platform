// Centralized API base URL — reads from NEXT_PUBLIC_API_URL env var in production,
// falls back to localhost for local development.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
export default API_BASE;
