"""Safe test runner executing selected tests within budget and sandbox boundaries."""

import os
from pathlib import Path
import subprocess
import sys
import time
from typing import List, Optional
from rippleci.core.models import TestExecutionResult


class SafeTestRunner:
    """Executes selected pytest tests in an isolated subprocess."""

    def __init__(self, repo_root: Path, timeout_seconds: float = 60.0):
        self.repo_root = repo_root.resolve()
        self.timeout_seconds = timeout_seconds

    def run_tests(
        self,
        test_node_ids: List[str],
        env_overrides: Optional[dict] = None,
        cwd: Optional[Path] = None,
    ) -> List[TestExecutionResult]:
        """Execute selected test node IDs and collect execution results."""
        if not test_node_ids:
            return []

        work_dir = (cwd or self.repo_root).resolve()
        results: List[TestExecutionResult] = []

        env = os.environ.copy()
        env["PYTHONPATH"] = str(work_dir)
        env["PYTHONDONTWRITEBYTECODE"] = "1"
        if env_overrides:
            env.update(env_overrides)

        # Run each test node individually or in batch to measure per-test duration
        for node_id in test_node_ids:
            cmd = [sys.executable, "-B", "-m", "pytest", node_id, "-v", "--tb=short", "-q"]
            start_t = time.perf_counter()
            try:
                proc = subprocess.run(
                    cmd,
                    cwd=str(work_dir),
                    env=env,
                    capture_output=True,
                    text=True,
                    timeout=self.timeout_seconds,
                    check=False,
                )
                duration = round(time.perf_counter() - start_t, 3)
                output = proc.stdout + proc.stderr

                if proc.returncode == 0:
                    status = "passed"
                    err_msg = None
                elif proc.returncode == 1:
                    status = "failed"
                    err_msg = output.strip()[-500:]  # Sanitized tail of failure message
                elif proc.returncode == 5:
                    # No tests collected or matched
                    status = "skipped"
                    err_msg = "Test node not matched by collector"
                else:
                    status = "error"
                    err_msg = f"Runner exited with code {proc.returncode}"

                results.append(
                    TestExecutionResult(
                        test_id=node_id,
                        node_id=node_id,
                        status=status,
                        duration_seconds=duration,
                        error_message=err_msg,
                    )
                )
            except subprocess.TimeoutExpired:
                results.append(
                    TestExecutionResult(
                        test_id=node_id,
                        node_id=node_id,
                        status="timed_out",
                        duration_seconds=self.timeout_seconds,
                        error_message=f"Execution exceeded timeout limit ({self.timeout_seconds}s)",
                    )
                )
            except Exception as e:
                results.append(
                    TestExecutionResult(
                        test_id=node_id,
                        node_id=node_id,
                        status="error",
                        duration_seconds=0.0,
                        error_message=str(e),
                    )
                )

        return results
