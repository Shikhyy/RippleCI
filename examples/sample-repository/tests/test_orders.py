"""Tests for order fulfillment."""

from src.order_service import place_order


def test_place_order_success():
    res = place_order(user_id="user_42", item_id="item_7", amount=50.0, token="valid-token-123")
    assert res["status"] == "completed"
    assert res["receipt_dispatched"] is True


def test_place_order_payment_failure():
    res = place_order(user_id="user_42", item_id="item_7", amount=50.0, token="bad_token")
    assert res["status"] == "failed"
