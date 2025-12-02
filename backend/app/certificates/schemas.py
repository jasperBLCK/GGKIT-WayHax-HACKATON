from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import ConfigDict


class CertificateCreate(BaseModel):
    contest_id: int
    application_id: int
    user_id: int
    recipient_name: str = Field(min_length=1, max_length=255)
    team_name: Optional[str] = Field(default=None, max_length=255)
    contest_title: str = Field(min_length=1, max_length=255)
    achievement: Optional[str] = Field(default=None, max_length=255)
    template_type: str = Field(default="auto", description="auto или custom")
    certificate_data: Optional[Dict[str, Any]] = Field(default=None, description="Кастомные данные для конструктора")


class CertificateUpdate(BaseModel):
    recipient_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    team_name: Optional[str] = Field(default=None, max_length=255)
    achievement: Optional[str] = Field(default=None, max_length=255)
    certificate_data: Optional[Dict[str, Any]] = None


class CertificateRead(BaseModel):
    id: int
    contest_id: int
    application_id: int
    user_id: int
    recipient_name: str
    team_name: Optional[str]
    contest_title: str
    achievement: Optional[str]
    template_type: str
    certificate_data: Optional[Dict[str, Any]]
    certificate_file: Optional[str]
    is_auto_generated: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AutoGenerateCertificatesRequest(BaseModel):
    contest_id: int
    top_n: Optional[int] = Field(default=3, description="Количество победителей (топ N)")


class CertificateTemplateData(BaseModel):
    title: str
    recipient_name: str
    team_name: Optional[str]
    contest_title: str
    achievement: Optional[str]
    date: str
    organizer_name: Optional[str]
    custom_text: Optional[str] = None
    template_style: Optional[str] = Field(default="elegant", description="Стиль шаблона")

