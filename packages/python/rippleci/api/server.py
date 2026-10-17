"""FastAPI HTTP backend adapter exposing RippleCI services to the Web Companion and CI."""

from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from rippleci import __version__
from rippleci.core.config import RippleConfig
from rippleci.core.models import (
    GraphData,
    ImpactReport,
    IndexSummary,
    TestPlan,
    VerificationReport,
)
from rippleci.graph.factory import create_graph_store
from rippleci.impact.diff import FileDiff
from rippleci.sdk.project import RippleProject
from rippleci.sdk.reporter import RippleReport

app = FastAPI(
    title="RippleCI API",
    version=__version__,
    description="Graph-native release intelligence API.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory run store for analysis sessions
_RUNS: Dict[str, RippleReport] = {}
_LAST_INDEX: Dict[str, IndexSummary] = {}


class ImpactRequest(BaseModel):
    base: str = "origin/main"
    head: str = "HEAD"
    file_diffs: Optional[List[Dict[str, Any]]] = None


class PlanRequest(BaseModel):
    budget_seconds: float = 300.0
    ranker_type: str = "auto"  # "auto" | "heuristic" | "ml"


class VerificationRequest(BaseModel):
    max_mutations: int = 5


class InvestigateRequest(BaseModel):
    base_ref: str = "origin/main"
    head_ref: str = "HEAD"
    budget_seconds: float = 300.0
    file_diffs: Optional[List[Dict[str, Any]]] = None


@app.get("/api/v1/health")
def get_health():
    project = RippleProject.open(".")
    return {
        "status": "ok",
        "version": __version__,
        "falkordb_healthy": project.graph.is_healthy(),
        "graph_url": project.config.graph.url,
        "graph_name": project.config.graph.graph_name,
    }


@app.get("/api/v1/repositories")
def get_repositories():
    project = RippleProject.open(".")
    return [
        {
            "id": project.config.repository.id,
            "root": str(project.root),
            "default_branch": project.config.repository.default_branch,
            "languages": project.config.repository.languages,
        }
    ]


@app.post("/api/v1/repositories/{repo_id}/index")
def trigger_index(repo_id: str):
    project = RippleProject.open(".")
    summary = project.indexer.index()
    _LAST_INDEX[repo_id] = summary
    return summary


@app.get("/api/v1/repositories/{repo_id}/index-status")
def get_index_status(repo_id: str):
    if repo_id in _LAST_INDEX:
        return _LAST_INDEX[repo_id]
    project = RippleProject.open(".")
    counts = project.graph.get_graph_counts()
    return {
        "repo_id": repo_id,
        "status": "ready",
        "counts": counts,
        "version": "0.1.0",
    }


@app.post("/api/v1/repositories/{repo_id}/impact")
def run_impact(repo_id: str, req: ImpactRequest):
    project = RippleProject.open(".")
    file_diffs = None
    if req.file_diffs:
        file_diffs = [FileDiff(**fd) for fd in req.file_diffs]

    impact = project.analyzer.analyze(base=req.base, head=req.head, file_diffs=file_diffs)
    report = project.reporter.build(impact=impact)
    _RUNS[impact.run_id] = report
    return impact


@app.post("/api/v1/repositories/{repo_id}/plans")
def create_plan(repo_id: str, req: PlanRequest, run_id: Optional[str] = None):
    project = RippleProject.open(".")
    if run_id and run_id in _RUNS:
        impact = _RUNS[run_id].impact
    else:
        # Default analyze
        impact = project.analyzer.analyze(base="HEAD~1", head="HEAD")

    plan = project.planner.plan(impact=impact, budget_seconds=req.budget_seconds)
    report = project.reporter.build(impact=impact, plan=plan)
    _RUNS[impact.run_id] = report
    return plan


@app.post("/api/v1/repositories/{repo_id}/verification")
def run_verification(repo_id: str, req: VerificationRequest, run_id: Optional[str] = None):
    project = RippleProject.open(".")
    if not run_id or run_id not in _RUNS or not _RUNS[run_id].plan:
        raise HTTPException(status_code=400, detail="Valid run_id with an existing TestPlan is required.")

    current_report = _RUNS[run_id]
    verification = project.verifier.verify(plan=current_report.plan, max_mutations=req.max_mutations)
    updated_report = project.reporter.build(
        impact=current_report.impact,
        plan=current_report.plan,
        verification=verification,
    )
    _RUNS[run_id] = updated_report
    return verification


@app.get("/api/v1/runs/{run_id}")
def get_run(run_id: str):
    if run_id not in _RUNS:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found.")
    return _RUNS[run_id]


@app.get("/api/v1/runs/{run_id}/graph")
def get_run_graph(run_id: str) -> GraphData:
    project = RippleProject.open(".")
    if run_id in _RUNS:
        report = _RUNS[run_id]
        sym_ids = [s.id for s in report.impact.changed_symbols] + [
            imp.symbol.id for imp in report.impact.impacted_symbols
        ]
        test_ids = [t.test_case.id for t in report.impact.candidate_tests]
        return project.graph.get_subgraph(symbol_ids=sym_ids, test_ids=test_ids)

    # Fallback to current graph sample
    counts = project.graph.get_graph_counts()
    return project.graph.get_subgraph(symbol_ids=[], test_ids=[])


@app.post("/api/v1/investigate")
def investigate_change(req: InvestigateRequest):
    project = RippleProject.open(".")
    result = project.agent.investigate_change(
        base_ref=req.base_ref,
        head_ref=req.head_ref,
        budget_seconds=req.budget_seconds,
        file_diffs=req.file_diffs,
    )
    return {
        "base_ref": result.base_ref,
        "head_ref": result.head_ref,
        "changed_symbols_count": result.changed_symbols_count,
        "impacted_callers_count": result.impacted_callers_count,
        "candidate_tests_count": result.candidate_tests_count,
        "selected_tests_count": result.selected_tests_count,
        "estimated_duration_seconds": result.estimated_duration_seconds,
        "verdict": result.verdict,
        "evidence_summary": result.evidence_summary,
        "tool_trace": result.tool_trace,
    }


@app.get("/api/v1/benchmark")
def get_benchmark():
    from rippleci.ranking.evaluation import run_benchmark_evaluation
    project = RippleProject.open(".")
    results = run_benchmark_evaluation(project.root)
    return results.to_dict()


@app.get("/api/v1/explain/{test_id}")
def explain_test(test_id: str, range: str = "HEAD~1..HEAD", budget: float = 300.0):
    project = RippleProject.open(".")
    parts = range.split("..")
    base = parts[0] if len(parts) > 1 else "HEAD~1"
    head = parts[1] if len(parts) > 1 else range

    impact = project.analyzer.analyze(base=base, head=head)
    plan = project.planner.plan(impact=impact, budget_seconds=budget)
    explanation = project.agent.explain_test(test_id, plan)
    if not explanation:
        raise HTTPException(status_code=404, detail=f"Test '{test_id}' not found in current plan.")

    return {
        "test_id": explanation.test_id,
        "test_name": explanation.test_name,
        "rank": explanation.rank,
        "rank_score": explanation.rank_score,
        "reasons": explanation.reasons,
        "evidence_paths": explanation.evidence_paths,
        "is_direct": explanation.is_direct,
        "summary": explanation.summary,
    }
