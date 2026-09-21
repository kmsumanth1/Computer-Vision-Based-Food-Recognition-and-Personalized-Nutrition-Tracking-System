"""
Image decoding and the preprocessing the model expects.

This MUST match the evaluation transform in ml/train.py:
  resize shorter side to `resize_size` (bilinear) -> center crop `input_size` -> /255 -> normalize (mean, std).
"""
import io

import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

from app.core.errors import AppError

ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
Image.MAX_IMAGE_PIXELS = 50_000_000  # refuse decompression bombs

IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)


def decode_image(data: bytes) -> Image.Image:
    invalid = AppError(422, "INVALID_IMAGE", "This image can't be used. Choose a JPG, JPEG, PNG or WEBP photo under 10 MB.")
    if not data:
        raise invalid
    try:
        with Image.open(io.BytesIO(data)) as probe:
            if probe.format not in ALLOWED_FORMATS:
                raise invalid
            probe.verify()
        image = Image.open(io.BytesIO(data))
        image.load()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError, SyntaxError, ValueError):
        raise invalid from None
    image = ImageOps.exif_transpose(image)  # phone photos carry their rotation in EXIF
    return image.convert("RGB")


def preprocess(
    image: Image.Image,
    input_size: int = 224,
    resize_size: int | None = None,
    mean: tuple[float, ...] = IMAGENET_MEAN,
    std: tuple[float, ...] = IMAGENET_STD,
) -> np.ndarray:
    """Returns a float32 array shaped (1, 3, input_size, input_size)."""
    resize_size = resize_size or int(round(input_size * 256 / 224))
    # Same arithmetic as torchvision's Resize(int): the shorter side becomes resize_size.
    w, h = image.size
    if w <= h:
        new_w, new_h = resize_size, int(resize_size * h / w)
    else:
        new_w, new_h = int(resize_size * w / h), resize_size
    image = image.resize((new_w, new_h), Image.BILINEAR)

    left = int(round((new_w - input_size) / 2.0))
    top = int(round((new_h - input_size) / 2.0))
    image = image.crop((left, top, left + input_size, top + input_size))

    array = np.asarray(image, dtype=np.float32) / 255.0  # H, W, C
    array = (array - np.asarray(mean, dtype=np.float32)) / np.asarray(std, dtype=np.float32)
    return np.ascontiguousarray(array.transpose(2, 0, 1)[None, ...], dtype=np.float32)
