Frontend (Next.js + TypeScript)

Features
- Next.js App Router (TypeScript)
- Reusable API client and hooks for calling Django APIs
- Basic pages: Home, Login, Register

Environment
- Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_BASE_URL` (e.g., `http://localhost:8000`).

Install & Run
- `npm install`
- `npm run dev`
- App runs on `http://localhost:3000`

Auth Flow
- On login/register, backend returns a token.
- Token is stored in `localStorage` and sent in `Authorization: Token <token>` header.

Notes
- For production, consider httpOnly cookies and SSR-friendly auth.
