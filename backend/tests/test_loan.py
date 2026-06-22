"""Tests for loan prediction."""
import pytest
from app.services.loan_service import predict_loan_eligibility


def test_eligible_loan():
    data = {
        "age": 30, "gender": "Male", "employment_status": "Employed",
        "occupation": "Engineer", "monthly_income": 8000, "existing_emi": 500,
        "loan_amount": 40000, "loan_tenure": 60, "credit_score": 780,
        "marital_status": "Single", "dependents": 0, "education": "Bachelor",
        "residential_status": "Rented",
    }
    result = predict_loan_eligibility(data)
    assert result["is_eligible"] is True
    assert result["approval_probability"] > 0.5
    assert 0 <= result["risk_score"] <= 100
    assert isinstance(result["recommendations"], list)


def test_ineligible_loan():
    data = {
        "age": 25, "gender": "Female", "employment_status": "Unemployed",
        "occupation": "Student", "monthly_income": 500, "existing_emi": 300,
        "loan_amount": 100000, "loan_tenure": 12, "credit_score": 400,
        "marital_status": "Single", "dependents": 0, "education": "High School",
        "residential_status": "Rented",
    }
    result = predict_loan_eligibility(data)
    assert result["is_eligible"] is False
    assert result["approval_probability"] < 0.5
