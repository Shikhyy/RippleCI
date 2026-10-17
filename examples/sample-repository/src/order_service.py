"""Order fulfillment service coordinating payments and notifications."""

from src.payments import process_payment
from src.notifications import send_receipt


def place_order(user_id: str, item_id: str, amount: float, token: str) -> dict:
    """Validate payment, fulfill order, and dispatch receipt."""
    payment_result = process_payment(user_id=user_id, amount=amount, token=token)
    if payment_result.get("status") != "success":
        return {"status": "failed", "reason": payment_result.get("error", "payment_failed")}

    receipt_sent = send_receipt(user_id=user_id, amount=amount)

    return {
        "status": "completed",
        "user_id": user_id,
        "item_id": item_id,
        "amount": amount,
        "receipt_dispatched": receipt_sent,
    }
