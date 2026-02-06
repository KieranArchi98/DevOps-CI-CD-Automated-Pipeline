# DevOps + CI/CD Operations Guide (Beginner Friendly)

This guide explains how to operate the full DevOps pipeline in this repo from start to finish. It is written for someone brand-new to DevOps, so it starts with the basics and walks you through quality checks, container builds, GHCR, Docker Desktop, and Kubernetes (inside Docker Desktop), plus the automated GitHub Actions pipeline.

If you want a single sentence summary: code changes flow through linting and tests, Docker images are built and scanned, images are pushed to GHCR, then Kubernetes deploys a canary, validates Prometheus metrics, and finally promotes to stable.

**Big Picture**

1. You change code locally.
2. You run quality checks (lint, format, tests).
3. You build and run containers locally (Docker Compose or Kubernetes).
4. You push to GitHub.
5. GitHub Actions runs the CI pipeline.
6. If CI passes, images are pushed to GHCR.
7. CD deploys canary in Kubernetes, checks Prometheus metrics, then promotes to stable.
8. If anything is wrong, you roll back.

---
**What’s In This Repo (DevOps-Relevant Files)**

- `./.github/workflows/ci-cd.yml`  
  The full CI/CD pipeline definition.
- `./docker-compose.yml`  
  Local dev stack using GHCR images plus Redis, Prometheus, Grafana.
- `./docker-compose.blue-green.yml`  
  Blue/Green deployment locally with Nginx traffic switching.
- `./k8s/*.yaml`  
  Kubernetes manifests for backend, frontend, canary, Redis, HPA, services.
- `./k8s/monitoring/*.yaml`  
  Prometheus + Grafana for Kubernetes.
- `./scripts/*`  
  Helper scripts for canary metrics checks, traffic switching, local K8s deploy.
- `./infrastructure/terraform/*`  
  Terraform for Kubernetes namespaces, secrets, and app deployments.

---
**Prerequisites (Local Machine)**

1. Install Docker Desktop.
2. Enable Kubernetes in Docker Desktop:
   - Docker Desktop > Settings > Kubernetes > Enable Kubernetes.
   - Wait for it to say “Kubernetes is running”.
3. Install `kubectl` and `helm` (optional).
4. Install Node.js (v18) and Python (3.11).
5. Install Git.

If you skip Kubernetes setup, you can still run everything using Docker Compose.

---
**Step 1: Set Up Secrets and Local Environment**

This project uses environment variables for secrets. The local `.env` file is used by Docker Compose and local scripts.

Minimum values you need:
- `OPENAI_API_KEY`
- `MONGO_URI`
- `MONGO_DB`
- `REDIS_URL`
- `GF_SECURITY_ADMIN_PASSWORD`

These are read in:
- `docker-compose.yml` and `docker-compose.blue-green.yml`
- `scripts/setup-and-verify-k8s.ps1` (reads `.env` to create K8s secrets)
- GitHub Actions (stored as GitHub Secrets)

---
**Step 2: Run Quality Checks Locally**

These are the same checks CI runs, so you should run them before pushing.

Backend checks:
```powershell
cd backend
pip install -r requirements.txt
isort --check .
black --check .
flake8 .
pytest --cov=app tests/
```

Frontend checks:
```powershell
cd frontend
npm install
npm run lint
npm run format:check
npm test -- --coverage --watchAll=false
```

If you want to auto-fix formatting locally:
```powershell
cd backend
isort .
black .

cd ..\frontend
npm run format
```

---
**Step 3: Run the Stack Locally with Docker Compose**

This is the easiest way to run everything locally.

1. Ensure `.env` is filled in.
2. Start the stack:
```powershell
docker-compose up -d
```
3. Verify containers:
```powershell
docker ps
```

Local ports (from `docker-compose.yml`):
- Backend: `http://localhost:8080`
- Frontend: `http://localhost:3001`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3003`

Images are pulled from GHCR:
- `ghcr.io/kieranarchi98/devops-ci-cd-automated-pipeline-backend:latest`
- `ghcr.io/kieranarchi98/devops-ci-cd-automated-pipeline-frontend:latest`

If GHCR images are private, log in first:
```powershell
docker login ghcr.io
```

---
**Step 4: Blue/Green Deployments Locally (Optional)**

The blue/green flow uses `docker-compose.blue-green.yml` + Nginx to route traffic.

Start the stack:
```powershell
docker-compose -f docker-compose.blue-green.yml up -d
```

Switch traffic between blue and green:
```powershell
./scripts/switch-traffic.sh blue
./scripts/switch-traffic.sh green
```

Active slot endpoint:
- `http://localhost:8081/active-slot`

This is a safe way to practice zero-downtime deploys without Kubernetes.

---
**Step 5: Kubernetes on Docker Desktop (Local Cluster)**

This step mirrors how production works, but on your machine.

1. Confirm Kubernetes context:
```powershell
kubectl config get-contexts
kubectl config use-context docker-desktop
kubectl cluster-info
```

2. (Optional) Use local images rather than GHCR:
   - Build local images:
```powershell
docker build -t genesis-backend:latest ./backend
docker build -t genesis-frontend:latest ./frontend
```
   - Kubernetes manifests already use local images (`genesis-backend:latest` / `genesis-frontend:latest`), so no change is required.

3. Create Kubernetes secrets (reads `.env`):
```powershell
./scripts/setup-and-verify-k8s.ps1
```

4. Deploy app to Kubernetes (stable deployment):
```powershell
$env:IMAGE_TAG="latest"
./scripts/deploy-local-k8s.ps1
```

5. Check pods and services:
```powershell
kubectl get pods
kubectl get services
```

Access frontend locally:
- Because the service is `LoadBalancer` in local Docker Desktop, it may expose a local port.
- If it does not, use port-forward:
```powershell
kubectl port-forward svc/llm-frontend 3000:3000
```

Backend health check:
```powershell
kubectl port-forward svc/llm-backend 8000:8000
Invoke-RestMethod http://localhost:8000/health
```

---
**Step 6: Monitoring (Prometheus + Grafana)**

Docker Compose includes Prometheus and Grafana by default.  
Kubernetes also has monitoring manifests in `k8s/monitoring/`.

Deploy monitoring to Kubernetes:
```powershell
kubectl apply -f k8s/monitoring/prometheus.yaml
kubectl apply -f k8s/monitoring/grafana.yaml
```

Port-forward:
```powershell
kubectl port-forward svc/prometheus-service 9090:9090
kubectl port-forward svc/grafana-service 3000:3000
```

Prometheus is used in the CD pipeline to validate canary health.

---
**Step 7: GitHub Actions CI/CD Pipeline (What Happens on Push)**

Pipeline file: `./.github/workflows/ci-cd.yml`

Triggered by:
- Pushes to `main` or `develop`
- Pull requests
- Manual runs (`workflow_dispatch`)

Stages:

1. **Lint Backend**
   - `isort --check .`
   - `black --check .`
   - `flake8 .`

2. **Lint Frontend**
   - `npm run lint`
   - `npm run format:check`

3. **Build + Test**
   - Backend: `pytest --cov=app tests/`
   - Frontend: `npm test -- --coverage --watchAll=false`
   - Build Docker images for backend + frontend

4. **Security Scan**
   - Trivy scans both images
   - Fails pipeline on `HIGH` or `CRITICAL` vulnerabilities

5. **Terraform (CI)**
   - `terraform fmt`, `init`, `validate`
   - `terraform plan` only on pull requests

6. **Build & Push (Main/Develop)**
   - Build images and push to GHCR
   - Tags: `sha` and `latest`

7. **Deploy Canary (CD)**
   - Applies canary deployments in Kubernetes
   - Runs `scripts/check-canary-metrics.sh` against Prometheus

8. **Promote to Production**
   - Rolling update of stable deployments
   - Removes canary deployments

9. **Rollback (Manual)**
   - `kubectl rollout undo` on backend + frontend

---
**Step 8: GHCR Image Usage**

Images are built in CI and pushed to:
- `ghcr.io/kieranarchi98/devops-ci-cd-automated-pipeline-backend`
- `ghcr.io/kieranarchi98/devops-ci-cd-automated-pipeline-frontend`

Tags:
- `latest`
- the commit SHA

To pull images manually:
```powershell
docker pull ghcr.io/kieranarchi98/devops-ci-cd-automated-pipeline-backend:latest
docker pull ghcr.io/kieranarchi98/devops-ci-cd-automated-pipeline-frontend:latest
```

---
**Step 9: Canary + Promotion (Kubernetes)**

Canary strategy:
- Canary deployments (`llm-backend-canary`, `llm-frontend-canary`) run with 1 replica.
- Stable deployments run with 2 replicas.
- Prometheus scrapes both canary and stable services.
- `scripts/check-canary-metrics.sh` compares error rate and latency before promotion.

Promotion:
- If canary metrics are OK, stable deployments are updated with the new image.
- Canary deployments are deleted.

Rollback:
- Triggered manually (GitHub Actions `workflow_dispatch`).
- Uses `kubectl rollout undo`.

---
**Step 10: Terraform (Infrastructure as Code)**

Terraform lives in `./infrastructure/terraform`.

What it manages:
- Kubernetes namespaces (dev + prod)
- Kubernetes secrets
- Deployments and services for backend, frontend, canary

Local workflow:
```powershell
Copy-Item infrastructure/terraform/terraform.tfvars.example infrastructure/terraform/terraform.tfvars
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

CI workflow:
- `fmt`, `init`, `validate` on every run
- `plan` on pull requests
- `apply` only when manually triggered in GitHub Actions

---
**Important Notes and Gotchas**

- Kubernetes manifests in `./k8s` currently use local images (`genesis-backend:latest`, `genesis-frontend:latest`).
  - For GHCR-based production deploys, update manifests to use GHCR images with `${IMAGE_TAG}`.
  - The CD pipeline expects to inject `${IMAGE_TAG}` with `envsubst`.
- `scripts/use-local-images.ps1` can force manifests to use local images.
- Docker Compose uses GHCR images by default.

---
**Daily Workflow (What You Actually Do)**

1. Pull the repo and update dependencies.
2. Run tests and lint checks locally.
3. Run Docker Compose locally for confidence.
4. Push your branch to GitHub.
5. Watch GitHub Actions for CI results.
6. If merged into `main` or `develop`, images are pushed to GHCR automatically.
7. Canary deploy happens, metrics are validated, and stable is promoted.

---
**Troubleshooting Quick Tips**

- Check CI logs: GitHub Actions tab.
- Kubernetes status:
```powershell
kubectl get pods
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```
- Docker status:
```powershell
docker ps
docker logs <container>
```
- Prometheus query test:
```powershell
curl http://localhost:9090/api/v1/query?query=up
```

---
If you want, I can tailor this into a step-by-step “first deploy” checklist or add screenshots for each tool.
