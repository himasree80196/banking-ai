from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.database import get_db
from app.models.user import User
from app.models.loan import LoanPrediction
from app.schemas.loan import LoanApplicationInput, LoanPredictionResult, LoanHistoryResponse, LoanHistoryItem
from app.utils.security import get_current_user
from app.services.loan_service import predict_loan_eligibility

router = APIRouter()


@router.post("/predict", response_model=LoanPredictionResult)
async def predict_loan(
    data: LoanApplicationInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = predict_loan_eligibility(data.model_dump())
    prediction = LoanPrediction(
        user_id=current_user.id,
        **data.model_dump(),
        is_eligible=result["is_eligible"],
        approval_probability=result["approval_probability"],
        risk_score=result["risk_score"],
        explanation=result["explanation"],
        recommendations="\n".join(result["recommendations"]),
    )
    db.add(prediction)
    await db.commit()
    await db.refresh(prediction)
    return LoanPredictionResult(
        id=prediction.id,
        is_eligible=prediction.is_eligible,
        approval_probability=prediction.approval_probability,
        risk_score=prediction.risk_score,
        explanation=prediction.explanation,
        recommendations=result["recommendations"],
        created_at=prediction.created_at,
    )


@router.get("/history", response_model=LoanHistoryResponse)
async def get_loan_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    eligible_only: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(LoanPrediction).where(LoanPrediction.user_id == current_user.id)
    if eligible_only is not None:
        query = query.where(LoanPrediction.is_eligible == eligible_only)

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar() or 0

    query = query.order_by(desc(LoanPrediction.created_at)).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    predictions = result.scalars().all()

    return LoanHistoryResponse(
        predictions=[LoanHistoryItem.model_validate(p) for p in predictions],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/history/{prediction_id}", response_model=LoanPredictionResult)
async def get_prediction_detail(
    prediction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from fastapi import HTTPException
    result = await db.execute(
        select(LoanPrediction).where(
            LoanPrediction.id == prediction_id,
            LoanPrediction.user_id == current_user.id
        )
    )
    prediction = result.scalar_one_or_none()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return LoanPredictionResult(
        id=prediction.id,
        is_eligible=prediction.is_eligible,
        approval_probability=prediction.approval_probability,
        risk_score=prediction.risk_score,
        explanation=prediction.explanation,
        recommendations=prediction.recommendations.split("\n") if prediction.recommendations else [],
        created_at=prediction.created_at,
    )
