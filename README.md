# DevFlow

A developer-centric project management tool built for engineering teams and AI agents. Prioritizes API-native workflows, minimal friction, and first-class support for automation.

## Features

- **Project management** — Create, organize, and delete projects with color labels
- **Todo tracking** — Full task lifecycle: create, edit, filter by status, toggle done, delete
- **Document management** — Upload any file (PDF, DOCX, PNG, MD…), click to download
- **Glass-morphism UI** — Translucent panels, backdrop blur, ambient color blobs
- **AI Agent ready** — Every UI action is available via REST API; agent skill guide served at `/agent-skill`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + TypeScript, Vanilla CSS |
| Backend | Fastify 5 + Prisma ORM |
| Database | SQLite (dev) |
| Icons | Lucide React |
| Testing | Playwright E2E (26 tests) |

## Quick Start

**Prerequisites:** Node.js 18+

```bash
# 1. Install backend dependencies & seed the database
cd code/backend
npm install
npm run seed        # creates sample projects and todos

# 2. Install frontend dependencies
cd ../frontend
npm install

# 3. Start both services (one command)
cd ..
bash start.sh
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:6171 |
| Backend API | http://localhost:3000/v1 |
| Agent Skill Guide | http://localhost:3000/agent-skill |

## API Reference

All endpoints return JSON. Base URL: `http://localhost:3000/v1`

```
GET    /v1/projects                       List projects
POST   /v1/projects                       Create project
DELETE /v1/projects/:slug                 Delete project (cascades)

GET    /v1/projects/:slug/todos           List todos
POST   /v1/projects/:slug/todos           Create todo
PATCH  /v1/todos/:id                      Update todo fields
DELETE /v1/todos/:id                      Delete todo

GET    /v1/projects/:slug/documents       List documents
POST   /v1/projects/:slug/documents       Upload document (multipart)
DELETE /v1/documents/:id                  Delete document
GET    /uploads/:storageKey               Download document file
```

### Todo fields

| Field | Values |
|-------|--------|
| `priority` | `p1` (High) · `p2` (Medium) · `p3` (Low) |
| `status` | `todo` · `in_progress` · `done` · `blocked` |
| `category` | Any string — e.g. `Backend`, `Frontend`, `DevX` |
| `createdBy` | Set to `"agent"` to mark AI-created tasks |

## AI Agent Integration

Start the server, then give your agent this URL:

```
http://localhost:3000/agent-skill
```

The agent skill guide includes full endpoint documentation, request/response examples, data models, and common agent workflows (bulk task creation, status triage, document upload).

**Example — agent creates a task:**
```bash
curl -X POST http://localhost:3000/v1/projects/my-project/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Review API spec", "priority": "p1", "createdBy": "agent"}'
```

## Project Structure

```
code/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Fastify entry, plugin registration
│   │   ├── routes/
│   │   │   ├── projects.ts   # Project CRUD
│   │   │   ├── todos.ts      # Todo CRUD
│   │   │   └── documents.ts  # Document upload/download
│   │   └── lib/prisma.ts     # Prisma client singleton
│   ├── prisma/
│   │   ├── schema.prisma     # Data models
│   │   └── seed.ts           # Sample data
│   ├── uploads/              # Uploaded files (git-ignored)
│   └── agent-skill.md        # AI agent API guide
└── frontend/
    ├── src/
    │   ├── App.tsx            # Root component, state, modals
    │   ├── api.ts             # Typed API client
    │   ├── types/index.ts     # Shared TypeScript types
    │   └── views/
    │       ├── OverviewView.tsx
    │       ├── TodoView.tsx
    │       └── DocumentsView.tsx
    └── e2e/
        └── devflow.spec.ts   # 26 Playwright E2E tests
```

## Running Tests

```bash
cd code/frontend
npx playwright test            # run all 26 E2E tests
npx playwright test --ui       # interactive test runner
```

## Database Reset

```bash
cd code/backend
rm dev.db prisma/dev.db        # delete SQLite files
npx prisma migrate dev         # re-apply schema
npm run seed                   # restore sample data
```

## Roadmap

- Phase 2: CLI tool (`devflow` command)
- Phase 3: Webhooks and audit log
- Phase 4: PostgreSQL + hosted deployment
