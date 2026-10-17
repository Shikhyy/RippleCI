"""Python AST parser extracting files, symbols, imports, and call relationships."""

import ast
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
from rippleci.core.models import SymbolKind


@dataclass
class ParsedSymbol:
    name: str
    qualified_name: str
    kind: SymbolKind
    file_path: str
    start_line: int
    end_line: int


@dataclass
class ParsedCall:
    caller_qualified_name: str
    callee_name: str
    callee_qualified_name: Optional[str]
    line: int
    resolved: bool


@dataclass
class ModuleParseResult:
    file_path: str
    content_hash: str
    symbols: List[ParsedSymbol] = field(default_factory=list)
    calls: List[ParsedCall] = field(default_factory=list)
    imports: Dict[str, str] = field(default_factory=dict)  # local alias -> qualified target
    imported_modules: Set[str] = field(default_factory=set)
    unresolved_calls: List[ParsedCall] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


class AstSymbolVisitor(ast.NodeVisitor):
    """Visits Python AST to collect classes, functions, and methods."""

    def __init__(self, rel_path: str, module_name: str):
        self.rel_path = rel_path
        self.module_name = module_name
        self.symbols: List[ParsedSymbol] = []
        self.scope_stack: List[Tuple[str, SymbolKind]] = []
        self.calls: List[ParsedCall] = []
        self.imports: Dict[str, str] = {}
        self.imported_modules: Set[str] = {}
        self.warnings: List[str] = []

    def _current_qualified_name(self, name: str) -> str:
        parts = [self.module_name] + [s[0] for s in self.scope_stack] + [name]
        return ".".join(p for p in parts if p)

    def _current_caller(self) -> Optional[str]:
        if not self.scope_stack:
            return None
        # Return innermost function/method
        for name, kind in reversed(self.scope_stack):
            if kind in (SymbolKind.FUNCTION, SymbolKind.METHOD):
                parts = [self.module_name]
                for s_name, _ in self.scope_stack:
                    parts.append(s_name)
                    if s_name == name:
                        break
                return ".".join(p for p in parts if p)
        return None

    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            asname = alias.asname or alias.name
            self.imports[asname] = alias.name
            if isinstance(self.imported_modules, set):
                self.imported_modules.add(alias.name)
            else:
                self.imported_modules = {alias.name}
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        mod = node.module or ""
        for alias in node.names:
            asname = alias.asname or alias.name
            target = f"{mod}.{alias.name}" if mod else alias.name
            self.imports[asname] = target
        if mod:
            if isinstance(self.imported_modules, set):
                self.imported_modules.add(mod)
            else:
                self.imported_modules = {mod}
        self.generic_visit(node)

    def visit_ClassDef(self, node: ast.ClassDef) -> None:
        qname = self._current_qualified_name(node.name)
        end_line = getattr(node, "end_lineno", node.lineno)
        self.symbols.append(
            ParsedSymbol(
                name=node.name,
                qualified_name=qname,
                kind=SymbolKind.CLASS,
                file_path=self.rel_path,
                start_line=node.lineno,
                end_line=end_line,
            )
        )
        self.scope_stack.append((node.name, SymbolKind.CLASS))
        self.generic_visit(node)
        self.scope_stack.pop()

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self._handle_function(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
        self._handle_function(node)

    def _handle_function(self, node: ast.AST) -> None:
        is_method = bool(self.scope_stack and self.scope_stack[-1][1] == SymbolKind.CLASS)
        kind = SymbolKind.METHOD if is_method else SymbolKind.FUNCTION
        func_name = getattr(node, "name", "unknown")
        qname = self._current_qualified_name(func_name)
        end_line = getattr(node, "end_lineno", getattr(node, "lineno", 1))

        self.symbols.append(
            ParsedSymbol(
                name=func_name,
                qualified_name=qname,
                kind=kind,
                file_path=self.rel_path,
                start_line=getattr(node, "lineno", 1),
                end_line=end_line,
            )
        )
        self.scope_stack.append((func_name, kind))
        self.generic_visit(node)
        self.scope_stack.pop()

    def visit_Call(self, node: ast.Call) -> None:
        caller = self._current_caller()
        if caller:
            callee_name = ""
            callee_qname = None
            resolved = False

            if isinstance(node.func, ast.Name):
                callee_name = node.func.id
                # Check imports
                if callee_name in self.imports:
                    callee_qname = self.imports[callee_name]
                    resolved = True
                else:
                    # Same module function?
                    callee_qname = f"{self.module_name}.{callee_name}"
                    resolved = True
            elif isinstance(node.func, ast.Attribute):
                callee_name = node.func.attr
                if isinstance(node.func.value, ast.Name):
                    base = node.func.value.id
                    if base in self.imports:
                        callee_qname = f"{self.imports[base]}.{callee_name}"
                        resolved = True
                    elif base == "self" and self.scope_stack:
                        # Method calling another method on self
                        class_name = self.scope_stack[0][0]
                        callee_qname = f"{self.module_name}.{class_name}.{callee_name}"
                        resolved = True
                    else:
                        callee_qname = f"{base}.{callee_name}"
                        resolved = False

            self.calls.append(
                ParsedCall(
                    caller_qualified_name=caller,
                    callee_name=callee_name or "unknown",
                    callee_qualified_name=callee_qname,
                    line=node.lineno,
                    resolved=resolved,
                )
            )

        self.generic_visit(node)


def parse_python_file(file_path: Path, repo_root: Path, content_hash: str) -> ModuleParseResult:
    """Parse a single Python file into symbols, imports, and calls."""
    rel_path = str(file_path.relative_to(repo_root)).replace("\\", "/")
    # Derive module name e.g. src/auth.py -> src.auth
    mod_parts = list(file_path.relative_to(repo_root).with_suffix("").parts)
    module_name = ".".join(mod_parts)

    result = ModuleParseResult(file_path=rel_path, content_hash=content_hash)

    try:
        source = file_path.read_text(encoding="utf-8")
        tree = ast.parse(source, filename=str(file_path))
    except SyntaxError as e:
        result.warnings.append(f"Syntax error in {rel_path} line {e.lineno}: {e.msg}")
        return result
    except Exception as e:
        result.warnings.append(f"Failed to read or parse {rel_path}: {e}")
        return result

    visitor = AstSymbolVisitor(rel_path=rel_path, module_name=module_name)
    visitor.visit(tree)

    result.symbols = visitor.symbols
    result.imports = visitor.imports
    result.imported_modules = set(visitor.imported_modules) if visitor.imported_modules else set()
    result.warnings.extend(visitor.warnings)

    for call in visitor.calls:
        if call.resolved:
            result.calls.append(call)
        else:
            result.unresolved_calls.append(call)

    return result
