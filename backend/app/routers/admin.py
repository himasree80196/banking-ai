from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.database import get_db
from app.models.user import User, UserRole
from app.models.chat import ChatSession, ChatMessage
from app.models.loan import LoanPrediction
from app.models.audit import AuditLog
from app.schemas.user import UserResponse, UserListResponse
from app.utils.security import get_current_admin

router = APIRouter()


@router.get("/stats")
async def get_stats(
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    active_users = (await db.execute(select(func.count(User.id)).where(User.is_active == True))).scalar()
    total_loans = (await db.execute(select(func.count(LoanPrediction.id)))).scalar()
    approved_loans = (await db.execute(select(func.count(LoanPrediction.id)).where(LoanPrediction.is_eligible == True))).scalar()
    total_chats = (await db.execute(select(func.count(ChatMessage.id)))).scalar()
    total_sessions = (await db.execute(select(func.count(ChatSession.id)))).scalar()

    return {
        "users": {"total": total_users, "active": active_users},
        "loans": {"total": total_loans, "approved": approved_loans, "rejected": total_loans - approved_loans},
        "chat": {"total_messages": total_chats, "total_sessions": total_sessions},
    }


@router.get("/users", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(select(func.count(User.id)))).scalar()
    result = await db.execute(select(User).offset((page - 1) * page_size).limit(page_size).order_by(desc(User.created_at)))
    users = result.scalars().all()
    return UserListResponse(users=[UserResponse.model_validate(u) for u in users], total=total, page=page, page_size=page_size)


@router.put("/users/{user_id}/toggle-active", response_model=UserResponse)
async def toggle_user_active(
    user_id: int,
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    from fastapi import HTTPException
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/loans")
async def list_all_loans(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(select(func.count(LoanPrediction.id)))).scalar()
    result = await db.execute(
        select(LoanPrediction).offset((page - 1) * page_size).limit(page_size).order_by(desc(LoanPrediction.created_at))
    )
    loans = result.scalars().all()
    return {
        "predictions": [{"id": l.id, "user_id": l.user_id, "loan_amount": l.loan_amount, "is_eligible": l.is_eligible, "approval_probability": l.approval_probability, "credit_score": l.credit_score, "created_at": l.created_at} for l in loans],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/audit-logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(select(func.count(AuditLog.id)))).scalar()
    result = await db.execute(
        select(AuditLog).offset((page - 1) * page_size).limit(page_size).order_by(desc(AuditLog.created_at))
    )
    logs = result.scalars().all()
    return {
        "logs": [{"id": l.id, "user_id": l.user_id, "action": l.action, "resource": l.resource, "ip_address": l.ip_address, "status_code": l.status_code, "created_at": l.created_at} for l in logs],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
