from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import ChatMessageCreate, ChatSessionResponse, ChatResponse, ChatSessionList
from app.utils.security import get_current_user
from app.services.ai_service import get_ai_response

router = APIRouter()


@router.get("/sessions", response_model=List[ChatSessionList])
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.user_id == current_user.id,
            ChatSession.is_active == True
        ).order_by(ChatSession.updated_at.desc())
    )
    sessions = result.scalars().all()
    session_list = []
    for s in sessions:
        msg_count_result = await db.execute(
            select(func.count(ChatMessage.id)).where(ChatMessage.session_id == s.id)
        )
        count = msg_count_result.scalar() or 0
        session_list.append(ChatSessionList(
            id=s.id, title=s.title, is_active=s.is_active,
            created_at=s.created_at, updated_at=s.updated_at, message_count=count
        ))
    return session_list


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    msgs = await db.execute(select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at))
    session.messages = msgs.scalars().all()
    return session


@router.post("/send", response_model=ChatResponse)
async def send_message(
    data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.session_id:
        result = await db.execute(
            select(ChatSession).where(ChatSession.id == data.session_id, ChatSession.user_id == current_user.id)
        )
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
    else:
        title = data.content[:50] + "..." if len(data.content) > 50 else data.content
        session = ChatSession(user_id=current_user.id, title=title)
        db.add(session)
        await db.flush()

    user_msg = ChatMessage(session_id=session.id, role="user", content=data.content)
    db.add(user_msg)
    await db.flush()

    history_result = await db.execute(
        select(ChatMessage).where(ChatMessage.session_id == session.id).order_by(ChatMessage.created_at).limit(20)
    )
    history = [{"role": m.role, "content": m.content} for m in history_result.scalars().all()]

    ai_text, tokens = await get_ai_response(history, data.content)

    ai_msg = ChatMessage(session_id=session.id, role="assistant", content=ai_text, tokens_used=tokens)
    db.add(ai_msg)
    await db.commit()
    await db.refresh(user_msg)
    await db.refresh(ai_msg)

    return ChatResponse(session_id=session.id, message=user_msg, reply=ai_msg)


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.is_active = False
    await db.commit()
    return {"message": "Session deleted"}
