export interface OtherNutrient {
  name: string;
  amount: number;
  unit: string;
}

export interface Nutrition {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  other_nutrients: OtherNutrient[];
}

export type FoodSource = 'camera' | 'upload' | 'barcode' | 'manual';

/** A recognised or looked-up food. `nutrition` is for `reference_weight_g`. */
export interface FoodItem {
  food_id: string;
  name: string;
  brand?: string | null;
  barcode?: string | null;
  /** 0 to 1. Only present for AI image recognition. */
  confidence?: number | null;
  reference_weight_g: number;
  /** e.g. "1 bar (40 g)" for packaged products */
  serving_size_label?: string | null;
  nutrition: Nutrition;
}

/** POST /food/analyze (multipart/form-data, field "image") */
export interface FoodAnalysisResponse {
  food: FoodItem;
}

/** POST /food/barcode */
export interface BarcodeRequest {
  barcode: string;
}
export interface BarcodeResponse {
  food: FoodItem;
}

/**
 * POST /food/calculate-weight
 * Send `food_id` for a food the AI or barcode lookup returned, or `food_name` for manual entry.
 */
export interface CalculateWeightRequest {
  food_id?: string;
  food_name?: string;
  weight_g: number;
}
export interface CalculateWeightResponse {
  food_id: string;
  food_name: string;
  weight_g: number;
  nutrition: Nutrition;
}

export type FoodInputMode = 'camera' | 'upload' | 'barcode';
