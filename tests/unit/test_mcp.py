"""Unit tests for the RippleCI Model Context Protocol (MCP) server."""

import io
import json
from pathlib import Path
import sys
import pytest

from rippleci.mcp.server import MCPServer
from rippleci.mcp.tools import TOOL_DEFINITIONS, execute_tool

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
SAMPLE_REPO = REPO_ROOT / "examples" / "sample-repository"


def test_tool_definitions():
    """Verify tool catalog contains all required MCP tools with valid schemas."""
    tool_names = [t["name"] for t in TOOL_DEFINITIONS]
    expected_tools = [
        "ripple_index",
        "ripple_trace_blast_radius",
        "ripple_prioritize_tests",
        "ripple_verify_mutations",
        "ripple_query_graph",
        "ripple_explain_selection",
        "ripple_investigate_agent",
    ]
    for expected in expected_tools:
        assert expected in tool_names

    for tool in TOOL_DEFINITIONS:
        assert "name" in tool
        assert "description" in tool
        assert "inputSchema" in tool
        assert tool["inputSchema"]["type"] == "object"


def test_mcp_server_initialize():
    """Verify standard MCP initialize and tools/list requests."""
    server = MCPServer(root_path=str(SAMPLE_REPO))
    responses = []

    # Mock send_response to collect output
    server.send_response = lambda resp: responses.append(resp)

    # 1. Initialize
    server.handle_message({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "test-client", "version": "1.0"},
        },
    })
    assert len(responses) == 1
    init_resp = responses[0]
    assert init_resp["id"] == 1
    assert init_resp["result"]["protocolVersion"] == "2024-11-05"
    assert "tools" in init_resp["result"]["capabilities"]

    # 2. Tools list
    server.handle_message({
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/list",
        "params": {},
    })
    assert len(responses) == 2
    tools_resp = responses[1]
    assert tools_resp["id"] == 2
    assert len(tools_resp["result"]["tools"]) == len(TOOL_DEFINITIONS)


def test_execute_tool_index():
    """Verify ripple_index tool executes and returns repository entity statistics."""
    result = execute_tool("ripple_index", {"path": str(SAMPLE_REPO), "force_memory_graph": True})
    assert result["isError"] is False
    assert len(result["content"]) == 1
    assert "RippleCI Dependency Graph Indexed" in result["content"][0]["text"]
    assert "Files Scanned" in result["content"][0]["text"]


def test_execute_tool_blast_radius():
    """Verify ripple_trace_blast_radius returns multi-hop callers."""
    # First index the repo
    execute_tool("ripple_index", {"path": str(SAMPLE_REPO), "force_memory_graph": True})

    result = execute_tool(
        "ripple_trace_blast_radius",
        {
            "path": str(SAMPLE_REPO),
            "file_paths": ["src/auth.py"],
        },
    )
    assert result["isError"] is False
    text = result["content"][0]["text"]
    assert "Blast Radius Report" in text


def test_execute_unknown_tool():
    """Verify unknown tool returns clean error response."""
    result = execute_tool("unknown_tool_xyz", {})
    assert result["isError"] is True
    assert "Unknown tool" in result["content"][0]["text"]


def test_connect_client_custom_path(tmp_path):
    """Verify single-command agentic connector writes valid MCP configuration."""
    from rippleci.mcp.connector import connect_client

    custom_cfg = tmp_path / ".cursor" / "mcp.json"
    results = connect_client("cursor", repo_path=SAMPLE_REPO, custom_config_path=custom_cfg)

    assert len(results) == 1
    assert results[0]["status"] == "connected"
    assert custom_cfg.exists()

    with open(custom_cfg, "r") as f:
        data = json.load(f)

    assert "mcpServers" in data
    assert "rippleci" in data["mcpServers"]
    server = data["mcpServers"]["rippleci"]
    assert "command" in server
    assert "args" in server
    assert "mcp" in server["args"]
    assert "serve" in server["args"]

