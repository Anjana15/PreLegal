from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.staticfiles import StaticFiles

from app import auth
from app.config import Settings, get_settings
from app.db import create_db_engine, reset_database


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    engine = create_db_engine(settings.database_path)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        reset_database(engine, settings.database_path)
        yield
        engine.dispose()

    app = FastAPI(title="PreLegal", lifespan=lifespan)
    app.state.settings = settings
    app.state.engine = engine

    # Routes match in registration order: API routes first, then the static frontend.
    app.include_router(auth.router)

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.api_route(
        "/api/{path:path}",
        methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        include_in_schema=False,
    )
    def api_not_found(path: str) -> None:
        # Keeps unknown API paths returning JSON rather than the frontend's 404 page.
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not Found")

    if settings.static_dir.is_dir():
        app.mount("/", StaticFiles(directory=settings.static_dir, html=True), name="frontend")

    return app


app = create_app()
