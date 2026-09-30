from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta

import jwt

from app.auth import SESSION_COOKIE

EMAIL = "ada@example.com"
PASSWORD = "correct-horse"


def sign_up(client, email=EMAIL, password=PASSWORD):
    return client.post("/api/auth/signup", json={"email": email, "password": password})


def test_sign_up_creates_user_and_signs_in(client):
    response = sign_up(client)
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == EMAIL
    assert "password_hash" not in body
    assert SESSION_COOKIE in response.cookies

    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == EMAIL


def test_session_cookie_is_http_only(client):
    set_cookie = sign_up(client).headers["set-cookie"]
    assert "HttpOnly" in set_cookie
    assert "SameSite=lax" in set_cookie
    assert "Path=/" in set_cookie


def test_sign_up_normalises_email_case(client):
    assert sign_up(client, email="Ada@Example.COM").json()["email"] == EMAIL


def test_duplicate_email_is_rejected(client):
    sign_up(client)
    response = sign_up(client, email=EMAIL.upper())
    assert response.status_code == 409


def test_concurrent_duplicate_sign_ups_conflict_instead_of_failing(client):
    with ThreadPoolExecutor(max_workers=5) as pool:
        statuses = sorted(r.status_code for r in pool.map(lambda _: sign_up(client), range(5)))
    assert statuses == [201, 409, 409, 409, 409]


def test_sign_up_validates_input(client):
    assert sign_up(client, email="not-an-email").status_code == 422
    assert sign_up(client, password="short").status_code == 422


def test_sign_in_with_correct_password(client):
    sign_up(client)
    client.cookies.clear()

    response = client.post("/api/auth/signin", json={"email": EMAIL, "password": PASSWORD})
    assert response.status_code == 200
    assert response.json()["email"] == EMAIL
    assert client.get("/api/auth/me").status_code == 200


def test_sign_in_rejects_wrong_password_and_unknown_email_alike(client):
    sign_up(client)
    client.cookies.clear()

    wrong_password = client.post("/api/auth/signin", json={"email": EMAIL, "password": "nope"})
    unknown_email = client.post(
        "/api/auth/signin", json={"email": "who@example.com", "password": PASSWORD}
    )
    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json()
    assert SESSION_COOKIE not in wrong_password.cookies


def test_me_requires_a_session(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert response.json() == {"detail": "Not signed in"}


def test_me_rejects_tampered_or_expired_tokens(client, settings):
    sign_up(client)

    client.cookies.set(SESSION_COOKIE, "not-a-jwt")
    assert client.get("/api/auth/me").status_code == 401

    forged = jwt.encode({"sub": "1"}, "wrong-secret-also-at-least-32-bytes", algorithm="HS256")
    client.cookies.set(SESSION_COOKIE, forged)
    assert client.get("/api/auth/me").status_code == 401

    expired = jwt.encode(
        {"sub": "1", "exp": datetime.now(UTC) - timedelta(minutes=1)},
        settings.jwt_secret,
        algorithm="HS256",
    )
    client.cookies.set(SESSION_COOKIE, expired)
    assert client.get("/api/auth/me").status_code == 401


def test_sign_out_clears_the_session(client):
    sign_up(client)
    response = client.post("/api/auth/signout")
    assert response.status_code == 204
    assert client.get("/api/auth/me").status_code == 401
