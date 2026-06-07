from fastapi import Header, HTTPException, status
from app.schemas.schemas import TokenData

async def get_current_user(
    x_user_id: str | None = Header(None),
) -> TokenData:
    """
    Extract user identity from the X-User-Id header.
    The API Gateway is responsible for JWT verification and injecting this header.
    """
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing User Identity (X-User-Id header)",
        )
    return TokenData(user_id=x_user_id)


def create_access_token(user_id: str) -> str:
    """Utility — used by the /dev/token endpoint in development."""
    from jose import jwt
    from datetime import datetime, timezone, timedelta
    from app.config.settings import settings
    
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    data = {"sub": user_id, "exp": expire}
    return jwt.encode(data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
