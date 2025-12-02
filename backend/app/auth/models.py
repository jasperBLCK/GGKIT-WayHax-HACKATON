from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.database import Base 

class Auth(Base):
    __tablename__ = "auth"   
    id = Column(Integer, primary_key=True, index=True)
    login = Column(String(50), unique=True, nullable=False, index=True)
    role = Column(String(50), default="Студент", nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)