import axios from "axios";

const api = axios.create({
    // In production (Vercel), use relative "/api" so requests go through the Vercel proxy rewrite.
    // In local dev, VITE_STRAPI_API_URL points to http://localhost:1337.
    baseURL: (import.meta.env.VITE_STRAPI_API_URL || "") + "/api",
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
