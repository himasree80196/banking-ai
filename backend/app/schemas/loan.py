from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class LoanApplicationInput(BaseModel):
    age: int = Field(..., ge=18, le=80)
    gender: str = Field(..., pattern="^(Male|Female|Other)$")
    employment_status: str = Field(..., pattern="^(Employed|Self-Employed|Unemployed|Student|Retired)$")
    occupation: str
    monthly_income: float = Field(..., ge=0)
    existing_emi: float = Field(0.0, ge=0)
    loan_amount: float = Field(..., gt=0)
    loan_tenure: int = Field(..., ge=1, le=360)
    credit_score: int = Field(..., ge=300, le=900)
    marital_status: str = Field(..., pattern="^(Single|Married|Divorced|Widowed)$")
    dependents: int = Field(0, ge=0, le=10)
    education: str = Field(..., pattern="^(High School|Bachelor|Master|PhD|Diploma|Other)$")
    residential_status: str = Field(..., pattern="^(Owned|Rented|Mortgaged|Parental)$")


class LoanPredictionResult(BaseModel):
    id: int
    is_eligible: bool
    approval_probability: float
    risk_score: float
    explanation: str
    recommendations: List[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class LoanHistoryItem(BaseModel):
    id: int
    loan_amount: float
    loan_tenure: int
    credit_score: int
    monthly_income: float
    is_eligible: bool
    approval_probability: float
    risk_score: float
    created_at: datetime

    model_config = {"from_attributes": True}


class LoanHistoryResponse(BaseModel):
    predictions: List[LoanHistoryItem]
    total: int
    page: int
    page_size: int
