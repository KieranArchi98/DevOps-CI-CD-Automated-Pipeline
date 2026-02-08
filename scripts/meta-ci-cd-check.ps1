param(
    [switch]$SkipTests,
    [switch]$SkipDockerCompose,
    [switch]$SkipKubernetes
)

$ErrorActionPreference = "Stop"
$root = (Get-Location).Path
$logPath = Join-Path $root "CI-CD-META-TEST.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

"CI/CD Meta Test Log" | Set-Content $logPath
"Date: $timestamp" | Add-Content $logPath
"Root: $root" | Add-Content $logPath
"" | Add-Content $logPath

function Write-Log([string]$msg) {
    $msg | Add-Content $logPath
    Write-Host $msg
}

function Check-Command([string]$name) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if ($cmd) {
        Write-Log "PASS: Found command '$name' -> $($cmd.Source)"
        return $true
    }
    Write-Log "FAIL: Missing command '$name'"
    return $false
}

function Run-Step([string]$title, [scriptblock]$action) {
    Write-Log "--- $title ---"
    try {
        & $action
        Write-Log "PASS: $title"
    } catch {
        Write-Log "FAIL: $title"
        Write-Log "  $($_.Exception.Message)"
    }
    Write-Log ""
}

Write-Log "=== Tooling Checks ==="
$toolsOk = $true
$toolsOk = (Check-Command "git") -and $toolsOk
$toolsOk = (Check-Command "docker") -and $toolsOk
$toolsOk = (Check-Command "kubectl") -and $toolsOk
$toolsOk = (Check-Command "node") -and $toolsOk
$toolsOk = (Check-Command "npm") -and $toolsOk
$toolsOk = (Check-Command "python") -and $toolsOk
$toolsOk = (Check-Command "pytest") -and $toolsOk
$toolsOk = (Check-Command "isort") -and $toolsOk
$toolsOk = (Check-Command "flake8") -and $toolsOk

# Optional tools for canary script
Check-Command "jq" | Out-Null
Check-Command "curl" | Out-Null
Check-Command "bash" | Out-Null
Check-Command "bc" | Out-Null

Write-Log ""

Write-Log "=== Repo Config Checks ==="
Run-Step "Workflow file present" { Test-Path .github\workflows\ci-cd.yml | Out-Null; if (-not (Test-Path .github\workflows\ci-cd.yml)) { throw "Missing .github/workflows/ci-cd.yml" } }
Run-Step "K8s manifests use GHCR + IMAGE_TAG" {
    $manifests = @(
        "k8s\backend-deployment.yaml",
        "k8s\backend-canary-deployment.yaml",
        "k8s\frontend-deployment.yaml",
        "k8s\frontend-canary-deployment.yaml",
        "k8s\worker-deployment.yaml"
    )
    foreach ($m in $manifests) {
        $content = Get-Content $m -Raw
        if ($content -notmatch "\$\{IMAGE_TAG\}") { throw "Missing IMAGE_TAG in $m" }
        if ($content -notmatch "ghcr.io/kieranarchi98/devops-ci-cd-automated-pipeline") { throw "Missing GHCR image in $m" }
    }
}
Run-Step "Docker Compose uses GHCR images" {
    $compose = Get-Content docker-compose.yml -Raw
    if ($compose -notmatch "ghcr.io/kieranarchi98/devops-ci-cd-automated-pipeline-backend") { throw "Backend GHCR image missing" }
    if ($compose -notmatch "ghcr.io/kieranarchi98/devops-ci-cd-automated-pipeline-frontend") { throw "Frontend GHCR image missing" }
}

Write-Log "=== Local Quality Checks ==="
if (-not $SkipTests) {
    Run-Step "Backend isort" { Push-Location backend; isort --check .; Pop-Location }
    Run-Step "Backend flake8" { Push-Location backend; flake8 .; Pop-Location }
    Run-Step "Backend pytest" { Push-Location backend; pytest --cov=app tests/; Pop-Location }
    Run-Step "Frontend lint" { Push-Location frontend; npm run lint; Pop-Location }
    Run-Step "Frontend format:check" { Push-Location frontend; npm run format:check; Pop-Location }
    Run-Step "Frontend tests (jest)" { Push-Location frontend; npm test -- --coverage --watchAll=false; Pop-Location }
} else {
    Write-Log "SKIP: Local quality checks (SkipTests set)"
}

Write-Log "=== Docker Compose Health ==="
if (-not $SkipDockerCompose) {
    Run-Step "Docker daemon reachable" { docker info | Out-Null }
    Run-Step "Compose services running" {
        $running = docker ps --format "{{.Names}}"
        if ($running -notmatch "llm-backend") { throw "llm-backend container not running" }
        if ($running -notmatch "llm-frontend") { throw "llm-frontend container not running" }
        if ($running -notmatch "prometheus") { throw "prometheus container not running" }
        if ($running -notmatch "grafana") { throw "grafana container not running" }
    }
    Run-Step "Backend health (Compose)" { Invoke-RestMethod http://localhost:8080/health | Out-Null }
    Run-Step "Frontend root (Compose)" { (Invoke-WebRequest http://localhost:3001 -UseBasicParsing).StatusCode | Out-Null }
    Run-Step "Prometheus healthy (Compose)" { (Invoke-WebRequest http://localhost:9090/-/healthy -UseBasicParsing).StatusCode | Out-Null }
    Run-Step "Grafana health (Compose)" { Invoke-RestMethod http://localhost:3003/api/health | Out-Null }
} else {
    Write-Log "SKIP: Docker Compose checks (SkipDockerCompose set)"
}

Write-Log "=== Kubernetes Health ==="
if (-not $SkipKubernetes) {
    Run-Step "K8s cluster-info" { kubectl cluster-info | Out-Null }
    Run-Step "K8s pods running" {
        $pods = kubectl get pods --no-headers
        if (-not $pods) { throw "No pods found" }
        if ($pods -match "CrashLoopBackOff") { throw "CrashLoopBackOff detected" }
    }
    Run-Step "K8s services present" {
        $services = kubectl get services --no-headers
        if (-not $services) { throw "No services found" }
    }
    Run-Step "Backend health via port-forward" {
        $job = Start-Job -ScriptBlock { kubectl port-forward svc/llm-backend 8000:8000 };
        Start-Sleep -Seconds 5
        try { Invoke-RestMethod http://localhost:8000/health | Out-Null }
        finally { Stop-Job $job; Remove-Job $job }
    }
    Run-Step "Frontend root via port-forward" {
        $job = Start-Job -ScriptBlock { kubectl port-forward svc/llm-frontend 3000:3000 };
        Start-Sleep -Seconds 5
        try { (Invoke-WebRequest http://localhost:3000 -UseBasicParsing).StatusCode | Out-Null }
        finally { Stop-Job $job; Remove-Job $job }
    }
} else {
    Write-Log "SKIP: Kubernetes checks (SkipKubernetes set)"
}

Write-Log "=== Summary ==="
Write-Log "Meta test completed. Review failures above."
