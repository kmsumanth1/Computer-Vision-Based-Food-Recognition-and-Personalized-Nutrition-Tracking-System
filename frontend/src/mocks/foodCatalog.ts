/**
 * MOCK BACKEND DATA. Approximate reference values used only when VITE_USE_MOCK=true.
 * The real nutrition database and AI model live in the FastAPI backend.
 */
export interface Per100 {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  sat_fat_g: number;
  cholesterol_mg: number;
}

export interface CatalogFood {
  id: string;
  name: string;
  aliases: string[];
  reference_weight_g: number;
  per100: Per100;
  /** Packaged products only */
  brand?: string;
  barcode?: string;
  serving_size_label?: string;
}

const p = (
  calories: number,
  protein_g: number,
  carbs_g: number,
  fat_g: number,
  fiber_g: number,
  sugar_g: number,
  sodium_mg: number,
  sat_fat_g: number,
  cholesterol_mg: number,
): Per100 => ({ calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, sat_fat_g, cholesterol_mg });

export const CATALOG_FOODS: CatalogFood[] = [
  { id: 'chicken-breast', name: 'Chicken breast (grilled)', aliases: ['chicken', 'chicken breast', 'grilled chicken'], reference_weight_g: 200, per100: p(165, 31, 0, 3.6, 0, 0, 74, 1, 85) },
  { id: 'egg-boiled', name: 'Boiled egg', aliases: ['egg', 'eggs', 'boiled egg', 'boiled eggs'], reference_weight_g: 100, per100: p(155, 12.6, 1.1, 10.6, 0, 1.1, 124, 3.3, 373) },
  { id: 'rice-cooked', name: 'White rice (cooked)', aliases: ['rice', 'white rice', 'steamed rice'], reference_weight_g: 200, per100: p(130, 2.7, 28, 0.3, 0.4, 0.1, 1, 0.1, 0) },
  { id: 'paneer', name: 'Paneer', aliases: ['paneer', 'cottage cheese', 'paneer cubes'], reference_weight_g: 100, per100: p(296, 18.3, 3.6, 22.8, 0, 2.6, 20, 14, 60) },
  { id: 'banana', name: 'Banana', aliases: ['banana', 'bananas'], reference_weight_g: 118, per100: p(89, 1.1, 22.8, 0.3, 2.6, 12.2, 1, 0.1, 0) },
  { id: 'milk-whole', name: 'Whole milk', aliases: ['milk', 'whole milk', 'glass of milk'], reference_weight_g: 250, per100: p(61, 3.2, 4.8, 3.3, 0, 5.1, 43, 1.9, 10) },
  { id: 'dal', name: 'Dal (cooked lentils)', aliases: ['dal', 'dhal', 'lentils', 'lentil curry'], reference_weight_g: 200, per100: p(116, 9, 20, 0.4, 7.9, 1.8, 2, 0.1, 0) },
  { id: 'chapati', name: 'Chapati', aliases: ['chapati', 'roti', 'phulka'], reference_weight_g: 40, per100: p(297, 9.6, 50, 7.5, 4.9, 1.5, 250, 2.6, 0) },
  { id: 'idli', name: 'Idli', aliases: ['idli', 'idly'], reference_weight_g: 120, per100: p(132, 4, 27, 0.4, 1.2, 0.6, 190, 0.1, 0) },
  { id: 'oatmeal', name: 'Oatmeal (cooked)', aliases: ['oats', 'oatmeal', 'porridge'], reference_weight_g: 250, per100: p(71, 2.5, 12, 1.5, 1.7, 0.3, 49, 0.3, 0) },
  { id: 'apple', name: 'Apple', aliases: ['apple', 'apples'], reference_weight_g: 180, per100: p(52, 0.3, 13.8, 0.2, 2.4, 10.4, 1, 0, 0) },
  { id: 'salmon', name: 'Salmon (baked)', aliases: ['salmon', 'fish', 'baked salmon'], reference_weight_g: 150, per100: p(208, 20, 0, 13, 0, 0, 59, 3.1, 55) },
  { id: 'bread-whole-wheat', name: 'Whole wheat bread', aliases: ['bread', 'toast', 'whole wheat bread', 'brown bread'], reference_weight_g: 60, per100: p(247, 13, 41, 3.4, 7, 6, 450, 0.7, 0) },
  { id: 'yogurt-greek', name: 'Greek yogurt', aliases: ['yogurt', 'yoghurt', 'greek yogurt', 'curd', 'dahi'], reference_weight_g: 170, per100: p(97, 9, 3.9, 5, 0, 3.6, 35, 3.2, 13) },
  { id: 'almonds', name: 'Almonds', aliases: ['almond', 'almonds', 'nuts'], reference_weight_g: 30, per100: p(579, 21, 22, 50, 12.5, 4.4, 1, 3.8, 0) },
];

export const CATALOG_PRODUCTS: CatalogFood[] = [
  {
    id: 'prod-protein-bar',
    name: 'Cocoa Protein Bar',
    aliases: [],
    brand: 'Northfield',
    barcode: '8901234500011',
    reference_weight_g: 45,
    serving_size_label: '1 bar (45 g)',
    per100: p(390, 33, 38, 12, 8, 5, 220, 5, 15),
  },
  {
    id: 'prod-peanut-butter',
    name: 'Crunchy Peanut Butter',
    aliases: [],
    brand: 'Harvest Table',
    barcode: '8901234500028',
    reference_weight_g: 32,
    serving_size_label: '2 tbsp (32 g)',
    per100: p(598, 25, 20, 50, 6, 9, 430, 10, 0),
  },
  {
    id: 'prod-whole-grain-cereal',
    name: 'Whole Grain Cereal',
    aliases: [],
    brand: 'PureCrunch',
    barcode: '8901234500035',
    reference_weight_g: 30,
    serving_size_label: '1 cup (30 g)',
    per100: p(375, 8, 80, 2, 9, 20, 500, 0.5, 0),
  },
];

const ALL = [...CATALOG_FOODS, ...CATALOG_PRODUCTS];

export const findFoodById = (id: string | undefined): CatalogFood | undefined =>
  id ? ALL.find((f) => f.id === id) : undefined;

export function findFoodByName(query: string | undefined): CatalogFood | undefined {
  const q = query?.trim().toLowerCase();
  if (!q) return undefined;
  return (
    CATALOG_FOODS.find((f) => f.name.toLowerCase() === q || f.aliases.includes(q)) ??
    CATALOG_FOODS.find((f) => q.includes(f.id.split('-')[0]) || f.aliases.some((a) => q.includes(a) || a.includes(q)))
  );
}
