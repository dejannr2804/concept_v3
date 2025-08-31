Frontend (Next.js + TypeScript)

Features
- Next.js App Router (TypeScript)
- Reusable API client and hooks for calling Django APIs
- Basic pages: Home, Login, Register
- Resource hooks for scalable create/update: see `docs/resource-hooks.md`

Environment
- Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_BASE_URL` (e.g., `http://localhost:8000`).

Install & Run
- `npm install`
- `npm run dev`
- App runs on `http://localhost:3000`

Auth Flow
- Login/Register happen via Next API routes under `/api/auth/*`.
- A secure httpOnly cookie stores the token; no localStorage.
- Server components get the user via `getCurrentUser()` for SSR.
- Client components consume `AuthProvider` context with `initialUser` from SSR.

Notes
- Configure `NEXT_PUBLIC_API_BASE_URL` to point to the Django server (e.g., `http://localhost:8000`).
- Cookies use `SameSite=Lax`, `HttpOnly`, and `Secure` in production.
