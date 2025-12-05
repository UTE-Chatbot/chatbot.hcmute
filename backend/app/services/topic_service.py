import os
import json
from typing import Dict, Any

TOPICS_JSON_PATH = os.path.join(os.path.dirname(__file__), '../assets/json/topics.json')

def read_topics() -> Dict[str, Any]:
    if not os.path.exists(TOPICS_JSON_PATH):
        write_topics({})
        return {}
    with open(TOPICS_JSON_PATH, 'r', encoding='utf-8-sig') as f:
        return json.load(f)

def write_topics(data: Dict[str, Any]):
    with open(TOPICS_JSON_PATH, 'w', encoding='utf-8-sig') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
