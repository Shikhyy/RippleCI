"""Model Context Protocol (MCP) stdio JSON-RPC server for RippleCI."""

import json
import logging
import sys
from typing import Any, Dict, Optional

from rippleci import __version__
from rippleci.mcp.tools import TOOL_DEFINITIONS, execute_tool

logging.basicConfig(
    stream=sys.stderr,
    level=logging.INFO,
    format="[%(asctime)s] [rippleci-mcp] %(levelname)s: %(message)s",
)
logger = logging.getLogger("rippleci.mcp.server")


class MCPServer:
    """Standard I/O Model Context Protocol (MCP) server."""

    def __init__(self, root_path: Optional[str] = None):
        self.root_path = root_path
        self.running = False

    def send_response(self, response_dict: Dict[str, Any]):
        """Serialize and send a JSON-RPC response followed by a newline."""
        line = json.dumps(response_dict)
        sys.stdout.write(line + "\n")
        sys.stdout.flush()

    def send_error(self, req_id: Any, code: int, message: str, data: Any = None):
        """Send a standard JSON-RPC 2.0 error."""
        error_payload = {"code": code, "message": message}
        if data is not None:
            error_payload["data"] = data
        self.send_response({"jsonrpc": "2.0", "id": req_id, "error": error_payload})

    def run(self):
        """Start the stdio reading loop."""
        self.running = True
        logger.info(f"Starting RippleCI MCP Server v{__version__} on stdio...")

        for raw_line in sys.stdin:
            line = raw_line.strip()
            if not line:
                continue

            try:
                msg = json.loads(line)
            except Exception as e:
                logger.error(f"Failed to parse JSON line: {e}")
                self.send_error(None, -32700, "Parse error")
                continue

            self.handle_message(msg)

    def handle_message(self, msg: Dict[str, Any]):
        req_id = msg.get("id")
        method = msg.get("method")
        params = msg.get("params", {})

        # Handle notifications (no response required)
        if method == "notifications/initialized":
            logger.info("Client completed initialization handshake.")
            return

        if not method:
            self.send_error(req_id, -32600, "Invalid Request: missing method")
            return

        logger.debug(f"Received method: {method} (id={req_id})")

        if method == "initialize":
            self.send_response(
                {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {
                            "tools": {"listChanged": False},
                            "resources": {},
                            "prompts": {},
                        },
                        "serverInfo": {
                            "name": "rippleci-mcp",
                            "version": __version__,
                        },
                    },
                }
            )
        elif method == "ping":
            self.send_response({"jsonrpc": "2.0", "id": req_id, "result": {}})
        elif method == "tools/list":
            self.send_response(
                {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "tools": TOOL_DEFINITIONS,
                    },
                }
            )
        elif method == "tools/call":
            tool_name = params.get("name")
            arguments = params.get("arguments", {})
            if self.root_path and "path" not in arguments:
                arguments["path"] = self.root_path

            result = execute_tool(tool_name, arguments)
            self.send_response(
                {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": result,
                }
            )
        elif method in ("resources/list", "prompts/list"):
            self.send_response({"jsonrpc": "2.0", "id": req_id, "result": {"items": []}})
        else:
            logger.warning(f"Unrecognized MCP method: {method}")
            self.send_error(req_id, -32601, f"Method not found: {method}")


def serve_stdio(root_path: Optional[str] = None):
    """Entrypoint to launch the MCP server over stdio."""
    server = MCPServer(root_path=root_path)
    server.run()
