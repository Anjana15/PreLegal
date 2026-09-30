from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.config import Settings
from app.db import User, get_session
from app.security import create_token, hash_password, read_token, verify_password

SESSION_COOKIE = "prelegal_session"

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class SignInRequest(BaseModel):
    email: EmailStr
    password: str = Field(max_length=128)


class UserPublic(BaseModel):
    id: int
    email: str
    created_at: datetime


def get_settings_from_app(request: Request) -> Settings:
    return request.app.state.settings


SessionDep = Annotated[Session, Depends(get_session)]
SettingsDep = Annotated[Settings, Depends(get_settings_from_app)]


def get_current_user(request: Request, session: SessionDep, settings: SettingsDep) -> User:
    """Dependency for any route that requires a signed-in user."""
    token = request.cookies.get(SESSION_COOKIE)
    user_id = read_token(token, settings) if token else None
    user = session.get(User, user_id) if user_id is not None else None
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not signed in")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def _set_session_cookie(response: Response, user: User, settings: Settings) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        create_token(user.id, settings),
        max_age=settings.jwt_expire_minutes * 60,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        path="/",
    )


@router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=UserPublic)
def sign_up(body: SignUpRequest, response: Response, session: SessionDep, settings: SettingsDep):
    user = User(email=body.email.lower(), password_hash=hash_password(body.password))
    session.add(user)
    try:
        session.commit()
    except IntegrityError:
        # The unique email constraint, which also covers two sign-ups racing each other.
        session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")
    session.refresh(user)
    _set_session_cookie(response, user, settings)
    return user


@router.post("/signin", response_model=UserPublic)
def sign_in(body: SignInRequest, response: Response, session: SessionDep, settings: SettingsDep):
    user = session.exec(select(User).where(User.email == body.email.lower())).first()
    if not verify_password(body.password, user.password_hash if user else None):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    _set_session_cookie(response, user, settings)
    return user


@router.post("/signout", status_code=status.HTTP_204_NO_CONTENT)
def sign_out(response: Response, settings: SettingsDep) -> None:
    response.delete_cookie(
        SESSION_COOKIE, httponly=True, samesite="lax", secure=settings.cookie_secure, path="/"
    )


@router.get("/me", response_model=UserPublic)
def me(user: CurrentUser):
    return user
