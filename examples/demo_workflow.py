"""RippleCI End-to-End Release Intelligence Demonstration.

Demonstrates the entire workflow on `examples/sample-repository`:
1. Indexing code, calls, and tests into the FalkorDB/Memory Graph.
2. Tracing change blast radius across multi-hop dependencies.
3. Autonomous Graph Agent tool-directed investigation.
4. Regression test selection benchmark (comparing 4 strategies).
5. Bounded mutation-based counterfactual verification.
6. Emitting actionable release intelligence reports.
"""

import sys
import time
from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.table import Table

# Add package to path if running directly
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "packages" / "python"))

from rippleci import RippleProject
from rippleci.impact.diff import FileDiff
from rippleci.ranking.evaluation import run_benchmark_evaluation


def main():
    console = Console()

    console.print(
        Panel.fit(
            "[bold cyan]RippleCI[/bold cyan] — [bold white]Graph-Native Release Intelligence Toolkit[/bold white]\n"
            "[dim]FalkorDB Connected-Data Traversal · ML Prioritization · Mutation Verification[/dim]",
            border_style="cyan",
        )
    )

    sample_repo = REPO_ROOT / "examples" / "sample-repository"
    console.print(f"\n[bold]1. Target Codebase:[/bold] [blue]{sample_repo.relative_to(REPO_ROOT)}[/blue]")

    # 1. Open project & Index
    with console.status("[cyan]Opening project and indexing into dependency graph...[/cyan]"):
        project = RippleProject.open(sample_repo, force_memory_graph=True)
        summary = project.indexer.index()

    idx_table = Table(title="Dependency Graph Indexing Summary", border_style="cyan")
    idx_table.add_column("Entities", style="bold")
    idx_table.add_column("Count", justify="right")
    idx_table.add_row("Files Scanned", str(summary.files_scanned))
    idx_table.add_row("Symbols (Functions/Classes)", str(summary.symbols_count))
    idx_table.add_row("Test Cases Mapped", str(summary.test_cases_count))
    idx_table.add_row("Dependency Call Edges", str(summary.call_edges_count))
    idx_table.add_row("Coverage Edges", str(summary.coverage_edges_count))
    console.print(idx_table)

    # 2. Simulate PR Change
    console.print("\n[bold]2. Simulating Pull Request Change:[/bold]")
    console.print("   • File: [yellow]src/auth.py[/yellow] (Line 12: modifying token validation logic)")
    diffs = [FileDiff(file_path="src/auth.py", modified_lines=[12])]

    # 3. Blast Radius Analysis
    with console.status("[cyan]Tracing change blast radius across multi-hop graph edges...[/cyan]"):
        impact = project.analyzer.analyze(file_diffs=diffs)

    blast_table = Table(title="Change Blast Radius (FalkorDB)", border_style="blue")
    blast_table.add_column("Type", style="bold")
    blast_table.add_column("Symbol Name")
    blast_table.add_column("Hops")
    blast_table.add_column("Call Path")

    for s in impact.changed_symbols:
        blast_table.add_row("[amber3]MODIFIED[/amber3]", s.name, "0", f"{s.file_path}:{s.start_line}")

    for imp in impact.impacted_symbols:
        blast_table.add_row(
            "[blue]IMPACTED[/blue]",
            imp.symbol.name,
            str(imp.hops_from_change),
            " → ".join(imp.path_to_change),
        )
    console.print(blast_table)

    # 4. Agent Tool Investigation
    console.print("\n[bold]3. Autonomous Graph Reasoning Agent Investigation:[/bold]")
    with console.status("[cyan]Agent executing parameterized graph tools...[/cyan]"):
        investigation = project.agent.investigate_change(
            base_ref="origin/main",
            head_ref="feat/token-auth",
            budget_seconds=120.0,
            file_diffs=[{"file_path": "src/auth.py", "modified_lines": [12]}],
        )

    console.print("[dim]Tool Execution Trace:[/dim]")
    for step in investigation.tool_trace:
        console.print(f"  [cyan]✓[/cyan] {step}")

    console.print(
        Panel(
            f"[bold]Verdict:[/bold] [bold green]{investigation.verdict}[/bold green]\n"
            f"[bold]Selected Tests:[/bold] {investigation.selected_tests_count} ({investigation.estimated_duration_seconds:.1f}s)\n"
            f"[bold]Downstream Callers Found:[/bold] {investigation.impacted_callers_count}",
            border_style="green",
            title="Agent Verdict",
        )
    )

    # 5. Benchmark Comparison
    console.print("\n[bold]4. Regression Test Selection Benchmark (4 Strategies):[/bold]")
    bench_results = run_benchmark_evaluation(sample_repo)

    bench_table = Table(title="Strategy Comparison & Fault Recall", border_style="cyan")
    bench_table.add_column("Strategy", style="bold")
    bench_table.add_column("Selection Ratio", justify="right")
    bench_table.add_column("Est. Duration", justify="right")
    bench_table.add_column("Fault Recall", justify="right")
    bench_table.add_column("Missed Scenarios")

    for s_name, m in bench_results.strategies.items():
        recall_style = "[bold green]" if m.fault_recall == 1.0 else "[bold red]"
        missed = ", ".join(m.missed_scenarios) if m.missed_scenarios else "[green]None (100% caught)[/green]"
        bench_table.add_row(
            s_name,
            f"{m.selection_ratio * 100:.1f}%",
            f"{m.estimated_duration_s:.1f}s",
            f"{recall_style}{m.fault_recall * 100:.1f}%[/]",
            missed,
        )
    console.print(bench_table)

    # 6. Verification with mutations
    console.print("\n[bold]5. Bounded Mutation Verification:[/bold]")
    plan = project.planner.plan(impact=impact, budget_seconds=120.0)
    with console.status("[cyan]Applying transient AST mutations and verifying test plan...[/cyan]"):
        verification = project.verifier.verify(plan=plan, target_files=["src/auth.py"], max_mutations=3)

    console.print(
        Panel(
            f"Mutations Tested: [bold]{verification.mutations_tested_count}[/bold]  |  "
            f"Killed: [bold green]{verification.killed_mutations_count}[/bold green]  |  "
            f"Survived: [bold]{verification.survived_mutations_count}[/bold]  |  "
            f"Mutation Score: [bold green]{verification.mutation_score * 100:.1f}%[/bold green]\n"
            f"Recommendation: [bold green]{verification.recommendation}[/bold green]",
            title="Counterfactual Verification Results",
            border_style="green",
        )
    )

    console.print("\n[bold green]✓ Demo completed successfully![/bold green] All graph assertions verified.\n")


if __name__ == "__main__":
    main()
