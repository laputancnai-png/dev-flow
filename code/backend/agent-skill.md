# DevFlow AI Agent Skill

**Base URL:** `http://localhost:3000/v1`

DevFlow is a developer-centric project management tool. AI agents can manage projects, tasks (todos), and documents via a REST API. All requests and responses use JSON (except file uploads which use multipart/form-data).

---

## Quick Reference

| Action | Method | Path |
|--------|--------|------|
| List projects | GET | `/v1/projects` |
| Create project | POST | `/v1/projects` |
| Delete project | DELETE | `/v1/projects/:slug` |
| List todos | GET | `/v1/projects/:slug/todos` |
| Create todo | POST | `/v1/projects/:slug/todos` |
| Update todo | PATCH | `/v1/todos/:id` |
| Delete todo | DELETE | `/v1/todos/:id` |
| List documents | GET | `/v1/projects/:slug/documents` |
| Upload document | POST | `/v1/projects/:slug/documents` |
| Delete document | DELETE | `/v1/documents/:id` |
| This skill guide | GET | `/agent-skill` |

---

## Data Models

### Project
```json
{
  "id": "uuid",
  "slug": "my-project",
  "name": "My Project",
  "description": "Optional description",
  "color": "#534AB7",
  "defaultView": "overview",
  "archived": false,
  "createdAt": "2026-06-03T00:00:00.000Z",
  "updatedAt": "2026-06-03T00:00:00.000Z"
}
```

### Todo
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "title": "Implement rate limiting",
  "content": "Use token bucket algorithm, configurable per route",
  "category": "Backend",
  "priority": "p1",
  "status": "in_progress",
  "dueDate": "2026-06-10T00:00:00.000Z",
  "remarks": "Blocked on Redis setup",
  "createdBy": "agent",
  "createdAt": "2026-06-03T00:00:00.000Z",
  "updatedAt": "2026-06-03T00:00:00.000Z"
}
```

**Enums:**
- `priority`: `p1` (High), `p2` (Medium), `p3` (Low)
- `status`: `todo`, `in_progress`, `done`, `blocked`
- `category`: any string — e.g. `Backend`, `Frontend`, `DevX`, `Design`, `Ops`

### Document
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "name": "Tech Spec",
  "filename": "tech-spec.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 204800,
  "storageKey": "1717400000000-abc123.pdf",
  "uploadedBy": "agent",
  "createdAt": "2026-06-03T00:00:00.000Z"
}
```

---

## Projects API

### List all active projects
```http
GET /v1/projects
```

Response: array of Project objects (includes `_count.todos` and `_count.documents`).

### Create a project
```http
POST /v1/projects
Content-Type: application/json

{
  "name": "Payment Service v2",
  "description": "Stripe integration rewrite",
  "color": "#1D9E75",
  "defaultView": "overview"
}
```

> `slug` is auto-generated from `name` by lowercasing and replacing spaces with `-`.

### Delete a project
```http
DELETE /v1/projects/:slug
```

Cascades: removes all todos, documents (database + files on disk).

---

## Todos API

### List todos for a project
```http
GET /v1/projects/:slug/todos
```

Returns todos ordered by `createdAt` desc.

### Create a todo
```http
POST /v1/projects/:slug/todos
Content-Type: application/json

{
  "title": "Implement rate limiting middleware",
  "content": "Use token bucket algo, configurable per route",
  "category": "Backend",
  "priority": "p1",
  "status": "in_progress",
  "dueDate": "2026-06-10",
  "remarks": "Blocked on Redis setup",
  "createdBy": "agent"
}
```

> Set `createdBy: "agent"` to distinguish AI-created tasks from human ones.

### Update a todo (partial update)
```http
PATCH /v1/todos/:id
Content-Type: application/json

{
  "status": "done"
}
```

Any subset of fields can be updated. Common use cases:
- Update status: `{ "status": "in_progress" }`
- Mark done: `{ "status": "done" }`
- Update priority: `{ "priority": "p1" }`
- Add remarks: `{ "remarks": "Blocked on external API" }`

### Delete a todo
```http
DELETE /v1/todos/:id
```

---

## Documents API

### List documents for a project
```http
GET /v1/projects/:slug/documents
```

### Upload a document
```http
POST /v1/projects/:slug/documents
Content-Type: multipart/form-data

file=@./tech-spec.pdf
```

Using curl:
```bash
curl -X POST http://localhost:3000/v1/projects/my-project/documents \
  -F "file=@./tech-spec.pdf"
```

Max file size: 50 MB. Any file type is accepted.

### Download a document
```http
GET /uploads/:storageKey
```

The `storageKey` field is returned in the document object. Use it to construct the download URL:
```
http://localhost:3000/uploads/{storageKey}
```

### Delete a document
```http
DELETE /v1/documents/:id
```

---

## Error Responses

All errors return:
```json
{ "error": "Human-readable error message" }
```

Common errors:
- `404 { "error": "Project not found" }` — invalid slug
- `404 { "error": "Todo not found" }` — invalid id
- `400 { "error": "No file provided" }` — upload without file

---

## Common Agent Workflows

### 1. Triage and update task statuses
```bash
# Get all todos for a project
GET /v1/projects/my-project/todos

# Update stale tasks
PATCH /v1/todos/{id}
{ "status": "blocked", "remarks": "Waiting on design review" }
```

### 2. Create tasks from a spec document
```bash
# First, create the project
POST /v1/projects
{ "name": "New Feature", "color": "#534AB7" }

# Then bulk-create todos
POST /v1/projects/new-feature/todos
{ "title": "Write API spec", "priority": "p1", "createdBy": "agent" }

POST /v1/projects/new-feature/todos
{ "title": "Implement endpoints", "priority": "p2", "createdBy": "agent" }
```

### 3. Upload a generated document
```bash
# Write spec to file, then upload
curl -X POST http://localhost:3000/v1/projects/my-project/documents \
  -F "file=@./generated-spec.md"
```

### 4. Get project overview
```bash
# Projects with todo/doc counts
GET /v1/projects

# Detailed view with all todos
GET /v1/projects/:slug
```

---

## Notes for AI Agents

- **Identify yourself**: use `createdBy: "agent"` or your agent name when creating todos
- **Slugs are stable**: use project slugs (not IDs) in paths — slugs are human-readable and don't change
- **Partial PATCH**: only send the fields you want to update — the rest are preserved
- **No authentication required** in the current deployment (internal/dev use)
