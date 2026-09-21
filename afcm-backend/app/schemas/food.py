from pydantic import BaseModel


class OtherNutrient(BaseModel):
    name: str
    amount: float
    unit: str


class Nutrition(BaseModel):
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    other_nutrients: list[OtherNutrient]


class FoodItem(BaseModel):
    food_id: str
    name: str
    brand: str | None = None
    barcode: str | None = None
    confidence: float | None = None
    reference_weight_g: float
    serving_size_label: str | None = None
    nutrition: Nutrition


class FoodAnalysisResponse(BaseModel):
    food: FoodItem


class BarcodeRequest(BaseModel):
    barcode: str


class BarcodeResponse(BaseModel):
    food: FoodItem


class CalculateWeightRequest(BaseModel):
    """Send food_id for a food the AI or barcode lookup returned, or food_name for manual entry."""

    food_id: str | None = None
    food_name: str | None = None
    weight_g: float


class CalculateWeightResponse(BaseModel):
    food_id: str
    food_name: str
    weight_g: float
    nutrition: Nutrition
