from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification, NotificationType
from uuid import UUID


async def send_notification(
    db: AsyncSession,
    user_id: UUID,
    title: str,
    message: str,
    notif_type: NotificationType = NotificationType.system,
    meta: dict = None,
):
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type,
        meta=meta or {},
    )
    db.add(notif)
    await db.flush()
    return notif
