"""Typed exceptions for RippleCI."""

from typing import Any, Dict, Optional


class RippleError(Exception):
    """Base exception for all RippleCI errors."""

    def __init__(self, message: str, code: str = "INTERNAL_ERROR", details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "code": self.code,
            "message": self.message,
            "details": self.details,
        }


class ConfigurationError(RippleError):
    """Raised when configuration is invalid or missing."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="CONFIG_ERROR", details=details)


class GraphConnectionError(RippleError):
    """Raised when FalkorDB or graph store cannot be reached."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="GRAPH_CONNECTION_ERROR", details=details)


class IndexingError(RippleError):
    """Raised when repository indexing encounters an unrecoverable error."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="INDEXING_ERROR", details=details)


class UnsupportedLanguageError(RippleError):
    """Raised when a file or repository language is not supported."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="UNSUPPORTED_LANGUAGE", details=details)


class PlanGenerationError(RippleError):
    """Raised when test planning fails."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="PLAN_GENERATION_ERROR", details=details)


class VerificationError(RippleError):
    """Raised when test or mutation verification fails unexpectedly."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="VERIFICATION_ERROR", details=details)


class TestRunnerError(RippleError):
    """Raised when test runner infrastructure encounters a failure before tests execute."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="TEST_RUNNER_ERROR", details=details)


class QueryBudgetExceeded(RippleError):
    """Raised when graph query exceeds time or hop limits."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="QUERY_BUDGET_EXCEEDED", details=details)


class ModelUnavailable(RippleError):
    """Raised when ML ranking model artifact is missing or invalid."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="MODEL_UNAVAILABLE", details=details)
