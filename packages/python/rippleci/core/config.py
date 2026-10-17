"""Configuration loader and schema for RippleCI."""

import os
from pathlib import Path
from typing import List, Optional
import yaml
from pydantic import BaseModel, Field
from rippleci.core.errors import ConfigurationError


class RepositoryConfig(BaseModel):
    id: str = "default-repo"
    default_branch: str = "main"
    languages: List[str] = Field(default_factory=lambda: ["python"])
    include: List[str] = Field(default_factory=lambda: ["src/**", "tests/**", "packages/**"])
    exclude: List[str] = Field(
        default_factory=lambda: [
            ".venv/**",
            "venv/**",
            "node_modules/**",
            "build/**",
            "dist/**",
            "*.egg-info/**",
            "__pycache__/**",
            ".git/**",
        ]
    )


class GraphConfig(BaseModel):
    url: str = "redis://localhost:6379"
    graph_name: str = "ripple_default"
    password: Optional[str] = None
    connect_timeout_seconds: float = 3.0


class AnalysisConfig(BaseModel):
    max_call_depth: int = 5
    max_results: int = 500
    unknown_dependency_policy: str = "conservative"


class RankingConfig(BaseModel):
    model: str = "auto"  # "auto" | "heuristic" | "ml"
    model_path: Optional[str] = None
    feature_schema_version: int = 1
    default_budget_seconds: float = 300.0


class TestingConfig(BaseModel):
    test_command_profile: str = "pytest"
    default_budget_seconds: float = 300.0
    allow_execution: bool = True
    allow_mutation_testing: bool = True
    max_mutations: int = 10
    max_wall_time_seconds: float = 600.0


class RippleConfig(BaseModel):
    version: int = 1
    repository: RepositoryConfig = Field(default_factory=RepositoryConfig)
    graph: GraphConfig = Field(default_factory=GraphConfig)
    analysis: AnalysisConfig = Field(default_factory=AnalysisConfig)
    ranking: RankingConfig = Field(default_factory=RankingConfig)
    testing: TestingConfig = Field(default_factory=TestingConfig)

    @classmethod
    def load(cls, config_path: Optional[Path] = None, root_dir: Optional[Path] = None) -> "RippleConfig":
        root = root_dir or Path.cwd()
        target = config_path or (root / ".ripple.yml")

        data = {}
        if target.exists():
            try:
                with open(target, "r", encoding="utf-8") as f:
                    content = yaml.safe_load(f)
                    if isinstance(content, dict):
                        data = content
            except Exception as e:
                raise ConfigurationError(f"Failed to parse config at {target}: {e}")

        # Environment variable overrides
        graph_url = os.getenv("RIPPLE_FALKORDB_URL")
        graph_name = os.getenv("RIPPLE_GRAPH_NAME")
        graph_pw = os.getenv("RIPPLE_FALKORDB_PASSWORD")

        if graph_url:
            data.setdefault("graph", {})["url"] = graph_url
        if graph_name:
            data.setdefault("graph", {})["graph_name"] = graph_name
        if graph_pw:
            data.setdefault("graph", {})["password"] = graph_pw

        # Auto-infer repo id from directory name if default
        if "repository" not in data or "id" not in data["repository"]:
            data.setdefault("repository", {})["id"] = root.name

        try:
            return cls(**data)
        except Exception as e:
            raise ConfigurationError(f"Configuration validation failed: {e}")

    def save(self, target_path: Path) -> None:
        """Write configuration to a YAML file."""
        data = self.model_dump()
        with open(target_path, "w", encoding="utf-8") as f:
            yaml.dump(data, f, default_flow_style=False, sort_keys=False)
