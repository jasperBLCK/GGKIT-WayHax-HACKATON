from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal

from app.database import get_db
from app.applications.models import Application
from app.applications.schemas import ApplicationCreate, ApplicationUpdate, ApplicationRead
from app.contests.models import Contest
from app.auth.models import Auth

router = APIRouter()


@router.post("", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
async def create_application(
    application: ApplicationCreate,
    db: Session = Depends(get_db)
):
    """Создать новую заявку на участие в конкурсе"""
    try:
        contest = db.query(Contest).filter(Contest.id == application.contest_id).first()
        if not contest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Конкурс не найден"
            )
        
        user = db.query(Auth).filter(Auth.id == application.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        
        existing_application = db.query(Application).filter(
            Application.contest_id == application.contest_id,
            Application.user_id == application.user_id
        ).first()
        
        if existing_application:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Вы уже подали заявку на этот конкурс"
            )
        
        valid_statuses = ["pending", "approved", "rejected", "winner", "participant"]
        if application.status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Статус должен быть одним из: {', '.join(valid_statuses)}"
            )
        
        new_application = Application(
            contest_id=application.contest_id,
            user_id=application.user_id,
            applicant_name=application.applicant_name,
            group=application.group,
            email=application.email,
            telegram_username=application.telegram_username,
            status=application.status
        )
        
        db.add(new_application)
        db.commit()
        db.refresh(new_application)
        
        return ApplicationRead(
            id=new_application.id,
            contest_id=new_application.contest_id,
            contest_title=contest.title,
            user_id=new_application.user_id,
            user_login=user.login,
            applicant_name=new_application.applicant_name,
            group=new_application.group,
            email=new_application.email,
            telegram_username=new_application.telegram_username,
            status=new_application.status,
            submission_date=new_application.submission_date,
            score=float(new_application.score) if new_application.score else None,
            created_at=new_application.created_at,
            updated_at=new_application.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        error_detail = traceback.format_exc()
        print(f"Ошибка при создании заявки: {str(e)}")
        print(f"Traceback: {error_detail}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при создании заявки: {str(e)}"
        )


@router.get("/user/{user_id}", response_model=List[ApplicationRead])
async def get_user_applications(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Получить все заявки пользователя"""
    try:
        user = db.query(Auth).filter(Auth.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        
        applications = db.query(Application).filter(
            Application.user_id == user_id
        ).order_by(Application.created_at.desc()).all()
        
        result = []
        for app in applications:
            contest = db.query(Contest).filter(Contest.id == app.contest_id).first()
            contest_title = contest.title if contest else "Неизвестный конкурс"
            
            app_user = db.query(Auth).filter(Auth.id == app.user_id).first()
            user_login = app_user.login if app_user else "Неизвестно"
            
            result.append(ApplicationRead(
                id=app.id,
                contest_id=app.contest_id,
                contest_title=contest_title,
                user_id=app.user_id,
                user_login=user_login,
                applicant_name=app.applicant_name,
                group=app.group,
                email=app.email,
                telegram_username=app.telegram_username,
                status=app.status,
                submission_date=app.submission_date,
                score=float(app.score) if app.score else None,
                created_at=app.created_at,
                updated_at=app.updated_at
            ))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"Ошибка при получении заявок пользователя: {str(e)}")
        print(f"Traceback: {error_detail}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении заявок пользователя: {str(e)}"
        )


@router.get("/contest/{contest_id}", response_model=List[ApplicationRead])
async def get_contest_applications(
    contest_id: int,
    db: Session = Depends(get_db)
):
    """Получить все заявки на конкурс"""
    try:
        contest = db.query(Contest).filter(Contest.id == contest_id).first()
        if not contest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Конкурс не найден"
            )
        
        applications = db.query(Application).filter(
            Application.contest_id == contest_id
        ).order_by(Application.created_at.desc()).all()
        
        result = []
        for app in applications:
            app_user = db.query(Auth).filter(Auth.id == app.user_id).first()
            user_login = app_user.login if app_user else "Неизвестно"
            
            result.append(ApplicationRead(
                id=app.id,
                contest_id=app.contest_id,
                contest_title=contest.title,
                user_id=app.user_id,
                user_login=user_login,
                applicant_name=app.applicant_name,
                group=app.group,
                email=app.email,
                telegram_username=app.telegram_username,
                status=app.status,
                submission_date=app.submission_date,
                score=float(app.score) if app.score else None,
                created_at=app.created_at,
                updated_at=app.updated_at
            ))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"Ошибка при получении заявок на конкурс: {str(e)}")
        print(f"Traceback: {error_detail}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении заявок на конкурс: {str(e)}"
        )


@router.put("/{application_id}", response_model=ApplicationRead)
async def update_application(
    application_id: int,
    application_update: ApplicationUpdate,
    db: Session = Depends(get_db)
):
    """Обновить заявку (только организатор)"""
    try:
        application = db.query(Application).filter(Application.id == application_id).first()
        
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Заявка не найдена"
            )
        
        update_data = application_update.model_dump(exclude_unset=True)
        
        if "status" in update_data:
            valid_statuses = ["pending", "approved", "rejected", "winner", "participant"]
            if update_data["status"] not in valid_statuses:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Статус должен быть одним из: {', '.join(valid_statuses)}"
                )
        
        for field, value in update_data.items():
            if field == "score" and value is not None:
                setattr(application, field, Decimal(str(value)))
            else:
                setattr(application, field, value)
        
        db.commit()
        db.refresh(application)
        
        contest = db.query(Contest).filter(Contest.id == application.contest_id).first()
        contest_title = contest.title if contest else "Неизвестный конкурс"
        
        app_user = db.query(Auth).filter(Auth.id == application.user_id).first()
        user_login = app_user.login if app_user else "Неизвестно"
        
        return ApplicationRead(
            id=application.id,
            contest_id=application.contest_id,
            contest_title=contest_title,
            user_id=application.user_id,
            user_login=user_login,
            applicant_name=application.applicant_name,
            group=application.group,
            email=application.email,
            telegram_username=application.telegram_username,
            status=application.status,
            submission_date=application.submission_date,
            score=float(application.score) if application.score else None,
            created_at=application.created_at,
            updated_at=application.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        error_detail = traceback.format_exc()
        print(f"Ошибка при обновлении заявки: {str(e)}")
        print(f"Traceback: {error_detail}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при обновлении заявки: {str(e)}"
        )


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: int,
    db: Session = Depends(get_db)
):
    """Удалить заявку"""
    try:
        application = db.query(Application).filter(Application.id == application_id).first()
        
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Заявка не найдена"
            )
        
        db.delete(application)
        db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        error_detail = traceback.format_exc()
        print(f"Ошибка при удалении заявки: {str(e)}")
        print(f"Traceback: {error_detail}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при удалении заявки: {str(e)}"
        )

