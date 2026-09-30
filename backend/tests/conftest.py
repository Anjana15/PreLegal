import os

import pytest
from fastapi.testclient import TestClient

# Use LiteLLM's bundled model cost map instead of fetching it over the network on import.
os.environ.setdefault("LITELLM_LOCAL_MODEL_COST_MAP", "True")

from app.config import Settings  # noqa: E402
from app.main import create_app  # noqa: E402


@pytest.fixture
def static_dir(tmp_path):
    """A stand-in for the Next.js static export (trailingSlash: true layout)."""
    root = tmp_path / "static"
    (root / "signin").mkdir(parents=True)
    (root / "index.html").write_text("<h1>home</h1>")
    (root / "signin" / "index.html").write_text("<h1>sign in</h1>")
    (root / "404.html").write_text("<h1>not found</h1>")
    return root


@pytest.fixture
def settings(tmp_path, static_dir):
    return Settings(
        _env_file=None,
        database_path=tmp_path / "data" / "test.db",
        static_dir=static_dir,
        jwt_secret="test-secret-at-least-32-bytes-long",
    )


@pytest.fixture
def client(settings):
    # Entering the context runs the lifespan, which creates the database.
    with TestClient(create_app(settings)) as client:
        yield client
