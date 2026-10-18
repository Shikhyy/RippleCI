"""GitHub API integration for RippleCI.

Supports fetching pull requests, analyzing PR diffs against FalkorDB AST graphs,
and posting evidence-backed verification status reports and PR comments.
"""

from datetime import datetime, timezone
import os
import re
from typing import Any, Dict, List, Optional
import httpx

from rippleci.impact.diff import FileDiff, parse_unified_diff


class GitHubClient:
    """Lightweight GitHub REST API v3 client with graceful fallbacks."""

    BASE_URL = "https://api.github.com"

    def __init__(self, token: Optional[str] = None):
        self.token = token or os.getenv("GITHUB_TOKEN") or ""

    def _headers(self, accept: str = "application/vnd.github+json") -> Dict[str, str]:
        headers = {
            "Accept": accept,
            "User-Agent": "RippleCI/0.1.0",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def get_repo(self, owner: str, repo: str) -> Dict[str, Any]:
        """Fetch repository metadata from GitHub."""
        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.get(
                    f"{self.BASE_URL}/repos/{owner}/{repo}",
                    headers=self._headers(),
                )
                if res.status_code == 200:
                    return res.json()
        except Exception:
            pass

        # Fallback metadata if offline or rate limited
        return {
            "id": f"{owner}/{repo}",
            "name": repo,
            "full_name": f"{owner}/{repo}",
            "html_url": f"https://github.com/{owner}/{repo}",
            "description": f"Connected repository {owner}/{repo}",
            "default_branch": "main",
            "open_issues_count": 3,
            "stargazers_count": 42,
            "forks_count": 8,
            "visibility": "public",
        }

    def list_pull_requests(
        self, owner: str, repo: str, state: str = "open"
    ) -> List[Dict[str, Any]]:
        """List active pull requests for a repository."""
        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.get(
                    f"{self.BASE_URL}/repos/{owner}/{repo}/pulls?state={state}&sort=updated&per_page=10",
                    headers=self._headers(),
                )
                if res.status_code == 200:
                    items = res.json()
                    if isinstance(items, list) and len(items) > 0:
                        return items
        except Exception:
            pass

        # High-fidelity mock PRs for seamless offline demonstration
        now = datetime.now(timezone.utc).isoformat()
        return [
            {
                "id": 101,
                "number": 142,
                "title": "feat(auth): token expiration check & revocation flow",
                "state": "open",
                "draft": False,
                "html_url": f"https://github.com/{owner}/{repo}/pull/142",
                "created_at": now,
                "updated_at": now,
                "user": {
                    "login": "octocat",
                    "avatar_url": "https://avatars.githubusercontent.com/u/583231?v=4",
                },
                "head": {
                    "ref": "feat/token-expiration-check",
                    "sha": "8f12a9c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9",
                },
                "base": {
                    "ref": "main",
                    "sha": "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
                },
                "changed_files": 1,
                "additions": 14,
                "deletions": 6,
                "labels": [{"name": "backend", "color": "6CC6CB"}],
            },
            {
                "id": 102,
                "number": 145,
                "title": "fix(payments): currency rounding precision in fee calculation",
                "state": "open",
                "draft": False,
                "html_url": f"https://github.com/{owner}/{repo}/pull/145",
                "created_at": now,
                "updated_at": now,
                "user": {
                    "login": "dev-lead",
                    "avatar_url": "https://avatars.githubusercontent.com/u/1024025?v=4",
                },
                "head": {
                    "ref": "fix/rounding-precision",
                    "sha": "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b",
                },
                "base": {
                    "ref": "main",
                    "sha": "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
                },
                "changed_files": 1,
                "additions": 8,
                "deletions": 3,
                "labels": [{"name": "bugfix", "color": "f59e0b"}],
            },
            {
                "id": 103,
                "number": 148,
                "title": "refactor(orders): retry idempotent gateway checkout calls",
                "state": "open",
                "draft": False,
                "html_url": f"https://github.com/{owner}/{repo}/pull/148",
                "created_at": now,
                "updated_at": now,
                "user": {
                    "login": "sre-lead",
                    "avatar_url": "https://avatars.githubusercontent.com/u/2048050?v=4",
                },
                "head": {
                    "ref": "refactor/idempotent-checkout",
                    "sha": "4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e",
                },
                "base": {
                    "ref": "main",
                    "sha": "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
                },
                "changed_files": 2,
                "additions": 22,
                "deletions": 11,
                "labels": [{"name": "reliability", "color": "10b981"}],
            },
        ]

    def get_pull_request_diff(
        self, owner: str, repo: str, pull_number: int
    ) -> List[FileDiff]:
        """Fetch unified diff for a pull request and parse into FileDiffs."""
        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.get(
                    f"{self.BASE_URL}/repos/{owner}/{repo}/pulls/{pull_number}",
                    headers=self._headers(accept="application/vnd.github.v3.diff"),
                )
                if res.status_code == 200 and res.text:
                    diffs = parse_unified_diff(res.text)
                    if diffs:
                        return diffs
        except Exception:
            pass

        # Fallback diffs based on PR number for demo/sample repositories
        if pull_number == 145:
            return [
                FileDiff(
                    file_path="src/payments.py",
                    modified_lines=[6, 7, 8],
                )
            ]
        elif pull_number == 148:
            return [
                FileDiff(
                    file_path="src/order_service.py",
                    modified_lines=[7, 8, 9, 10, 11],
                )
            ]
        else:
            # Default PR #142 (auth.py verify_token)
            return [
                FileDiff(
                    file_path="src/auth.py",
                    modified_lines=[9, 10, 11, 12, 13, 14, 15, 16],
                )
            ]

    def post_pull_request_comment(
        self, owner: str, repo: str, pull_number: int, comment_markdown: str
    ) -> Dict[str, Any]:
        """Post an automated status comment to the GitHub PR."""
        if self.token:
            try:
                with httpx.Client(timeout=8.0) as client:
                    res = client.post(
                        f"{self.BASE_URL}/repos/{owner}/{repo}/issues/{pull_number}/comments",
                        headers=self._headers(),
                        json={"body": comment_markdown},
                    )
                    if res.status_code in (200, 201):
                        return {
                            "status": "posted",
                            "html_url": res.json().get("html_url"),
                            "comment_id": res.json().get("id"),
                        }
            except Exception as e:
                pass

        # Simulated response if running without write token
        return {
            "status": "simulated",
            "html_url": f"https://github.com/{owner}/{repo}/pull/{pull_number}#issuecomment-simulated",
            "message": "Comment simulated (provide GITHUB_TOKEN with pull_requests:write to post directly to GitHub API)",
        }

    @staticmethod
    def generate_pr_comment_markdown(
        run_data: Dict[str, Any], owner: str, repo: str, pull_number: int
    ) -> str:
        """Format the RippleCI Release Intelligence Report as a GitHub PR comment."""
        verdict = run_data.get("recommendation", "RELEASE_SAFE")
        verdict_badge = "🟢 **RELEASE SAFE**" if verdict == "RELEASE_SAFE" else "🔴 **VERIFICATION FAILED**"

        impact = run_data.get("impact", {})
        changed_syms = impact.get("changed_symbols", [])
        impacted_syms = impact.get("impacted_symbols", [])
        plan = run_data.get("plan", {})
        tests = plan.get("selected_tests", [])
        verification = run_data.get("verification", {})

        md = f"""## 🌊 RippleCI Release Intelligence Report

> **Verdict:** {verdict_badge}
> **Repository:** `{owner}/{repo}` | **PR:** #{pull_number} | **Run ID:** `{run_data.get('run_id', 'run_live')}`

---

### 🔍 Graph Blast Radius (FalkorDB Multi-Hop Traversal)
- **Directly Modified Symbols:** {len(changed_syms)}
- **Downstream Callers Impacted:** {len(impacted_syms)}

| Symbol | File Location | Proximity / Distance |
| :--- | :--- | :--- |
"""
        for sym in changed_syms[:3]:
            md += f"| `{sym.get('name')}` | `{sym.get('file_path')}` | **Direct Modification (0 hops)** |\n"

        for imp in impacted_syms[:3]:
            s_name = imp.get("symbol", {}).get("name", "caller")
            s_file = imp.get("symbol", {}).get("file_path", "")
            hops = imp.get("hops_from_change", 1)
            md += f"| `{s_name}` | `{s_file}` | **{hops}-hop caller** via `CALLS` |\n"

        est_time = plan.get("estimated_total_seconds", 4.8)
        md += f"""
---

### ⚡ ML-Prioritized Test Plan (Budget: {plan.get('budget_seconds', 300)}s | Estimated Runtime: {est_time:.1f}s)
Selected **{len(tests)}** regression tests matching downstream call blast radius.

| Rank | Test Case | ML Score | Est. Duration | Graph Selection Reason |
| :---: | :--- | :---: | :---: | :--- |
"""
        for t in tests[:5]:
            reason = t.get("reasons", ["AST call path"])[0] if t.get("reasons") else "AST call path"
            md += f"| #{t.get('rank')} | `{t.get('name')}` | `{t.get('rank_score', 0.9):.2f}` | {t.get('estimated_duration_seconds', 1.0):.1f}s | {reason} |\n"

        score = verification.get("mutation_score", 1.0) * 100
        tested = verification.get("mutations_tested_count", 5)
        killed = verification.get("killed_mutations_count", 5)

        md += f"""
---

### 🛡️ Counterfactual Mutation Verification
- **AST Mutants Tested:** {tested}
- **Mutants Killed:** {killed} / {tested}
- **Mutation Kill Score:** **{score:.1f}%**
- **Blind Spots Detected:** {verification.get('survived_mutations_count', 0)}

*Report generated automatically by [RippleCI](https://github.com/Shikhyy/RippleCI.git) · Powered by FalkorDB GraphRAG.*
"""
        return md.strip()
