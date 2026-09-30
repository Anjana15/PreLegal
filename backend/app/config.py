import secrets
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    """Runtime configuration, read from environment variables (case-insensitive).

    Locally the repo-root .env is also read; in Docker, compose passes it via env_file.
    """

    model_config = SettingsConfigDict(env_file=REPO_ROOT / ".env", extra="ignore")

    database_path: Path = BACKEND_DIR / "data" / "prelegal.db"
    # The statically exported Next.js app. Not served if the directory doesn't exist.
    static_dir: Path = REPO_ROOT / "frontend" / "out"

    # Random per process unless set. Fine while the user table is also recreated on every start;
    # set it explicitly once data persists or more than one worker runs.
    jwt_secret: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    jwt_expire_minutes: int = 60 * 24 * 7
    # Set to true when served over HTTPS.
    cookie_secure: bool = False

    openrouter_api_key: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
