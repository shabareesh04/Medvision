import os
import sys
from huggingface_hub import snapshot_download

print("\nAttempting to download models from Hugging Face...")

# Safely check for the secret token
token = os.getenv("HF_TOKEN")
if not token and os.path.exists('/run/secrets/HF_TOKEN'):
    token = open('/run/secrets/HF_TOKEN').read().strip()

local_models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model_assests')

try:
    snapshot_download(
        repo_id='sumitsingh3072/medivision-weights',
        local_dir=local_models_dir,
        local_dir_use_symlinks=False,
        token=token
    )
    print("\nDOWNLOAD SUCCESSFUL!")
except Exception as e:
    print(f"\n\nDOWNLOAD ERROR: {e}\n\n")
    sys.exit(1)