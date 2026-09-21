import api from './api';
import type { AuthResponse, ForgotPasswordRequest, LoginRequest, RegisterRequest } from '../types/auth';
import type { MessageResponse } from '../types/api';

export const authService = {
  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  async login(payload: LoginRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  async forgotPassword(payload: ForgotPasswordRequest): Promise<MessageResponse> {
    const { data } = await api.post<MessageResponse>('/auth/forgot-password', payload);
    return data;
  },
};
