import axios from 'axios';

// Get the backend URL from environment variables or default to localhost
// For Vercel, you should set VITE_API_URL in the dashboard environment variables
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000');

const api = axios.create({
    baseURL: API_URL,
});

// Automatically add the Authorization header if a token exists in localStorage
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
