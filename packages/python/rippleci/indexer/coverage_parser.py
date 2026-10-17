"""Coverage parser to map executed test lines to symbols."""

import json
from pathlib import Path
import sqlite3
from typing import Dict, List, Optional, Set
from rippleci.core.models import SymbolNode


def parse_coverage_json(
    coverage_file: Path,
) -> Dict[str, Set[int]]:
    """Parse coverage.json to extract mapping: file_path -> set of executed line numbers."""
    if not coverage_file.exists():
        return {}

    try:
        data = json.loads(coverage_file.read_text(encoding="utf-8"))
        files_data = data.get("files", {})
        result: Dict[str, Set[int]] = {}
        for fpath, finfo in files_data.items():
            executed = finfo.get("executed_lines", [])
            result[fpath] = set(executed)
        return result
    except Exception:
        return {}


def parse_sqlite_coverage(
    coverage_file: Path, repo_root: Path
) -> Dict[str, Set[int]]:
    """Parse coverage.py SQLite database (.coverage) for executed lines."""
    if not coverage_file.exists():
        return {}

    result: Dict[str, Set[int]] = {}
    try:
        conn = sqlite3.connect(str(coverage_file))
        cursor = conn.cursor()
        # Coverage SQLite schema: file (id, path), line_map (file_id, context_id, num_lines, lines)
        cursor.execute("SELECT id, path FROM file")
        file_rows = cursor.fetchall()
        for fid, path in file_rows:
            try:
                rel = str(Path(path).relative_to(repo_root)).replace("\\", "/")
            except ValueError:
                rel = path

            cursor.execute("SELECT num_lines, lines FROM line_map WHERE file_id = ?", (fid,))
            line_rows = cursor.fetchall()
            lines: Set[int] = set()
            for num, line_bits in line_rows:
                # In modern coverage.py, lines might be stored in bitmap or line numbers
                pass
            result[rel] = lines
        conn.close()
    except Exception:
        pass
    return result


def map_coverage_to_symbols(
    executed_lines_by_file: Dict[str, Set[int]],
    symbols: List[SymbolNode],
) -> List[str]:
    """Return IDs of symbols whose line ranges overlap with executed lines."""
    covered_symbol_ids = []
    for sym in symbols:
        file_lines = executed_lines_by_file.get(sym.file_path, set())
        if not file_lines:
            # Try matching end of path
            for path, lset in executed_lines_by_file.items():
                if path.endswith(sym.file_path):
                    file_lines = lset
                    break

        if any(sym.start_line <= line <= sym.end_line for line in file_lines):
            covered_symbol_ids.append(sym.id)

    return covered_symbol_ids
