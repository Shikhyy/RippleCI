from __future__ import annotations

import pytest
from starlette.testclient import TestClient

from rippleci.api.server import app
from rippleci.integrations.github import GitHubClient


@pytest.fixture
def client():
    return TestClient(app)


def test_github_status_endpoint(client):
    res = client.get("/api/v1/github/status")
    assert res.status_code == 200
    data = res.json()
    assert data["connected"] is True
    assert "api_endpoint" in data


def test_github_connect_endpoint(client):
    res = client.post(
        "/api/v1/github/connect",
        json={"repo": "Shikhyy/RippleCI"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "Shikhyy/RippleCI"
    assert data["symbols_count"] >= 1


def test_github_list_pull_requests(client):
    res = client.get("/api/v1/github/repos/Shikhyy/RippleCI/pulls")
    assert res.status_code == 200
    data = res.json()
    assert "pull_requests" in data
    assert len(data["pull_requests"]) >= 1
    first_pr = data["pull_requests"][0]
    assert "number" in first_pr
    assert "title" in first_pr


def test_github_analyze_pull_request(client):
    res = client.post(
        "/api/v1/github/repos/Shikhyy/RippleCI/pulls/142/analyze",
        json={"budget_seconds": 180, "max_mutations": 3},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["pull_number"] == 142
    assert "recommendation" in data
    assert "comment_markdown" in data
    assert "RippleCI Release Intelligence" in data["comment_markdown"]


def test_github_comment_pull_request(client):
    res = client.post(
        "/api/v1/github/repos/Shikhyy/RippleCI/pulls/142/comment",
        json={"run_id": "demo_run_142"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["pull_number"] == 142
    assert data["status"] == "success"
    assert "result" in data


def test_github_comment_markdown_generator():
    client = GitHubClient()
    mock_run = {
        "run_id": "test_run_abc",
        "recommendation": "RELEASE_SAFE",
        "impact": {
            "changed_symbols": [{"name": "verify_token", "file_path": "src/auth.py", "start_line": 9, "end_line": 16}],
            "impacted_symbols": [{"symbol": {"name": "process_payment", "file_path": "src/payments.py"}, "hops_from_change": 1}],
        },
        "plan": {
            "selected_tests": [
                {"name": "test_auth", "rank": 1, "rank_score": 0.95, "reasons": ["Direct AST cover"]},
            ],
            "estimated_total_seconds": 2.4,
        },
        "verification": {
            "mutation_score": 1.0,
            "killed_mutations_count": 3,
            "mutations_tested_count": 3,
            "all_passed": True,
        },
    }
    markdown = client.generate_pr_comment_markdown(mock_run, "Shikhyy", "RippleCI", 142)
    assert "RELEASE SAFE" in markdown
    assert "Shikhyy/RippleCI" in markdown
    assert "FalkorDB Multi-Hop Traversal" in markdown
    assert "ML-Prioritized Test Plan" in markdown
    assert "verify_token" in markdown
