/** Codes the frontend understands. The backend may send its own codes; unknown codes fall back to the HTTP-based message. */
export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_EXISTS'
  | 'PROFILE_NOT_FOUND'
  | 'FOOD_NOT_RECOGNIZED'
  | 'INVALID_IMAGE'
  | 'BARCODE_NOT_FOUND'
  | 'NUTRITION_UNAVAILABLE'
  | 'INVALID_WEIGHT'
  | 'UNKNOWN';

export interface ApiErrorInfo {
  code: ApiErrorCode | (string & {});
  message: string;
  status?: number;
}

export interface MessageResponse {
  message: string;
}
