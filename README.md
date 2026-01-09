# Genesis AI Chatbot

Genesis AI Chatbot is a full-stack LLM-driven conversational assistant built as a learning and demonstration project. It pairs a Next.js + Tailwind frontend with a FastAPI backend that calls the OpenAI ChatGPT API. The repo is also used to demonstrate containerization (Docker), local development with Docker Compose, Kubernetes manifests, and a sample CI/CD pipeline.

---

## Goals

- Provide a minimal, production-structured example of an LLM-powered web app.
- Show how to connect a Next.js UI to a Python FastAPI backend that proxies requests to OpenAI's ChatGPT API.
- Demonstrate containerization with Docker, local development with Docker Compose, and deployment manifests for Kubernetes.
- Integrate an industry-standard CI/CD workflow (GitHub Actions) to automate build and deployment steps.

---

## Table of Contents

1. Features
2. Tech stack
3. Architecture overview
4. Local development
5. Docker & Kubernetes
6. CI/CD
7. Environment variables
8. Project structure
9. Contributing
10. Docs

---

## Features

- Browser chat UI powered by ChatGPT.
- FastAPI backend acting as a secure proxy to the ChatGPT API.
- Dockerfiles for frontend and backend, and a `docker-compose.yml` for local development.
- Kubernetes manifests under `k8s/` for deploying to a cluster.
- Example CI/CD pipeline for automated builds and deployments.

---

## Tech stack

- Frontend: Next.js, React, Tailwind CSS
- Backend: Python 3.11, FastAPI, Uvicorn
- LLM: OpenAI ChatGPT API
- Containerization: Docker, Docker Compose
- Orchestration: Kubernetes (manifests included)
- CI/CD: GitHub Actions (example workflows)

---

## Architecture overview

The app is split into two main services:

- Frontend (Next.js): renders the chat UI and handles client-side state and streaming UI updates.
- Backend (FastAPI): receives chat requests from the frontend, performs any necessary validation or session handling, and forwards user messages to the OpenAI ChatGPT API. The backend keeps secrets (API keys) off the client.

Communication patterns:

- Browser <-> Frontend (Next.js pages/components)
- Frontend -> Backend: HTTP requests to the API endpoints in `backend/app/api/`.
- Backend -> OpenAI: secure server-side requests using the `OPENAI_API_KEY` environment variable.

Key files:

- `backend/app/main.py` – FastAPI app entrypoint
- `backend/requirements.txt` – Python dependencies
- `frontend/` – Next.js app with UI components in `frontend/components/`
- `docker-compose.yml` – local development orchestration for frontend + backend
- `k8s/` – Kubernetes YAML manifests for deployments and services

---

## Local development

Prerequisites:

- Docker Desktop (or Docker + docker-compose), or
- Python 3.11 and Node.js 18+ (for running services locally without Docker)

Run frontend locally (node):

```bash
cd frontend
npm install
npm run dev
```

Run backend locally (Python venv):

Windows (PowerShell):

```powershell
cd backend
python -m venv venv
venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Linux / macOS:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

By default, the frontend expects the backend API at `/api` (see `frontend/services/api.ts`). If running separately, update the frontend config or use a proxy/rewrite in `next.config.js`.

Run both with Docker Compose (recommended for parity):

```bash
docker-compose up --build
```

This will build and start the frontend and backend containers and any supporting services defined in `docker-compose.yml`.

---

## Docker & Kubernetes

- Dockerfiles are included for both `frontend` and `backend`.
- Use `docker-compose.yml` for local multi-service runs and quick iteration.
- The `k8s/` folder contains example Kubernetes manifests for `Deployment` and `Service` resources for both frontend and backend.

Secrets and environment variables should be provided to containers via environment variables in Docker Compose or using Kubernetes `Secret` objects in production.

---

## CI/CD

This repository is set up to demonstrate CI/CD using GitHub Actions (example workflows should be added under `.github/workflows/`). Suggested pipeline steps:

1. Lint and run tests for backend and frontend.
2. Build production Docker images for frontend and backend.
3. Push images to a container registry (Docker Hub / GitHub Packages / ACR).
4. Deploy or update Kubernetes manifests pointing to the new image tags.

If you'd like, I can add a starter GitHub Actions workflow that builds images and runs tests.

---

## Environment variables

Required for local and production runs:

- `OPENAI_API_KEY` – your OpenAI API key (backend-only; never expose this in the frontend)
- `BACKEND_HOST` / `BACKEND_PORT` – used by frontend if not using proxy/rewrite

Store secrets in your platform's secret manager, or in Kubernetes `Secret` resources when deploying to a cluster.

---

## Project structure (high level)

- `backend/` – FastAPI application, controllers, services, and Dockerfile
- `frontend/` – Next.js application, components, and Dockerfile
- `k8s/` – Kubernetes deployment and service manifests
- `docker-compose.yml` – compose orchestration for local development
- `README.md` – this file

---

## Contributing

Contributions are welcome. Suggested workflow:

1. Fork the repo and create a feature branch.
2. Add tests for new behavior.
3. Open a pull request describing the change.

Please do not commit secrets or API keys to the repository.

---

## Next steps I can help with

- Add a GitHub Actions workflow to the repo (build/test/deploy).
- Add example environment config and `.env.example`.
- Add basic automated tests for the backend (pytest) and frontend (Jest).

---

## Start Commands

```bash
cd backend
uvicorn app.main:app --reload

cd frontend
npm run dev
```


📝 README Discipline
Every repo should have:
What it does
How to run it
How to test it
Architecture overview (bonus)
