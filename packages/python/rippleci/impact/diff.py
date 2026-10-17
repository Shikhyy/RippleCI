"""Git diff parser and symbol line mapping."""

from dataclasses import dataclass, field
from pathlib import Path
import re
import subprocess
from typing import Dict, List, Optional, Set
from rippleci.core.models import SymbolNode


@dataclass
class FileDiff:
    file_path: str
    added_lines: List[int] = field(default_factory=list)
    modified_lines: List[int] = field(default_factory=list)
    deleted_lines: List[int] = field(default_factory=list)
    is_deleted: bool = False
    is_new: bool = False


@dataclass
class DiffResult:
    base_ref: str
    head_ref: str
    base_sha: str
    head_sha: str
    files: List[FileDiff] = field(default_factory=list)
    raw_diff: str = ""


HUNK_RE = re.compile(r"^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@")


def parse_unified_diff(diff_text: str) -> List[FileDiff]:
    """Parse unified git diff output into per-file modified line numbers."""
    file_diffs: List[FileDiff] = []
    current_file: Optional[FileDiff] = None
    current_line = 0

    for line in diff_text.splitlines():
        if line.startswith("diff --git "):
            # Format: diff --git a/path/to/file b/path/to/file
            parts = line.split(" ")
            if len(parts) >= 4:
                b_path = parts[3]
                if b_path.startswith("b/"):
                    b_path = b_path[2:]
                current_file = FileDiff(file_path=b_path)
                file_diffs.append(current_file)
            continue

        if current_file is None:
            continue

        if line.startswith("new file mode"):
            current_file.is_new = True
            continue
        if line.startswith("deleted file mode"):
            current_file.is_deleted = True
            continue

        hunk_match = HUNK_RE.match(line)
        if hunk_match:
            # +new_start,new_count
            new_start = int(hunk_match.group(3))
            current_line = new_start
            continue

        if line.startswith("+") and not line.startswith("+++"):
            current_file.added_lines.append(current_line)
            current_file.modified_lines.append(current_line)
            current_line += 1
        elif line.startswith("-") and not line.startswith("---"):
            current_file.deleted_lines.append(current_line)
        elif not line.startswith("\\"):
            # Context line
            current_line += 1

    return file_diffs


def get_git_diff(
    repo_root: Path,
    base_ref: str = "HEAD~1",
    head_ref: str = "HEAD",
) -> DiffResult:
    """Run git diff command in repository and parse results."""
    # Resolve commit SHAs
    base_sha = "unknown"
    head_sha = "unknown"

    try:
        r1 = subprocess.run(
            ["git", "rev-parse", base_ref],
            cwd=str(repo_root),
            capture_output=True,
            text=True,
            check=False,
        )
        if r1.returncode == 0:
            base_sha = r1.stdout.strip()
    except Exception:
        pass

    try:
        r2 = subprocess.run(
            ["git", "rev-parse", head_ref],
            cwd=str(repo_root),
            capture_output=True,
            text=True,
            check=False,
        )
        if r2.returncode == 0:
            head_sha = r2.stdout.strip()
    except Exception:
        pass

    diff_range = f"{base_ref}..{head_ref}" if base_ref and head_ref else ""
    cmd = ["git", "diff", "--no-color", "-U0"]
    if diff_range:
        cmd.append(diff_range)

    try:
        res = subprocess.run(
            cmd,
            cwd=str(repo_root),
            capture_output=True,
            text=True,
            check=False,
        )
        raw_diff = res.stdout
    except Exception:
        raw_diff = ""

    parsed_files = parse_unified_diff(raw_diff)

    return DiffResult(
        base_ref=base_ref,
        head_ref=head_ref,
        base_sha=base_sha,
        head_sha=head_sha,
        files=parsed_files,
        raw_diff=raw_diff,
    )


def map_diff_to_symbols(
    file_diffs: List[FileDiff],
    symbols: List[SymbolNode],
) -> List[SymbolNode]:
    """Find all symbols whose line spans intersect with modified lines in diff."""
    changed_symbols: List[SymbolNode] = []
    diff_map: Dict[str, Set[int]] = {
        fd.file_path: set(fd.modified_lines) for fd in file_diffs
    }

    for sym in symbols:
        lines = diff_map.get(sym.file_path)
        if lines is None:
            # Try matching relative paths
            for path, lset in diff_map.items():
                if path.endswith(sym.file_path) or sym.file_path.endswith(path):
                    lines = lset
                    break

        if lines:
            # Check overlap with [start_line, end_line]
            if any(sym.start_line <= l <= sym.end_line for l in lines):
                changed_symbols.append(sym)

    return changed_symbols
