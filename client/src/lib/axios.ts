import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { notifyActivity } from "./sessionActivity";

export const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  notifyActivity();
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 401 && window.location.pathname !== "/login") {
      useAuthStore.getState().logout();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (status === 403 && data?.mustChangePassword) {
      window.location.href = "/change-password";
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);
