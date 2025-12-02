from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional
from pydantic import ConfigDict
from decimal import Decimal


class ApplicationCreate(BaseModel):
    contest_id: int
    user_id: int
    applicant_name: str = Field(min_length=1, max_length=255)
    group: Optional[str] = Field(default=None, max_length=100)
    email: EmailStr
    telegram_username: Optional[str] = Field(default=None, max_length=100, description="Telegram username без @")
    status: str = Field(default="pending", description="Статус: pending, approved, rejected, winner, participant")


class ApplicationUpdate(BaseModel):
    applicant_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    group: Optional[str] = Field(default=None, max_length=100)
    email: Optional[EmailStr] = None
    telegram_username: Optional[str] = Field(default=None, max_length=100, description="Telegram username без @")
    status: Optional[str] = Field(default=None, description="Статус: pending, approved, rejected, winner, participant")
    score: Optional[float] = Field(default=None, ge=0, le=100)


class ApplicationRead(BaseModel):
    id: int
    contest_id: int
    contest_title: str
    user_id: int
    user_login: str  # Логин пользователя
    applicant_name: str
    group: Optional[str]
    email: str
    telegram_username: Optional[str]
    status: str
    submission_date: datetime
    score: Optional[float]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

