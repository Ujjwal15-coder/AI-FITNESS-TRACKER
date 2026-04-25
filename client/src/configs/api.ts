import axios from "axios";

const api = axios.create({
    // VITE_STRAPI_API_URL should point to http://localhost:1337/api for Strapi v5 routes
    baseURL: import.meta.env.VITE_STRAPI_API_URL + "/api",
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
