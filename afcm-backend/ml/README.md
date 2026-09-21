# Training the food recognition model

The API can name the food in a photo. That needs a trained image classifier. You bring the photos; these scripts do the rest.

```
your photos  ->  check_dataset  ->  train.py  ->  models/food_classifier.onnx  ->  API (AI_PROVIDER=onnx)
```

## 1. Decide your food classes

Each class is one food the app can recognise, and **each class needs a row in the nutrition database**, because the photo
only tells us *what* the food is. Calories and macros come from the `foods` table.

- Start with the foods your users actually eat (for example 30 to 100 classes), not thousands.
- Give every class a stable slug such as `chicken-breast`. That slug is the food's `id`.
- Foods that look the same in a photo (white rice and jeera rice) are better as one class, unless you have plenty of photos of each.

## 2. Collect photos

One folder per class. The folder name is the label.

```
ml/data/
  train/
    chapati/      1.jpg 2.jpg ...
    dal/          ...
    paneer/       ...
  val/            (optional: same folders, photos the model never trains on)
    chapati/ ...
```

- Around **200+ photos per class** gives solid results with transfer learning. Fewer works, with lower accuracy. 30 is a bare minimum.
- Vary lighting, plates, angles and distances. Include real phone photos, not only studio shots.
- No `val/` folder? `train.py` sets aside 15 % of `train/` for validation. A separate `val/` is better if photos of the same meal could land in both.
- Public datasets you can start from (check each licence): Food-101, UEC Food-256, IndianFood10/20. Their class names become your labels.

## 3. Add nutrition data for every class

Put your foods in a CSV (`app/data/foods_template.csv` shows the columns), then import it:

```bash
python -m app.db.import_foods my_foods.csv --dry-run     # validates the file, changes nothing
python -m app.db.import_foods my_foods.csv               # adds new foods (--update overwrites existing ones)
```

Nutrition is **per 100 g**. Good sources: USDA FoodData Central, the Indian Food Composition Tables (IFCT), or a
dietitian-reviewed sheet. The starter values in the app are approximate placeholders.

If a class folder name differs from the food id (say `roti_photos` should be `chapati`), add `ml/label_map.json`:

```json
{ "roti_photos": "chapati" }
```

## 4. Check the dataset

```bash
python -m ml.check_dataset --data-dir ml/data --foods-csv my_foods.csv --label-map ml/label_map.json --deep
```

It flags classes with too few photos, unreadable files, classes missing from `val/`, and labels with no nutrition row.
Fix every `ERROR` before training.

## 5. Train

```bash
pip install -r ml/requirements-train.txt          # for an NVIDIA GPU, install torch from pytorch.org first
python -m ml.train --data-dir ml/data --epochs 15 --label-map ml/label_map.json
```

It fine-tunes a network that already knows general images (default `mobilenet_v3_large`, small and quick on CPU;
`--arch resnet50` is heavier and usually a bit more accurate). Watch the validation top-1 accuracy climb and check the
"Weakest classes" line at the end: those need more or better photos.

Output in `models/`:

| File | Purpose |
| --- | --- |
| `food_classifier.onnx` | the model the API runs (no PyTorch needed on the server) |
| `labels.json` | class names in the model's output order |
| `label_map.json` | class name to food id, only if you passed `--label-map` |
| `model_meta.json` | image size, normalisation, validation accuracy |

## 6. Use it

```bash
AI_PROVIDER=onnx uvicorn app.main:app        # or set AI_PROVIDER=onnx in .env
curl localhost:8000/health                   # "ai": {"provider": "onnx", "ready": true}
```

If the files are missing or the label count doesn't match the model, `/health` says why and `/food/analyze` answers `503 MODEL_NOT_READY`.

## Tuning the API's behaviour

- `RECOGNITION_MIN_CONFIDENCE` (default `0.25`): below this the photo counts as "food not recognized". The frontend
  separately shows a "not very sure" warning under 60 %.
- Retrain whenever you add classes. `labels.json` and the model must always come from the same run.

## Things worth knowing

- Photos tell us the food, not the amount. The user sets the weight in the app and the backend calculates from it.
- Mixed plates (rice + dal + curry on one plate) are a different, harder problem (object detection or segmentation).
  This pipeline recognises the single most likely food per photo.
- `app/ai/preprocess.py` and the evaluation transform in `ml/train.py` must stay identical (resize shorter side, center crop,
  ImageNet normalisation). If you change one, change the other.
