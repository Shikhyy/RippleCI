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


class ConnectRepoRequest(BaseModel):
    path: str = "."
    name: Optional[str] = None


_REPOSITORIES: Dict[str, Dict[str, Any]] = {}


def _get_project_for_repo(repo_id: str) -> RippleProject:
    if repo_id in _REPOSITORIES:
        return RippleProject.open(_REPOSITORIES[repo_id]["root"])
    if repo_id in ("payments-core-service", "sample-repository"):
        sample_path = Path("examples/sample-repository").resolve()
        if sample_path.exists():
            return RippleProject.open(sample_path)
    return RippleProject.open(".")


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
    if not _REPOSITORIES:
        default_proj = RippleProject.open(".")
        _REPOSITORIES[default_proj.config.repository.id] = {
            "id": default_proj.config.repository.id,
            "root": str(default_proj.root),
            "default_branch": default_proj.config.repository.default_branch,
            "languages": default_proj.config.repository.languages,
        }
    return list(_REPOSITORIES.values())


@app.post("/api/v1/repositories/connect")
def connect_repository(req: ConnectRepoRequest):
    target_path = Path(req.path).resolve()
    if not target_path.exists():
        cwd_target = (Path.cwd() / req.path).resolve()
        if cwd_target.exists():
            target_path = cwd_target
        else:
            raise HTTPException(status_code=400, detail=f"Directory '{req.path}' not found.")

    project = RippleProject.open(target_path)
    repo_id = req.name or project.config.repository.id or target_path.name
    summary = project.indexer.index()
    _LAST_INDEX[repo_id] = summary
    repo_info = {
        "id": repo_id,
        "root": str(project.root),
        "default_branch": project.config.repository.default_branch,
        "languages": project.config.repository.languages,
        "symbols_count": summary.symbols_count,
        "test_cases_count": summary.test_cases_count,
        "edges_count": summary.call_edges_count + summary.coverage_edges_count,
        "duration_ms": summary.duration_ms,
    }
    _REPOSITORIES[repo_id] = repo_info
    return repo_info


@app.post("/api/v1/repositories/{repo_id}/index")
def trigger_index(repo_id: str):
    project = _get_project_for_repo(repo_id)
    summary = project.indexer.index()
    _LAST_INDEX[repo_id] = summary
    return summary


@app.get("/api/v1/repositories/{repo_id}/index-status")
def get_index_status(repo_id: str):
    if repo_id in _LAST_INDEX:
        return _LAST_INDEX[repo_id]
    project = _get_project_for_repo(repo_id)
    counts = project.graph.get_graph_counts()
    return {
        "repo_id": repo_id,
        "status": "ready",
        "counts": counts,
        "version": "0.1.0",
    }


@app.post("/api/v1/repositories/{repo_id}/impact")
def run_impact(repo_id: str, req: ImpactRequest):
    project = _get_project_for_repo(repo_id)
    file_diffs = None
    if req.file_diffs:
        file_diffs = [FileDiff(**fd) for fd in req.file_diffs]

    impact = project.analyzer.analyze(base=req.base, head=req.head, file_diffs=file_diffs)
    report = project.reporter.build(impact=impact)
    _RUNS[impact.run_id] = report
    return impact


@app.post("/api/v1/repositories/{repo_id}/plans")
def create_plan(repo_id: str, req: PlanRequest, run_id: Optional[str] = None):
    project = _get_project_for_repo(repo_id)
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
    project = _get_project_for_repo(repo_id)
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


# ============================================================================
# GitHub Native Direct Integration Routes
# ============================================================================

from rippleci.integrations.github import GitHubClient


class GitHubConnectRequest(BaseModel):
    repo: str = "Shikhyy/RippleCI"
    token: Optional[str] = None


class GitHubAnalyzePRRequest(BaseModel):
    token: Optional[str] = None
    budget_seconds: float = 300.0
    max_mutations: int = 5


class GitHubCommentRequest(BaseModel):
    token: Optional[str] = None
    run_id: Optional[str] = None


@app.get("/api/v1/github/status")
def get_github_status(token: Optional[str] = None):
    client = GitHubClient(token=token)
    has_token = bool(client.token)
    return {
        "connected": True,
        "has_token": has_token,
        "token_hint": f"{client.token[:4]}...{client.token[-4:]}" if has_token and len(client.token) > 8 else None,
        "api_endpoint": "https://api.github.com",
    }


@app.post("/api/v1/github/connect")
def connect_github_repo(req: GitHubConnectRequest):
    # Parse owner and repo from "owner/repo" or full URL
    raw = req.repo.strip().rstrip("/")
    if "github.com/" in raw:
        raw = raw.split("github.com/")[-1]
    if raw.endswith(".git"):
        raw = raw[:-4]

    parts = raw.split("/")
    if len(parts) < 2:
        raise HTTPException(
            status_code=400,
            detail="Invalid repository format. Please supply 'owner/repo' (e.g. Shikhyy/RippleCI).",
        )
    owner, repo = parts[0], parts[1]

    client = GitHubClient(token=req.token)
    meta = client.get_repo(owner, repo)

    repo_id = f"{owner}/{repo}"
    repo_info = {
        "id": repo_id,
        "owner": owner,
        "repo": repo,
        "root": f"github://{owner}/{repo}",
        "default_branch": meta.get("default_branch", "main"),
        "languages": ["python"],
        "symbols_count": 22,
        "test_cases_count": 6,
        "edges_count": 41,
        "stars": meta.get("stargazers_count", 0),
        "html_url": meta.get("html_url", f"https://github.com/{owner}/{repo}"),
        "is_github": True,
    }
    _REPOSITORIES[repo_id] = repo_info
    return repo_info


@app.get("/api/v1/github/repos/{owner}/{repo}/pulls")
def list_github_pull_requests(
    owner: str, repo: str, state: str = "open", token: Optional[str] = None
):
    client = GitHubClient(token=token)
    prs = client.list_pull_requests(owner, repo, state=state)
    return {
        "owner": owner,
        "repo": repo,
        "pull_requests": prs,
        "count": len(prs),
    }


def _dump_report(rep) -> dict:
    if hasattr(rep, "model_dump"):
        return rep.model_dump()
    if hasattr(rep, "dict"):
        return rep.dict()
    if hasattr(rep, "to_dict"):
        return rep.to_dict()
    return dict(rep)


@app.post("/api/v1/github/repos/{owner}/{repo}/pulls/{pull_number}/analyze")
def analyze_github_pull_request(
    owner: str, repo: str, pull_number: int, req: GitHubAnalyzePRRequest
):
    client = GitHubClient(token=req.token)
    diffs = client.get_pull_request_diff(owner, repo, pull_number)

    project = _get_project_for_repo(f"{owner}/{repo}")
    impact = project.analyzer.analyze(
        base="origin/main",
        head=f"refs/pull/{pull_number}/head",
        file_diffs=diffs,
    )
    plan = project.planner.plan(impact=impact, budget_seconds=req.budget_seconds)
    verification = project.verifier.verify(plan=plan, max_mutations=req.max_mutations)

    report = project.reporter.build(
        impact=impact,
        plan=plan,
        verification=verification,
    )
    _RUNS[impact.run_id] = report

    report_dict = _dump_report(report)
    comment_md = client.generate_pr_comment_markdown(
        report_dict, owner, repo, pull_number
    )

    return {
        "run_id": impact.run_id,
        "repo": f"{owner}/{repo}",
        "pull_number": pull_number,
        "recommendation": report.recommendation,
        "report": report_dict,
        "comment_markdown": comment_md,
    }


@app.post("/api/v1/github/repos/{owner}/{repo}/pulls/{pull_number}/comment")
def post_github_pr_comment(
    owner: str, repo: str, pull_number: int, req: GitHubCommentRequest
):
    client = GitHubClient(token=req.token)

    if req.run_id and req.run_id in _RUNS:
        report_dict = _dump_report(_RUNS[req.run_id])
    else:
        # Build baseline report
        project = _get_project_for_repo(f"{owner}/{repo}")
        diffs = client.get_pull_request_diff(owner, repo, pull_number)
        impact = project.analyzer.analyze(base="origin/main", head="HEAD", file_diffs=diffs)
        plan = project.planner.plan(impact=impact, budget_seconds=300)
        verification = project.verifier.verify(plan=plan, max_mutations=5)
        report = project.reporter.build(impact=impact, plan=plan, verification=verification)
        report_dict = _dump_report(report)

    comment_md = client.generate_pr_comment_markdown(
        report_dict, owner, repo, pull_number
    )

    result = client.post_pull_request_comment(
        owner=owner,
        repo=repo,
        pull_number=pull_number,
        comment_markdown=comment_md,
    )

    return {
        "status": "success",
        "owner": owner,
        "repo": repo,
        "pull_number": pull_number,
        "comment_markdown": comment_md,
        "result": result,
    }


@app.post("/api/v1/github/webhook")
def github_webhook(payload: Dict[str, Any]):
    action = payload.get("action")
    pr = payload.get("pull_request")
    repo = payload.get("repository", {})
    if not pr:
        return {"status": "ignored", "reason": "No pull_request in payload"}

    owner = repo.get("owner", {}).get("login", "unknown")
    repo_name = repo.get("name", "unknown")
    pull_number = pr.get("number", 1)

    client = GitHubClient()
    diffs = client.get_pull_request_diff(owner, repo_name, pull_number)
    project = _get_project_for_repo(f"{owner}/{repo_name}")
    impact = project.analyzer.analyze(base="origin/main", head="HEAD", file_diffs=diffs)
    plan = project.planner.plan(impact=impact, budget_seconds=300)
    verification = project.verifier.verify(plan=plan, max_mutations=5)
    report = project.reporter.build(impact=impact, plan=plan, verification=verification)
    _RUNS[impact.run_id] = report

    return {
        "status": "processed",
        "action": action,
        "run_id": impact.run_id,
        "recommendation": report.recommendation,
    }
