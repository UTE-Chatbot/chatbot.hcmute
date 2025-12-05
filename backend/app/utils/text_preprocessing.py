from underthesea import word_tokenize
import re, os, string
import pandas as pd
import math
import numpy as np
from pathlib import Path

CURRENT_DIR = Path(__file__).parent
ASSETS_DIR = CURRENT_DIR.parent / "assets" / "csv" / "datasets"
STOPWORDS_FILE = ASSETS_DIR / "vietnamese-stopwords.csv"

_stopwords_set = None

def get_stopwords():
    global _stopwords_set
    if _stopwords_set is None:
        df = pd.read_csv(STOPWORDS_FILE)
        _stopwords_set = set(df['stopwords'].tolist())
    return _stopwords_set


def clean_text(text):
    text = re.sub('<.*?>', '', text).strip()
    text = re.sub('(\s)+', r'\1', text)
    return text


def normalize_text(text):
    listpunctuation = string.punctuation.replace('_', '')
    for i in listpunctuation:
        text = text.replace(i, ' ')
    return text.lower()


def remove_stopword(text):
    stopwords = get_stopwords()
    pre_text = []
    words = text.split()
    for word in words:
        if word not in stopwords:
            pre_text.append(word)
    text2 = ' '.join(pre_text)
    return text2

def word_segment(sent):
    sent = word_tokenize(sent, format="text")
    return sent

def process_pipeline(text):
    text = clean_text(text)
    text = normalize_text(text)
    text = remove_stopword(text)
    text = word_segment(text)
    return text
