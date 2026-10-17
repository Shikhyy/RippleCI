"""Authentication module."""

import hashlib
import time

VALID_TOKENS = {"valid-token-123": 1800000000, "token-admin": 1800000000}


def verify_token(token: str) -> bool:
    """Validate user authentication token and expiration."""
    if not token or not isinstance(token, str):
        return False
    exp = VALID_TOKENS.get(token)
    if exp is None:
        return False
    return exp > time.time()


def check_permission(user_id: str, role: str) -> bool:
    """Verify if user has specified role permission."""
    if not user_id:
        return False
    if role == "admin":
        return user_id.startswith("admin_")
    return True


def hash_password(password: str) -> str:
    """Compute sha256 password hash."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()
