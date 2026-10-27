from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("/", response_model=List[dict])
async def get_notifications(
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        query = query.where(Notification.is_read == False)
    query = query.order_by(Notification.created_at.desc()).limit(50)

    result = await db.execute(query)
    notifs = result.scalars().all()
    return [
        {
            "id": str(n.id),
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "meta": n.meta,
            "created_at": n.created_at,
        }
        for n in notifs
    ]


@router.post("/{notif_id}/read")
async def mark_read(
    notif_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        update(Notification)
        .where(Notification.id == notif_id, Notification.user_id == current_user.id)
        .values(is_read=True)
    )
    return {"status": "ok"}


@router.post("/read-all")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
        .values(is_read=True)
    )
    return {"status": "ok"}
