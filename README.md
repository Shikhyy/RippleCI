# RippleCI

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.10%20%7C%203.11%20%7C%203.12-blue)](https://www.python.org/)
[![FalkorDB](https://img.shields.io/badge/graph-FalkorDB-red)](https://www.falkordb.com/)

**RippleCI** is an open-source, graph-native release intelligence toolkit. It helps engineering teams understand the blast radius of code changes, select the regression tests that matter under a runtime budget, and verify test plans with evidence-backed recommendations.

The core workflow:
$$\text{Repository} \longrightarrow \text{Dependency Graph} \longrightarrow \text{Change Impact} \longrightarrow \text{ML-Ranked Tests} \longrightarrow \text{Verification} \longrightarrow \text{Evidence-Backed Decision}$$

---

## Key Capabilities

- **Graph-Grounded Impact Analysis:** Parses code structure, call graphs, imports, and test coverage into FalkorDB to trace multi-hop downstream blast radius from changed symbols.
- **Learned & Heuristic Test Prioritization:** Prioritizes candidate tests under an execution time budget using graph distance, coverage evidence, churn size, and historical execution stats.
- **Bounded Verification:** Optionally runs the selected test subset and mutation testing to verify that real faults are detected before release.
- **Four Developer Interfaces:**
  1. **CLI:** Fast, human-readable terminal commands (`ripple impact`, `ripple plan`, `ripple verify`, `ripple doctor`).
  2. **Python SDK:** Typed, reusable API for programmatic analysis in custom pipelines.
  3. **HTTP API:** High-performance FastAPI backend serving structured analysis and graph data.
  4. **Web Companion:** Modern React/Next.js interface with interactive dependency graphs powered by React Flow.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Interfaces                     │
│    CLI (Typer/Rich)   SDK (Python)   API / Web Companion   │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       RippleCI Core                         │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │   Repository Indexer  │       │  Impact Analyzer      │  │
│  │   (AST, Pytest, Cov)  │       │  (Multi-hop Traversal)│  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              │                               │              │
│  ┌───────────▼───────────┐       ┌───────────▼───────────┐  │
│  │    FalkorDB Graph     │       │   Ranker & Planner    │  │
│  │ (Nodes, Edges, Paths) │       │ (Heuristic + ML Model)│  │
│  └───────────────────────┘       └───────────┬───────────┘  │
│                                              │              │
│                                  ┌───────────▼───────────┐  │
│                                  │  Verification Engine  │  │
│                                  │ (Test & Mutation Run) │  │
│                                  └───────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### FalkorDB Graph Model

RippleCI models entities and relationships directly in FalkorDB:
- **Nodes:** `Repository`, `File`, `Symbol` (functions, classes, methods), `TestCase`, `TestRun`, `TestResult`, `Mutation`, `AnalysisRun`.
- **Relationships:**
  - `(:Repository)-[:CONTAINS_FILE]->(:File)`
  - `(:File)-[:DEFINES]->(:Symbol)`
  - `(:Symbol)-[:CALLS]->(:Symbol)`
  - `(:TestCase)-[:COVERS]->(:Symbol)`
  - `(:TestRun)-[:HAS_RESULT]->(:TestResult)-[:RESULT_FOR]->(:TestCase)`
  - `(:Mutation)-[:TARGETS]->(:Symbol)`
  - `(:Mutation)-[:CAUGHT_BY]->(:TestCase)`

---

## Prerequisites

- **Python:** 3.10, 3.11, or 3.12 (Python 3.13+ not yet supported)
- **FalkorDB:** Either run locally via Docker (`docker compose -f infra/docker-compose.yml up -d`) or connect to a remote instance.
- **Git:** Available on system PATH.

---

## Getting Started

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Shikhyy/RippleCI.git
cd RippleCI

# Create virtual environment and install
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

### 2. Start FalkorDB

```bash
docker compose -f infra/docker-compose.yml up -d
```

### 3. Run Doctor Diagnostics

Check your environment, Git state, and FalkorDB connectivity:

```bash
ripple doctor
```

### 4. Initialize Configuration

Generate a `.ripple.yml` configuration in your repository:

```bash
ripple init
```

### 5. Index Repository

Index source code, call relationships, and test cases into FalkorDB:

```bash
ripple index
```

### 6. Analyze Change Impact

Trace the downstream impact of changes between a base revision and HEAD:

```bash
ripple impact origin/main..HEAD
```

### 7. Generate a Test Plan

Prioritize candidate tests within a specified execution time budget (in seconds):

```bash
ripple plan --budget 300
```

### 8. Run Verification

Execute selected tests and bounded mutations:

```bash
ripple verify --mutations 5
```

### 9. Graph Agent Investigation & Explanations

Run autonomous, tool-directed graph investigations to discover callers and blind spots:

```bash
# Agent-orchestrated investigation across multi-hop FalkorDB calls
ripple investigate origin/main..HEAD

# Inspect exact evidence paths and selection reasons for a test
ripple explain test_process_payment_success
```

### 10. Run Test Selection Benchmark

Compare 4 regression selection strategies across selection ratio, runtime, and fault recall:

```bash
ripple benchmark
```

---

## Web Companion Interface

Explore interactive dependency graphs, review blast radius traces, and inspect mutation evidence in real time:

```bash
# Start FastAPI backend (port 8000)
ripple serve

# Start Web Companion (port 3000)
cd apps/web && pnpm dev
```

**Note:** The web companion includes demo/mock data for popular repositories (fastapi, flask, requests) for demonstration purposes. For real AST analysis and graph visualization, connect a local repository via the "Local Workspace" tab in the UI.

---

## GitHub Actions Integration

Add RippleCI to your pull request workflows via the reusable action:

```yaml
name: RippleCI Release Intelligence
on: [pull_request]

jobs:
  rippleci:
    runs-on: ubuntu-latest
    services:
      falkordb:
        image: falkordb/falkordb:latest
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run RippleCI Intelligence
        uses: Shikhyy/RippleCI@main
        with:
          base-ref: ${{ github.base_ref }}
          head-ref: ${{ github.sha }}
          budget: 300
          mutation-verify: true
```

---

## Python SDK Example

```python
from rippleci import RippleProject

# Open project from current directory
project = RippleProject.open(".")

# 1. Index codebase into FalkorDB
index_summary = project.indexer.index()
print(f"Indexed {index_summary.symbols_count} symbols and {index_summary.test_cases_count} tests")

# 2. Analyze blast radius of changes
impact = project.analyzer.analyze(base="origin/main", head="HEAD")
print(f"Impacted symbols: {len(impact.impacted_symbols)}")

# 3. Rank and select tests within a 300-second budget
plan = project.planner.plan(impact=impact, budget_seconds=300)
for test in plan.selected_tests:
    print(f"Rank {test.rank}: {test.test_id} (score: {test.rank_score:.2f})")

# 4. Agent tool-directed investigation
investigation = project.agent.investigate_change(base_ref="origin/main", head_ref="HEAD")
print(f"Verdict: {investigation.verdict}")
print(investigation.evidence_summary)

# 5. Run mutation verification
verification = project.verifier.verify(plan=plan, max_mutations=5)
print(f"Tests passed: {verification.all_passed}, Killed mutants: {verification.killed_mutations_count}")
```

---

## Configuration (`.ripple.yml`)

```yaml
version: 1
repository:
  id: sample-service
  default_branch: main
  languages: [python]
  include:
    - src/**
    - tests/**
  exclude:
    - .venv/**
    - build/**

graph:
  url: redis://localhost:6379
  graph_name: ripple_sample_service
  connect_timeout_seconds: 3

analysis:
  max_call_depth: 5
  max_results: 500

ranking:
  model: auto # auto | heuristic | ml
  default_budget_seconds: 300

testing:
  test_command_profile: pytest
  allow_execution: true
  max_mutations: 10
```

---

## Running Tests

Run the test suite:

```bash
pytest
```

---

## Security & Privacy

- **Data Minimization:** RippleCI indexes symbol metadata, call graphs, and coverage metrics; full source code is not stored in the graph.
- **Credential Protection:** Secrets and tokens are never written to the graph, logs, or reports.
- **Bounded Execution:** Verification runs within an isolated workspace and strictly enforces execution budgets and timeouts.

---

## License

Apache-2.0 License.
