from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.user import User
from app.models.case import Case
from app.schemas.user import UserOut, UserUpdate
from app.core.dependencies import get_current_user
from app.services.storage import save_file

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
async def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    await db.flush()
    await db.refresh(current_user)
    return current_user


@router.post("/me/avatar", response_model=UserOut)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    url = await save_file(file, folder="avatars")
    current_user.profile_picture = url
    await db.flush()
    await db.refresh(current_user)
    return current_user


@router.get("/me/stats")
async def my_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.case import CaseStatus
    result = await db.execute(
        select(Case.status, func.count(Case.id))
        .where(Case.citizen_id == current_user.id)
        .group_by(Case.status)
    )
    stats = {str(row[0]): row[1] for row in result.all()}
    total = sum(stats.values())
    return {"total_cases": total, "by_status": stats}
