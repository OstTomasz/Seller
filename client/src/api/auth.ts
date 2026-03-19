import { api } from "@/lib/axios";
import { User } from "@/types";

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  message: string;
  token: string;
}

export const authApi = {
  login: (payload: LoginPayload) => api.post<LoginResponse>("/auth/login", payload),

  changePassword: (payload: ChangePasswordPayload) =>
    api.patch<ChangePasswordResponse>("/users/me/password", payload),

  verifyPassword: (password: string) =>
    api.post<{ verified: boolean }>("/auth/verify-password", { password }),
};
