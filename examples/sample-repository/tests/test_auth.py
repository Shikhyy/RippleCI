"""Tests for authentication."""

from src.auth import verify_token, check_permission, hash_password


def test_verify_valid_token():
    assert verify_token("valid-token-123") is True


def test_verify_expired_token():
    assert verify_token("non-existent-token") is False


def test_check_permission_allowed():
    assert check_permission("admin_1", "admin") is True
    assert check_permission("user_1", "viewer") is True


def test_check_permission_denied():
    assert check_permission("regular_user", "admin") is False


def test_hash_password():
    h1 = hash_password("secret")
    assert isinstance(h1, str)
    assert len(h1) == 64
