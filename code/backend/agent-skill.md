# DevFlow Agent Skill

> Give this URL to any AI agent: `http://localhost:3000/agent-skill`
> The agent can also read the CLI-specific guide at: `http://localhost:3000/cli-skill`

DevFlow is a developer-centric project management tool. Every action available in the web UI is also available via **REST API** and **CLI**. This document covers both interfaces so an agent can choose whichever is most convenient.

---

## System Overview

| Component | URL / Command |
|-----------|--------------|
| Web UI | http://localhost:6171 |
| REST API base | http://localhost:3000/v1 |
| CLI entry | `node code/cli/bin/devflow.js` (or `devflow` if installed globally) |
| This skill guide | http://localhost:3000/agent-skill |
| CLI skill guide | http://localhost:3000/cli-skill |

**No authentication is required** in the current deployment (internal/dev use).

---

## Data Models

### Project
```json
{
  "id": "uuid",
  "slug": "api-gateway-v2",
  "name": "API Gateway v2",
  "description": "Next-gen gateway",
  "color": "#534AB7",
  "defaultView": "overview",
  "archived": false,
  "createdAt": "2026-06-03T00:00:00.000Z"
}
```

### Todo (Task)
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
  "remarks": "Blocked on Redis",
  "createdBy": "agent",
  "createdAt": "2026-06-03T00:00:00.000Z"
}
```

**Enums:**
- `priority`: `p1` (High) · `p2` (Medium) · `p3` (Low)
- `status`: `todo` · `in_progress` · `done` · `blocked`

### Document
```json
{
  "id": "uuid",
  "name": "Tech Spec",
  "filename": "tech-spec.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 204800,
  "storageKey": "1717400000000-abc123.pdf",
  "createdAt": "2026-06-03T00:00:00.000Z"
}
```

---

## REST API Reference

Base URL: `http://localhost:3000/v1`

All request/response bodies are JSON. File upload uses `multipart/form-data`.

### Projects

```
GET    /v1/projects               → Project[]     List active projects
POST   /v1/projects               → Project       Create project
DELETE /v1/projects/:slug         → {success}     Delete project + all data
```

**Create project body:**
```json
{ "name": "Payment Service v2", "description": "...", "color": "#1D9E75", "defaultView": "overview" }
```

### Todos

```
GET    /v1/projects/:slug/todos   → Todo[]    List todos (newest first)
POST   /v1/projects/:slug/todos   → Todo      Create todo
PATCH  /v1/todos/:id              → Todo      Partial update
DELETE /v1/todos/:id              → {success} Delete todo
```

**Create todo body:**
```json
{
  "title": "Write OpenAPI spec",
  "content": "Cover all v2 endpoints with examples",
  "category": "DevX",
  "priority": "p2",
  "status": "todo",
  "dueDate": "2026-06-15",
  "remarks": "Needs review from team",
  "createdBy": "agent"
}
```

**Update todo — send only changed fields:**
```json
{ "status": "done" }
{ "priority": "p1", "remarks": "Now urgent" }
{ "status": "blocked", "remarks": "Waiting on infra" }
```

### Documents

```
GET    /v1/projects/:slug/documents   → Doc[]     List documents
POST   /v1/projects/:slug/documents   → Doc       Upload (multipart/form-data, field: "file")
DELETE /v1/documents/:id              → {success} Delete document + file on disk
GET    /uploads/:storageKey           → binary    Download file
```

### Error format

All errors return: `{ "error": "Human-readable message" }` with appropriate HTTP status.

---

## CLI Reference

**Install / run:**
```bash
cd code/cli && npm install
node bin/devflow.js --help

# Or set DEVFLOW_URL to target a different server
DEVFLOW_URL=http://prod-server:3000/v1 node bin/devflow.js projects list
```

### Projects CLI

```bash
# List all projects
devflow projects list

# Create a project
devflow projects create "My Project" --color "#534AB7" --description "What we're building"

# Delete a project (with all tasks and documents)
devflow projects delete my-project --yes          # --yes skips confirmation
```

### Todos CLI

```bash
# List tasks for a project
devflow todos list my-project
devflow todos list my-project --status in_progress
devflow todos list my-project --priority p1

# Create a task
devflow todos create my-project "Task title" \
  --priority p1 \
  --category Backend \
  --content "Acceptance criteria here" \
  --status todo \
  --due 2026-06-15 \
  --agent                    # marks createdBy=agent

# Update a task (use full UUID or 8-char prefix + --project)
devflow todos update <id> --project my-project --status in_progress
devflow todos update <id> --project my-project --priority p1 --remarks "Now urgent"

# Mark done (shortcut)
devflow todos done <id> --project my-project

# Delete a task
devflow todos delete <id> --project my-project --yes
```

### Documents CLI

```bash
# List documents
devflow docs list my-project

# Upload a file
devflow docs upload my-project ./spec.pdf
devflow docs upload my-project ./architecture.png

# Delete a document
devflow docs delete <id> --yes
```

---

## Agent Workflows

### 1. Understand a project's current state
```bash
# Via CLI
devflow projects list
devflow todos list my-project

# Via REST API
curl http://localhost:3000/v1/projects
curl http://localhost:3000/v1/projects/my-project/todos
```

### 2. Create tasks from a spec (bulk)
```bash
# CLI — create multiple tasks
devflow todos create api-gw-v2 "Implement rate limiting" --priority p1 --category Backend --agent
devflow todos create api-gw-v2 "Write OpenAPI 3.0 spec" --priority p2 --category DevX --agent
devflow todos create api-gw-v2 "SDK generation — Python & TS" --priority p2 --category DevX --agent

# REST API — same as POST /v1/projects/api-gw-v2/todos for each task
```

### 3. Triage and update task statuses
```bash
# List in-progress tasks
devflow todos list my-project --status in_progress

# Mark completed
devflow todos done <id> --project my-project

# Flag a blocker
devflow todos update <id> --project my-project \
  --status blocked \
  --remarks "Waiting on third-party API access"
```

### 4. Upload generated documents
```bash
# Generate a doc, then upload
devflow docs upload my-project ./generated-spec.md
devflow docs upload my-project ./architecture-diagram.png

# REST API
curl -X POST http://localhost:3000/v1/projects/my-project/documents \
  -F "file=@./generated-spec.md"
```

### 5. Create a new project and populate it
```bash
devflow projects create "Sprint 42" --color "#1D9E75"
devflow todos create sprint-42 "Design API contract" --priority p1 --agent
devflow todos create sprint-42 "Implement endpoints" --priority p1 --agent
devflow todos create sprint-42 "Write integration tests" --priority p2 --agent
devflow todos create sprint-42 "Update docs" --priority p3 --agent
```

---

## Key Conventions

- **Identify agent work**: always set `createdBy: "agent"` (CLI: `--agent` flag) so tasks can be filtered from human-created ones
- **Slugs are stable**: use the project `slug` (not `id`) in paths — slugs are human-readable and don't change after creation
- **Short IDs**: the CLI list shows 8-char short IDs; use them with `--project <slug>` for update/done/delete, or pass the full UUID
- **Partial PATCH**: only send fields you want to change — all others are preserved
- **Slug generation**: when creating a project, `slug` is auto-generated as `name.toLowerCase().replace(/ /g, "-")`
