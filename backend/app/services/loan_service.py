"""Loan eligibility prediction service using ML model or rule-based fallback."""
import logging
import os
import json
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../ml/models/loan_model.pkl")
PIPELINE_PATH = os.path.join(os.path.dirname(__file__), "../../ml/models/pipeline.pkl")

_model = None
_pipeline = None


def _load_model():
    global _model, _pipeline
    try:
        import joblib
        if os.path.exists(MODEL_PATH):
            _model = joblib.load(MODEL_PATH)
            _pipeline = joblib.load(PIPELINE_PATH)
            logger.info("ML loan model loaded successfully")
        else:
            logger.warning("ML model not found — using rule-based prediction. Run ml/train.py to generate the model.")
    except Exception as e:
        logger.error(f"Failed to load ML model: {e}")


_load_model()


def predict_loan_eligibility(data: Dict[str, Any]) -> Dict[str, Any]:
    """Predict loan eligibility using ML model or rule-based fallback."""
    if _model and _pipeline:
        return _ml_predict(data)
    return _rule_based_predict(data)


def _ml_predict(data: Dict[str, Any]) -> Dict[str, Any]:
    """Use trained scikit-learn model for prediction."""
    import pandas as pd
    import numpy as np
    try:
        df = pd.DataFrame([data])
        features = _pipeline.transform(df)
        prob = _model.predict_proba(features)[0][1]
        is_eligible = prob >= 0.5
        risk_score = round((1 - prob) * 100, 2)
        explanation, recommendations = _generate_explanation(data, is_eligible, prob)
        return {
            "is_eligible": bool(is_eligible),
            "approval_probability": round(float(prob), 4),
            "risk_score": risk_score,
            "explanation": explanation,
            "recommendations": recommendations,
        }
    except Exception as e:
        logger.error(f"ML prediction error: {e}")
        return _rule_based_predict(data)


def _rule_based_predict(data: Dict[str, Any]) -> Dict[str, Any]:
    """Rule-based loan eligibility prediction as fallback."""
    score = 0
    max_score = 100

    # Credit score (30 points)
    credit = data.get("credit_score", 600)
    if credit >= 750:
        score += 30
    elif credit >= 700:
        score += 22
    elif credit >= 650:
        score += 14
    elif credit >= 600:
        score += 8
    else:
        score += 0

    # Debt-to-income ratio (25 points)
    income = data.get("monthly_income", 1)
    emi = data.get("existing_emi", 0)
    loan_amount = data.get("loan_amount", 0)
    tenure = data.get("loan_tenure", 12)
    proposed_emi = loan_amount / tenure if tenure > 0 else loan_amount
    total_emi = emi + proposed_emi
    dti = (total_emi / income) * 100 if income > 0 else 100
    if dti <= 30:
        score += 25
    elif dti <= 40:
        score += 18
    elif dti <= 50:
        score += 10
    elif dti <= 60:
        score += 4
    else:
        score += 0

    # Employment status (20 points)
    emp = data.get("employment_status", "Unemployed")
    emp_scores = {"Employed": 20, "Self-Employed": 15, "Retired": 12, "Student": 5, "Unemployed": 0}
    score += emp_scores.get(emp, 0)

    # Education (10 points)
    edu = data.get("education", "Other")
    edu_scores = {"PhD": 10, "Master": 9, "Bachelor": 7, "Diploma": 5, "High School": 3, "Other": 2}
    score += edu_scores.get(edu, 2)

    # Age factor (10 points)
    age = data.get("age", 30)
    if 25 <= age <= 50:
        score += 10
    elif 21 <= age <= 60:
        score += 7
    else:
        score += 4

    # Residential status (5 points)
    res = data.get("residential_status", "Rented")
    res_scores = {"Owned": 5, "Mortgaged": 4, "Parental": 3, "Rented": 2}
    score += res_scores.get(res, 2)

    probability = score / max_score
    is_eligible = probability >= 0.5
    risk_score = round((1 - probability) * 100, 2)

    explanation, recommendations = _generate_explanation(data, is_eligible, probability)
    return {
        "is_eligible": is_eligible,
        "approval_probability": round(probability, 4),
        "risk_score": risk_score,
        "explanation": explanation,
        "recommendations": recommendations,
    }


def _generate_explanation(data: Dict, is_eligible: bool, probability: float) -> tuple:
    credit = data.get("credit_score", 0)
    income = data.get("monthly_income", 0)
    loan = data.get("loan_amount", 0)
    emi = data.get("existing_emi", 0)
    tenure = data.get("loan_tenure", 12)
    proposed_emi = loan / tenure if tenure > 0 else loan
    dti = ((emi + proposed_emi) / income * 100) if income > 0 else 100

    status = "approved" if is_eligible else "not approved"
    pct = round(probability * 100, 1)

    explanation = (
        f"Your loan application has been analyzed with a {pct}% approval probability. "
        f"The application is {status} based on key factors: "
        f"credit score of {credit}, monthly income of ${income:,.0f}, "
        f"requested loan of ${loan:,.0f} over {tenure} months, "
        f"and a debt-to-income ratio of {dti:.1f}%."
    )

    recommendations: List[str] = []
    if credit < 700:
        recommendations.append(f"Improve your credit score (currently {credit}) — aim for 700+ by paying bills on time and reducing credit utilization.")
    if dti > 40:
        recommendations.append(f"Reduce your debt-to-income ratio (currently {dti:.1f}%) — ideally below 40%. Consider paying off existing EMIs.")
    if income < 3000:
        recommendations.append("Increasing your monthly income through additional income sources would strengthen your application.")
    if not recommendations:
        recommendations.append("Maintain your excellent financial profile to keep loan eligibility high.")
    if not is_eligible:
        recommendations.append("Consider applying for a smaller loan amount or longer tenure to reduce monthly payments.")
        recommendations.append("Wait 6-12 months to improve credit score before reapplying.")

    return explanation, recommendations
