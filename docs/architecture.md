---

# **2️⃣ /docs/architecture.md**

```markdown
# Architecture Overview

Genesis AI Chatbot is designed as a **modular full-stack application**:

## Components

1. **Frontend**
   - React + Next.js for SPA interface
   - Tailwind CSS for styling
   - NPM for dependency management
   - Served via Nginx in Docker container

2. **Backend**
   - Python FastAPI application
   - Handles API requests and routes
   - Communicates with ChatGPT API for LLM responses
   - Organized into:
     - `api/` → route definitions
     - `controllers/` → business logic
     - `services/` → external API calls
     - `schemas/` → data models
     - `middleware/` → request/response processing
     - `utils/` → helper functions

3. **Containerization**
   - Docker images for frontend and backend
   - Docker Compose for local orchestration
   - Kubernetes manifests for production-like orchestration
   - Secrets and ConfigMaps for environment variables

## Data Flow

1. User interacts with frontend (React SPA)
2. Frontend calls backend API (`/api/chat`)
3. Backend validates request and calls OpenAI ChatGPT API
4. Response is returned to frontend
5. Frontend renders the response in chat interface

## Networking

- Local Docker Compose: frontend ↔ backend via service names
- Kubernetes: frontend ↔ backend via ClusterIP services
```
