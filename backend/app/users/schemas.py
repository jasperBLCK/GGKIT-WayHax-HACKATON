from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
from pydantic import ConfigDict


class UserCreate(BaseModel):
    auth_id: int
    name: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)
    group: Optional[str] = Field(default=None, max_length=255)
    bio: Optional[str] = Field(default=None)


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)
    group: Optional[str] = Field(default=None, max_length=255)  # Для обратной совместимости
    bio: Optional[str] = Field(default=None)
    avatar: Optional[str] = Field(default=None, max_length=500)
    education_type: Optional[str] = Field(default=None, max_length=50)  # 'school' или 'university'
    school_name: Optional[str] = Field(default=None, max_length=255)
    class_name: Optional[str] = Field(default=None, max_length=50)
    education_degree: Optional[str] = Field(default=None, max_length=100)
    university_name: Optional[str] = Field(default=None, max_length=255)


class UserRead(BaseModel):
    id: int
    auth_id: int
    name: Optional[str]
    phone: Optional[str]
    group: Optional[str]
    bio: Optional[str]
    avatar: Optional[str]
    education_type: Optional[str]
    school_name: Optional[str]
    class_name: Optional[str]
    education_degree: Optional[str]
    university_name: Optional[str]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class UserProfileRead(BaseModel):
    """Полная информация о пользователе с данными из Auth"""
    id: int
    auth_id: int
    login: str
    email: str
    role: str
    name: Optional[str]
    phone: Optional[str]
    group: Optional[str]
    bio: Optional[str]
    avatar: Optional[str]
    education_type: Optional[str]
    school_name: Optional[str]
    class_name: Optional[str]
    education_degree: Optional[str]
    university_name: Optional[str]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

