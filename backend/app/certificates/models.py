from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, func, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Certificate(Base):
    __tablename__ = "certificates"
    
    id = Column(Integer, primary_key=True, index=True)
    contest_id = Column(Integer, ForeignKey("contests.id"), nullable=False, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("auth.id"), nullable=False, index=True)
    
    # Данные для сертификата
    recipient_name = Column(String(255), nullable=False)  # Имя получателя
    team_name = Column(String(255), nullable=True)  # Название команды
    contest_title = Column(String(255), nullable=False)  # Название конкурса
    achievement = Column(String(255), nullable=True)  # Достижение (1 место, победитель и т.д.)
    
    # Дизайн сертификата
    template_type = Column(String(50), default="auto", nullable=False)  # auto или custom
    certificate_data = Column(JSON, nullable=True)  # Кастомные данные для конструктора
    
    # Файл сертификата
    certificate_file = Column(String(500), nullable=True)  # URL к файлу сертификата
    
    # Метаданные
    is_auto_generated = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    contest = relationship("Contest", backref="certificates")
    application = relationship("Application", backref="certificate")
    user = relationship("Auth", backref="certificates")

