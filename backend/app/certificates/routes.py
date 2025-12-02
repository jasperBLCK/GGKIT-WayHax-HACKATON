from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from decimal import Decimal
from datetime import datetime
import uuid
from pathlib import Path
from pydantic import BaseModel

from app.database import get_db
from app.certificates.models import Certificate
from app.certificates.schemas import (
    CertificateCreate, CertificateUpdate, CertificateRead,
    AutoGenerateCertificatesRequest, CertificateTemplateData
)
from app.contests.models import Contest
from app.applications.models import Application
from app.auth.models import Auth
from app.users.models import User

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CERTIFICATES_DIR = BASE_DIR / "app" / "static" / "uploads" / "certificates"
CERTIFICATES_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/auto-generate", response_model=List[CertificateRead])
async def auto_generate_certificates(
    request: AutoGenerateCertificatesRequest,
    db: Session = Depends(get_db)
):
    """Автоматически определить победителей и сгенерировать сертификаты"""
    try:
        contest = db.query(Contest).filter(Contest.id == request.contest_id).first()
        
        if not contest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Конкурс не найден"
            )
        
        # Получаем все заявки с оценками, сортируем по убыванию
        applications = db.query(Application).filter(
            Application.contest_id == request.contest_id,
            Application.score.isnot(None)
        ).order_by(desc(Application.score)).limit(request.top_n).all()
        
        if not applications:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Нет заявок с оценками для генерации сертификатов"
            )
        
        certificates = []
        
        for index, app in enumerate(applications):
            # Определяем достижение
            position = index + 1
            achievement_map = {
                1: "1 место",
                2: "2 место",
                3: "3 место"
            }
            achievement = achievement_map.get(position, f"{position} место")
            
            # Получаем данные пользователя
            user = db.query(Auth).filter(Auth.id == app.user_id).first()
            user_login = user.login if user else "Неизвестно"
            
            # Проверяем, не существует ли уже сертификат
            existing_cert = db.query(Certificate).filter(
                Certificate.contest_id == request.contest_id,
                Certificate.application_id == app.id
            ).first()
            
            if existing_cert:
                # Обновляем существующий
                existing_cert.recipient_name = app.applicant_name
                existing_cert.team_name = app.group
                existing_cert.achievement = achievement
                certificates.append(existing_cert)
                continue
            
            # Создаем новый сертификат
            organizer = db.query(Auth).filter(Auth.id == contest.organizer_id).first()
            organizer_name = organizer.login if organizer else "Неизвестно"
            
            if organizer:
                user_profile = db.query(User).filter(User.auth_id == organizer.id).first()
                if user_profile and user_profile.name:
                    organizer_name = user_profile.name
                elif user_profile and user_profile.group:
                    organizer_name = user_profile.group
            
            certificate = Certificate(
                contest_id=request.contest_id,
                application_id=app.id,
                user_id=app.user_id,
                recipient_name=app.applicant_name,
                team_name=app.group,
                contest_title=contest.title,
                achievement=achievement,
                template_type="auto",
                is_auto_generated=True
            )
            
            db.add(certificate)
            certificates.append(certificate)
        
        db.commit()
        
        # Возвращаем данные сертификатов
        result = []
        for cert in certificates:
            db.refresh(cert)
            result.append(CertificateRead(
                id=cert.id,
                contest_id=cert.contest_id,
                application_id=cert.application_id,
                user_id=cert.user_id,
                recipient_name=cert.recipient_name,
                team_name=cert.team_name,
                contest_title=cert.contest_title,
                achievement=cert.achievement,
                template_type=cert.template_type,
                certificate_data=cert.certificate_data,
                certificate_file=cert.certificate_file,
                is_auto_generated=cert.is_auto_generated,
                created_at=cert.created_at
            ))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при генерации сертификатов: {str(e)}"
        )


@router.post("", response_model=CertificateRead, status_code=status.HTTP_201_CREATED)
async def create_certificate(
    certificate: CertificateCreate,
    db: Session = Depends(get_db)
):
    """Создать сертификат вручную (через конструктор)"""
    try:
        contest = db.query(Contest).filter(Contest.id == certificate.contest_id).first()
        if not contest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Конкурс не найден"
            )
        
        application = db.query(Application).filter(Application.id == certificate.application_id).first()
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Заявка не найдена"
            )
        
        new_certificate = Certificate(
            contest_id=certificate.contest_id,
            application_id=certificate.application_id,
            user_id=certificate.user_id,
            recipient_name=certificate.recipient_name,
            team_name=certificate.team_name,
            contest_title=certificate.contest_title,
            achievement=certificate.achievement,
            template_type=certificate.template_type,
            certificate_data=certificate.certificate_data,
            is_auto_generated=False
        )
        
        db.add(new_certificate)
        db.commit()
        db.refresh(new_certificate)
        
        return CertificateRead(
            id=new_certificate.id,
            contest_id=new_certificate.contest_id,
            application_id=new_certificate.application_id,
            user_id=new_certificate.user_id,
            recipient_name=new_certificate.recipient_name,
            team_name=new_certificate.team_name,
            contest_title=new_certificate.contest_title,
            achievement=new_certificate.achievement,
            template_type=new_certificate.template_type,
            certificate_data=new_certificate.certificate_data,
            certificate_file=new_certificate.certificate_file,
            is_auto_generated=new_certificate.is_auto_generated,
            created_at=new_certificate.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при создании сертификата: {str(e)}"
        )


@router.get("/contest/{contest_id}", response_model=List[CertificateRead])
async def get_contest_certificates(
    contest_id: int,
    db: Session = Depends(get_db)
):
    """Получить все сертификаты конкурса"""
    try:
        certificates = db.query(Certificate).filter(
            Certificate.contest_id == contest_id
        ).order_by(Certificate.created_at.desc()).all()
        
        return [
            CertificateRead(
                id=cert.id,
                contest_id=cert.contest_id,
                application_id=cert.application_id,
                user_id=cert.user_id,
                recipient_name=cert.recipient_name,
                team_name=cert.team_name,
                contest_title=cert.contest_title,
                achievement=cert.achievement,
                template_type=cert.template_type,
                certificate_data=cert.certificate_data,
                certificate_file=cert.certificate_file,
                is_auto_generated=cert.is_auto_generated,
                created_at=cert.created_at
            )
            for cert in certificates
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении сертификатов: {str(e)}"
        )


@router.get("/{certificate_id}", response_model=CertificateRead)
async def get_certificate(
    certificate_id: int,
    db: Session = Depends(get_db)
):
    """Получить сертификат по ID"""
    try:
        certificate = db.query(Certificate).filter(Certificate.id == certificate_id).first()
        
        if not certificate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Сертификат не найден"
            )
        
        return CertificateRead(
            id=certificate.id,
            contest_id=certificate.contest_id,
            application_id=certificate.application_id,
            user_id=certificate.user_id,
            recipient_name=certificate.recipient_name,
            team_name=certificate.team_name,
            contest_title=certificate.contest_title,
            achievement=certificate.achievement,
            template_type=certificate.template_type,
            certificate_data=certificate.certificate_data,
            certificate_file=certificate.certificate_file,
            is_auto_generated=certificate.is_auto_generated,
            created_at=certificate.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении сертификата: {str(e)}"
        )


class ImageDataRequest(BaseModel):
    image_data: str

@router.post("/{certificate_id}/save-image", response_model=CertificateRead)
async def save_certificate_image(
    certificate_id: int,
    request: ImageDataRequest,
    db: Session = Depends(get_db)
):
    """Сохранить сгенерированное изображение сертификата"""
    try:
        certificate = db.query(Certificate).filter(Certificate.id == certificate_id).first()
        
        if not certificate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Сертификат не найден"
            )
        
        # Сохраняем base64 изображение (можно конвертировать в файл позже)
        import base64
        
        image_data = request.image_data
        
        # Пропускаем префикс data:image/png;base64,
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        unique_filename = f"{uuid.uuid4()}.png"
        file_path = CERTIFICATES_DIR / unique_filename
        
        with open(file_path, "wb") as f:
            f.write(image_bytes)
        
        certificate.certificate_file = f"/static/uploads/certificates/{unique_filename}"
        
        db.commit()
        db.refresh(certificate)
        
        return CertificateRead(
            id=certificate.id,
            contest_id=certificate.contest_id,
            application_id=certificate.application_id,
            user_id=certificate.user_id,
            recipient_name=certificate.recipient_name,
            team_name=certificate.team_name,
            contest_title=certificate.contest_title,
            achievement=certificate.achievement,
            template_type=certificate.template_type,
            certificate_data=certificate.certificate_data,
            certificate_file=certificate.certificate_file,
            is_auto_generated=certificate.is_auto_generated,
            created_at=certificate.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при сохранении изображения: {str(e)}"
        )

