from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func, Numeric
from sqlalchemy.orm import relationship
from app.database import Base


class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    contest_id = Column(Integer, ForeignKey("contests.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("auth.id"), nullable=False, index=True)
    applicant_name = Column(String(255), nullable=False)
    group = Column(String(100), nullable=True)
    email = Column(String(255), nullable=False)
    telegram_username = Column(String(100), nullable=True)
    status = Column(String(50), default="pending", nullable=False)
    submission_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    score = Column(Numeric(5, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    contest = relationship("Contest", backref="applications")
    user = relationship("Auth", backref="applications")

