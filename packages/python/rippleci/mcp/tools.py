"""Model Context Protocol (MCP) tool definitions and handlers for RippleCI."""

import json
import logging
from pathlib import Path
import sys
from typing import Any, Dict, List, Optional

from rippleci.core.errors import RippleError
from rippleci.impact.diff import FileDiff
from rippleci.sdk.project import RippleProject

logger = logging.getLogger("rippleci.mcp")


def get_project(path: Optional[str] = None, force_memory: bool = False) -> RippleProject:
    """Resolve and open a RippleProject instance."""
    target_path = Path(path).resolve() if path else Path.cwd()
    return RippleProject.open(root=target_path, force_memory_graph=force_memory)


# Tool Definitions Catalog (MCP 2024-11-05 Schema)
TOOL_DEFINITIONS = [
    {
        "name": "ripple_index",
        "description": (
            "Index a codebase's source files, AST symbols (classes, functions), call edges, "
            "and test cases into the FalkorDB dependency graph."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Path to the target repository directory (defaults to current working directory).",
                },
                "force_memory_graph": {
                    "type": "boolean",
                    "description": "Force in-memory graph store rather than FalkorDB Redis instance.",
                    "default": False,
                },
            },
        },
    },
    {
        "name": "ripple_trace_blast_radius",
        "description": (
            "Trace the multi-hop semantic blast radius of changed code in FalkorDB. "
            "Returns directly modified AST symbols, multi-hop downstream impacted callers, "
            "and all candidate test cases covering the affected path."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "base_ref": {
                    "type": "string",
                    "description": "Base Git reference or commit (e.g. 'origin/main').",
                    "default": "origin/main",
                },
                "head_ref": {
                    "type": "string",
                    "description": "Head Git reference or commit (e.g. 'HEAD').",
                    "default": "HEAD",
                },
                "file_paths": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Optional explicit list of modified file paths to analyze instead of git diff.",
                },
                "path": {
                    "type": "string",
                    "description": "Path to the repository directory.",
                },
            },
        },
    },
    {
        "name": "ripple_prioritize_tests",
        "description": (
            "Rank and select regression tests within an execution time budget using "
            "FalkorDB graph distance, coverage metrics, and GBDT machine learning."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "budget_seconds": {
                    "type": "number",
                    "description": "Maximum allowed test suite execution duration in seconds (e.g. 180.0).",
                    "default": 180.0,
                },
                "base_ref": {
                    "type": "string",
                    "description": "Base Git reference.",
                    "default": "origin/main",
                },
                "head_ref": {
                    "type": "string",
                    "description": "Head Git reference.",
                    "default": "HEAD",
                },
                "path": {
                    "type": "string",
                    "description": "Path to the repository directory.",
                },
            },
        },
    },
    {
        "name": "ripple_verify_mutations",
        "description": (
            "Run Bounded Mutation Verification: injects transient AST mutants only into the "
            "FalkorDB-identified impacted subgraph to verify that the selected tests kill all mutations."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "max_mutations": {
                    "type": "integer",
                    "description": "Maximum number of bounded mutations to evaluate.",
                    "default": 3,
                },
                "target_files": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Optional specific list of files to mutate.",
                },
                "path": {
                    "type": "string",
                    "description": "Path to the repository directory.",
                },
            },
        },
    },
    {
        "name": "ripple_query_graph",
        "description": (
            "Query the FalkorDB code knowledge graph directly using openCypher or inspect node/edge counts. "
            "Available node labels: Symbol, TestCase, File. Available relationships: CALLS, COVERS, DEFINES."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "cypher_query": {
                    "type": "string",
                    "description": "openCypher query to execute against the FalkorDB graph.",
                },
                "path": {
                    "type": "string",
                    "description": "Path to the repository directory.",
                },
            },
        },
    },
    {
        "name": "ripple_explain_selection",
        "description": (
            "Explain why a specific test case was prioritized with full FalkorDB path provenance, "
            "graph hops from the modified symbol, and GBDT ranking features."
        ),
        "inputSchema": {
            "type": "object",
            "required": ["test_name"],
            "properties": {
                "test_name": {
                    "type": "string",
                    "description": "Qualified identifier of the test case to explain.",
                },
                "path": {
                    "type": "string",
                    "description": "Path to the repository directory.",
                },
            },
        },
    },
    {
        "name": "ripple_investigate_agent",
        "description": (
            "Run the Autonomous Graph Reasoning Agent to investigate a pull request change, "
            "traverse FalkorDB, and produce an automated safety verdict with tool execution traces."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "base_ref": {
                    "type": "string",
                    "description": "Base Git reference.",
                    "default": "origin/main",
                },
                "head_ref": {
                    "type": "string",
                    "description": "Head Git reference.",
                    "default": "HEAD",
                },
                "budget_seconds": {
                    "type": "number",
                    "description": "Runtime budget for prioritized tests in seconds.",
                    "default": 180.0,
                },
                "path": {
                    "type": "string",
                    "description": "Path to the repository directory.",
                },
            },
        },
    },
]


def execute_tool(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Dispatch and execute an MCP tool, returning JSON-RPC result content."""
    try:
        if name == "ripple_index":
            return handle_index(arguments)
        elif name == "ripple_trace_blast_radius":
            return handle_trace_blast_radius(arguments)
        elif name == "ripple_prioritize_tests":
            return handle_prioritize_tests(arguments)
        elif name == "ripple_verify_mutations":
            return handle_verify_mutations(arguments)
        elif name == "ripple_query_graph":
            return handle_query_graph(arguments)
        elif name == "ripple_explain_selection":
            return handle_explain_selection(arguments)
        elif name == "ripple_investigate_agent":
            return handle_investigate_agent(arguments)
        else:
            return {
                "content": [{"type": "text", "text": f"Error: Unknown tool '{name}'"}],
                "isError": True,
            }
    except Exception as e:
        sys.stderr.write(f"[rippleci-mcp] Tool {name} error: {e}\n")
        return {
            "content": [{"type": "text", "text": f"Execution error in {name}: {str(e)}"}],
            "isError": True,
        }


def handle_index(args: Dict[str, Any]) -> Dict[str, Any]:
    project = get_project(args.get("path"), force_memory=args.get("force_memory_graph", False))
    summary = project.indexer.index()
    data = {
        "status": "success",
        "repository": str(project.root),
        "files_scanned": summary.files_scanned,
        "symbols_count": summary.symbols_count,
        "test_cases_count": summary.test_cases_count,
        "call_edges_count": summary.call_edges_count,
        "coverage_edges_count": summary.coverage_edges_count,
    }
    return {
        "content": [
            {
                "type": "text",
                "text": (
                    f"### 🌊 RippleCI Dependency Graph Indexed\n\n"
                    f"- **Repository:** `{project.root}`\n"
                    f"- **Files Scanned:** `{summary.files_scanned}`\n"
                    f"- **AST Symbols (Classes/Functions):** `{summary.symbols_count}`\n"
                    f"- **Test Cases Mapped:** `{summary.test_cases_count}`\n"
                    f"- **Dependency Call Edges:** `{summary.call_edges_count}`\n"
                    f"- **Coverage Edges:** `{summary.coverage_edges_count}`\n\n"
                    f"```json\n{json.dumps(data, indent=2)}\n```"
                ),
            }
        ],
        "isError": False,
    }


def handle_trace_blast_radius(args: Dict[str, Any]) -> Dict[str, Any]:
    project = get_project(args.get("path"))
    file_paths = args.get("file_paths")
    if file_paths:
        diffs = [FileDiff(file_path=p, modified_lines=[1]) for p in file_paths]
        impact = project.analyzer.analyze(file_diffs=diffs)
    else:
        base = args.get("base_ref", "origin/main")
        head = args.get("head_ref", "HEAD")
        impact = project.analyzer.analyze(base=base, head=head)

    changed = [
        {"name": s.name, "file": s.file_path, "lines": f"{s.start_line}-{s.end_line}"}
        for s in impact.changed_symbols
    ]
    impacted = [
        {
            "symbol": imp.symbol.name,
            "hops": imp.hops_from_change,
            "call_chain": " → ".join(imp.path_to_change),
        }
        for imp in impact.impacted_symbols
    ]
    candidates = [
        {"test": c.test_case.name, "file": c.test_case.file_path, "covers": c.covered_symbol.name}
        for c in impact.candidate_tests
    ]

    out_text = (
        f"### 🔍 FalkorDB Multi-Hop Blast Radius Report\n\n"
        f"**Directly Modified Symbols ({len(changed)}):**\n"
        + "\n".join([f"- `{s['name']}` ({s['file']}:{s['lines']})" for s in changed] or ["- None"])
        + f"\n\n**Downstream Impacted Callers ({len(impacted)}):**\n"
        + "\n".join([f"- `{imp['symbol']}` ({imp['hops']} hops): `{imp['call_chain']}`" for imp in impacted] or ["- None"])
        + f"\n\n**Candidate Regression Tests ({len(candidates)}):**\n"
        + "\n".join([f"- `{t['test']}` (covers `{t['covers']}`)" for t in candidates] or ["- None"])
    )

    return {
        "content": [
            {
                "type": "text",
                "text": out_text,
            }
        ],
        "isError": False,
    }


def handle_prioritize_tests(args: Dict[str, Any]) -> Dict[str, Any]:
    project = get_project(args.get("path"))
    base = args.get("base_ref", "origin/main")
    head = args.get("head_ref", "HEAD")
    budget = float(args.get("budget_seconds", 180.0))

    impact = project.analyzer.analyze(base=base, head=head)
    plan = project.planner.plan(impact=impact, budget_seconds=budget)

    tests_summary = [
        {
            "rank": t.rank,
            "name": t.name,
            "rank_score": round(t.rank_score, 3),
            "estimated_seconds": round(t.estimated_duration_seconds, 2),
            "reasons": t.reasons,
        }
        for t in plan.selected_tests
    ]

    out_text = (
        f"### 🎯 GBDT Prioritized Regression Test Plan\n\n"
        f"- **Budget Allowed:** `{budget:.1f}s`\n"
        f"- **Estimated Duration:** `{plan.estimated_total_seconds:.1f}s`\n"
        f"- **Selected Tests:** `{len(plan.selected_tests)}`\n"
        f"- **Skipped Tests:** `{len(plan.skipped_tests)}`\n\n"
        f"| Rank | Test Case | ML Score | Est. Duration | Rationale |\n"
        f"| --- | --- | --- | --- | --- |\n"
        + "\n".join(
            [
                f"| #{t['rank']} | `{t['name']}` | `{t['rank_score']}` | `{t['estimated_seconds']}s` | {', '.join(t['reasons'][:2])} |"
                for t in tests_summary
            ]
        )
    )

    return {
        "content": [{"type": "text", "text": out_text}],
        "isError": False,
    }


def handle_verify_mutations(args: Dict[str, Any]) -> Dict[str, Any]:
    project = get_project(args.get("path"))
    max_mut = int(args.get("max_mutations", 3))
    target_files = args.get("target_files")

    impact = project.analyzer.analyze(base="origin/main", head="HEAD")
    plan = project.planner.plan(impact=impact, budget_seconds=300.0)

    files = target_files or impact.changed_files
    verification = project.verifier.verify(plan=plan, target_files=files, max_mutations=max_mut)

    score_pct = verification.mutation_score * 100.0
    out_text = (
        f"### 🧬 Bounded Mutation Verification Result\n\n"
        f"- **Mutations Tested:** `{verification.mutations_tested_count}`\n"
        f"- **Mutants Killed:** `{verification.killed_mutations_count}`\n"
        f"- **Mutants Survived:** `{verification.survived_mutations_count}`\n"
        f"- **Mutation Score:** `{score_pct:.1f}%`\n"
        f"- **Release Recommendation:** `{verification.recommendation}`\n"
        f"- **Total Wall Time:** `{verification.total_wall_time_seconds:.2f}s`\n"
    )

    return {
        "content": [{"type": "text", "text": out_text}],
        "isError": False,
    }


def handle_query_graph(args: Dict[str, Any]) -> Dict[str, Any]:
    project = get_project(args.get("path"))
    query = args.get("cypher_query")

    if not query:
        counts = project.get_stats()
        return {
            "content": [
                {
                    "type": "text",
                    "text": f"### FalkorDB Graph Statistics\n\n```json\n{json.dumps(counts, indent=2)}\n```",
                }
            ],
            "isError": False,
        }

    # If backed by FalkorDB client
    graph_store = project.graph
    if hasattr(graph_store, "_connect"):
        try:
            g = graph_store._connect()
            res = g.query(query)
            rows = [r for r in res.result_set]
            return {
                "content": [
                    {
                        "type": "text",
                        "text": f"### FalkorDB Query Results\n\nQuery: `{query}`\nRows returned: {len(rows)}\n\n```json\n{json.dumps(rows, default=str, indent=2)}\n```",
                    }
                ],
                "isError": False,
            }
        except Exception as e:
            return {
                "content": [{"type": "text", "text": f"FalkorDB query failed: {str(e)}"}],
                "isError": True,
            }

    counts = project.get_stats()
    return {
        "content": [
            {
                "type": "text",
                "text": (
                    f"### In-Memory Graph Query Fallback\n\n"
                    f"Graph Nodes/Edges:\n```json\n{json.dumps(counts, indent=2)}\n```"
                ),
            }
        ],
        "isError": False,
    }


def handle_explain_selection(args: Dict[str, Any]) -> Dict[str, Any]:
    test_name = args["test_name"]
    project = get_project(args.get("path"))

    impact = project.analyzer.analyze(base="origin/main", head="HEAD")
    plan = project.planner.plan(impact=impact, budget_seconds=300.0)

    matched = next((t for t in plan.selected_tests if t.name == test_name or test_name in t.name), None)
    if not matched:
        return {
            "content": [
                {
                    "type": "text",
                    "text": f"Test case `{test_name}` was not selected in the current prioritized regression plan.",
                }
            ],
            "isError": False,
        }

    out_text = (
        f"### 📍 FalkorDB Selection Explanation: `{matched.name}`\n\n"
        f"- **Priority Rank:** `#{matched.rank}`\n"
        f"- **ML Score:** `{matched.rank_score:.3f}`\n"
        f"- **Estimated Runtime:** `{matched.estimated_duration_seconds:.2f}s`\n"
        f"- **Attribution Rationale:**\n"
        + "\n".join([f"  • {r}" for r in matched.reasons])
    )

    return {
        "content": [{"type": "text", "text": out_text}],
        "isError": False,
    }


def handle_investigate_agent(args: Dict[str, Any]) -> Dict[str, Any]:
    project = get_project(args.get("path"))
    base = args.get("base_ref", "origin/main")
    head = args.get("head_ref", "HEAD")
    budget = float(args.get("budget_seconds", 180.0))

    investigation = project.agent.investigate_change(
        base_ref=base,
        head_ref=head,
        budget_seconds=budget,
    )

    trace = "\n".join([f"1. `{step}`" for step in investigation.tool_trace])
    out_text = (
        f"### 🤖 Autonomous Graph Reasoning Agent Verdict\n\n"
        f"**Verdict:** `{investigation.verdict}`\n\n"
        f"**Selected Tests:** `{investigation.selected_tests_count}` (`{investigation.estimated_duration_seconds:.1f}s`)\n"
        f"**Downstream Callers Found:** `{investigation.impacted_callers_count}`\n\n"
        f"#### Tool Execution Trace:\n{trace}\n\n"
        f"#### Grounded Findings:\n{investigation.evidence_summary}"
    )

    return {
        "content": [{"type": "text", "text": out_text}],
        "isError": False,
    }
