"""
Authentication module for ML Interview API.
Supports GitHub OAuth with JWT tokens.
"""

import os
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional
import httpx
from fastapi import APIRouter, HTTPException, Depends, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt

from .db import get_session, User, Session

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)

# Environment variables
GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET", "")
APP_URL = os.environ.get("APP_URL", "http://localhost:3000")
JWT_SECRET = os.environ.get("JWT_SECRET", "")
ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "")

# JWT settings
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: int
    user_name: Optional[str]
    user_email: str


class UserResponse(BaseModel):
    authenticated: bool
    user_id: Optional[int] = None
    email: Optional[str] = None
    name: Optional[str] = None


def get_db():
    db = get_session()
    try:
        yield db
    finally:
        db.close()


def create_jwt_token(user_id: int, email: str) -> str:
    """Create a JWT token for a user."""
    if not JWT_SECRET:
        raise HTTPException(status_code=500, detail="JWT_SECRET not configured")

    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_jwt_token(token: str) -> dict:
    """Verify and decode a JWT token."""
    if not JWT_SECRET:
        raise HTTPException(status_code=500, detail="JWT_SECRET not configured")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db=Depends(get_db)
) -> Optional[User]:
    """Get current user from JWT token (optional - returns None if not authenticated)."""
    if not credentials:
        return None

    try:
        payload = verify_jwt_token(credentials.credentials)
        user_id = int(payload["sub"])
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except HTTPException:
        return None


def get_current_user_required(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db=Depends(get_db)
) -> User:
    """Get current user from JWT token (required - raises 401 if not authenticated)."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")

    payload = verify_jwt_token(credentials.credentials)
    user_id = int(payload["sub"])
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def verify_admin_secret(x_admin_secret: Optional[str] = Header(None)) -> bool:
    """Verify admin secret for protected endpoints."""
    if not ADMIN_SECRET:
        raise HTTPException(status_code=500, detail="ADMIN_SECRET not configured")

    if not x_admin_secret:
        raise HTTPException(status_code=401, detail="Admin secret required")

    # Use constant-time comparison to prevent timing attacks
    if not secrets.compare_digest(x_admin_secret, ADMIN_SECRET):
        raise HTTPException(status_code=401, detail="Invalid admin secret")

    return True


def hash_token(token: str) -> str:
    """Hash a token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()


@router.get("/github")
def github_login(db=Depends(get_db)):
    """Start GitHub OAuth flow."""
    if not GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")

    # Create state token and store in database
    state = secrets.token_urlsafe(32)
    state_hash = hash_token(state)

    session = Session(
        token_hash=state_hash,
        user_id=None,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
        data={"type": "oauth_state"}
    )
    db.add(session)
    db.commit()

    github_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&redirect_uri={APP_URL}/api/auth/github/callback"
        f"&scope=user:email"
        f"&state={state}"
    )
    return {"url": github_url}


@router.get("/github/callback")
async def github_callback(code: str, state: str, db=Depends(get_db)):
    """Handle GitHub OAuth callback."""
    # Verify state token
    state_hash = hash_token(state)
    session = db.query(Session).filter(
        Session.token_hash == state_hash,
        Session.expires_at > datetime.utcnow()
    ).first()

    if not session:
        raise HTTPException(status_code=400, detail="Invalid or expired state")

    # Delete used state token
    db.delete(session)
    db.commit()

    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
            },
            headers={"Accept": "application/json"},
            timeout=10.0,
        )
        token_data = token_response.json()

    if "access_token" not in token_data:
        raise HTTPException(status_code=400, detail="Failed to get access token")

    access_token = token_data["access_token"]

    # Get user info from GitHub
    async with httpx.AsyncClient() as client:
        user_response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10.0,
        )
        github_user = user_response.json()

        # Get email
        email_response = await client.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10.0,
        )
        emails = email_response.json()

        if not isinstance(emails, list):
            raise HTTPException(status_code=400, detail="Could not get emails from GitHub")

        primary_email = next(
            (e["email"] for e in emails if e.get("primary")),
            emails[0]["email"] if emails else None
        )

    if not primary_email:
        raise HTTPException(status_code=400, detail="Could not get email from GitHub")

    # Find or create user
    user = db.query(User).filter(User.email == primary_email).first()
    if not user:
        user = User(
            email=primary_email,
            name=github_user.get("name") or github_user.get("login"),
            image=github_user.get("avatar_url"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Create JWT token
    jwt_token = create_jwt_token(user.id, user.email)

    return TokenResponse(
        access_token=jwt_token,
        expires_in=JWT_EXPIRATION_HOURS * 3600,
        user_id=user.id,
        user_name=user.name,
        user_email=user.email,
    )


@router.get("/me", response_model=UserResponse)
def get_me(user: Optional[User] = Depends(get_current_user_optional)):
    """Get current logged in user."""
    if not user:
        return UserResponse(authenticated=False)

    return UserResponse(
        authenticated=True,
        user_id=user.id,
        email=user.email,
        name=user.name,
    )


@router.post("/logout")
def logout():
    """Log out current user (client should discard token)."""
    # With JWT, logout is handled client-side by discarding the token
    # For added security, you could maintain a token blacklist in the database
    return {"status": "ok", "message": "Discard your token to complete logout"}
