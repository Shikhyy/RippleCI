"""Bounded AST mutation engine for verifying test suite defect-detection capability."""

import ast
from dataclasses import dataclass
from pathlib import Path
import shutil
import tempfile
from typing import List, Optional
import uuid

from rippleci.core.models import MutationResult, TestPlan
from rippleci.verification.test_runner import SafeTestRunner


@dataclass
class MutationSpec:
    mutation_id: str
    target_symbol_id: str
    file_path: str
    line: int
    operator: str
    original_code: str
    mutated_code: str


class AstMutationGenerator(ast.NodeVisitor):
    """Generates bounded AST candidate mutations."""

    def __init__(self, rel_path: str, max_candidates: int = 10):
        self.rel_path = rel_path
        self.max_candidates = max_candidates
        self.candidates: List[MutationSpec] = []

    def visit_Compare(self, node: ast.Compare) -> None:
        if len(self.candidates) < self.max_candidates:
            # Invert comparison operator
            for i, op in enumerate(node.ops):
                inv_op = None
                op_name = op.__class__.__name__
                if isinstance(op, ast.Eq):
                    inv_op = "!="
                elif isinstance(op, ast.NotEq):
                    inv_op = "=="
                elif isinstance(op, ast.Gt):
                    inv_op = "<="
                elif isinstance(op, ast.Lt):
                    inv_op = ">="
                elif isinstance(op, ast.GtE):
                    inv_op = "<"
                elif isinstance(op, ast.LtE):
                    inv_op = ">"

                if inv_op:
                    self.candidates.append(
                        MutationSpec(
                            mutation_id=f"mut_{uuid.uuid4().hex[:8]}",
                            target_symbol_id=f"{self.rel_path}::line_{node.lineno}",
                            file_path=self.rel_path,
                            line=node.lineno,
                            operator=f"INVERT_OP_{op_name}",
                            original_code=op_name,
                            mutated_code=inv_op,
                        )
                    )
        self.generic_visit(node)

    def visit_Constant(self, node: ast.Constant) -> None:
        if len(self.candidates) < self.max_candidates:
            if isinstance(node.value, bool):
                self.candidates.append(
                    MutationSpec(
                        mutation_id=f"mut_{uuid.uuid4().hex[:8]}",
                        target_symbol_id=f"{self.rel_path}::line_{node.lineno}",
                        file_path=self.rel_path,
                        line=node.lineno,
                        operator="INVERT_BOOLEAN",
                        original_code=str(node.value),
                        mutated_code=str(not node.value),
                    )
                )
        self.generic_visit(node)


class BoundedMutator:
    """Applies bounded mutations and checks if selected tests kill them."""

    def __init__(self, repo_root: Path, runner: SafeTestRunner):
        self.repo_root = repo_root.resolve()
        self.runner = runner

    def run_bounded_mutations(
        self,
        target_files: List[str],
        plan: TestPlan,
        max_mutations: int = 5,
    ) -> List[MutationResult]:
        results: List[MutationResult] = []
        selected_node_ids = [st.node_id for st in plan.selected_tests]
        if not selected_node_ids:
            return results

        candidates: List[MutationSpec] = []
        for rel_file in target_files:
            if not rel_file.endswith(".py") or "test" in rel_file:
                continue
            full_path = self.repo_root / rel_file
            if not full_path.exists():
                continue

            try:
                content = full_path.read_text(encoding="utf-8")
                tree = ast.parse(content)
                gen = AstMutationGenerator(rel_file, max_candidates=max_mutations)
                gen.visit(tree)
                candidates.extend(gen.candidates)
            except Exception:
                continue

        # Cap candidates to max_mutations
        capped_candidates = candidates[:max_mutations]

        # Execute mutations safely with automatic rollback
        for mut in capped_candidates:
            target_path = self.repo_root / mut.file_path
            backup_content = target_path.read_text(encoding="utf-8")

            # Apply line-based mutation
            lines = backup_content.splitlines(keepends=True)
            if 0 < mut.line <= len(lines):
                orig_line = lines[mut.line - 1]
                mutated_line = orig_line

                if mut.operator == "INVERT_BOOLEAN":
                    if "True" in orig_line:
                        mutated_line = orig_line.replace("True", "False", 1)
                    elif "False" in orig_line:
                        mutated_line = orig_line.replace("False", "True", 1)
                elif "INVERT_OP" in mut.operator:
                    for sym, rep in [("==", "!="), ("!=", "=="), ("<=", ">"), (">=", "<"), ("<", ">="), (">", "<=")]:
                        if sym in orig_line:
                            mutated_line = orig_line.replace(sym, rep, 1)
                            break

                if mutated_line != orig_line:
                    lines[mut.line - 1] = mutated_line
                    try:
                        # Write mutated content
                        target_path.write_text("".join(lines), encoding="utf-8")

                        # Run selected tests against mutant
                        test_execs = self.runner.run_tests(selected_node_ids)

                        # Did any test fail?
                        failed_test = next(
                            (t for t in test_execs if t.status in ("failed", "timed_out")), None
                        )
                        if failed_test:
                            results.append(
                                MutationResult(
                                    mutation_id=mut.mutation_id,
                                    target_symbol_id=mut.target_symbol_id,
                                    file_path=mut.file_path,
                                    line=mut.line,
                                    operator=mut.operator,
                                    status="killed",
                                    killed_by_test_id=failed_test.node_id,
                                )
                            )
                        else:
                            # Tests passed despite mutation -> Mutant SURVIVED
                            results.append(
                                MutationResult(
                                    mutation_id=mut.mutation_id,
                                    target_symbol_id=mut.target_symbol_id,
                                    file_path=mut.file_path,
                                    line=mut.line,
                                    operator=mut.operator,
                                    status="survived",
                                    killed_by_test_id=None,
                                )
                            )
                    finally:
                        # ALWAYS restore original file content
                        target_path.write_text(backup_content, encoding="utf-8")

        return results
