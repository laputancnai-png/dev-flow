import { useState } from "react";
import { Check, ArrowUp, ArrowDown, Minus, Filter, ArrowUpDown, Terminal, X, Trash2 } from "lucide-react";
import type { Todo } from "../types";
import { api } from "../api";

interface Props {
  todos: Todo[];
  loading: boolean;
  onToggleTodo: (todo: Todo) => void;
  onTodosChange: () => void;
}

type FilterStatus = "all" | "in_progress" | "todo" | "blocked" | "done";

const PRIORITY_COLOR: Record<string, string> = { p1: "pri-high", p2: "pri-med", p3: "pri-low" };
const STATUS_CLASS: Record<string, string> = {
  todo: "st-todo", in_progress: "st-inprogress", done: "st-done", blocked: "st-blocked",
};
const STATUS_LABEL: Record<string, string> = {
  todo: "Todo", in_progress: "In Progress", done: "Done", blocked: "Blocked",
};

function PriorityIcon({ priority }: { priority: string }) {
  if (priority === "p1") return <ArrowUp size={14} />;
  if (priority === "p3") return <ArrowDown size={14} />;
  return <Minus size={14} />;
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`status-pill ${STATUS_CLASS[status] || "st-todo"}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function CategoryBadge({ category }: { category?: string }) {
  if (!category) return <span />;
  const lower = category.toLowerCase();
  let cls = "badge-dx";
  if (lower.includes("back")) cls = "badge-be";
  else if (lower.includes("front")) cls = "badge-fe";
  return <span className={`badge ${cls}`}>{category}</span>;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function toInputDate(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().slice(0, 10);
}

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: "All", value: "all" },
  { label: "In Progress", value: "in_progress" },
  { label: "Todo", value: "todo" },
  { label: "Blocked", value: "blocked" },
  { label: "Done", value: "done" },
];

// ── Edit modal ──────────────────────────────────────────────────────────────
function TodoEditModal({ todo, onClose, onSaved, onDeleted }: {
  todo: Todo;
  onClose: () => void;
  onSaved: (updated: Todo) => void;
  onDeleted: (id: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    title: todo.title,
    content: todo.content || "",
    category: todo.category || "Backend",
    priority: todo.priority,
    status: todo.status,
    dueDate: toInputDate(todo.dueDate),
    remarks: todo.remarks || "",
  });

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const updated = await api.todos.update(todo.id, {
      ...form,
      dueDate: form.dueDate || undefined,
    }).catch(console.error);
    setSaving(false);
    if (updated) { onSaved(updated); onClose(); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this task?")) return;
    setDeleting(true);
    await api.todos.delete(todo.id).catch(console.error);
    setDeleting(false);
    onDeleted(todo.id);
    onClose();
  };

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          Edit task
          <X size={18} style={{ cursor: "pointer", color: "var(--color-text-tertiary)" }} onClick={onClose} />
        </div>
        <div className="modal-body">
          <form id="edit-todo-form" onSubmit={handleSave}>
            <div className="form-field">
              <label className="form-label">Title</label>
              <input
                required className="form-input"
                value={form.title}
                onChange={e => set("title", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Content / Notes</label>
              <textarea
                rows={3} className="form-input"
                style={{ resize: "vertical" }}
                value={form.content}
                onChange={e => set("content", e.target.value)}
              />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Category</label>
                <select className="form-input" value={form.category} onChange={e => set("category", e.target.value)}>
                  {["Backend", "Frontend", "DevX", "Design", "Ops"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Priority</label>
                <select className="form-input" value={form.priority} onChange={e => set("priority", e.target.value)}>
                  <option value="p1">P1 — High</option>
                  <option value="p2">P2 — Medium</option>
                  <option value="p3">P3 — Low</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Status</label>
                <select className="form-input" value={form.status} onChange={e => set("status", e.target.value)}>
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Due date</label>
                <input
                  type="date" className="form-input"
                  value={form.dueDate}
                  onChange={e => set("dueDate", e.target.value)}
                />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Remarks</label>
              <input
                type="text" className="form-input"
                value={form.remarks}
                onChange={e => set("remarks", e.target.value)}
              />
            </div>
          </form>
        </div>
        <div className="modal-footer" style={{ justifyContent: "space-between" }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ color: "#A32D2D" }}
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 size={13} /> {deleting ? "Deleting..." : "Delete"}
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" form="edit-todo-form" className="btn-primary" disabled={saving}>
              <Check size={13} /> {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function TodoView({ todos, loading, onToggleTodo, onTodosChange }: Props) {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sortByPriority, setSortByPriority] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  let displayed = filter === "all" ? todos : todos.filter(t => t.status === filter);
  if (sortByPriority) {
    const order = { p1: 0, p2: 1, p3: 2 };
    displayed = [...displayed].sort(
      (a, b) => (order[a.priority as keyof typeof order] ?? 2) - (order[b.priority as keyof typeof order] ?? 2)
    );
  }

  const handleSaved = (_updated: Todo) => {
    onTodosChange();
  };

  const handleDeleted = (_id: string) => {
    onTodosChange();
  };

  return (
    <div>
      <div className="todo-toolbar">
        {FILTERS.map(f => (
          <span
            key={f.value}
            className={`filter-chip ${filter === f.value ? "active" : ""}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </span>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <span className="filter-chip">
            <Filter size={12} /> Filter
          </span>
          <span
            className={`filter-chip ${sortByPriority ? "active" : ""}`}
            onClick={() => setSortByPriority(v => !v)}
          >
            <ArrowUpDown size={12} /> Sort
          </span>
        </div>
      </div>

      <div className="glass-card">
        <div className="todo-table-header">
          <div />
          <div>Title</div>
          <div>Category</div>
          <div>Priority</div>
          <div>Status</div>
          <div>Date</div>
        </div>

        {loading && <div className="empty-state">Loading...</div>}
        {!loading && displayed.length === 0 && (
          <div className="empty-state">No tasks match this filter.</div>
        )}

        {!loading && displayed.map(todo => (
          <div
            key={todo.id}
            className="todo-full-row"
            onClick={() => setEditingTodo(todo)}
          >
            <div
              className={`todo-check ${todo.status === "done" ? "done" : ""}`}
              onClick={e => { e.stopPropagation(); onToggleTodo(todo); }}
              title="Toggle done"
            >
              {todo.status === "done" ? (
                <Check size={10} color="white" />
              ) : (
                <Minus size={9} style={{ color: "var(--color-text-tertiary)" }} />
              )}
            </div>
            <div>
              <div className={`todo-title ${todo.status === "done" ? "done" : ""}`}>
                {todo.title}
              </div>
              {todo.content && <div className="todo-subtitle">{todo.content}</div>}
            </div>
            <CategoryBadge category={todo.category} />
            <span className={PRIORITY_COLOR[todo.priority]}>
              <PriorityIcon priority={todo.priority} />
            </span>
            <StatusPill status={todo.status} />
            <span className="date-col">{formatDate(todo.dueDate)}</span>
          </div>
        ))}
      </div>

      <div className="api-hint">
        <Terminal size={14} style={{ color: "#534AB7" }} />
        <span>AI Agent can update tasks —</span>
        <code>PATCH /v1/todos/:id</code>
        <code>POST /v1/projects/:slug/todos</code>
      </div>

      {editingTodo && (
        <TodoEditModal
          todo={editingTodo}
          onClose={() => setEditingTodo(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
