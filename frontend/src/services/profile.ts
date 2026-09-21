import api from './api';
import type { ProfileResponse, ProfileSetupRequest, ProfileUpdateRequest } from '../types/user';

export const profileService = {
  async setup(payload: ProfileSetupRequest): Promise<ProfileResponse> {
    const { data } = await api.post<ProfileResponse>('/profile/setup', payload);
    return data;
  },

  async get(): Promise<ProfileResponse> {
    const { data } = await api.get<ProfileResponse>('/profile');
    return data;
  },

  /** The backend recalculates calorie targets when body values or goal change. */
  async update(payload: ProfileUpdateRequest): Promise<ProfileResponse> {
    const { data } = await api.put<ProfileResponse>('/profile', payload);
    return data;
  },
};
