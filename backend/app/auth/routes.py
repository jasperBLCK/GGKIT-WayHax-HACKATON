from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.models import Auth
from app.auth.schemas import AuthCreate, AuthRead, AuthLogin, AuthRoleUpdate, AuthWithProfile, StatsResponse
from app.auth.hash import hash_password, verify_password
from typing import List

router = APIRouter()


@router.post("/register", response_model=AuthRead, status_code=status.HTTP_201_CREATED)
async def register(auth_data: AuthCreate, db: Session = Depends(get_db)):
    """Регистрация нового пользователя"""
    if auth_data.role not in ["Студент", "Организатор", "Администратор"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Роль должна быть 'Студент', 'Организатор' или 'Администратор'"
        )
    
    existing_user = db.query(Auth).filter(Auth.login == auth_data.login).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким логином уже существует"
        )
    
    existing_email = db.query(Auth).filter(Auth.email == auth_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )
    
    hashed_password = hash_password(auth_data.password)
    new_user = Auth(
        login=auth_data.login,
        email=auth_data.email,
        password_hash=hashed_password,
        role=auth_data.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=AuthRead)
async def login(auth_data: AuthLogin, db: Session = Depends(get_db)):
    """Авторизация пользователя"""
    if not auth_data.login and not auth_data.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо указать логин или email"
        )
    
    if not auth_data.role or auth_data.role not in ["Студент", "Организатор", "Администратор"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Роль должна быть 'Студент', 'Организатор' или 'Администратор'"
        )
    
    query = db.query(Auth).filter(Auth.role == auth_data.role)
    
    if auth_data.login and auth_data.email:
        user = query.filter(
            (Auth.login == auth_data.login) | (Auth.email == auth_data.email)
        ).first()
    elif auth_data.login:
        user = query.filter(Auth.login == auth_data.login).first()
    else:
        user = query.filter(Auth.email == auth_data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин/email, пароль или роль"
        )
    
    if not verify_password(auth_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин/email или пароль"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Аккаунт деактивирован"
        )
    
    return user



@router.get("/me", response_model=AuthRead)
async def get_current_user(user_id: int, db: Session = Depends(get_db)):
    """Получить информацию о текущем пользователе"""
    user = db.query(Auth).filter(Auth.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    return user


@router.get("/users", response_model=List[AuthWithProfile])
async def get_all_users(db: Session = Depends(get_db)):
    """Получить всех пользователей (для админ-панели)"""
    users = db.query(Auth).order_by(Auth.created_at.desc()).all()
    
    result = []
    from app.users.models import User
    for user in users:
        user_profile = db.query(User).filter(User.auth_id == user.id).first()
        result.append(AuthWithProfile(
            id=user.id,
            login=user.login,
            email=user.email,
            role=user.role,
            created_at=user.created_at,
            name=user_profile.name if user_profile else None,
            is_active=user.is_active
        ))
    
    return result


@router.put("/users/{user_id}/role", response_model=AuthRead)
async def update_user_role(user_id: int, role_update: AuthRoleUpdate, db: Session = Depends(get_db)):
    """Обновить роль пользователя (только для админов)"""
    user = db.query(Auth).filter(Auth.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    if role_update.role not in ["Студент", "Организатор", "Администратор"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Роль должна быть 'Студент', 'Организатор' или 'Администратор'"
        )
    
    user.role = role_update.role
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Удалить пользователя (только для админов)"""
    user = db.query(Auth).filter(Auth.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    from app.users.models import User
    from app.applications.models import Application
    
    user_profile = db.query(User).filter(User.auth_id == user_id).first()
    if user_profile:
        db.delete(user_profile)
    
    applications = db.query(Application).filter(Application.user_id == user_id).all()
    for app in applications:
        db.delete(app)
    
    from app.contests.models import Contest
    if user.role == "Организатор":
        contests = db.query(Contest).filter(Contest.organizer_id == user_id).all()
        for contest in contests:
            contest_apps = db.query(Application).filter(Application.contest_id == contest.id).all()
            for app in contest_apps:
                db.delete(app)
            db.delete(contest)
    
    db.delete(user)
    db.commit()
    
    return None


@router.put("/users/{user_id}/activate", response_model=AuthRead)
async def toggle_user_active(user_id: int, db: Session = Depends(get_db)):
    """Активировать/деактивировать пользователя"""
    user = db.query(Auth).filter(Auth.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    
    return user


@router.get("/stats", response_model=StatsResponse)
async def get_stats(db: Session = Depends(get_db)):
    """Получить статистику для админ-панели"""
    from app.contests.models import Contest
    from app.applications.models import Application
    
    total_users = db.query(Auth).count()
    total_contests = db.query(Contest).count()
    total_applications = db.query(Application).count()
    active_applications = db.query(Application).filter(Application.status.in_(["pending", "approved", "participant", "winner"])).count()
    
    students_count = db.query(Auth).filter(Auth.role == "Студент").count()
    organizers_count = db.query(Auth).filter(Auth.role == "Организатор").count()
    admins_count = db.query(Auth).filter(Auth.role == "Администратор").count()
    
    return StatsResponse(
        total_users=total_users,
        total_contests=total_contests,
        total_applications=total_applications,
        active_applications=active_applications,
        users_by_role={
            "Студент": students_count,
            "Организатор": organizers_count,
            "Администратор": admins_count
        }
    )

