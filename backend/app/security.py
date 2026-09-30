from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash

from app.config import Settings

JWT_ALGORITHM = "HS256"

_password_hash = PasswordHash.recommended()
# Verified against when the email is unknown, so sign-in takes as long either way.
_DUMMY_HASH = _password_hash.hash("dummy-password")


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    if password_hash is None:
        _password_hash.verify(password, _DUMMY_HASH)
        return False
    return _password_hash.verify(password, password_hash)


def create_token(user_id: int, settings: Settings) -> str:
    expires = datetime.now(UTC) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": str(user_id), "exp": expires}
    return jwt.encode(payload, settings.jwt_secret, algorithm=JWT_ALGORITHM)


def read_token(token: str, settings: Settings) -> int | None:
    """Return the user id in a valid token, or None if it is invalid or expired."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[JWT_ALGORITHM])
        return int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        return None
