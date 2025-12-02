from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi import UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from datetime import datetime
import shutil
import uuid
from pathlib import Path

from app.database import get_db
from app.contests.models import Contest
from app.contests.schemas import ContestCreate, ContestUpdate, ContestRead
from app.auth.models import Auth

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CONTESTS_IMAGES_DIR = BASE_DIR / "app" / "static" / "uploads" / "contests"
CONTESTS_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
CONTESTS_FILES_DIR = BASE_DIR / "app" / "static" / "uploads" / "contests" / "files"
CONTESTS_FILES_DIR.mkdir(parents=True, exist_ok=True)


@router.post("", response_model=ContestRead, status_code=status.HTTP_201_CREATED)
async def create_contest(
    contest: ContestCreate,
    db: Session = Depends(get_db)
):
    """Создать новый конкурс"""
    try:
        organizer = db.query(Auth).filter(Auth.id == contest.organizer_id).first()
        if not organizer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Организатор не найден"
            )
        
        if organizer.role != "Организатор":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Только организаторы могут создавать конкурсы"
            )
        
        if contest.start_date >= contest.end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Дата окончания должна быть позже даты начала"
            )
        
        valid_types = ["olympiad", "creative", "sport", "hackathon"]
        if contest.type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Тип конкурса должен быть одним из: {', '.join(valid_types)}"
            )
        
        valid_statuses = ["open", "closed", "judging", "completed"]
        if contest.status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Статус должен быть одним из: {', '.join(valid_statuses)}"
            )
        
        new_contest = Contest(
            organizer_id=contest.organizer_id,
            title=contest.title,
            description=contest.description,
            full_description=contest.full_description,
            documents_and_tasks=contest.documents_and_tasks,
            type=contest.type,
            custom_tags=contest.custom_tags,
            files=[],
            start_date=contest.start_date,
            end_date=contest.end_date,
            image=contest.image,
            status=contest.status,
            participant_limit=contest.participant_limit,
            results_published=contest.results_published
        )
        
        db.add(new_contest)
        db.commit()
        db.refresh(new_contest)
        
        organizer_name = organizer.login
        from app.users.models import User
        user_profile = db.query(User).filter(User.auth_id == organizer.id).first()
        if user_profile and user_profile.name:
            organizer_name = user_profile.name
        elif user_profile and user_profile.group:
            organizer_name = user_profile.group
        
        return ContestRead(
            id=new_contest.id,
            organizer_id=new_contest.organizer_id,
            organizer_name=organizer_name,
            title=new_contest.title,
            description=new_contest.description,
            full_description=new_contest.full_description,
            documents_and_tasks=new_contest.documents_and_tasks,
            type=new_contest.type,
            custom_tags=new_contest.custom_tags,
            start_date=new_contest.start_date,
            end_date=new_contest.end_date,
            image=new_contest.image,
            status=new_contest.status,
            participant_limit=new_contest.participant_limit,
            results_published=new_contest.results_published,
            created_at=new_contest.created_at,
            updated_at=new_contest.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        error_detail = traceback.format_exc()
        print(f"Ошибка при создании конкурса: {str(e)}")
        print(f"Traceback: {error_detail}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при создании конкурса: {str(e)}"
        )


@router.get("", response_model=List[ContestRead])
async def get_contests(
    type_filter: Optional[str] = Query(None, alias="type", description="Фильтр по типу: olympiad, creative, sport, hackathon"),
    status_filter: Optional[str] = Query(None, alias="status", description="Фильтр по статусу: open, closed, judging, completed"),
    db: Session = Depends(get_db)
):
    """Получить список всех конкурсов (доступно всем)"""
    try:
        query = db.query(Contest)
        
        if type_filter:
            query = query.filter(Contest.type == type_filter)
        
        if status_filter:
            query = query.filter(Contest.status == status_filter)
        
        contests = query.order_by(Contest.created_at.desc()).all()
        
        result = []
        for contest in contests:
            organizer = db.query(Auth).filter(Auth.id == contest.organizer_id).first()
            organizer_name = organizer.login if organizer else "Неизвестно"
            
            if organizer:
                from app.users.models import User
                user_profile = db.query(User).filter(User.auth_id == organizer.id).first()
                if user_profile:
                    if user_profile.name:
                        organizer_name = user_profile.name
                    elif user_profile.group:
                        organizer_name = user_profile.group
            
            result.append(ContestRead(
                id=contest.id,
                organizer_id=contest.organizer_id,
                organizer_name=organizer_name,
                title=contest.title,
                description=contest.description,
                full_description=contest.full_description,
                documents_and_tasks=contest.documents_and_tasks,
                type=contest.type,
            custom_tags=contest.custom_tags,
            files=contest.files,
            start_date=contest.start_date,
                end_date=contest.end_date,
                image=contest.image,
                status=contest.status,
                participant_limit=contest.participant_limit,
                results_published=contest.results_published,
                created_at=contest.created_at,
                updated_at=contest.updated_at
            ))
        
        return result
        
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"Ошибка при получении конкурсов: {str(e)}")
        print(f"Traceback: {error_detail}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении конкурсов: {str(e)}"
        )


@router.get("/{contest_id}", response_model=ContestRead)
async def get_contest(contest_id: int, db: Session = Depends(get_db)):
    """Получить конкурс по ID"""
    contest = db.query(Contest).filter(Contest.id == contest_id).first()
    
    if not contest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Конкурс не найден"
        )
    
    organizer = db.query(Auth).filter(Auth.id == contest.organizer_id).first()
    organizer_name = organizer.login if organizer else "Неизвестно"
    
    if organizer:
        from app.users.models import User
        user_profile = db.query(User).filter(User.auth_id == organizer.id).first()
        if user_profile and user_profile.name:
            organizer_name = user_profile.name
        elif user_profile and user_profile.group:
            organizer_name = user_profile.group
    
    return ContestRead(
        id=contest.id,
        organizer_id=contest.organizer_id,
        organizer_name=organizer_name,
        title=contest.title,
        description=contest.description,
        full_description=contest.full_description,
        documents_and_tasks=contest.documents_and_tasks,
        type=contest.type,
            custom_tags=contest.custom_tags,
            files=contest.files,
            start_date=contest.start_date,
        end_date=contest.end_date,
        image=contest.image,
        status=contest.status,
        participant_limit=contest.participant_limit,
        results_published=contest.results_published,
        created_at=contest.created_at,
        updated_at=contest.updated_at
    )


@router.put("/{contest_id}", response_model=ContestRead)
async def update_contest(
    contest_id: int,
    contest_update: ContestUpdate,
    db: Session = Depends(get_db)
):
    """Обновить конкурс (только организатор)"""
    try:
        contest = db.query(Contest).filter(Contest.id == contest_id).first()
        
        if not contest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Конкурс не найден"
            )
        
        update_data = contest_update.model_dump(exclude_unset=True)
        
        if "type" in update_data:
            valid_types = ["olympiad", "creative", "sport", "hackathon"]
            if update_data["type"] not in valid_types:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Тип конкурса должен быть одним из: {', '.join(valid_types)}"
                )
        
        if "status" in update_data:
            valid_statuses = ["open", "closed", "judging", "completed"]
            if update_data["status"] not in valid_statuses:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Статус должен быть одним из: {', '.join(valid_statuses)}"
                )
        
        start_date = update_data.get("start_date", contest.start_date)
        end_date = update_data.get("end_date", contest.end_date)
        if start_date >= end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Дата окончания должна быть позже даты начала"
            )
        
        for field, value in update_data.items():
            if field == 'custom_tags' and value is not None:
                # Обеспечиваем, что custom_tags всегда список или None
                setattr(contest, field, value if isinstance(value, list) else None)
            else:
                setattr(contest, field, value)
        
        db.commit()
        db.refresh(contest)
        
        organizer = db.query(Auth).filter(Auth.id == contest.organizer_id).first()
        organizer_name = organizer.login if organizer else "Неизвестно"
        
        if organizer:
            from app.users.models import User
            user_profile = db.query(User).filter(User.auth_id == organizer.id).first()
            if user_profile and user_profile.name:
                organizer_name = user_profile.name
            elif user_profile and user_profile.group:
                organizer_name = user_profile.group
        
        return ContestRead(
            id=contest.id,
            organizer_id=contest.organizer_id,
            organizer_name=organizer_name,
            title=contest.title,
            description=contest.description,
            full_description=contest.full_description,
            documents_and_tasks=contest.documents_and_tasks,
            type=contest.type,
            custom_tags=contest.custom_tags,
            files=contest.files,
            start_date=contest.start_date,
            end_date=contest.end_date,
            image=contest.image,
            status=contest.status,
            participant_limit=contest.participant_limit,
            results_published=contest.results_published,
            created_at=contest.created_at,
            updated_at=contest.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при обновлении конкурса: {str(e)}"
        )


@router.delete("/{contest_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contest(contest_id: int, db: Session = Depends(get_db)):
    """Удалить конкурс (только организатор)"""
    try:
        from app.applications.models import Application
        
        contest = db.query(Contest).filter(Contest.id == contest_id).first()
        
        if not contest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Конкурс не найден"
            )
        
        applications = db.query(Application).filter(Application.contest_id == contest_id).all()
        for application in applications:
            db.delete(application)
        
        db.delete(contest)
        db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        error_detail = traceback.format_exc()
        print(f"Ошибка при удалении конкурса: {str(e)}")
        print(f"Traceback: {error_detail}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при удалении конкурса: {str(e)}"
        )


@router.get("/organizer/{organizer_id}", response_model=List[ContestRead])
async def get_organizer_contests(
    organizer_id: int,
    db: Session = Depends(get_db)
):
    """Получить все конкурсы организатора"""
    try:
        organizer = db.query(Auth).filter(Auth.id == organizer_id).first()
        if not organizer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Организатор не найден"
            )
        
        contests = db.query(Contest).filter(
            Contest.organizer_id == organizer_id
        ).order_by(Contest.created_at.desc()).all()
        
        organizer_name = organizer.login
        from app.users.models import User
        user_profile = db.query(User).filter(User.auth_id == organizer.id).first()
        if user_profile and user_profile.name:
            organizer_name = user_profile.name
        elif user_profile and user_profile.group:
            organizer_name = user_profile.group
        
        result = []
        for contest in contests:
            result.append(ContestRead(
                id=contest.id,
                organizer_id=contest.organizer_id,
                organizer_name=organizer_name,
                title=contest.title,
                description=contest.description,
                full_description=contest.full_description,
                documents_and_tasks=contest.documents_and_tasks,
                type=contest.type,
            custom_tags=contest.custom_tags,
            files=contest.files,
            start_date=contest.start_date,
                end_date=contest.end_date,
                image=contest.image,
                status=contest.status,
                participant_limit=contest.participant_limit,
                results_published=contest.results_published,
                created_at=contest.created_at,
                updated_at=contest.updated_at
            ))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении конкурсов организатора: {str(e)}"
        )


@router.post("/{contest_id}/image", response_model=ContestRead)
async def upload_contest_image(
    contest_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Загрузить изображение для конкурса"""
    try:
        contest = db.query(Contest).filter(Contest.id == contest_id).first()
        
        if not contest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Конкурс не найден"
            )
        
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Файл должен быть изображением"
            )
        
        file_extension = Path(file.filename).suffix if file.filename else '.jpg'
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = CONTESTS_IMAGES_DIR / unique_filename
        
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Ошибка при сохранении файла: {str(e)}"
            )
        
        if contest.image:
            old_filename = contest.image.split("/")[-1]
            old_file_path = CONTESTS_IMAGES_DIR / old_filename
            if old_file_path.exists():
                try:
                    old_file_path.unlink()
                except Exception:
                    pass
        
        image_url = f"/static/uploads/contests/{unique_filename}"
        contest.image = image_url
        
        db.commit()
        db.refresh(contest)
        
        organizer = db.query(Auth).filter(Auth.id == contest.organizer_id).first()
        organizer_name = organizer.login if organizer else "Неизвестно"
        
        if organizer:
            from app.users.models import User
            user_profile = db.query(User).filter(User.auth_id == organizer.id).first()
            if user_profile and user_profile.name:
                organizer_name = user_profile.name
            elif user_profile and user_profile.group:
                organizer_name = user_profile.group
        
        return ContestRead(
            id=contest.id,
            organizer_id=contest.organizer_id,
            organizer_name=organizer_name,
            title=contest.title,
            description=contest.description,
            full_description=contest.full_description,
            documents_and_tasks=contest.documents_and_tasks,
            type=contest.type,
            custom_tags=contest.custom_tags,
            files=contest.files,
            start_date=contest.start_date,
            end_date=contest.end_date,
            image=contest.image,
            status=contest.status,
            participant_limit=contest.participant_limit,
            results_published=contest.results_published,
            created_at=contest.created_at,
            updated_at=contest.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при загрузке изображения: {str(e)}"
        )


@router.post("/{contest_id}/publish-results", response_model=ContestRead)
async def publish_results(
    contest_id: int,
    db: Session = Depends(get_db)
):
    """Опубликовать результаты конкурса"""
    try:
        contest = db.query(Contest).filter(Contest.id == contest_id).first()
        
        if not contest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Конкурс не найден"
            )
        
        contest.results_published = True
        if contest.status != "completed":
            contest.status = "completed"
        
        db.commit()
        db.refresh(contest)
        
        organizer = db.query(Auth).filter(Auth.id == contest.organizer_id).first()
        organizer_name = organizer.login if organizer else "Неизвестно"
        
        if organizer:
            from app.users.models import User
            user_profile = db.query(User).filter(User.auth_id == organizer.id).first()
            if user_profile and user_profile.name:
                organizer_name = user_profile.name
            elif user_profile and user_profile.group:
                organizer_name = user_profile.group
        
        return ContestRead(
            id=contest.id,
            organizer_id=contest.organizer_id,
            organizer_name=organizer_name,
            title=contest.title,
            description=contest.description,
            full_description=contest.full_description,
            documents_and_tasks=contest.documents_and_tasks,
            type=contest.type,
            custom_tags=contest.custom_tags,
            files=contest.files,
            start_date=contest.start_date,
            end_date=contest.end_date,
            image=contest.image,
            status=contest.status,
            participant_limit=contest.participant_limit,
            results_published=contest.results_published,
            created_at=contest.created_at,
            updated_at=contest.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при публикации результатов: {str(e)}"
        )


@router.post("/{contest_id}/files", response_model=ContestRead)
async def upload_contest_file(
    contest_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Загрузить файл для конкурса (PDF, DOC, DOCX и т.д.)"""
    try:
        contest = db.query(Contest).filter(Contest.id == contest_id).first()
        
        if not contest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Конкурс не найден"
            )
        
        # Разрешенные типы файлов
        allowed_extensions = {'.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar'}
        file_extension = Path(file.filename).suffix.lower() if file.filename else ''
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Неподдерживаемый тип файла. Разрешены: {', '.join(allowed_extensions)}"
            )
        
        # Ограничение размера файла (50MB)
        max_file_size = 50 * 1024 * 1024  # 50MB
        
        # Сохраняем файл во временную переменную для проверки размера
        file_content = await file.read()
        file_size = len(file_content)
        
        if file_size > max_file_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Размер файла превышает 50MB"
            )
        
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Файл пуст"
            )
        
        # Генерируем уникальное имя файла
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = CONTESTS_FILES_DIR / unique_filename
        
        try:
            with open(file_path, "wb") as buffer:
                buffer.write(file_content)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Ошибка при сохранении файла: {str(e)}"
            )
        
        # Добавляем файл в список файлов конкурса
        file_url = f"/static/uploads/contests/files/{unique_filename}"
        file_info = {
            "name": file.filename,
            "url": file_url,
            "size": file_size
        }
        
        current_files = contest.files if contest.files else []
        current_files.append(file_info)
        contest.files = current_files
        
        db.commit()
        db.refresh(contest)
        
        organizer = db.query(Auth).filter(Auth.id == contest.organizer_id).first()
        organizer_name = organizer.login if organizer else "Неизвестно"
        
        if organizer:
            from app.users.models import User
            user_profile = db.query(User).filter(User.auth_id == organizer.id).first()
            if user_profile and user_profile.name:
                organizer_name = user_profile.name
            elif user_profile and user_profile.group:
                organizer_name = user_profile.group
        
        return ContestRead(
            id=contest.id,
            organizer_id=contest.organizer_id,
            organizer_name=organizer_name,
            title=contest.title,
            description=contest.description,
            full_description=contest.full_description,
            documents_and_tasks=contest.documents_and_tasks,
            type=contest.type,
            custom_tags=contest.custom_tags,
            files=contest.files,
            start_date=contest.start_date,
            end_date=contest.end_date,
            image=contest.image,
            status=contest.status,
            participant_limit=contest.participant_limit,
            results_published=contest.results_published,
            created_at=contest.created_at,
            updated_at=contest.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при загрузке файла: {str(e)}"
        )


@router.delete("/{contest_id}/files/{file_index:int}", response_model=ContestRead)
async def delete_contest_file(
    contest_id: int,
    file_index: int,
    db: Session = Depends(get_db)
):
    """Удалить файл из конкурса по индексу"""
    try:
        contest = db.query(Contest).filter(Contest.id == contest_id).first()
        
        if not contest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Конкурс не найден"
            )
        
        current_files = contest.files if contest.files else []
        
        if file_index < 0 or file_index >= len(current_files):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Файл не найден"
            )
        
        file_to_remove = current_files[file_index]
        
        # Удаляем файл с диска
        filename = file_to_remove.get("url", "").split("/")[-1]
        file_path = CONTESTS_FILES_DIR / filename
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception:
                pass
        
        # Удаляем из списка
        current_files.pop(file_index)
        contest.files = current_files
        
        db.commit()
        db.refresh(contest)
        
        organizer = db.query(Auth).filter(Auth.id == contest.organizer_id).first()
        organizer_name = organizer.login if organizer else "Неизвестно"
        
        if organizer:
            from app.users.models import User
            user_profile = db.query(User).filter(User.auth_id == organizer.id).first()
            if user_profile and user_profile.name:
                organizer_name = user_profile.name
            elif user_profile and user_profile.group:
                organizer_name = user_profile.group
        
        return ContestRead(
            id=contest.id,
            organizer_id=contest.organizer_id,
            organizer_name=organizer_name,
            title=contest.title,
            description=contest.description,
            full_description=contest.full_description,
            documents_and_tasks=contest.documents_and_tasks,
            type=contest.type,
            custom_tags=contest.custom_tags,
            files=contest.files,
            start_date=contest.start_date,
            end_date=contest.end_date,
            image=contest.image,
            status=contest.status,
            participant_limit=contest.participant_limit,
            results_published=contest.results_published,
            created_at=contest.created_at,
            updated_at=contest.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при удалении файла: {str(e)}"
        )

