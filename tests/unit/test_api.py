"""Unit tests for the FastAPI HTTP backend."""

import pytest
from starlette.testclient import TestClient
from rippleci.api.server import app

client = TestClient(app)


def test_api_health():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["version"] == "0.1.0"
    assert "falkordb_healthy" in data


def test_api_repositories():
    res = client.get("/api/v1/repositories")
    assert res.status_code == 200
    repos = res.json()
    assert len(repos) >= 1
    assert "default_branch" in repos[0]


def test_api_impact_and_plan_flow():
    # 1. Trigger impact
    res_imp = client.post(
        "/api/v1/repositories/test-repo/impact",
        json={"base": "HEAD~1", "head": "HEAD"},
    )
    assert res_imp.status_code == 200
    imp_data = res_imp.json()
    run_id = imp_data["run_id"]
    assert "changed_symbols" in imp_data

    # 2. Trigger plan
    res_plan = client.post(
        f"/api/v1/repositories/test-repo/plans?run_id={run_id}",
        json={"budget_seconds": 300.0},
    )
    assert res_plan.status_code == 200
    plan_data = res_plan.json()
    assert plan_data["budget_seconds"] == 300.0

    # 3. Retrieve run
    res_run = client.get(f"/api/v1/runs/{run_id}")
    assert res_run.status_code == 200
    run_data = res_run.json()
    assert run_data["run_id"] == run_id

    # 4. Retrieve graph
    res_graph = client.get(f"/api/v1/runs/{run_id}/graph")
    assert res_graph.status_code == 200
    graph_data = res_graph.json()
    assert "nodes" in graph_data
    assert "edges" in graph_data


def test_api_investigate_and_benchmark():
    # 1. Investigate endpoint
    res_inv = client.post(
        "/api/v1/investigate",
        json={"base_ref": "HEAD~1", "head_ref": "HEAD", "budget_seconds": 150.0},
    )
    assert res_inv.status_code == 200
    inv_data = res_inv.json()
    assert "verdict" in inv_data
    assert "tool_trace" in inv_data
    assert len(inv_data["tool_trace"]) == 5

    # 2. Benchmark endpoint
    res_bench = client.get("/api/v1/benchmark")
    assert res_bench.status_code == 200
    bench_data = res_bench.json()
    assert "strategies" in bench_data
    assert "full_suite" in bench_data["strategies"]
    assert "graph_plus_ml" in bench_data["strategies"]
