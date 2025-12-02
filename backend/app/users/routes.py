from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import Optional
import shutil
import uuid
from pathlib import Path

from app.database import get_db
from app.users.models import User
from app.users.schemas import UserCreate, UserUpdate, UserRead, UserProfileRead
from app.auth.models import Auth

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BASE_DIR / "app" / "static" / "uploads" / "avatars"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.get("/me", response_model=UserProfileRead)
async def get_current_user_profile(user_id: int = Query(..., description="ID пользователя из таблицы auth"), db: Session = Depends(get_db)):
    """Получить полный профиль текущего пользователя"""
    auth_user = db.query(Auth).filter(Auth.id == user_id).first()
    
    if not auth_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    user_profile = db.query(User).filter(User.auth_id == user_id).first()
    
    if not user_profile:
        user_profile = User(
            auth_id=user_id,
            name=None,
            phone=None,
            group=None,
            bio=None,
            avatar=None
        )
        db.add(user_profile)
        db.commit()
        db.refresh(user_profile)
    
    return UserProfileRead(
        id=user_profile.id,
        auth_id=user_profile.auth_id,
        login=auth_user.login,
        email=auth_user.email,
        role=auth_user.role,
        name=user_profile.name,
        phone=user_profile.phone,
        group=user_profile.group,
        bio=user_profile.bio,
        avatar=user_profile.avatar,
        education_type=user_profile.education_type,
        school_name=user_profile.school_name,
        class_name=user_profile.class_name,
        education_degree=user_profile.education_degree,
        university_name=user_profile.university_name,
        created_at=user_profile.created_at,
        updated_at=user_profile.updated_at
    )


@router.put("/me", response_model=UserRead)
async def update_current_user_profile(
    user_update: UserUpdate,
    user_id: int = Query(..., description="ID пользователя из таблицы auth"),
    db: Session = Depends(get_db)
):
    """Обновить профиль текущего пользователя"""
    try:
        auth_user = db.query(Auth).filter(Auth.id == user_id).first()
        if not auth_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        
        user_profile = db.query(User).filter(User.auth_id == user_id).first()
        
        if not user_profile:
            user_profile = User(auth_id=user_id)
            db.add(user_profile)
        
        update_data = user_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if isinstance(value, str) and value.strip() == '':
                value = None
            setattr(user_profile, field, value)
        
        db.commit()
        db.refresh(user_profile)
        
        return user_profile
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при обновлении профиля: {str(e)}"
        )


@router.post("/avatar", response_model=UserRead)
async def upload_avatar(
    file: UploadFile = File(...),
    user_id: int = Query(..., description="ID пользователя из таблицы auth"),
    db: Session = Depends(get_db)
):
    """Загрузить аватар пользователя"""
    auth_user = db.query(Auth).filter(Auth.id == user_id).first()
    if not auth_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл должен быть изображением"
        )
    
    file_extension = Path(file.filename).suffix if file.filename else '.jpg'
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при сохранении файла: {str(e)}"
        )
    
    avatar_url = f"/static/uploads/avatars/{unique_filename}"
    
    user_profile = db.query(User).filter(User.auth_id == user_id).first()
    
    if not user_profile:
        user_profile = User(auth_id=user_id, avatar=avatar_url)
        db.add(user_profile)
    else:
        if user_profile.avatar:
            old_filename = user_profile.avatar.split("/")[-1]
            old_file_path = UPLOAD_DIR / old_filename
            if old_file_path.exists():
                try:
                    old_file_path.unlink()
                except Exception:
                    pass  # Игнорируем ошибки удаления старого файла
        
        user_profile.avatar = avatar_url
    
    db.commit()
    db.refresh(user_profile)
    
    return user_profile


@router.get("/{user_id}", response_model=UserRead)
async def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    """Получить профиль пользователя по ID профиля"""
    user_profile = db.query(User).filter(User.id == user_id).first()
    
    if not user_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Профиль пользователя не найден"
        )
    
    return user_profile


@router.get("/by-auth/{auth_id}", response_model=UserRead)
async def get_user_profile_by_auth_id(auth_id: int, db: Session = Depends(get_db)):
    """Получить профиль пользователя по auth_id"""
    user_profile = db.query(User).filter(User.auth_id == auth_id).first()
    
    if not user_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Профиль пользователя не найден"
        )
    
    return user_profile

