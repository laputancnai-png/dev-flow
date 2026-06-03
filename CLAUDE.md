# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevFlow is a developer-centric project management tool. It is API-first, designed for engineering teams and AI agents. The current implementation (in `code/`) covers Project/Todo CRUD with a glass-morphism React UI.

## Running the App

**One-click start (both services):**
```bash
cd code && bash start.sh
```

**Manual start:**
```bash
# Backend (port 3000)
cd code/backend && npm install && npm run dev

# Frontend (port 6171)
cd code/frontend && npm install && npm run dev -- --port 6171
```

**Seed the database:**
```bash
cd code/backend && npm run seed
```

**Frontend build & lint:**
```bash
cd code/frontend
npm run build    # tsc + vite build
npm run lint     # eslint
```

## Architecture

### Backend (`code/backend/`)
- **Fastify 5** + **Prisma** (SQLite at `backend/dev.db` via `DATABASE_URL=file:./dev.db`)
- Entry: `src/index.ts` — registers two route plugins under `/v1`
- Routes: `src/routes/projects.ts`, `src/routes/todos.ts`
- DB client singleton: `src/lib/prisma.ts`
- Run with `tsx` (no compile step); TypeScript module type (`"type": "module"`)

**API surface:**
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/v1/projects` | List / create projects |
| GET | `/v1/projects/:slug` | Get project with todos + docs |
| GET/POST | `/v1/projects/:slug/todos` | List / create todos |
| PATCH | `/v1/todos/:id` | Update todo fields |
| DELETE | `/v1/todos/:id` | Delete todo |
| GET | `/v1/projects/:slug/documents` | List documents |
| POST | `/v1/projects/:slug/documents` | Upload document (multipart) |
| DELETE | `/v1/documents/:id` | Delete document |

### Frontend (`code/frontend/`)
- **React 19** + **Vite** + TypeScript (no state management library)
- All UI lives in a single file: `src/App.tsx`
- Styles: vanilla CSS in `src/App.css` and `src/index.css` (glass-morphism aesthetic — translucent panels, backdrop blur, ambient blobs)
- Icons: Lucide React
- `API_BASE` is hardcoded to `http://localhost:3000/v1`

The frontend fetches data directly in `App.tsx` using the native `fetch` API with optimistic updates for todo status toggles.

## Data Model

```
Project: id (uuid), slug (unique, auto-derived from name), name, color, archived
Todo: id (uuid), projectId, title, category, priority (p1/p2/p3), status (todo/in_progress/done/blocked), dueDate, remarks, createdBy
Document: id (uuid), projectId, name, docType, filename, mimeType, storageKey
```

## Key Conventions

- **Project lookup uses `slug`**, not `id`, in URL paths. Slug is auto-generated: `name.toLowerCase().replace(/ /g, "-")`.
- **Error responses** use `{ error: "..." }` — the frontend reads `data.error`, not `data.message`.
- **`createdBy` field** on Todo distinguishes human vs. agent actions (supports AI-native workflow).
- No tests are configured yet (`npm test` exits with error).
- Prisma migrations are committed in `prisma/migrations/`. To reset: delete `dev.db`, run `npx prisma migrate dev`, then `npm run seed`.
