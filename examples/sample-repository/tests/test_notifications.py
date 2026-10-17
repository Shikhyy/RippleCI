"""Tests for notifications."""

from src.notifications import send_receipt, send_security_alert


def test_send_receipt():
    assert send_receipt("user_10", 25.0) is True
    assert send_receipt("", 25.0) is False
    assert send_receipt("user_10", -5.0) is False


def test_send_security_alert():
    assert send_security_alert("user_10", "suspicious_login") is True
    assert send_security_alert("", "reason") is False
