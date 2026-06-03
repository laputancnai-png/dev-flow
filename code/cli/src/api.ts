import { BASE_URL } from "./config.js";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json() as any;
  if (!res.ok) throw new ApiError(res.status, data.error ?? "Request failed");
  return data as T;
}

export interface Project {
  id: string; slug: string; name: string; color: string;
  description?: string; defaultView?: string; archived: boolean;
  _count?: { todos: number; documents: number };
}
export interface Todo {
  id: string; projectId: string; title: string; content?: string;
  category?: string; priority: string; status: string;
  dueDate?: string; remarks?: string; createdBy?: string;
  createdAt: string; updatedAt: string;
}
export interface Doc {
  id: string; projectId: string; name: string; filename: string;
  mimeType: string; sizeBytes: number; storageKey: string;
  uploadedBy: string; createdAt: string;
}

export const api = {
  projects: {
    list: () => req<Project[]>("/projects"),
    get:  (slug: string) => req<Project>(`/projects/${slug}`),
    create: (body: Partial<Project>) => req<Project>("/projects", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    delete: (slug: string) => req<{ success: boolean }>(`/projects/${slug}`, { method: "DELETE" }),
  },
  todos: {
    list: (slug: string) => req<Todo[]>(`/projects/${slug}/todos`),
    create: (slug: string, body: Partial<Todo>) => req<Todo>(`/projects/${slug}/todos`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    update: (id: string, body: Partial<Todo>) => req<Todo>(`/todos/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    delete: (id: string) => req<{ success: boolean }>(`/todos/${id}`, { method: "DELETE" }),
  },
  docs: {
    list:   (slug: string) => req<Doc[]>(`/projects/${slug}/documents`),
    delete: (id: string)   => req<{ success: boolean }>(`/documents/${id}`, { method: "DELETE" }),
    upload: async (slug: string, filePath: string): Promise<Doc> => {
      const { readFileSync } = await import("fs");
      const { basename, extname } = await import("path");
      const { lookup } = await import("mime-types").catch(() => ({ lookup: () => "application/octet-stream" }));
      const buf = readFileSync(filePath);
      const mimeType = (lookup(filePath) as string | false) || "application/octet-stream";
      const blob = new Blob([buf], { type: mimeType });
      const form = new FormData();
      form.append("file", blob, basename(filePath));
      const res = await fetch(`${BASE_URL}/projects/${slug}/documents`, {
        method: "POST", body: form as any,
      });
      const data = await res.json() as any;
      if (!res.ok) throw new ApiError(res.status, data.error ?? "Upload failed");
      return data as Doc;
    },
  },
};
