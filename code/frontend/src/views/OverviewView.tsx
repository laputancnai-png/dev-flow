
import { Clock, FileText, Check, Terminal } from "lucide-react";
import type { Todo, Doc } from "../types";

interface Props {
  todos: Todo[];
  docs: Doc[];
  onToggleTodo: (todo: Todo) => void;
  onViewAll: (tab: string) => void;
  projectSlug: string;
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    p1: { label: "P1", cls: "badge-p1" },
    p2: { label: "P2", cls: "badge-p2" },
    p3: { label: "P3", cls: "badge-p3" },
  };
  const info = map[priority] || { label: priority.toUpperCase(), cls: "badge-p2" };
  return <span className={`badge ${info.cls}`}>{info.label}</span>;
}

function CategoryBadge({ category }: { category?: string }) {
  if (!category) return null;
  const lower = category.toLowerCase();
  let cls = "badge-dx";
  if (lower.includes("back")) cls = "badge-be";
  else if (lower.includes("front")) cls = "badge-fe";
  return <span className={`badge ${cls}`}>{category}</span>;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

export default function OverviewView({ todos, docs, onToggleTodo, onViewAll, projectSlug }: Props) {
  const total = todos.length;
  const inProgress = todos.filter((t) => t.status === "in_progress").length;
  const done = todos.filter((t) => t.status === "done").length;
  const blocked = todos.filter((t) => t.status === "blocked").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Tasks</div>
          <div className="stat-val">{total}</div>
          <div className="stat-sub">{inProgress} in progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Progress</div>
          <div className="stat-val" style={{ color: "#534AB7" }}>{inProgress}</div>
          <div className="stat-sub">{blocked > 0 ? `${blocked} blocked` : "on track"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-val" style={{ color: "#1D9E75" }}>{done}</div>
          <div className="stat-sub">{pct}% done</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Blocked</div>
          <div className="stat-val" style={{ color: "#E24B4A" }}>{blocked}</div>
          <div className="stat-sub">{blocked > 0 ? "Needs attention" : "All clear"}</div>
        </div>
      </div>

      <div className="glass-card">
        <div className="card-header">
          <div className="card-header-left">
            <Clock size={14} style={{ color: "#534AB7" }} /> Recent tasks
          </div>
          <span className="view-all-link" onClick={() => onViewAll("todo")}>View all →</span>
        </div>
        {todos.length === 0 && <div className="empty-state">No tasks yet. Create your first task!</div>}
        {todos.slice(0, 5).map((todo) => (
          <div key={todo.id} className="todo-row" onClick={() => onToggleTodo(todo)}>
            <div className={`todo-check ${todo.status === "done" ? "done" : ""}`}>
              {todo.status === "done" && <Check size={10} color="white" />}
            </div>
            <span className={`todo-title ${todo.status === "done" ? "done" : ""}`}>{todo.title}</span>
            <div className="todo-meta">
              <CategoryBadge category={todo.category} />
              <PriorityBadge priority={todo.priority} />
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card">
        <div className="card-header">
          <div className="card-header-left">
            <FileText size={14} style={{ color: "#1D9E75" }} /> Documents
          </div>
          <span className="view-all-link" onClick={() => onViewAll("docs")}>View all →</span>
        </div>
        {docs.length === 0 && <div className="empty-state">No documents yet.</div>}
        {docs.slice(0, 3).map((doc) => (
          <div key={doc.id} className="todo-row">
            <FileText size={16} style={{ color: "#534AB7" }} />
            <span className="todo-title">{doc.name}</span>
            <span className="doc-time">{timeAgo(doc.createdAt)}</span>
          </div>
        ))}
      </div>

      <div className="api-hint">
        <Terminal size={14} style={{ color: "#534AB7" }} />
        <span>AI agents can manage this project via API —</span>
        <code>GET /v1/projects/{projectSlug}/todos</code>
        <code>PATCH /v1/todos/:id</code>
      </div>
    </div>
  );
}
