"""Tests for payment processing."""

from src.payments import process_payment, calculate_fee, refund_payment


def test_calculate_fee():
    assert calculate_fee(100.0) == 2.50
    assert calculate_fee(0.0) == 0.0


def test_process_payment_success():
    res = process_payment(user_id="user_1", amount=100.0, token="valid-token-123")
    assert res["status"] == "success"
    assert res["total"] == 102.50


def test_process_payment_invalid_token():
    res = process_payment(user_id="user_1", amount=100.0, token="invalid-token")
    assert res["status"] == "error"
    assert res["error"] == "unauthorized"


def test_refund_payment():
    assert refund_payment("tx_999") is True
    assert refund_payment("") is False
