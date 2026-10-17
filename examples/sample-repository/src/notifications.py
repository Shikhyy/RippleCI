"""Notification dispatch module."""


def send_receipt(user_id: str, amount: float) -> bool:
    """Send payment receipt notification."""
    if not user_id or amount <= 0:
        return False
    return True


def send_security_alert(user_id: str, reason: str) -> bool:
    """Alert user of unusual security activity."""
    return bool(user_id and reason)
