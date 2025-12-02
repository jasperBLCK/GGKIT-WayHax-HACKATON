from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    auth_id = Column(Integer, ForeignKey("auth.id"), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    group = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    avatar = Column(String(500), nullable=True)
    education_type = Column(String(50), nullable=True)
    school_name = Column(String(255), nullable=True)
    class_name = Column(String(50), nullable=True)
    education_degree = Column(String(100), nullable=True)
    university_name = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    auth = relationship("Auth", backref="user_profile")

