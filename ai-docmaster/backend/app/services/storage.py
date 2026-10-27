import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.config import settings


async def save_file(file: UploadFile, folder: str = "uploads") -> str:
    """Save uploaded file locally or to Cloudinary. Returns public URL."""
    if settings.STORAGE_PROVIDER == "cloudinary":
        return await _save_cloudinary(file, folder)
    return await _save_local(file, folder)


async def _save_local(file: UploadFile, folder: str) -> str:
    ext = Path(file.filename).suffix
    filename = f"{uuid.uuid4()}{ext}"
    save_dir = Path(settings.UPLOAD_DIR) / folder
    save_dir.mkdir(parents=True, exist_ok=True)
    file_path = save_dir / filename

    contents = await file.read()
    if len(contents) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds {settings.MAX_FILE_SIZE_MB}MB limit")

    with open(file_path, "wb") as f:
        f.write(contents)

    # Return a relative URL (served by a static files route)
    return f"/uploads/{folder}/{filename}"


async def _save_cloudinary(file: UploadFile, folder: str) -> str:
    import cloudinary.uploader
    contents = await file.read()
    result = cloudinary.uploader.upload(
        contents,
        folder=f"ai-docmaster/{folder}",
        resource_type="auto",
    )
    return result["secure_url"]
