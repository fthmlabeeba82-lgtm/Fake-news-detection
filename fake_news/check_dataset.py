import pandas as pd
import re

fake_news = pd.read_csv("dataset/Fake.csv")
real_news = pd.read_csv("dataset/True.csv")

fake_news["label"] = "FAKE"
real_news["label"] = "REAL"

data = pd.concat([fake_news, real_news], ignore_index=True)


def clean_text(text):
    text = text.lower()
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


data["clean_text"] = data["text"].apply(clean_text)

print(data[["text", "clean_text", "label"]].head())

print("\nOriginal:")
print(data["text"].iloc[0][:300])

print("\nCleaned:")
print(data["clean_text"].iloc[0][:300])