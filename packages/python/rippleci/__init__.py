"""RippleCI: Graph-native release intelligence toolkit."""

__version__ = "0.1.0"

try:
    from rippleci.sdk.project import RippleProject
    __all__ = ["RippleProject", "__version__"]
except ImportError:
    __all__ = ["__version__"]
