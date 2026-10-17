"""Unit tests for the RippleCI Typer/Rich CLI interface."""

import json
from pathlib import Path
import pytest
from typer.testing import CliRunner
from rippleci.cli.main import app

runner = CliRunner()


def test_cli_version():
    result = runner.invoke(app, ["--version"])
    assert result.exit_code == 0
    assert "RippleCI" in result.stdout
    assert "0.1.0" in result.stdout


def test_cli_help():
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    assert "doctor" in result.stdout
    assert "impact" in result.stdout
    assert "plan" in result.stdout
    assert "verify" in result.stdout


def test_cli_doctor():
    result = runner.invoke(app, ["doctor"])
    assert result.exit_code == 0
    assert "Python Runtime" in result.stdout
    assert "FalkorDB Graph" in result.stdout


def test_cli_config_commands():
    res_show = runner.invoke(app, ["config", "show"])
    assert res_show.exit_code == 0
    data = json.loads(res_show.stdout)
    assert "repository" in data

    res_val = runner.invoke(app, ["config", "validate"])
    assert res_val.exit_code == 0
    assert "valid" in res_val.stdout.lower()


def test_cli_index_and_impact():
    res_idx = runner.invoke(app, ["index"])
    assert res_idx.exit_code == 0
    assert "Repository Indexing Summary" in res_idx.stdout

    res_plan = runner.invoke(app, ["plan", "--budget", "300", "--format", "json"])
    assert res_plan.exit_code == 0
    plan_data = json.loads(res_plan.stdout)
    assert "budget_seconds" in plan_data
    assert plan_data["budget_seconds"] == 300.0


def test_cli_report_json():
    res = runner.invoke(app, ["report", "--format", "json"])
    assert res.exit_code == 0
    report_data = json.loads(res.stdout)
    assert "impact" in report_data
    assert "plan" in report_data
