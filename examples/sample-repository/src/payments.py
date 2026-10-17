"""Payment processing module."""

from src.auth import verify_token


def calculate_fee(amount: float) -> float:
    """Calculate 2.5% processing fee on positive amounts."""
    if amount <= 0:
        return 0.0
    return round(amount * 0.025, 2)


def process_payment(user_id: str, amount: float, token: str) -> dict:
    """Process customer charge if authenticated."""
    if not verify_token(token):
        return {"status": "error", "error": "unauthorized"}

    if amount <= 0:
        return {"status": "error", "error": "invalid_amount"}

    fee = calculate_fee(amount)
    total = amount + fee

    return {
        "status": "success",
        "user_id": user_id,
        "amount": amount,
        "fee": fee,
        "total": total,
    }


def refund_payment(transaction_id: str) -> bool:
    """Issue refund for completed transaction."""
    return bool(transaction_id and transaction_id.startswith("tx_"))
