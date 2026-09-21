import api from './api';
import type { DashboardData, HistoryRange, HistoryResponse, NutritionPlan } from '../types/nutrition';

export const nutritionService = {
  /** Calculates Cut / Maintain / Bulk targets from the saved profile. Never computed in the browser. */
  async calculate(): Promise<NutritionPlan> {
    const { data } = await api.post<NutritionPlan>('/nutrition/calculate');
    return data;
  },

  async getDashboard(date: string): Promise<DashboardData> {
    const { data } = await api.get<DashboardData>('/dashboard', { params: { date } });
    return data;
  },

  async getHistory(range: HistoryRange): Promise<HistoryResponse> {
    const { data } = await api.get<HistoryResponse>('/history', { params: { range } });
    return data;
  },
};
