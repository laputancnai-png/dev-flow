# DevFlow

## Project Overview
DevFlow is a developer-centric project management tool designed for engineering teams. It prioritizes API-native workflows, minimal friction for developers, and first-class support for AI agents and automation scripts. 

### Key Technologies (Recommended)
- **Frontend:** React + Vite (TypeScript), Glass-morphism UI.
- **Backend:** Node.js (Fastify 5), Prisma ORM, SQLite (dev.db), local file storage.
- **CLI:** Node.js (commander.js) or Python.
- **Auth:** JWT + OAuth2 with Service Token support for AI agents.

### Architecture Highlights
- **API-First:** Every UI action is available via REST API and CLI.
- **AI-Ready:** Structured data (UUIDs, stable enums), bulk operations, and webhooks.
- **Context Management:** Projects serve as top-level containers for Documents (specs, diagrams) and Todos (tasks with rich metadata).

---

## Directory Overview
This directory currently contains the foundational documentation and UI mockups for the DevFlow project. It is in the **Definition & Design** phase.

### Key Files
- `docs/DevFlow_PRD.docx`: The Product Requirements Document. Contains detailed specifications for the data model, REST API, CLI, and AI agent integration.
- `docs/devflow_pm_tool.html`: A high-fidelity UI mockup demonstrating the "Glass-morphism" design language, navigation structure, and core views (Overview, Documents, Todo).
- `GEMINI.md`: This file, providing context and instructions for AI interactions within this workspace.

---

## Usage & Development
As the project is currently in the design phase, the primary usage involves:
1. **Reference:** Using the PRD and Mockup to guide implementation.
2. **Implementation:** Scaffolding the React frontend and Fastify/FastAPI backend according to the specs in `DevFlow_PRD.docx`.

### Building and Running
The project is fully implemented. Run with `cd code && bash start.sh`.

- **Backend:** Fastify 5 + Prisma + SQLite, running on port 3000
- **Frontend:** React 19 + Vite, running on port 6171
- **E2E Tests:** `cd code/frontend && npx playwright test`

### Development Conventions
- **API Standards:** Follow REST best practices; all responses should be JSON. Use RFC 7807 for error reporting.
- **Data Integrity:** Use UUIDs for all identifiers. Prefix todo IDs with `todo_`.
- **AI Support:** Ensure all mutations are logged with a `created_by` field to distinguish between human and agent actions.
- **Styling:** Adhere to the glass-morphism aesthetic defined in the HTML mockup (translucent backgrounds, blurs, and specific color palettes for status/priority).

---

## Strategic Roadmap
1. **Phase 1 (Core):** Implement Project/Document/Todo CRUD and basic Web UI.
2. **Phase 2 (API/CLI):** Finalize REST API and publish the CLI tool.
3. **Phase 3 (Automation):** Implement Webhooks and Audit logs.
