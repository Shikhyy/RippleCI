"""Single-command agentic connector for RippleCI MCP server.

Automatically configures AI coding agents (Claude Desktop, Cursor, Windsurf, VS Code)
by discovering their local config files and registering RippleCI's FalkorDB MCP tools.
"""

import json
import os
from pathlib import Path
import platform
import sys
from typing import Any, Dict, List, Optional, Tuple


def get_default_config_paths() -> Dict[str, List[Path]]:
    """Resolve standard OS locations for AI agent MCP configuration files."""
    home = Path.home()
    system = platform.system()

    paths: Dict[str, List[Path]] = {
        "cursor": [
            home / ".cursor" / "mcp.json",
            Path.cwd() / ".cursor" / "mcp.json",
        ],
        "windsurf": [
            home / ".codeium" / "windsurf" / "mcp_config.json",
            Path.cwd() / ".windsurf" / "mcp.json",
        ],
        "vscode": [
            Path.cwd() / ".vscode" / "mcp.json",
            home / ".vscode" / "mcp.json",
        ],
        "claude": [],
    }

    if system == "Darwin":  # macOS
        paths["claude"].append(home / "Library" / "Application Support" / "Claude" / "claude_desktop_config.json")
    elif system == "Windows":
        appdata = os.environ.get("APPDATA")
        if appdata:
            paths["claude"].append(Path(appdata) / "Claude" / "claude_desktop_config.json")
    else:  # Linux / other
        paths["claude"].append(home / ".config" / "Claude" / "claude_desktop_config.json")

    return paths


def build_server_config(
    repo_path: Optional[Path] = None,
    python_bin: Optional[str] = None,
    falkordb_url: str = "redis://localhost:6379",
) -> Dict[str, Any]:
    """Build the canonical MCP server config object for RippleCI."""
    target_repo = (repo_path or Path.cwd()).resolve()
    target_python = python_bin or sys.executable

    return {
        "command": target_python,
        "args": ["-m", "rippleci.cli.main", "mcp", "serve", "--path", str(target_repo)],
        "env": {
            "FALKORDB_URL": falkordb_url,
            "PYTHONUNBUFFERED": "1",
        },
    }


def connect_client(
    client_name: str,
    repo_path: Optional[Path] = None,
    python_bin: Optional[str] = None,
    custom_config_path: Optional[Path] = None,
) -> List[Dict[str, Any]]:
    """Connect RippleCI to specified AI agent client(s).

    Args:
        client_name: 'claude', 'cursor', 'windsurf', 'vscode', or 'all'
        repo_path: Target repository path for graph analysis
        python_bin: Specific python binary to use (defaults to sys.executable)
        custom_config_path: Optional override path for config file

    Returns:
        List of result summaries per configured client.
    """
    results: List[Dict[str, Any]] = []
    config_paths_map = get_default_config_paths()
    server_payload = build_server_config(repo_path=repo_path, python_bin=python_bin)

    targets = (
        ["cursor", "claude", "windsurf", "vscode"]
        if client_name.lower() in ("all", "auto")
        else [client_name.lower()]
    )

    for target in targets:
        if custom_config_path:
            chosen_paths = [custom_config_path]
        else:
            chosen_paths = config_paths_map.get(target, [])

        if not chosen_paths:
            results.append({
                "client": target,
                "status": "skipped",
                "message": f"No default configuration path known for '{target}' on {platform.system()}.",
            })
            continue

        target_file = chosen_paths[0]
        try:
            target_file.parent.mkdir(parents=True, exist_ok=True)
            current_config: Dict[str, Any] = {}

            if target_file.exists():
                try:
                    with open(target_file, "r", encoding="utf-8") as f:
                        content = f.read().strip()
                        if content:
                            current_config = json.loads(content)
                except Exception:
                    # In case of corrupted or malformed file, initialize clean structure
                    current_config = {}

            if "mcpServers" not in current_config or not isinstance(current_config["mcpServers"], dict):
                current_config["mcpServers"] = {}

            current_config["mcpServers"]["rippleci"] = server_payload

            with open(target_file, "w", encoding="utf-8") as f:
                json.dump(current_config, f, indent=2)

            results.append({
                "client": target,
                "status": "connected",
                "config_path": str(target_file),
                "message": f"Successfully injected RippleCI into {target} configuration!",
            })
        except Exception as e:
            results.append({
                "client": target,
                "status": "error",
                "config_path": str(target_file),
                "message": str(e),
            })

    return results
