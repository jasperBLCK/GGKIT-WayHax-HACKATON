from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, func, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Contest(Base):
    __tablename__ = "contests"
    
    id = Column(Integer, primary_key=True, index=True)
    organizer_id = Column(Integer, ForeignKey("auth.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    full_description = Column(Text, nullable=True)
    documents_and_tasks = Column(Text, nullable=True)
    type = Column(String(50), nullable=False)
    custom_tags = Column(JSON, nullable=True)  # Массив строк для хэштегов
    files = Column(JSON, nullable=True)  # Массив объектов {name: str, url: str, size: int}
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    image = Column(String(500), nullable=True)
    status = Column(String(50), default="open", nullable=False)
    participant_limit = Column(Integer, nullable=True)
    results_published = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    organizer = relationship("Auth", backref="contests")

