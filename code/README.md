# DevFlow Implementation

This folder contains the complete implementation of DevFlow based on the PRD and UI mockup.

## Structure
- `backend/`: Fastify API with Prisma & SQLite.
- `frontend/`: React + TypeScript frontend with Vanilla CSS Glass-morphism.

## How to Run

### 1. Start the Backend
```bash
cd backend
npm install
npm run dev
```
The server will run on `http://localhost:3000`.

### 2. Start the Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:5173` (or the next available port).

## Features Implemented
- **Project Sidebar:** List of active projects with status dots.
- **Overview Dashboard:** Stat cards and recent task list.
- **Todo List:** Full task table with category badges, priority icons, and status pills.
- **Task Interaction:** Click any task (in Overview or Todo) to toggle between 'Todo' and 'Done'.
- **Glass-morphism UI:** Translucent panels, blurs, and ambient blobs as per the design spec.

## Tech Stack
- **Frontend:** React, Lucide React, Vanilla CSS.
- **Backend:** Fastify, Prisma, SQLite, tsx.
