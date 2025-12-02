from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import ConfigDict


class ContestCreate(BaseModel):
    organizer_id: int
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=10)
    full_description: Optional[str] = None
    documents_and_tasks: Optional[str] = None  # Текст с документами и заданиями
    type: str = Field(description="Тип конкурса: olympiad, creative, sport, hackathon")
    custom_tags: Optional[List[str]] = Field(default=None, description="Дополнительные хэштеги")
    start_date: datetime
    end_date: datetime
    image: Optional[str] = Field(default=None, max_length=500)
    status: str = Field(default="open", description="Статус: open, closed, judging, completed")
    participant_limit: Optional[int] = Field(default=None, ge=1)
    results_published: bool = Field(default=False)


class ContestUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=255)
    description: Optional[str] = Field(default=None, min_length=10)
    full_description: Optional[str] = None
    documents_and_tasks: Optional[str] = None  # Текст с документами и заданиями
    type: Optional[str] = Field(default=None, description="Тип конкурса: olympiad, creative, sport, hackathon")
    custom_tags: Optional[List[str]] = Field(default=None, description="Дополнительные хэштеги")
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    image: Optional[str] = Field(default=None, max_length=500)
    status: Optional[str] = Field(default=None, description="Статус: open, closed, judging, completed")
    participant_limit: Optional[int] = Field(default=None, ge=1)
    results_published: Optional[bool] = None


class ContestRead(BaseModel):
    id: int
    organizer_id: int
    organizer_name: str
    title: str
    description: str
    full_description: Optional[str]
    documents_and_tasks: Optional[str]
    type: str
    custom_tags: Optional[List[str]]
    files: Optional[List[Dict[str, Any]]] = Field(default=None, description="Список файлов: [{name: str, url: str, size: int}]")
    start_date: datetime
    end_date: datetime
    image: Optional[str]
    status: str
    participant_limit: Optional[int]
    results_published: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

