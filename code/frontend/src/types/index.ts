export interface Project {
  id: string;
  slug: string;
  name: string;
  color: string;
  description?: string;
  defaultView?: string;
  _count?: { todos: number; documents: number };
}

export interface Todo {
  id: string;
  title: string;
  content?: string;
  category?: string;
  priority: string; // p1, p2, p3
  status: string;   // todo, in_progress, done, blocked
  dueDate?: string;
  remarks?: string;
}

export interface Doc {
  id: string;
  projectId: string;
  name: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  version?: string;
  uploadedBy: string;
  createdAt: string;
}
