import type { Project, Todo, Doc } from "./types";

export const API_BASE = "http://localhost:3000/v1";

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export const api = {
  projects: {
    list: () => req<Project[]>("/projects"),
    create: (body: Partial<Project>) =>
      req<Project>("/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
  },
  todos: {
    list: (slug: string) => req<Todo[]>(`/projects/${slug}/todos`),
    create: (slug: string, body: Partial<Todo>) =>
      req<Todo>(`/projects/${slug}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    update: (id: string, body: Partial<Todo>) =>
      req<Todo>(`/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    delete: (id: string) => req<{ success: boolean }>(`/todos/${id}`, { method: "DELETE" }),
  },
  documents: {
    list: (slug: string) => req<Doc[]>(`/projects/${slug}/documents`),
    upload: (slug: string, file: File) => {
      const form = new FormData();
      form.append("file", file);
      return req<Doc>(`/projects/${slug}/documents`, { method: "POST", body: form });
    },
    delete: (id: string) => req<{ success: boolean }>(`/documents/${id}`, { method: "DELETE" }),
  },
};
