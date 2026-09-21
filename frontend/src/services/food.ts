import api from './api';
import type {
  BarcodeRequest,
  BarcodeResponse,
  CalculateWeightRequest,
  CalculateWeightResponse,
  FoodAnalysisResponse,
  FoodItem,
} from '../types/food';

export const foodService = {
  /** Sends a photo to the AI recognition endpoint. */
  async analyzeImage(image: File): Promise<FoodItem> {
    const form = new FormData();
    form.append('image', image);
    const { data } = await api.post<FoodAnalysisResponse>('/food/analyze', form, { timeout: 60_000 });
    return data.food;
  },

  /** Asks the backend to recalculate nutrition for a different weight. */
  async calculateWeight(payload: CalculateWeightRequest): Promise<CalculateWeightResponse> {
    const { data } = await api.post<CalculateWeightResponse>('/food/calculate-weight', payload);
    return data;
  },

  async lookupBarcode(barcode: string): Promise<FoodItem> {
    const body: BarcodeRequest = { barcode };
    const { data } = await api.post<BarcodeResponse>('/food/barcode', body);
    return data.food;
  },
};
