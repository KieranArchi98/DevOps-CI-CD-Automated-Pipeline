# CI/CD Pipeline Command Checklist

This checklist walks through every command you run when activating the DevOps pipeline locally, from initial setup through the full Docker Compose + Kubernetes flow and into GitHub Actions. Follow each section in order to stay in sync with the documented pipeline.

1.  **Prep your machine**
    - Install prerequisites: Docker Desktop (with Kubernetes enabled), `kubectl`, Python 3.11, Node.js 18, and Git.
    - Ensure Docker Desktop reports “Kubernetes is running,” and log in to GHCR with `docker login ghcr.io` if you plan to pull the hosted images.
    - Duplicate the local environment file and fill the required secrets:
      ```powershell
      copy .env.example .env        # or edit .env if you already have it
      # then edit .env and set:
      # OPENAI_API_KEY, MONGO_URI, MONGO_DB, REDIS_URL, GF_SECURITY_ADMIN_PASSWORD
      ```

2.  **Run project-level quality checks (same commands CI uses)**
    - Backend:
      ```powershell
      cd backend
      pip install -r requirements.txt
      isort --check .
      black --check .
      flake8 .
      pytest --cov=app tests/
      cd ..
      ```
    - Frontend:
      ```powershell
      cd frontend
      npm install
      npm run lint
      npm run format:check
      npm test -- --coverage --watchAll=false
      cd ..
      ```

3.  **Start the local stack with Docker Compose**
    ```powershell
    docker-compose up -d
    docker ps
    docker-compose logs backend
    ```
    - Use `http://localhost:3001` for the frontend, `http://localhost:8080/health` for the backend, `http://localhost:9090` for Prometheus, and `http://localhost:3003` for Grafana.
    - Tidy up before re-running if something hangs:
      ```powershell
      docker-compose down --remove-orphans
      ```

4.  **Rebuild/tag images when GHCR `:latest` is missing**
    ```powershell
    docker build -t genesis-backend:latest ./backend
    docker build -t genesis-frontend:latest ./frontend
    docker tag genesis-backend:latest ghcr.io/kieranarchi98/devops-ci-cd-automated-pipeline-backend:latest
    docker tag genesis-frontend:latest ghcr.io/kieranarchi98/devops-ci-cd-automated-pipeline-frontend:latest
    ```
    - Push to GHCR if you need the canonical registry versions: `docker push ghcr.io/<...>`

5.  **Run the Kubernetes (Docker Desktop) deployment**
    ```powershell
    kubectl config get-contexts
    kubectl config use-context docker-desktop
    kubectl cluster-info
    ./scripts/setup-and-verify-k8s.ps1    # creates secrets + stable manifests
    $env:IMAGE_TAG="latest"; ./scripts/deploy-local-k8s.ps1
    kubectl get pods
    kubectl get services
    ```
    - Port-forward if the LoadBalancer services don't expose local ports:
      ```powershell
      kubectl port-forward svc/llm-frontend 3000:3000
      kubectl port-forward svc/llm-backend 8000:8000
      ```

6.  **Deploy monitoring inside Kubernetes (optional but matches CD)**
    ```powershell
    kubectl apply -f k8s/monitoring/prometheus.yaml
    kubectl apply -f k8s/monitoring/grafana.yaml
    kubectl port-forward svc/prometheus-service 9090:9090
    kubectl port-forward svc/grafana-service 3000:3000
    ```
    - Validate canary metrics with the helper script:
      ```powershell
      ./scripts/check-canary-metrics.sh 'job="llm-backend-canary"' 'job="llm-backend-stable"' "http://localhost:9090"
      ```

7.  **Blue/green experimentation (optional)**
    ```powershell
    docker-compose -f docker-compose.blue-green.yml up -d
    ./scripts/switch-traffic.sh blue
    ./scripts/switch-traffic.sh green
    ```
    - Query `http://localhost:8081/active-slot` to see which slot is live.

8.  **Git + GitHub Actions/CD**
    ```powershell
    git checkout -b feature/your-change
    git add .
    git commit -m "chore: describe work"
    git push -u origin feature/your-change
    ```
    - Open a pull request in GitHub to trigger `.github/workflows/ci-cd.yml`.
    - The workflow runs backend lint/test, frontend lint/test/build, Docker build/Trivy, Terraform checks, and then pushes images to GHCR before the CD stage.
    - Merge to `main` or `develop` to promote the new `latest` images and trigger the Kubernetes/CD steps defined in the workflow.

9.  **Troubleshooting quick checks**
    ```powershell
    kubectl get pods
    kubectl describe pod <pod>
    kubectl logs <pod>
    docker ps
    docker logs <container>
    ```
    - Use `DEVOPS-STEPS.log` (also in the repo root) to inspect which commands you've run previously and why—they mirror this checklist.
