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
    assert isinstance(data["pull_requests"], list)

    # Test sample repository returns demonstration PRs
    sample_res = client.get("/api/v1/github/repos/sample-org/payments-service/pulls")
    assert sample_res.status_code == 200
    sample_data = sample_res.json()
    assert len(sample_data["pull_requests"]) >= 1
    assert "number" in sample_data["pull_requests"][0]
    assert "title" in sample_data["pull_requests"][0]


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

    # Test external repository PR analysis (e.g. fastapi/fastapi)
    res_external = client.post(
        "/api/v1/github/repos/fastapi/fastapi/pulls/10420/analyze",
        json={"budget_seconds": 180, "max_mutations": 3},
    )
    assert res_external.status_code == 200
    ext_data = res_external.json()
    assert ext_data["repo"] == "fastapi/fastapi"
    assert ext_data["recommendation"] in ("release_safe", "proceed", "allow")
    assert len(ext_data["report"]["impact"]["changed_symbols"]) >= 1
    assert len(ext_data["report"]["plan"]["selected_tests"]) >= 1
    assert "RELEASE SAFE" in ext_data["comment_markdown"]


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
