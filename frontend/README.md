# AI Food Calories Meter (frontend)

React + TypeScript + Vite + Tailwind CSS. Frontend only, built to connect to a FastAPI backend.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-checks, then builds to dist/
```

Environment (`.env`, see `.env.example`):

| Variable | Meaning |
| --- | --- |
| `VITE_API_URL` | Base URL of the FastAPI backend, e.g. `http://localhost:8000` |
| `VITE_USE_MOCK` | `true` uses the in-browser mock backend (no server needed). Set `false` to call the real API. |

With the mock on, sign up with any email. Handy demo triggers for the mock:

- Upload an image whose filename contains `unknown` to see "food not recognized", or `lowconf` to see the low-confidence warning.
- Barcodes starting with `000` return "not found". Any other 6 to 14 digit number returns a product.

## Connecting the real backend

1. Set `VITE_USE_MOCK=false` and `VITE_API_URL` to your server.
2. Everything the UI sends and receives is typed in `src/types/` and called from `src/services/`.
   Endpoints: `POST /auth/register|login|forgot-password`, `POST /profile/setup`, `GET|PUT /profile`,
   `POST /nutrition/calculate`, `GET /dashboard`, `POST /food/analyze|calculate-weight|barcode`,
   `POST|GET|PUT|DELETE /meals`, `GET /history`, `POST|GET /water`.
3. Errors: the UI reads FastAPI's `detail` as a string, a validation array, or `{ code, message }`
   (`src/utils/apiError.ts`). Codes with friendly copy: `FOOD_NOT_RECOGNIZED`, `BARCODE_NOT_FOUND`,
   `INVALID_CREDENTIALS`, `EMAIL_EXISTS`, `NUTRITION_UNAVAILABLE`, `INVALID_WEIGHT`, `INVALID_IMAGE`.
4. A `401` on any non-auth call logs the user out. `GET /profile` returning `404` means profile setup isn't done yet.
5. `src/mocks/` is only loaded when `VITE_USE_MOCK=true` and is never imported by components or pages.
   Delete it when you no longer need it.

The frontend never calculates calories or nutrition. Targets, food nutrition and weight changes all come from the backend.
Camera and barcode scanning need HTTPS (or localhost).
