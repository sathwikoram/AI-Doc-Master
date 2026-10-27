from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AI DocMaster"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/ai_docmaster"
    SYNC_DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/ai_docmaster"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # AI / LLM
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    LLM_PROVIDER: str = "openai"
    LLM_MODEL: str = "gpt-4o-mini"

    # Vector DB
    VECTOR_DB: str = "chromadb"
    CHROMA_PERSIST_DIR: str = "./data/chroma"
    FAISS_INDEX_PATH: str = "./data/faiss"

    # File Storage
    STORAGE_PROVIDER: str = "local"
    UPLOAD_DIR: str = "./uploads"
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    MAX_FILE_SIZE_MB: int = 20

    # Email
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = "noreply@aidocmaster.com"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
