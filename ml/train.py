"""
Loan Eligibility Model Training Script
Run: python train.py
Outputs: models/loan_model.pkl and models/pipeline.pkl
"""
import os
import json
import logging
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score,
    accuracy_score, precision_score, recall_score, f1_score
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

os.makedirs("models", exist_ok=True)
os.makedirs("data", exist_ok=True)


def generate_sample_dataset(n=2000):
    """Generate realistic synthetic loan dataset."""
    np.random.seed(42)
    ages = np.random.randint(21, 70, n)
    genders = np.random.choice(["Male", "Female", "Other"], n, p=[0.52, 0.46, 0.02])
    employment_statuses = np.random.choice(
        ["Employed", "Self-Employed", "Unemployed", "Student", "Retired"],
        n, p=[0.55, 0.20, 0.10, 0.08, 0.07]
    )
    occupations = np.random.choice(
        ["Engineer", "Doctor", "Teacher", "Accountant", "Sales", "Manager", "Clerk", "Farmer", "Other"],
        n
    )
    income_base = {"Employed": 5000, "Self-Employed": 4000, "Retired": 3000, "Student": 1000, "Unemployed": 500}
    monthly_incomes = np.array([
        max(500, np.random.normal(income_base.get(e, 3000), 1500)) for e in employment_statuses
    ])
    existing_emis = np.random.uniform(0, monthly_incomes * 0.3)
    loan_amounts = np.random.uniform(5000, 200000, n)
    loan_tenures = np.random.choice([12, 24, 36, 48, 60, 84, 120, 180, 240], n)
    credit_scores = np.clip(np.random.normal(680, 80, n), 300, 900).astype(int)
    marital_statuses = np.random.choice(["Single", "Married", "Divorced", "Widowed"], n, p=[0.35, 0.50, 0.10, 0.05])
    dependents = np.random.randint(0, 5, n)
    educations = np.random.choice(["High School", "Diploma", "Bachelor", "Master", "PhD", "Other"], n, p=[0.15, 0.10, 0.45, 0.20, 0.05, 0.05])
    residential_statuses = np.random.choice(["Owned", "Rented", "Mortgaged", "Parental"], n, p=[0.30, 0.40, 0.20, 0.10])

    # Rule-based eligibility with noise
    proposed_emi = loan_amounts / loan_tenures
    dti = (existing_emis + proposed_emi) / np.maximum(monthly_incomes, 1) * 100
    emp_factor = np.where(np.isin(employment_statuses, ["Employed", "Self-Employed"]), 1.0, 0.4)
    credit_factor = np.clip((credit_scores - 400) / 500, 0, 1)
    dti_factor = np.clip(1 - dti / 100, 0, 1)
    income_factor = np.clip(monthly_incomes / 10000, 0, 1)
    score = 0.35 * credit_factor + 0.30 * dti_factor + 0.20 * emp_factor + 0.15 * income_factor
    eligible = (score + np.random.normal(0, 0.08, n) >= 0.45).astype(int)

    df = pd.DataFrame({
        "age": ages, "gender": genders, "employment_status": employment_statuses,
        "occupation": occupations, "monthly_income": monthly_incomes.round(2),
        "existing_emi": existing_emis.round(2), "loan_amount": loan_amounts.round(2),
        "loan_tenure": loan_tenures, "credit_score": credit_scores,
        "marital_status": marital_statuses, "dependents": dependents,
        "education": educations, "residential_status": residential_statuses,
        "eligible": eligible,
    })
    return df


def build_pipeline():
    numeric_features = ["age", "monthly_income", "existing_emi", "loan_amount", "loan_tenure", "credit_score", "dependents"]
    categorical_features = ["gender", "employment_status", "occupation", "marital_status", "education", "residential_status"]

    preprocessor = ColumnTransformer(transformers=[
        ("num", StandardScaler(), numeric_features),
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features),
    ])
    return preprocessor


def main():
    logger.info("Generating synthetic dataset...")
    df = generate_sample_dataset(2000)
    df.to_csv("data/loan_dataset.csv", index=False)
    logger.info(f"Dataset saved: {len(df)} records, {df['eligible'].mean():.1%} eligible")

    X = df.drop("eligible", axis=1)
    y = df["eligible"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    preprocessor = build_pipeline()
    model = GradientBoostingClassifier(n_estimators=200, learning_rate=0.1, max_depth=4, random_state=42)

    logger.info("Training Gradient Boosting model...")
    X_train_t = preprocessor.fit_transform(X_train)
    X_test_t = preprocessor.transform(X_test)
    model.fit(X_train_t, y_train)

    y_pred = model.predict(X_test_t)
    y_prob = model.predict_proba(X_test_t)[:, 1]

    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred), 4),
        "recall": round(recall_score(y_test, y_pred), 4),
        "f1_score": round(f1_score(y_test, y_pred), 4),
        "roc_auc": round(roc_auc_score(y_test, y_prob), 4),
    }

    logger.info("Model Evaluation Metrics:")
    for k, v in metrics.items():
        logger.info(f"  {k}: {v}")

    with open("models/metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    joblib.dump(model, "models/loan_model.pkl")
    joblib.dump(preprocessor, "models/pipeline.pkl")
    logger.info("✅ Model saved to models/loan_model.pkl")
    logger.info("✅ Pipeline saved to models/pipeline.pkl")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Not Eligible", "Eligible"]))


if __name__ == "__main__":
    main()
