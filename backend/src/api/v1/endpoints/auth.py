"""
Authentication endpoints.
"""

import httpx
import jwt
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import os

from src.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()
security = HTTPBearer()

# Environment variables
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET") 
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24


class GitHubAuthRequest(BaseModel):
    """GitHub OAuth callback request."""
    code: str
    state: str = None


class TokenResponse(BaseModel):
    """Authentication token response."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict


class GitHubUser(BaseModel):
    """GitHub user data."""
    id: int
    login: str
    name: str
    email: str
    avatar_url: str
    bio: str = None
    company: str = None
    location: str = None
    blog: str = None
    public_repos: int
    followers: int
    following: int


async def exchange_github_code(code: str) -> str:
    """Exchange GitHub authorization code for access token."""
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="GitHub OAuth not configured"
        )
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
            },
            headers={"Accept": "application/json"}
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail="Failed to exchange GitHub code"
            )
        
        data = response.json()
        if "access_token" not in data:
            raise HTTPException(
                status_code=400,
                detail="GitHub OAuth failed"
            )
        
        return data["access_token"]


async def fetch_github_user(access_token: str) -> GitHubUser:
    """Fetch user data from GitHub API."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github.v3+json"
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail="Failed to fetch GitHub user"
            )
        
        user_data = response.json()
        
        # Handle missing email by trying the emails endpoint
        if not user_data.get("email"):
            email_response = await client.get(
                "https://api.github.com/user/emails",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                }
            )
            
            if email_response.status_code == 200:
                emails = email_response.json()
                primary_email = next((e for e in emails if e.get("primary")), None)
                if primary_email:
                    user_data["email"] = primary_email["email"]
        
        return GitHubUser(**user_data)


def create_jwt_token(user_data: dict) -> tuple[str, int]:
    """Create JWT token for user."""
    expiry = datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)
    
    payload = {
        "sub": str(user_data["id"]),
        "login": user_data["login"],
        "email": user_data["email"],
        "name": user_data["name"],
        "exp": expiry,
        "iat": datetime.utcnow()
    }
    
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    expires_in = int(timedelta(hours=JWT_EXPIRY_HOURS).total_seconds())
    
    return token, expires_in


def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify JWT token and return user data."""
    try:
        payload = jwt.decode(
            credentials.credentials, 
            JWT_SECRET, 
            algorithms=[JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


@router.post("/github/callback", response_model=TokenResponse)
async def github_callback(request: GitHubAuthRequest):
    """
    Handle GitHub OAuth callback.
    Exchange authorization code for access token.
    """
    logger.info("GitHub OAuth callback", code=request.code[:10] + "...")
    
    try:
        # Exchange code for GitHub access token
        github_token = await exchange_github_code(request.code)
        
        # Fetch user data from GitHub
        github_user = await fetch_github_user(github_token)
        
        # TODO: Create or update user in database
        user_data = {
            "id": github_user.id,
            "login": github_user.login,
            "name": github_user.name,
            "email": github_user.email,
            "avatar_url": github_user.avatar_url,
            "bio": github_user.bio,
            "company": github_user.company,
            "location": github_user.location,
            "blog": github_user.blog,
            "public_repos": github_user.public_repos,
            "followers": github_user.followers,
            "following": github_user.following,
            "github_token": github_token  # Store for GitHub API access
        }
        
        # Generate JWT token
        jwt_token, expires_in = create_jwt_token(user_data)
        
        logger.info("GitHub OAuth successful", user_id=github_user.id, login=github_user.login)
        
        return TokenResponse(
            access_token=jwt_token,
            expires_in=expires_in,
            user=user_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("GitHub OAuth error", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Authentication failed"
        )


@router.get("/me")
async def get_current_user(current_user: dict = Depends(verify_jwt_token)):
    """Get current authenticated user."""
    return {"user": current_user}


@router.get("/github/authorize")
async def get_github_auth_url():
    """Get GitHub OAuth authorization URL."""
    if not GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="GitHub OAuth not configured"
        )
    
    # Generate state for CSRF protection
    import secrets
    state = secrets.token_urlsafe(32)
    
    auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&scope=user:email,read:user,repo"
        f"&state={state}"
    )
    
    return {
        "auth_url": auth_url,
        "state": state
    }


@router.post("/refresh")
async def refresh_token(current_user: dict = Depends(verify_jwt_token)):
    """Refresh JWT token."""
    # Generate new token with existing user data
    jwt_token, expires_in = create_jwt_token(current_user)
    
    return {
        "access_token": jwt_token,
        "token_type": "bearer",
        "expires_in": expires_in
    }


@router.post("/logout")
async def logout():
    """Logout user."""
    # For JWT tokens, logout is handled client-side by removing the token
    # In production, you might want to implement token blacklisting
    return {"message": "Logged out successfully"}