from pydantic import BaseModel, EmailStr, Field, model_validator
from datetime import datetime
from pydantic import ConfigDict

class AuthCreate(BaseModel):
    login: str = Field(min_length=3, max_length=25)
    role: str
    email: EmailStr = Field(max_length=100)
    password: str = Field(min_length=8, max_length=128, strip_whitespace=True)

class AuthRead(BaseModel):
    id: int
    login: str
    email: str
    role: str 
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AuthLogin(BaseModel):
    login: str | None = Field(default=None, min_length=3, max_length=25)
    email: EmailStr | None = Field(default=None, max_length=100)
    password: str = Field(min_length=8, max_length=128, strip_whitespace=True)
    role: str = Field(description="Роль пользователя: 'Студент', 'Организатор' или 'Администратор'")
    
    @model_validator(mode='after')
    def check_login_or_email(self):
        if not self.login and not self.email:
            raise ValueError('Необходимо указать логин или email')
        return self


class AuthRoleUpdate(BaseModel):
    role: str = Field(description="Роль пользователя: 'Студент', 'Организатор' или 'Администратор'")


class AuthWithProfile(AuthRead):
    """Пользователь с дополнительной информацией для админ-панели"""
    name: str | None = None
    is_active: bool = True


class StatsResponse(BaseModel):
    total_users: int
    total_contests: int
    total_applications: int
    active_applications: int
    users_by_role: dict[str, int]