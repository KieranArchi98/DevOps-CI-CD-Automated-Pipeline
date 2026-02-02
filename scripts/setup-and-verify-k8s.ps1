# Phase 13 - Kubernetes Setup and Verification Script
# This script sets up Kubernetes, applies manifests, and verifies Phase 13 implementation

Write-Host "=== Phase 13 - Kubernetes Setup and Verification ===" -ForegroundColor Cyan
Write-Host ""

# Function to check command success
function Test-CommandSuccess {
    param($LastExitCode, $ErrorMessage)
    if ($LastExitCode -ne 0) {
        Write-Host "❌ $ErrorMessage" -ForegroundColor Red
        return $false
    }
    return $true
}

# Step 1: Check Kubernetes cluster
Write-Host "Step 1: Checking Kubernetes cluster..." -ForegroundColor Yellow
kubectl cluster-info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Kubernetes cluster not running. Starting Minikube..." -ForegroundColor Yellow
    minikube start
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to start Minikube" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Kubernetes cluster is running" -ForegroundColor Green
Write-Host ""

# Step 2: Create secrets if they don't exist
Write-Host "Step 2: Checking/Creating Kubernetes secrets..." -ForegroundColor Yellow
kubectl get secret app-secrets 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating app-secrets..." -ForegroundColor Yellow
    
    # Load from .env file
    $envFile = Get-Content ".env" -ErrorAction SilentlyContinue
    $openaiKey = ""
    $mongoUri = ""
    $mongoDb = ""
    
    foreach ($line in $envFile) {
        if ($line -match "^OPENAI_API_KEY=(.+)") { $openaiKey = $matches[1] }
        if ($line -match "^MONGO_URI=(.+)") { $mongoUri = $matches[1] }
        if ($line -match "^MONGO_DB=(.+)") { $mongoDb = $matches[1] }
    }
    
    if ($openaiKey -and $mongoUri -and $mongoDb) {
        kubectl create secret generic app-secrets `
            --from-literal=OPENAI_API_KEY=$openaiKey `
            --from-literal=MONGO_URI=$mongoUri `
            --from-literal=MONGO_DB=$mongoDb
        Write-Host "✅ Secrets created" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Could not find all required secrets in .env file" -ForegroundColor Yellow
        Write-Host "Please create secrets manually:" -ForegroundColor Yellow
        Write-Host "kubectl create secret generic app-secrets --from-literal=OPENAI_API_KEY=<key> --from-literal=MONGO_URI=<uri> --from-literal=MONGO_DB=<db>" -ForegroundColor Cyan
    }
} else {
    Write-Host "✅ Secrets already exist" -ForegroundColor Green
}
Write-Host ""

# Step 3: Apply Kubernetes manifests
Write-Host "Step 3: Applying Kubernetes manifests..." -ForegroundColor Yellow

# Set IMAGE_TAG environment variable
$env:IMAGE_TAG = "latest"

# Apply Redis first
Write-Host "Applying Redis..." -ForegroundColor Cyan
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/redis-service.yaml

# Apply backend
Write-Host "Applying Backend..." -ForegroundColor Cyan
Get-Content k8s/backend-deployment.yaml | ForEach-Object { $_ -replace '\$\{IMAGE_TAG\}', $env:IMAGE_TAG } | kubectl apply -f -
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/backend-hpa.yaml

# Apply frontend
Write-Host "Applying Frontend..." -ForegroundColor Cyan
Get-Content k8s/frontend-deployment.yaml | ForEach-Object { $_ -replace '\$\{IMAGE_TAG\}', $env:IMAGE_TAG } | kubectl apply -f -
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/frontend-hpa.yaml

# Apply worker
Write-Host "Applying Worker..." -ForegroundColor Cyan
Get-Content k8s/worker-deployment.yaml | ForEach-Object { $_ -replace '\$\{IMAGE_TAG\}', $env:IMAGE_TAG } | kubectl apply -f -

Write-Host "✅ Manifests applied" -ForegroundColor Green
Write-Host ""

# Step 4: Wait for pods to be ready
Write-Host "Step 4: Waiting for pods to be ready..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Cyan

$timeout = 300  # 5 minutes
$elapsed = 0
$interval = 10

while ($elapsed -lt $timeout) {
    $notReady = kubectl get pods --no-headers 2>&1 | Where-Object { $_ -notmatch "Running.*1/1|Completed" }
    
    if (-not $notReady) {
        Write-Host "✅ All pods are ready!" -ForegroundColor Green
        break
    }
    
    Write-Host "⏳ Waiting for pods... ($elapsed/$timeout seconds)" -ForegroundColor Yellow
    Start-Sleep -Seconds $interval
    $elapsed += $interval
}

if ($elapsed -ge $timeout) {
    Write-Host "⚠️  Timeout waiting for pods. Current status:" -ForegroundColor Yellow
    kubectl get pods
}

Write-Host ""

# Step 5: Display pod status
Write-Host "Step 5: Pod Status" -ForegroundColor Yellow
kubectl get pods
Write-Host ""

# Step 6: Verify probes on backend pod
Write-Host "Step 6: Verifying probes and configuration..." -ForegroundColor Yellow
$backendPod = kubectl get pods -l app=llm-backend,version=stable -o jsonpath='{.items[0].metadata.name}' 2>&1

if ($backendPod) {
    Write-Host "Checking backend pod: $backendPod" -ForegroundColor Cyan
    
    # Check for liveness probe
    $livenessProbe = kubectl get pod $backendPod -o jsonpath='{.spec.containers[0].livenessProbe}' 2>&1
    if ($livenessProbe) {
        Write-Host "✅ Liveness probe configured" -ForegroundColor Green
    } else {
        Write-Host "❌ Liveness probe NOT configured" -ForegroundColor Red
    }
    
    # Check for readiness probe
    $readinessProbe = kubectl get pod $backendPod -o jsonpath='{.spec.containers[0].readinessProbe}' 2>&1
    if ($readinessProbe) {
        Write-Host "✅ Readiness probe configured" -ForegroundColor Green
    } else {
        Write-Host "❌ Readiness probe NOT configured" -ForegroundColor Red
    }
    
    # Check for resource limits
    $resources = kubectl get pod $backendPod -o jsonpath='{.spec.containers[0].resources}' 2>&1
    if ($resources -match "limits") {
        Write-Host "✅ Resource limits configured" -ForegroundColor Green
    } else {
        Write-Host "❌ Resource limits NOT configured" -ForegroundColor Red
    }
    
    # Check for graceful termination
    $gracePeriod = kubectl get pod $backendPod -o jsonpath='{.spec.terminationGracePeriodSeconds}' 2>&1
    if ($gracePeriod -ge 30) {
        Write-Host "✅ Graceful termination configured ($gracePeriod seconds)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Graceful termination period: $gracePeriod seconds" -ForegroundColor Yellow
    }
}
Write-Host ""

# Step 7: Test health endpoints via port-forward
Write-Host "Step 7: Testing health endpoints..." -ForegroundColor Yellow
Write-Host "Setting up port-forward to backend..." -ForegroundColor Cyan

if ($backendPod) {
    # Start port-forward in background
    $portForwardJob = Start-Job -ScriptBlock {
        param($podName)
        kubectl port-forward pod/$podName 8000:8000
    } -ArgumentList $backendPod
    
    Start-Sleep -Seconds 5
    
    # Test health endpoint
    try {
        $healthResponse = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 5 -ErrorAction Stop
        if ($healthResponse.status -eq "ok") {
            Write-Host "✅ /health endpoint working: $($healthResponse | ConvertTo-Json -Compress)" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ /health endpoint failed: $_" -ForegroundColor Red
    }
    
    # Test readiness endpoint
    try {
        $readyResponse = Invoke-RestMethod -Uri "http://localhost:8000/ready" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ /ready endpoint working: $($readyResponse | ConvertTo-Json -Compress)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  /ready endpoint: $_" -ForegroundColor Yellow
    }
    
    # Stop port-forward
    Stop-Job -Job $portForwardJob
    Remove-Job -Job $portForwardJob
}
Write-Host ""

# Step 8: Check logs for structured logging
Write-Host "Step 8: Checking structured logging..." -ForegroundColor Yellow
if ($backendPod) {
    Write-Host "Recent logs from $backendPod" ":" -ForegroundColor Cyan
    $logs = kubectl logs $backendPod --tail=5 2>&1
    
    if ($logs -match '"timestamp".*"level".*"service"') {
        Write-Host "✅ Structured JSON logging detected" -ForegroundColor Green
        $logs | Select-Object -First 3 | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
    } else {
        Write-Host "⚠️  Logs may not be in JSON format" -ForegroundColor Yellow
        $logs | Select-Object -First 3 | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
    }
}
Write-Host ""

# Step 9: Display services
Write-Host "Step 9: Services" -ForegroundColor Yellow
kubectl get services
Write-Host ""

# Step 10: Summary
Write-Host "=== Verification Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Phase 13 setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test graceful shutdown: kubectl delete pod $backendPod" -ForegroundColor Cyan
Write-Host "2. Monitor logs: kubectl logs -f $backendPod" -ForegroundColor Cyan
Write-Host "3. Check metrics: kubectl port-forward svc/prometheus-service 9090:9090" -ForegroundColor Cyan
Write-Host "4. View detailed pod info: kubectl describe pod $backendPod" -ForegroundColor Cyan
Write-Host ""
