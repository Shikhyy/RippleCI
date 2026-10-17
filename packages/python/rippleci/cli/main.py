"""RippleCI CLI: Typer and Rich command-line interface."""

import json
from pathlib import Path
import subprocess
import sys
from typing import Optional
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
import typer

from rippleci import __version__
from rippleci.core.config import RippleConfig
from rippleci.core.errors import RippleError
from rippleci.graph.factory import create_graph_store
from rippleci.impact.diff import FileDiff
from rippleci.sdk.project import RippleProject

app = typer.Typer(
    name="ripple",
    help="RippleCI: Graph-native release intelligence toolkit.",
    no_args_is_help=True,
)
graph_app = typer.Typer(help="Inspect and manage the FalkorDB dependency graph.")
config_app = typer.Typer(help="Manage RippleCI repository configuration.")

app.add_typer(graph_app, name="graph")
app.add_typer(config_app, name="config")

console = Console()
err_console = Console(stderr=True)


def version_callback(value: bool):
    if value:
        console.print(f"[bold cyan]RippleCI[/bold cyan] version [bold green]{__version__}[/bold green]")
        raise typer.Exit()


@app.callback()
def main(
    version: Optional[bool] = typer.Option(
        None, "--version", "-v", callback=version_callback, is_eager=True, help="Show version and exit."
    ),
):
    pass


@app.command("init")
def init_cmd(
    repo_id: Optional[str] = typer.Option(None, "--repo-id", help="Repository identifier."),
    graph_url: str = typer.Option("redis://localhost:6379", "--graph-url", help="FalkorDB Redis URL."),
    graph_name: Optional[str] = typer.Option(None, "--graph-name", help="FalkorDB graph name."),
):
    """Initialize a .ripple.yml configuration file in the current directory."""
    cwd = Path.cwd()
    target = cwd / ".ripple.yml"
    if target.exists():
        console.print(f"[yellow]Configuration file already exists at {target}[/yellow]")
        return

    name = repo_id or cwd.name
    gname = graph_name or f"ripple_{name.replace('-', '_')}"

    config = RippleConfig()
    config.repository.id = name
    config.graph.url = graph_url
    config.graph.graph_name = gname

    config.save(target)
    console.print(Panel(
        f"[green]Initialized configuration file at [bold]{target}[/bold][/green]\n"
        f"Repository ID: [cyan]{name}[/cyan]\n"
        f"Graph Database: [cyan]{gname}[/cyan] ({graph_url})\n\n"
        f"Next steps:\n"
        f"  1. Run [bold]ripple doctor[/bold] to check environment\n"
        f"  2. Run [bold]ripple index[/bold] to populate dependency graph",
        title="RippleCI Init",
        border_style="cyan",
    ))


@app.command("doctor")
def doctor_cmd():
    """Diagnose environment, Git repository, Python, and FalkorDB connectivity."""
    cwd = Path.cwd()
    table = Table(title="RippleCI Diagnostics", border_style="cyan")
    table.add_column("Component", style="bold")
    table.add_column("Status")
    table.add_column("Details")

    # 1. Python version
    py_ver = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    table.add_row("Python Runtime", "[green]OK[/green]", f"Python {py_ver}")

    # 2. Git check
    git_ok = False
    git_msg = "Not in a git repository"
    try:
        res = subprocess.run(["git", "rev-parse", "--is-inside-work-tree"], capture_output=True, text=True, check=False)
        if res.returncode == 0:
            git_ok = True
            branch = subprocess.run(["git", "rev-parse", "--abbrev-ref", "HEAD"], capture_output=True, text=True, check=False).stdout.strip()
            git_msg = f"Git repo detected (branch: {branch})"
    except Exception as e:
        git_msg = f"Git error: {e}"
    table.add_row("Git Repository", "[green]OK[/green]" if git_ok else "[yellow]WARN[/yellow]", git_msg)

    # 3. Config check
    cfg_file = cwd / ".ripple.yml"
    config = RippleConfig.load(root_dir=cwd)
    table.add_row("Configuration", "[green]OK[/green]" if cfg_file.exists() else "[yellow]DEFAULT[/yellow]",
                  f"File: {cfg_file.name if cfg_file.exists() else 'Default applied'}")

    # 4. FalkorDB check
    from rippleci.graph.falkordb_store import FalkorGraphStore
    falkor = FalkorGraphStore(config.graph)
    if falkor.is_healthy():
        table.add_row("FalkorDB Graph", "[green]CONNECTED[/green]", f"Reachable at {config.graph.url} (graph: {config.graph.graph_name})")
    else:
        table.add_row(
            "FalkorDB Graph",
            "[yellow]OFFLINE (Memory Fallback Active)[/yellow]",
            f"Not reachable at {config.graph.url}. Run 'docker compose -f infra/docker-compose.yml up -d'",
        )

    # 5. Pytest check
    pytest_ok = False
    try:
        import pytest
        pytest_ok = True
        py_details = f"pytest {pytest.__version__}"
    except ImportError:
        py_details = "pytest not installed in environment"
    table.add_row("Test Runner", "[green]OK[/green]" if pytest_ok else "[red]MISSING[/red]", py_details)

    console.print(table)


@app.command("index")
def index_cmd(
    commit: Optional[str] = typer.Option(None, "--commit", help="Optional commit SHA to record with index."),
):
    """Index source files, symbols, calls, and tests into the dependency graph."""
    try:
        project = RippleProject.open(".")
        with console.status("[bold cyan]Indexing repository into FalkorDB...[/bold cyan]"):
            summary = project.indexer.index(commit_sha=commit)

        table = Table(title="Repository Indexing Summary", border_style="green")
        table.add_column("Metric", style="bold")
        table.add_column("Count", justify="right")

        table.add_row("Files Scanned", str(summary.files_scanned))
        table.add_row("Symbols Indexed", str(summary.symbols_count))
        table.add_row("Test Cases Indexed", str(summary.test_cases_count))
        table.add_row("Call Edges (AST)", str(summary.call_edges_count))
        table.add_row("Coverage Links", str(summary.coverage_edges_count))
        table.add_row("Duration", f"{summary.duration_ms:.1f}ms")

        console.print(table)

        if summary.warnings:
            console.print("\n[bold yellow]Warnings:[/bold yellow]")
            for w in summary.warnings[:5]:
                console.print(f"  ! {w}")
    except Exception as e:
        err_console.print(f"[bold red]Error during indexing:[/bold red] {e}")
        raise typer.Exit(code=1)


@app.command("impact")
def impact_cmd(
    ref_range: str = typer.Argument("HEAD~1..HEAD", help="Git revision range e.g. origin/main..HEAD"),
    format: str = typer.Option("table", "--format", "-f", help="Output format: table | json"),
):
    """Analyze blast radius of changes and list affected callers and candidate tests."""
    try:
        project = RippleProject.open(".")
        # Ensure indexed
        project.indexer.index()

        parts = ref_range.split("..")
        base = parts[0] if len(parts) > 1 else "HEAD~1"
        head = parts[1] if len(parts) > 1 else ref_range

        with console.status("[bold cyan]Tracing change blast radius in graph...[/bold cyan]"):
            impact = project.analyzer.analyze(base=base, head=head)

        if format == "json":
            sys.stdout.write(impact.model_dump_json(indent=2) + "\n")
            return

        # Terminal table output
        console.print(Panel(
            f"[bold cyan]RippleCI Impact Analysis[/bold cyan]  |  [bold]{project.config.repository.id}[/bold]  |  {base}..{head}\n"
            f"Changed Files: [bold]{len(impact.changed_files)}[/bold]  |  "
            f"Modified Symbols: [bold]{len(impact.changed_symbols)}[/bold]  |  "
            f"Downstream Callers: [bold]{len(impact.impacted_symbols)}[/bold]  |  "
            f"Candidate Tests: [bold]{len(impact.candidate_tests)}[/bold]",
            border_style="cyan",
        ))

        if impact.changed_symbols:
            table_sym = Table(title="Directly Changed Symbols", border_style="blue")
            table_sym.add_column("Symbol Name")
            table_sym.add_column("File")
            table_sym.add_column("Lines")
            for s in impact.changed_symbols[:10]:
                table_sym.add_row(s.name, s.file_path, f"{s.start_line}-{s.end_line}")
            console.print(table_sym)

        if impact.impacted_symbols:
            table_imp = Table(title="Impacted Callers (Graph Traversal)", border_style="magenta")
            table_imp.add_column("Caller Symbol")
            table_imp.add_column("Hops", justify="right")
            table_imp.add_column("Call Path")
            for imp in impact.impacted_symbols[:10]:
                path_s = " -> ".join(imp.path_to_change)
                table_imp.add_row(imp.symbol.name, str(imp.hops_from_change), path_s)
            console.print(table_imp)

        if impact.candidate_tests:
            table_test = Table(title="Candidate Tests Connected Via Graph", border_style="green")
            table_test.add_column("Test Case")
            table_test.add_column("Direct?")
            table_test.add_column("Shortest Hops", justify="right")
            for t in impact.candidate_tests[:10]:
                is_dir = "[green]YES[/green]" if t.direct_coverage else "[yellow]INDIRECT[/yellow]"
                table_test.add_row(t.test_case.name, is_dir, str(t.shortest_hops))
            console.print(table_test)

        if impact.warnings:
            console.print("\n[bold yellow]Warnings & Uncertainties:[/bold yellow]")
            for w in impact.warnings:
                console.print(f"  ! {w}")

        console.print(f"\n[bold]Next recommendation:[/bold] Run [bold cyan]ripple plan --budget 300[/bold cyan]")
    except Exception as e:
        err_console.print(f"[bold red]Error during impact analysis:[/bold red] {e}")
        raise typer.Exit(code=1)


@app.command("plan")
def plan_cmd(
    ref_range: str = typer.Option("HEAD~1..HEAD", "--range", "-r", help="Git revision range e.g. origin/main..HEAD"),
    budget: float = typer.Option(300.0, "--budget", "-b", help="Execution time budget in seconds."),
    format: str = typer.Option("table", "--format", "-f", help="Output format: table | json"),
):
    """Rank and select candidate tests within an execution time budget."""
    try:
        project = RippleProject.open(".")
        project.indexer.index()

        parts = ref_range.split("..")
        base = parts[0] if len(parts) > 1 else "HEAD~1"
        head = parts[1] if len(parts) > 1 else ref_range

        impact = project.analyzer.analyze(base=base, head=head)
        plan = project.planner.plan(impact=impact, budget_seconds=budget)

        if format == "json":
            sys.stdout.write(plan.model_dump_json(indent=2) + "\n")
            return

        table = Table(
            title=f"Selected Test Plan ({plan.ranker_type} | Budget: {plan.budget_seconds:.0f}s)",
            border_style="green",
        )
        table.add_column("Rank", justify="right", style="bold")
        table.add_column("Test Case", style="cyan")
        table.add_column("Score", justify="right")
        table.add_column("Est. Duration", justify="right")
        table.add_column("Reasons")

        for t in plan.selected_tests:
            reasons_text = "; ".join(t.reasons)
            table.add_row(str(t.rank), t.name, f"{t.rank_score:.2f}", f"{t.estimated_duration_seconds:.1f}s", reasons_text)

        console.print(table)
        console.print(
            f"Selected [bold green]{len(plan.selected_tests)}[/bold green] tests | "
            f"Estimated total duration: [bold]{plan.estimated_total_seconds:.1f}s[/bold] | "
            f"Omitted: {plan.deselected_tests_count}"
        )

        if plan.fallback_recommendation:
            console.print(f"[yellow]Notice: {plan.fallback_recommendation}[/yellow]")
    except Exception as e:
        err_console.print(f"[bold red]Error during test planning:[/bold red] {e}")
        raise typer.Exit(code=1)


@app.command("verify")
def verify_cmd(
    ref_range: str = typer.Option("HEAD~1..HEAD", "--range", "-r", help="Git revision range e.g. origin/main..HEAD"),
    budget: float = typer.Option(300.0, "--budget", "-b", help="Test execution budget in seconds."),
    mutations: int = typer.Option(5, "--mutations", "-m", help="Max bounded mutations to test."),
    format: str = typer.Option("table", "--format", "-f", help="Output format: table | json"),
):
    """Execute selected tests and bounded mutations to verify release safety."""
    try:
        project = RippleProject.open(".")
        project.indexer.index()

        parts = ref_range.split("..")
        base = parts[0] if len(parts) > 1 else "HEAD~1"
        head = parts[1] if len(parts) > 1 else ref_range

        with console.status("[bold cyan]Running impact analysis and test planning...[/bold cyan]"):
            impact = project.analyzer.analyze(base=base, head=head)
            plan = project.planner.plan(impact=impact, budget_seconds=budget)

        with console.status("[bold cyan]Executing selected tests and bounded mutations...[/bold cyan]"):
            verification = project.verifier.verify(plan=plan, max_mutations=mutations)

        if format == "json":
            sys.stdout.write(verification.model_dump_json(indent=2) + "\n")
            return

        table = Table(title="Verification Results", border_style="cyan")
        table.add_column("Metric", style="bold")
        table.add_column("Result")

        all_p = "[bold green]YES[/bold green]" if verification.all_passed else "[bold red]NO (FAILURES DETECTED)[/bold red]"
        table.add_row("All Tests Passed", all_p)
        table.add_row("Tests Executed", f"{verification.tests_passed_count}/{verification.tests_executed_count} passed")
        table.add_row("Mutations Tested", str(verification.mutations_tested_count))
        table.add_row("Mutations Killed", f"{verification.killed_mutations_count} ({verification.mutation_score * 100:.1f}%)")
        table.add_row("Surviving Mutants", str(verification.survived_mutations_count))
        table.add_row("Wall Time", f"{verification.total_wall_time_seconds:.2f}s")
        table.add_row("Release Recommendation", f"[bold]{verification.recommendation.upper()}[/bold]")

        console.print(table)

        if verification.surviving_mutants:
            console.print("\n[bold yellow]Surviving Mutants (Potential Blind Spots):[/bold yellow]")
            for sm in verification.surviving_mutants:
                console.print(f"  ! {sm.file_path}:{sm.line} ({sm.operator})")

        if not verification.all_passed:
            raise typer.Exit(code=5)
    except typer.Exit:
        raise
    except Exception as e:
        err_console.print(f"[bold red]Error during verification:[/bold red] {e}")
        raise typer.Exit(code=1)


@app.command("report")
def report_cmd(
    ref_range: str = typer.Option("HEAD~1..HEAD", "--range", "-r", help="Git revision range e.g. origin/main..HEAD"),
    budget: float = typer.Option(300.0, "--budget", "-b", help="Test execution budget in seconds."),
    format: str = typer.Option("markdown", "--format", "-f", help="Output format: markdown | json"),
):
    """Generate a comprehensive Markdown or JSON release intelligence report."""
    try:
        project = RippleProject.open(".")
        project.indexer.index()

        parts = ref_range.split("..")
        base = parts[0] if len(parts) > 1 else "HEAD~1"
        head = parts[1] if len(parts) > 1 else ref_range

        impact = project.analyzer.analyze(base=base, head=head)
        plan = project.planner.plan(impact=impact, budget_seconds=budget)
        report = project.reporter.build(impact=impact, plan=plan)

        if format == "json":
            sys.stdout.write(project.reporter.to_json(report) + "\n")
        else:
            sys.stdout.write(project.reporter.to_markdown(report) + "\n")
    except Exception as e:
        err_console.print(f"[bold red]Error generating report:[/bold red] {e}")
@app.command("explain")
def explain_cmd(
    test_id: str = typer.Argument(..., help="Test name or node ID to explain."),
    ref_range: str = typer.Option("HEAD~1..HEAD", "--range", "-r", help="Git revision range e.g. origin/main..HEAD"),
    budget: float = typer.Option(300.0, "--budget", "-b", help="Test execution budget in seconds."),
):
    """Explain why a specific test was selected using graph paths and model features."""
    try:
        project = RippleProject.open(".")
        project.indexer.index()

        parts = ref_range.split("..")
        base = parts[0] if len(parts) > 1 else "HEAD~1"
        head = parts[1] if len(parts) > 1 else ref_range

        impact = project.analyzer.analyze(base=base, head=head)
        plan = project.planner.plan(impact=impact, budget_seconds=budget)

        explanation = project.agent.explain_test(test_id, plan)
        if not explanation:
            console.print(f"[yellow]Test '{test_id}' was not selected in the test plan for {ref_range}.[/yellow]")
            return

        table = Table(title=f"Test Selection Explanation: {explanation.test_name}", border_style="cyan")
        table.add_column("Property", style="bold")
        table.add_column("Value")

        table.add_row("Test Identifier", explanation.test_id)
        table.add_row("Plan Rank", f"#{explanation.rank}")
        table.add_row("ML Relevance Score", f"{explanation.rank_score:.4f}")
        table.add_row("Direct Coverage", "[green]YES[/green]" if explanation.is_direct else "[yellow]INDIRECT[/yellow]")
        table.add_row("Selection Reasons", "; ".join(explanation.reasons))
        table.add_row("Summary", explanation.summary)

        console.print(table)
    except Exception as e:
        err_console.print(f"[bold red]Error explaining test:[/bold red] {e}")
        raise typer.Exit(code=1)


@app.command("investigate")
def investigate_cmd(
    ref_range: str = typer.Argument("HEAD~1..HEAD", help="Git revision range e.g. origin/main..HEAD"),
    budget: float = typer.Option(300.0, "--budget", "-b", help="Test budget in seconds."),
):
    """Run agent tool-directed investigation and summarize blast radius and test decisions."""
    try:
        project = RippleProject.open(".")
        project.indexer.index()

        parts = ref_range.split("..")
        base = parts[0] if len(parts) > 1 else "HEAD~1"
        head = parts[1] if len(parts) > 1 else ref_range

        with console.status("[bold cyan]Agent executing graph tools...[/bold cyan]"):
            result = project.agent.investigate_change(base_ref=base, head_ref=head, budget_seconds=budget)

        console.print(Panel(
            f"[bold cyan]Agent Investigation Summary[/bold cyan]  |  {base}..{head}\n"
            f"Verdict: [bold green]{result.verdict}[/bold green]  |  "
            f"Modified Symbols: {result.changed_symbols_count}  |  "
            f"Impacted Callers: {result.impacted_callers_count}  |  "
            f"Selected Tests: {result.selected_tests_count} ({result.estimated_duration_seconds:.1f}s)",
            border_style="cyan",
        ))

        console.print("\n[bold]Tool Execution Trace:[/bold]")
        for step in result.tool_trace:
            console.print(f"  → [cyan]{step}[/cyan]")

        console.print("\n" + result.evidence_summary)
    except Exception as e:
        err_console.print(f"[bold red]Error during investigation:[/bold red] {e}")
        raise typer.Exit(code=1)


@app.command("benchmark")
def benchmark_cmd(
    format: str = typer.Option("table", "--format", "-f", help="Output format: table | json"),
    output: Optional[Path] = typer.Option(None, "--output", "-o", help="Optional output path for JSON results."),
):
    """Run regression test selection benchmark comparing full-suite, file-heuristic, graph, and ML."""
    try:
        from rippleci.ranking.evaluation import run_benchmark_evaluation
        project = RippleProject.open(".")
        with console.status("[bold cyan]Running 4-strategy regression benchmark...[/bold cyan]"):
            results = run_benchmark_evaluation(project.root, output_path=output)

        if format == "json":
            sys.stdout.write(json.dumps(results.to_dict(), indent=2) + "\n")
            return

        table = Table(title="Regression Test Selection Benchmark (4 Strategies)", border_style="cyan")
        table.add_column("Strategy", style="bold")
        table.add_column("Selection Ratio", justify="right")
        table.add_column("Avg. Duration", justify="right")
        table.add_column("Fault Recall", justify="right")
        table.add_column("Missed Scenarios")

        for s_name, m in results.strategies.items():
            recall_text = f"[bold green]{m.fault_recall * 100:.1f}%[/bold green]" if m.fault_recall == 1.0 else f"[yellow]{m.fault_recall * 100:.1f}%[/yellow]"
            missed_text = ", ".join(m.missed_scenarios) if m.missed_scenarios else "[green]None[/green]"
            table.add_row(
                s_name,
                f"{m.selection_ratio * 100:.1f}%",
                f"{m.estimated_duration_s:.1f}s",
                recall_text,
                missed_text,
            )

        console.print(table)
    except Exception as e:
        err_console.print(f"[bold red]Error running benchmark:[/bold red] {e}")
        raise typer.Exit(code=1)


@graph_app.command("status")
def graph_status_cmd():
    """Display connection status and entity counts in the FalkorDB graph."""
    try:
        project = RippleProject.open(".")
        counts = project.graph.get_graph_counts()
        is_h = project.graph.is_healthy()

        table = Table(title=f"Graph Status: {project.config.graph.graph_name}", border_style="cyan")
        table.add_column("Property", style="bold")
        table.add_column("Value")

        status_text = "[green]HEALTHY[/green]" if is_h else "[yellow]OFFLINE (Memory Mode)[/yellow]"
        table.add_row("Connection Status", status_text)
        table.add_row("FalkorDB URL", project.config.graph.url)
        for k, v in counts.items():
            table.add_row(f"Node/Edge: {k}", str(v))

        console.print(table)
    except Exception as e:
        err_console.print(f"[bold red]Graph error:[/bold red] {e}")
        raise typer.Exit(code=3)


@config_app.command("show")
def config_show_cmd():
    """Print the active non-secret configuration."""
    project = RippleProject.open(".")
    cfg = project.config.model_dump()
    # Strip any potential secrets
    if "graph" in cfg and "password" in cfg["graph"]:
        cfg["graph"]["password"] = "******" if cfg["graph"]["password"] else None
    sys.stdout.write(json.dumps(cfg, indent=2) + "\n")


@config_app.command("validate")
def config_validate_cmd():
    """Validate current .ripple.yml configuration."""
    try:
        project = RippleProject.open(".")
        console.print("[green]Configuration is valid![/green]")
    except Exception as e:
        err_console.print(f"[red]Configuration invalid:[/red] {e}")
        raise typer.Exit(code=2)


if __name__ == "__main__":
    app()
