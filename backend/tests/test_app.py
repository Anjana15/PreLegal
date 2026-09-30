from fastapi.testclient import TestClient

from app.main import create_app


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_database_is_recreated_on_startup(settings):
    signup = {"email": "ada@example.com", "password": "correct-horse"}
    with TestClient(create_app(settings)) as client:
        assert client.post("/api/auth/signup", json=signup).status_code == 201

    with TestClient(create_app(settings)) as client:
        # The user from the previous run is gone, so the same email can sign up again.
        assert client.post("/api/auth/signup", json=signup).status_code == 201


def test_serves_frontend_index(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "home" in response.text


def test_serves_exported_page_directories(client):
    for path in ("/signin", "/signin/"):
        response = client.get(path)
        assert response.status_code == 200
        assert "sign in" in response.text


def test_unknown_page_serves_frontend_404(client):
    response = client.get("/no-such-page")
    assert response.status_code == 404
    assert "not found" in response.text


def test_unknown_api_path_returns_json_404(client):
    for method in ("get", "post"):
        response = client.request(method, "/api/no-such-endpoint")
        assert response.status_code == 404
        assert response.headers["content-type"] == "application/json"
        assert response.json() == {"detail": "Not Found"}


def test_runs_without_a_frontend_build(settings, tmp_path):
    settings.static_dir = tmp_path / "missing"
    with TestClient(create_app(settings)) as client:
        assert client.get("/api/health").status_code == 200
        assert client.get("/").status_code == 404
