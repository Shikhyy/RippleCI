"""RippleCI Model Context Protocol (MCP) Server Module."""

from rippleci.mcp.connector import build_server_config, connect_client, get_default_config_paths
from rippleci.mcp.server import MCPServer, serve_stdio
from rippleci.mcp.tools import TOOL_DEFINITIONS, execute_tool

__all__ = [
    "MCPServer",
    "serve_stdio",
    "TOOL_DEFINITIONS",
    "execute_tool",
    "connect_client",
    "build_server_config",
    "get_default_config_paths",
]
