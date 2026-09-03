const defaultApiUrl = 'https://medisync-4-rpyr.onrender.com';

export const API_URL = (import.meta.env.VITE_API_URL || defaultApiUrl).replace(/\/$/, '');
