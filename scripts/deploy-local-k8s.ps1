$env:IMAGE_TAG = "latest"

Write-Host "Deploying Redis..."
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/redis-service.yaml

Write-Host "Deploying Backend (Replacing variables)..."
(Get-Content k8s/backend-deployment.yaml) -replace '\$\{IMAGE_TAG\}', $env:IMAGE_TAG | kubectl apply -f -

Write-Host "Deploying Frontend (Replacing variables)..."
(Get-Content k8s/frontend-deployment.yaml) -replace '\$\{IMAGE_TAG\}', $env:IMAGE_TAG | kubectl apply -f -

Write-Host "Deploying Celery Worker (Replacing variables)..."
(Get-Content k8s/worker-deployment.yaml) -replace '\$\{IMAGE_TAG\}', $env:IMAGE_TAG | kubectl apply -f -

Write-Host "Deploying HPAs..."
kubectl apply -f k8s/backend-hpa.yaml
kubectl apply -f k8s/frontend-hpa.yaml

Write-Host "Done! Check status with 'kubectl get pods'"
