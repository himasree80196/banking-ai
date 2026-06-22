from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, ForeignKey, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class LoanPrediction(Base):
    __tablename__ = "loan_predictions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Input features
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    employment_status: Mapped[str] = mapped_column(String(50), nullable=False)
    occupation: Mapped[str] = mapped_column(String(100), nullable=False)
    monthly_income: Mapped[float] = mapped_column(Float, nullable=False)
    existing_emi: Mapped[float] = mapped_column(Float, default=0.0)
    loan_amount: Mapped[float] = mapped_column(Float, nullable=False)
    loan_tenure: Mapped[int] = mapped_column(Integer, nullable=False)
    credit_score: Mapped[int] = mapped_column(Integer, nullable=False)
    marital_status: Mapped[str] = mapped_column(String(30), nullable=False)
    dependents: Mapped[int] = mapped_column(Integer, default=0)
    education: Mapped[str] = mapped_column(String(50), nullable=False)
    residential_status: Mapped[str] = mapped_column(String(50), nullable=False)

    # Prediction results
    is_eligible: Mapped[bool] = mapped_column(Boolean, nullable=False)
    approval_probability: Mapped[float] = mapped_column(Float, nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=True)
    recommendations: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="loan_predictions")
