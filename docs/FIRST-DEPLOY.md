# First Deploy Checklist (Beginner-Friendly)

This is a short, step-by-step checklist for your very first run. It assumes you are starting from scratch and want a clean path to get the app running locally and understand the CI/CD flow.

---
**A. One-Time Setup**

1. Install Docker Desktop.
2. Enable Kubernetes in Docker Desktop:
   - Docker Desktop > Settings > Kubernetes > Enable Kubernetes.
   - Wait for “Kubernetes is running”.
3. Install these tools:
   - Git
   - Node.js 18
   - Python 3.11
   - `kubectl`
4. Clone this repo.

---
**B. Fill In Secrets**

1. Open `.env` in the repo root.
2. Set at least:
   - `OPENAI_API_KEY`
   - `MONGO_URI`
   - `MONGO_DB`
   - `REDIS_URL`
   - `GF_SECURITY_ADMIN_PASSWORD`

---
**C. Run Local Quality Checks (Recommended)**

Backend:
```powershell
cd backend
pip install -r requirements.txt
isort --check .
black --check .
flake8 .
pytest --cov=app tests/
```

Frontend:
```powershell
cd ..\frontend
npm install
npm run lint
npm run format:check
npm test -- --coverage --watchAll=false
```

---
**D. Fastest Way to See It Working (Docker Compose)**

1. Start the stack:
```powershell
docker-compose up -d
```
2. Verify:
```powershell
docker ps
```
3. Open:
   - Frontend: `http://localhost:3001`
   - Backend: `http://localhost:8080/health`
   - Prometheus: `http://localhost:9090`
   - Grafana: `http://localhost:3003`

---
**E. First Kubernetes Run (Docker Desktop Cluster)**

1. Confirm Kubernetes context:
```powershell
kubectl config get-contexts
kubectl config use-context docker-desktop
kubectl cluster-info
```

2. Build local images:
```powershell
docker build -t genesis-backend:latest ./backend
docker build -t genesis-frontend:latest ./frontend
```
3. Switch manifests to local images:
```powershell
./scripts/use-local-images.ps1
```

4. Create K8s secrets from `.env`:
```powershell
./scripts/setup-and-verify-k8s.ps1
```

5. Deploy to Kubernetes:
```powershell
$env:IMAGE_TAG="latest"
./scripts/deploy-local-k8s.ps1
```

6. Verify:
```powershell
kubectl get pods
kubectl get services
```

7. Access services:
```powershell
kubectl port-forward svc/llm-frontend 3000:3000
kubectl port-forward svc/llm-backend 8000:8000
```
Then open:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000/health`

---
**F. (Optional) Canary + Metrics Check (Local)**

1. Deploy monitoring:
```powershell
kubectl apply -f k8s/monitoring/prometheus.yaml
kubectl apply -f k8s/monitoring/grafana.yaml
```

2. Port-forward Prometheus:
```powershell
kubectl port-forward svc/prometheus-service 9090:9090
```

3. Run the canary metrics check script:
```powershell
./scripts/check-canary-metrics.sh 'job="llm-backend-canary"' 'job="llm-backend-stable"' "http://localhost:9090"
```

---
**G. Push to Trigger CI/CD**

1. Create a branch, commit, push:
```powershell
git checkout -b feature/first-deploy
git add .
git commit -m "chore: first deploy setup"
git push -u origin feature/first-deploy
```

2. Open a Pull Request.
3. Watch GitHub Actions:
   - Linting
   - Tests
   - Docker build
   - Trivy scan
   - Terraform checks

4. Merge to `main` or `develop` to trigger image push to GHCR and CD pipeline.

---
**H. If Something Breaks**

Quick checks:
```powershell
kubectl get pods
kubectl describe pod <pod-name>
kubectl logs <pod-name>
docker ps
docker logs <container>
```

---
If you want, I can add a “first deploy walkthrough” section with screenshots and a visual flow diagram.
