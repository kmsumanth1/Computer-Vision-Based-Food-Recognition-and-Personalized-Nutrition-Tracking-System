import api from './api';
import type { CreateMealRequest, MealEntry, MealsResponse, UpdateMealRequest } from '../types/meal';

export const mealService = {
  async list(date: string): Promise<MealsResponse> {
    const { data } = await api.get<MealsResponse>('/meals', { params: { date } });
    return data;
  },

  async create(payload: CreateMealRequest): Promise<MealEntry> {
    const { data } = await api.post<MealEntry>('/meals', payload);
    return data;
  },

  async update(id: string, payload: UpdateMealRequest): Promise<MealEntry> {
    const { data } = await api.put<MealEntry>(`/meals/${encodeURIComponent(id)}`, payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/meals/${encodeURIComponent(id)}`);
  },
};
