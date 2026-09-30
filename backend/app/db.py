from collections.abc import Iterator
from datetime import UTC, datetime
from pathlib import Path

from fastapi import Request
from sqlalchemy import Engine
from sqlmodel import Field, Session, SQLModel, create_engine


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


def create_db_engine(path: Path) -> Engine:
    # FastAPI runs sync endpoints in a thread pool, so connections cross threads.
    return create_engine(f"sqlite:///{path}", connect_args={"check_same_thread": False})


def reset_database(engine: Engine, path: Path) -> None:
    """Start from an empty database: V1 deliberately keeps no data across restarts."""
    path.parent.mkdir(parents=True, exist_ok=True)
    engine.dispose()
    path.unlink(missing_ok=True)
    SQLModel.metadata.create_all(engine)


def get_session(request: Request) -> Iterator[Session]:
    with Session(request.app.state.engine) as session:
        yield session
