import pandas as pd
import re
import joblib


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


from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer

y = data["label"]

# Aadyam data train-test aayi split cheyyuka
X_train_text, X_test_text, y_train, y_test = train_test_split(
    data["clean_text"],
    y,
    test_size=0.2,
    random_state=42
)

# Vectorizer training text-il maathram fit cheyyuka
vectorizer = TfidfVectorizer(
    max_features=10000,
    ngram_range=(1, 2),
    sublinear_tf=True
)

X_train = vectorizer.fit_transform(X_train_text)
X_test = vectorizer.transform(X_test_text)

print("\nTF-IDF training shape:")
print(X_train.shape)

print("TF-IDF testing shape:")
print(X_test.shape)

print("\nTraining data:", X_train.shape)
print("Testing data:", X_test.shape)


from sklearn.linear_model import LogisticRegression

model = LogisticRegression(max_iter=1000)

model.fit(X_train, y_train)

print("\nModel training completed!")

y_pred = model.predict(X_test)

print("\nFirst 10 predictions:")
print(y_pred[:10])

from sklearn.metrics import accuracy_score

accuracy = accuracy_score(y_test, y_pred)

print("\nAccuracy:", accuracy)
print("Accuracy percentage:", accuracy * 100, "%")

from sklearn.metrics import classification_report

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

joblib.dump(model, "models/fake_news_model.pkl")
joblib.dump(vectorizer, "models/tfidf_vectorizer.pkl")

print("\nModel saved successfully!")