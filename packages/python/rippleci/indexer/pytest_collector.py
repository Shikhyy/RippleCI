"""Collector for test cases and test-to-symbol relationships."""

import ast
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Set
from rippleci.core.models import TestCaseNode


@dataclass
class CollectedTest:
    node_id: str
    name: str
    file_path: str
    framework: str = "pytest"
    called_symbols: Set[str] = field(default_factory=set)
    imported_symbols: Set[str] = field(default_factory=set)


class TestVisitor(ast.NodeVisitor):
    def __init__(self, rel_path: str):
        self.rel_path = rel_path
        self.tests: List[CollectedTest] = []
        self.current_class: Optional[str] = None
        self.imports: Dict[str, str] = {}
        self.current_test: Optional[CollectedTest] = None

    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            asname = alias.asname or alias.name
            self.imports[asname] = alias.name
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        mod = node.module or ""
        for alias in node.names:
            asname = alias.asname or alias.name
            self.imports[asname] = f"{mod}.{alias.name}" if mod else alias.name
        self.generic_visit(node)

    def visit_ClassDef(self, node: ast.ClassDef) -> None:
        if node.name.startswith("Test"):
            prev_class = self.current_class
            self.current_class = node.name
            self.generic_visit(node)
            self.current_class = prev_class
        else:
            self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self._handle_function(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
        self._handle_function(node)

    def _handle_function(self, node: ast.AST) -> None:
        func_name = getattr(node, "name", "")
        if func_name.startswith("test_") or func_name.endswith("_test"):
            if self.current_class:
                node_id = f"{self.rel_path}::{self.current_class}::{func_name}"
            else:
                node_id = f"{self.rel_path}::{func_name}"

            test = CollectedTest(
                node_id=node_id,
                name=func_name,
                file_path=self.rel_path,
                imported_symbols=set(self.imports.values()),
            )
            self.current_test = test
            self.generic_visit(node)
            self.tests.append(test)
            self.current_test = None
        else:
            self.generic_visit(node)

    def visit_Call(self, node: ast.Call) -> None:
        if self.current_test:
            if isinstance(node.func, ast.Name):
                callee_name = node.func.id
                if callee_name in self.imports:
                    self.current_test.called_symbols.add(self.imports[callee_name])
                else:
                    self.current_test.called_symbols.add(callee_name)
            elif isinstance(node.func, ast.Attribute):
                attr_name = node.func.attr
                if isinstance(node.func.value, ast.Name):
                    base = node.func.value.id
                    if base in self.imports:
                        self.current_test.called_symbols.add(f"{self.imports[base]}.{attr_name}")
                    else:
                        self.current_test.called_symbols.add(f"{base}.{attr_name}")
        self.generic_visit(node)


def collect_tests_from_file(file_path: Path, repo_root: Path) -> List[CollectedTest]:
    """Parse test file and extract test cases with their symbol call evidence."""
    rel_path = str(file_path.relative_to(repo_root)).replace("\\", "/")
    try:
        source = file_path.read_text(encoding="utf-8")
        tree = ast.parse(source, filename=str(file_path))
    except Exception:
        return []

    visitor = TestVisitor(rel_path=rel_path)
    visitor.visit(tree)
    return visitor.tests
