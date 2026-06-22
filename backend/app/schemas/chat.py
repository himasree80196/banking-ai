from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class ChatMessageCreate(BaseModel):
    content: str
    session_id: Optional[int] = None


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    tokens_used: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionResponse(BaseModel):
    id: int
    title: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = []

    model_config = {"from_attributes": True}


class ChatSessionList(BaseModel):
    id: int
    title: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    model_config = {"from_attributes": True}


class ChatResponse(BaseModel):
    session_id: int
    message: ChatMessageResponse
    reply: ChatMessageResponse
