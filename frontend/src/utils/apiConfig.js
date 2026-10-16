// API Base URL helper
// Uses VITE_API_URL in production (e.g., https://healthdock-backend.onrender.com)
// Falls back to http://localhost:5000 in local development
export const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') 
  : 'http://localhost:5000';
