from __future__ import annotations

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_workflow_has_expected_jobs() -> None:
    workflow = _read(REPO_ROOT / ".github" / "workflows" / "ci-cd.yml")
    expected_jobs = [
        "lint-backend:",
        "lint-frontend:",
        "build:",
        "terraform:",
        "build-and-push:",
        "deploy-canary:",
        "promote-to-production:",
    ]
    for job in expected_jobs:
        assert job in workflow


def test_k8s_manifests_use_image_tags() -> None:
    manifests = [
        REPO_ROOT / "k8s" / "backend-deployment.yaml",
        REPO_ROOT / "k8s" / "backend-canary-deployment.yaml",
        REPO_ROOT / "k8s" / "frontend-deployment.yaml",
        REPO_ROOT / "k8s" / "frontend-canary-deployment.yaml",
        REPO_ROOT / "k8s" / "worker-deployment.yaml",
    ]
    for manifest in manifests:
        content = _read(manifest)
        assert "${IMAGE_TAG}" in content
        assert "ghcr.io/kieranarchi98/devops-ci-cd-automated-pipeline" in content


def test_docker_compose_uses_ghcr_images() -> None:
    compose = _read(REPO_ROOT / "docker-compose.yml")
    assert "ghcr.io/kieranarchi98/devops-ci-cd-automated-pipeline-backend" in compose
    assert "ghcr.io/kieranarchi98/devops-ci-cd-automated-pipeline-frontend" in compose


def test_k8s_prometheus_jobs_match_canary_strategy() -> None:
    prometheus = _read(REPO_ROOT / "k8s" / "monitoring" / "prometheus.yaml")
    expected_jobs = [
        "job_name: 'llm-backend-stable'",
        "job_name: 'llm-backend-canary'",
        "job_name: 'llm-frontend-stable'",
        "job_name: 'llm-frontend-canary'",
    ]
    for job in expected_jobs:
        assert job in prometheus
