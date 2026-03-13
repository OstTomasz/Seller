import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// REQUEST interceptor — attach token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token; // read from store without hook
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// RESPONSE interceptor — handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // token expired or invalid — force logout
    if (status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // password change required — redirect
    if (status === 403 && data?.mustChangePassword) {
      window.location.href = "/change-password";
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default api;
