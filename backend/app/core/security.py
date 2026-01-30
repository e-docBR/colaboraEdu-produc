"""Security helpers: password hashing and JWT setup."""
from datetime import timedelta

from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token
from passlib.context import CryptContext

from .config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
jwt = JWTManager()


def hash_password(raw_password: str) -> str:
    return pwd_context.hash(raw_password)


def verify_password(raw_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(raw_password, hashed_password)


def generate_tokens(identity: str, roles: list[str], extra_claims: dict[str, object] | None = None) -> dict[str, str]:
    claims = {"roles": roles}
    if extra_claims:
        for key, value in extra_claims.items():
            if value is not None:
                claims[key] = value
    access = create_access_token(
        identity=identity,
        additional_claims=claims,
        expires_delta=timedelta(minutes=30),
    )
    refresh = create_refresh_token(identity=identity, additional_claims=claims)
    return {"access_token": access, "refresh_token": refresh}
