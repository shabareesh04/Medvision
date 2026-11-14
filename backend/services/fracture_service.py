# backend/services/fracture_service.py

import os
import threading
from pathlib import Path
from models.fracture_model import load_fracture_model, predict_fracture

# Resolve project root and weight path
PROJECT_ROOT = Path(os.path.abspath(__file__)).parent.parent
DEFAULT_WEIGHT_PATH = PROJECT_ROOT / 'model_assests' / 'fracture' / 'fracture.pth.tar'

_fracture_model = None
_lock = threading.Lock()
_weights_available = None  # cached check


def _check_weights() -> bool:
    """Check if fracture model weights exist."""
    global _weights_available
    if _weights_available is None:
        _weights_available = DEFAULT_WEIGHT_PATH.is_file()
    return _weights_available


def init_fracture_model(weight_path: Path = DEFAULT_WEIGHT_PATH, device: str = 'cpu') -> None:
    """
    Load and cache the FractureNet model.
    """
    global _fracture_model

    weight_path = Path(weight_path)
    if not weight_path.is_file():
        raise FileNotFoundError(f"Fracture weights not found at {weight_path}")

    _fracture_model = load_fracture_model(str(weight_path), device=device)


def _ensure_model(device: str = 'cpu') -> None:
    """Lazy-load the model on first use (thread-safe)."""
    global _fracture_model
    if _fracture_model is None:
        with _lock:
            if _fracture_model is None:  # double-check after acquiring lock
                print("Lazy-loading Fracture model...")
                init_fracture_model(device=device)


def has_fracture_model() -> bool:
    """Check if the fracture model weights are available."""
    return _check_weights()


def process_fracture(image_path: str, device: str = 'cpu', top_k: int = 2) -> list:
    """
    Process a bone X-ray image for fracture detection.
    
    Returns list of (label, probability) tuples.
    Raises FileNotFoundError if weights are not available.
    """
    _ensure_model(device=device)

    ext = os.path.splitext(image_path)[1].lower()
    if ext not in ['.png', '.jpg', '.jpeg', '.bmp']:
        raise ValueError(f"Unsupported file type: {ext}")

    return predict_fracture(_fracture_model, image_path, top_k=top_k, device=device)
