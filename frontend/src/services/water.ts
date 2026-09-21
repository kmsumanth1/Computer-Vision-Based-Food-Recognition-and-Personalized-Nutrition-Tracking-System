import api from './api';
import type { AddWaterRequest, WaterSummary } from '../types/nutrition';

export const waterService = {
  async get(date: string): Promise<WaterSummary> {
    const { data } = await api.get<WaterSummary>('/water', { params: { date } });
    return data;
  },

  async add(payload: AddWaterRequest): Promise<WaterSummary> {
    const { data } = await api.post<WaterSummary>('/water', payload);
    return data;
  },
};
