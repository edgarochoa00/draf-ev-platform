// Centralized API base URL — defaults to relative '/api' on Vercel and local dev proxy.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
export default API_BASE;
