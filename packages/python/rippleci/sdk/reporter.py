"""Report builder generating structured JSON and Markdown release intelligence reports."""

import json
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from rippleci.core.models import (
    CandidateTest,
    EvidencePath,
    ImpactReport,
    ImpactedSymbol,
    SelectedTest,
    TestPlan,
    VerificationReport,
)


class RippleReport(BaseModel):
    """Unified release intelligence report."""

    repo_id: str
    run_id: str
    base_ref: str
    head_ref: str
    base_sha: str
    head_sha: str
    impact: ImpactReport
    plan: Optional[TestPlan] = None
    verification: Optional[VerificationReport] = None
    recommendation: str = "proceed"
    summary: str = ""
    created_at: str


class ReportBuilder:
    """Formats and compiles unified reports."""

    def build(
        self,
        impact: ImpactReport,
        plan: Optional[TestPlan] = None,
        verification: Optional[VerificationReport] = None,
    ) -> RippleReport:
        rec = "proceed"
        if verification:
            rec = verification.recommendation
        elif plan and plan.fallback_recommendation:
            rec = "review_required"
        elif impact.recommendation != "proceed":
            rec = impact.recommendation

        summary_parts = [
            f"RippleCI Release Intelligence Report for {impact.repo_id}",
            f"Range: {impact.base_ref}..{impact.head_ref} ({len(impact.changed_files)} changed files)",
            f"Impact: {len(impact.changed_symbols)} changed symbols, {len(impact.impacted_symbols)} downstream callers",
            f"Tests: {len(impact.candidate_tests)} candidate tests identified",
        ]

        if plan:
            summary_parts.append(
                f"Selected: {len(plan.selected_tests)} tests ({plan.estimated_total_seconds:.1f}s estimated duration)"
            )

        if verification:
            summary_parts.append(
                f"Verification: {verification.tests_passed_count}/{verification.tests_executed_count} passed, "
                f"{verification.killed_mutations_count}/{verification.mutations_tested_count} mutants killed "
                f"(score: {verification.mutation_score * 100:.1f}%)"
            )

        summary_parts.append(f"Recommendation: {rec.upper()}")

        return RippleReport(
            repo_id=impact.repo_id,
            run_id=impact.run_id,
            base_ref=impact.base_ref,
            head_ref=impact.head_ref,
            base_sha=impact.base_sha,
            head_sha=impact.head_sha,
            impact=impact,
            plan=plan,
            verification=verification,
            recommendation=rec,
            summary="\n".join(summary_parts),
            created_at=impact.created_at,
        )

    def to_markdown(self, report: RippleReport) -> str:
        """Render report as formatted GitHub-compatible Markdown."""
        lines = [
            f"# RippleCI Release Intelligence Report",
            f"",
            f"**Repository:** `{report.repo_id}`  ",
            f"**Commit Range:** `{report.base_ref}..{report.head_ref}`  ",
            f"**Recommendation:** `{report.recommendation.upper()}`  ",
            f"",
            f"---",
            f"",
            f"## Change Impact Blast Radius",
            f"",
            f"- **Changed files:** {len(report.impact.changed_files)}",
            f"- **Directly modified symbols:** {len(report.impact.changed_symbols)}",
            f"- **Downstream affected callers:** {len(report.impact.impacted_symbols)}",
            f"- **Candidate tests connected via graph:** {len(report.impact.candidate_tests)}",
            f"",
        ]

        if report.impact.changed_symbols:
            lines.extend([
                f"### Modified Symbols",
                f"",
                f"| Symbol | File | Lines |",
                f"|---|---|---|",
            ])
            for s in report.impact.changed_symbols[:10]:
                lines.append(f"| `{s.name}` | `{s.file_path}` | {s.start_line}–{s.end_line} |")
            lines.append("")

        if report.impact.impacted_symbols:
            lines.extend([
                f"### Downstream Impacted Callers (Graph Traversal)",
                f"",
                f"| Caller Symbol | Hops | Call Path |",
                f"|---|---|---|",
            ])
            for imp in report.impact.impacted_symbols[:10]:
                path_str = " → ".join(imp.path_to_change)
                lines.append(f"| `{imp.symbol.name}` | {imp.hops_from_change} | `{path_str}` |")
            lines.append("")

        if report.plan:
            lines.extend([
                f"## ML-Ranked Test Plan",
                f"",
                f"- **Budget:** {report.plan.budget_seconds}s",
                f"- **Predicted Duration:** {report.plan.estimated_total_seconds}s",
                f"- **Ranker:** `{report.plan.ranker_type}` ({report.plan.ranker_version})",
                f"",
                f"| Rank | Test Node ID | Score | Reasons |",
                f"|---|---|---|---|",
            ])
            for t in report.plan.selected_tests:
                reasons_str = "; ".join(t.reasons)
                lines.append(f"| {t.rank} | `{t.name}` | {t.rank_score:.2f} | {reasons_str} |")
            lines.append("")

        if report.verification:
            v = report.verification
            lines.extend([
                f"## Verification Evidence",
                f"",
                f"- **Tests Executed:** {v.tests_executed_count} ({v.tests_passed_count} passed, {v.tests_failed_count} failed)",
                f"- **Mutations Tested:** {v.mutations_tested_count} ({v.killed_mutations_count} killed, {v.survived_mutations_count} survived)",
                f"- **Mutation Kill Score:** {v.mutation_score * 100:.1f}%",
                f"- **Execution Time:** {v.total_wall_time_seconds}s",
                f"- **Status:** `{v.recommendation.upper()}`",
                f"",
            ])
            if v.surviving_mutants:
                lines.extend([
                    f"### Surviving Mutants (Review Needed)",
                    f"",
                    f"| File | Line | Mutation Operator |",
                    f"|---|---|---|",
                ])
                for m in v.surviving_mutants:
                    lines.append(f"| `{m.file_path}` | {m.line} | `{m.operator}` |")
                lines.append("")

        if report.impact.warnings:
            lines.extend([
                f"## Warnings & Uncertainties",
                f"",
            ])
            for w in report.impact.warnings:
                lines.append(f"- ⚠️ {w}")
            lines.append("")

        return "\n".join(lines)

    def to_json(self, report: RippleReport) -> str:
        """Render report as formatted JSON."""
        return report.model_dump_json(indent=2)
