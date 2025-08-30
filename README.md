Monorepo: Next.js + Django (DRF) Web App

This repository contains a production‑ready structure for a scalable web application with a Next.js frontend and a Django REST Framework backend. The apps communicate strictly via HTTP APIs.

Structure
- frontend/ — Next.js (TypeScript, App Router)
- backend/ — Django + DRF + Token Auth
- .env.example — Example env for both parts

Quick Start
- See `backend/README.md` for backend setup (Postgres, migrations, runserver).
- See `frontend/README.md` for frontend setup (env, dev server, calling APIs).

Auth Overview
- Token-based login and registration endpoints under `/api/v1/auth/` on the backend.
- Frontend provides reusable hooks (`hooks/useAuth.ts`, `hooks/useApi.ts`) and an `ApiClient` wrapper.

Notes
- For production, prefer issuing httpOnly cookies for auth (e.g., JWT) and enforcing CSRF when using session auth. This template uses DRF TokenAuth for simplicity.
