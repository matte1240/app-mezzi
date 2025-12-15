# 🚀 Deployment & Release Guide

This guide covers the complete deployment lifecycle, from Docker setup to production releases.

## 📋 Table of Contents
- [Docker Setup](#docker-setup)
- [Deployment Workflow](#deployment-workflow)
- [Release Process](#release-process)

---

## 🐳 Docker Setup

The application is containerized using Docker with:
- **Next.js 16** (Production build)
- **PostgreSQL 16** (Database)
- **Multi-stage build** for optimized images
- **Health checks** & **Persistent volumes**

### Prerequisites
- Docker Engine 24.0+
- Docker Compose 2.0+
- `.env` file configured (see `.env.example`)

### Quick Start
```bash
# Full deployment using helper script
./docker-deploy.sh deploy

# Or using npm scripts
npm run docker:deploy
```

### Useful Commands
| Command | Description |
|---------|-------------|
| `npm run docker:logs` | View container logs |
| `npm run docker:restart` | Restart containers |
| `npm run docker:down` | Stop and remove containers |
| `docker compose ps` | Check container status |

---

## 🚀 Deployment Workflow

The project uses **GitHub Actions** for CI/CD with two environments:

### Architecture
```
┌─────────────────┐
│   GitHub Repo   │
│                 │
│   dev branch    │ ─────► Build Docker :dev
│                 │
│ staging branch  │ ─────► Build + Deploy → 🟡 Staging Server
│                 │
│   main branch   │ ─────► Build + Deploy → 🟢 Production Server
└─────────────────┘
```

### Environments
1.  **Staging**: Deployed from `staging` branch. Used for final testing.
2.  **Production**: Deployed from `main` branch. Live environment.

### GitHub Actions Workflows
- **docker-build.yml**: Builds Docker image on push to `dev`/`main`.
- **deploy-staging.yml**: Deploys to Staging server on push to `staging`.
- **deploy-production.yml**: Deploys to Production server on push to `main`.

### Server Requirements
- Docker & Docker Compose installed
- SSH access configured for GitHub Actions
- Secrets configured in GitHub Repository Settings (see [Configuration Guide](./CONFIGURATION.md))

---

## 📦 Release Process

Releases are automated via GitHub Actions and Semantic Versioning.

### Workflow
1.  **Develop** on `dev` branch.
2.  **Test** on `staging` branch (merge `dev` -> `staging`).
3.  **Deploy** to `main` (merge `staging` -> `main`).
4.  **Release** by tagging `main`.

### Creating a Release
Releases must be created from the `main` branch.

```bash
# 1. Checkout main and pull latest
git checkout main
git pull origin main

# 2. Create and push tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

**Automated Actions:**
- Builds multi-platform Docker image
- Pushes to GitHub Container Registry (`ghcr.io`)
- Creates GitHub Release with auto-generated changelog
