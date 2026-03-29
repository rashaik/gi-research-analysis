import json
import pandas as pd

def load_jsonl(path):
    with open(path, "r") as f:
        return [json.loads(line) for line in f]

def load_csv(path):
    return pd.read_csv(path).to_dict(orient="records")
