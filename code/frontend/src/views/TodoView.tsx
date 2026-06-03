import { useState } from "react";
import { Check, ArrowUp, ArrowDown, Minus, Filter, ArrowUpDown, Terminal } from "lucide-react";
import type { Todo } from "../types";

interface Props {
  todos: Todo[];
  loading: boolean;
  onToggleTodo: (todo: Todo) => void;
}

type FilterStatus = "all" | "in_progress" | "todo" | "blocked" | "done";

function PriorityIcon({ priority }: { priority: string }) {
  if (priority === "p1") return <ArrowUp size={14} className="pri-high" />;
  if (priority === "p3") return <ArrowDown size={14} className="pri-low" />;
  return <Minus size={14} className="pri-med" />;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    todo: "st-todo",
    in_progress: "st-inprogress",
    done: "st-done",
    blocked: "st-blocked",
  };
  const label: Record<string, string> = {
    todo: "Todo",
    in_progress: "In Progress",
    done: "Done",
    blocked: "Blocked",
  };
  return (
    <span className={`status-pill ${map[status] || "st-todo"}`}>
      {label[status] || status}
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
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: "All", value: "all" },
  { label: "In Progress", value: "in_progress" },
  { label: "Todo", value: "todo" },
  { label: "Blocked", value: "blocked" },
  { label: "Done", value: "done" },
];

export default function TodoView({ todos, loading, onToggleTodo }: Props) {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sortByPriority, setSortByPriority] = useState(false);

  let displayed = filter === "all" ? todos : todos.filter((t) => t.status === filter);
  if (sortByPriority) {
    const order = { p1: 0, p2: 1, p3: 2 };
    displayed = [...displayed].sort(
      (a, b) => (order[a.priority as keyof typeof order] ?? 2) - (order[b.priority as keyof typeof order] ?? 2)
    );
  }

  return (
    <div>
      <div className="todo-toolbar">
        {FILTERS.map((f) => (
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
            onClick={() => setSortByPriority((v) => !v)}
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

        {!loading &&
          displayed.map((todo) => (
            <div key={todo.id} className="todo-full-row" onClick={() => onToggleTodo(todo)}>
              <div className={`todo-check ${todo.status === "done" ? "done" : ""}`}>
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
                {todo.content && (
                  <div className="todo-subtitle">{todo.content}</div>
                )}
              </div>
              <CategoryBadge category={todo.category} />
              <span className={todo.priority === "p1" ? "pri-high" : todo.priority === "p3" ? "pri-low" : "pri-med"}>
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
    </div>
  );
}
