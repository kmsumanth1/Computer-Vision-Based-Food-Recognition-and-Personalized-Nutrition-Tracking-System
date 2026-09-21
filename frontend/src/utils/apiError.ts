import axios from 'axios';
import type { ApiErrorInfo } from '../types/api';

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';

/** User-facing copy for each error code. */
const MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'We can’t reach the server. Check your internet connection and try again.',
  TIMEOUT: 'The request took too long. Please try again.',
  SERVER_ERROR: 'Something went wrong on our side. Please try again in a moment.',
  INVALID_CREDENTIALS: 'That email and password don’t match. Check them and try again.',
  EMAIL_EXISTS: 'An account with this email already exists. Log in instead.',
  PROFILE_NOT_FOUND: 'Your profile hasn’t been set up yet.',
  FOOD_NOT_RECOGNIZED:
    'We couldn’t recognise any food in this photo. Try a closer, well-lit shot, or add the food manually.',
  INVALID_IMAGE: 'This image can’t be used. Choose a JPG, JPEG, PNG or WEBP photo under 10 MB.',
  BARCODE_NOT_FOUND: 'We couldn’t find a product for this barcode. Scan again, or add the food manually.',
  NUTRITION_UNAVAILABLE:
    'Nutrition data isn’t available for this food yet. Check the spelling or try a simpler name.',
  INVALID_WEIGHT: 'Enter a weight between 1 and 5000 g.',
};

interface DetailObject {
  code?: string;
  message?: string;
}

/**
 * Converts anything thrown by an Axios call into `{ code, message, status }`.
 * Understands FastAPI's `{ detail: string | { code, message } | ValidationError[] }` shapes.
 */
export function parseApiError(error: unknown, fallback: string = DEFAULT_MESSAGE): ApiErrorInfo {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
      const code = timedOut ? 'TIMEOUT' : 'NETWORK_ERROR';
      return { code, message: MESSAGES[code] };
    }

    const { status, data } = error.response;
    const detail = (data as { detail?: unknown } | undefined)?.detail;
    let code: string | undefined;
    let serverMessage: string | undefined;

    if (typeof detail === 'string') {
      serverMessage = detail;
    } else if (Array.isArray(detail)) {
      code = 'VALIDATION_ERROR';
      const first = detail[0] as { msg?: string } | undefined;
      serverMessage = first?.msg;
    } else if (detail && typeof detail === 'object') {
      const d = detail as DetailObject;
      code = d.code;
      serverMessage = d.message;
    }

    if (!code) {
      if (status >= 500) code = 'SERVER_ERROR';
      else if (status === 401) code = 'UNAUTHORIZED';
      else if (status === 404) code = 'NOT_FOUND';
      else if (status === 422) code = 'VALIDATION_ERROR';
      else code = 'UNKNOWN';
    }

    return { code, status, message: MESSAGES[code] ?? serverMessage ?? fallback };
  }

  return { code: 'UNKNOWN', message: fallback };
}
