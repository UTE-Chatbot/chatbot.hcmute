from pathlib import Path
import json
from typing import Dict, Any

# Define paths using pathlib for better cross-platform compatibility and robustness
START_DIR = Path(__file__).resolve().parent  # app/services
APP_DIR = START_DIR.parent  # app
ASSETS_DIR = APP_DIR / "assets"
TOPICS_JSON_PATH = ASSETS_DIR / "json" / "topics.json"

def read_topics() -> Dict[str, Any]:
    # Ensure the directory exists
    if not TOPICS_JSON_PATH.parent.exists():
        TOPICS_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
        
    if not TOPICS_JSON_PATH.exists():
        write_topics({})
        return {}
        
    try:
        with open(TOPICS_JSON_PATH, 'r', encoding='utf-8-sig') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return {}

def write_topics(data: Dict[str, Any]):
    # Ensure directory exists before writing
    if not TOPICS_JSON_PATH.parent.exists():
        TOPICS_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
        
    with open(TOPICS_JSON_PATH, 'w', encoding='utf-8-sig') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
