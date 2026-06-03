import chalk from "chalk";
import Table from "cli-table3";

// ── Colours ───────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, chalk.Chalk> = {
  todo:        chalk.white,
  in_progress: chalk.blueBright,
  done:        chalk.green,
  blocked:     chalk.red,
};
const PRI_COLOR: Record<string, chalk.Chalk> = {
  p1: chalk.red,
  p2: chalk.yellow,
  p3: chalk.green,
};
const PRI_LABEL: Record<string, string> = { p1: "P1 High", p2: "P2 Med", p3: "P3 Low" };
const STATUS_LABEL: Record<string, string> = {
  todo: "Todo", in_progress: "In Progress", done: "Done", blocked: "Blocked",
};

export function colorStatus(s: string) {
  return (STATUS_COLOR[s] ?? chalk.white)(STATUS_LABEL[s] ?? s);
}
export function colorPriority(p: string) {
  return (PRI_COLOR[p] ?? chalk.white)(PRI_LABEL[p] ?? p);
}
export function colorProject(name: string, color: string) {
  return chalk.hex(color).bold(name);
}

// ── Tables ────────────────────────────────────────────────────────────────
export function printProjects(projects: any[]) {
  if (projects.length === 0) { console.log(chalk.dim("No projects found.")); return; }
  const t = new Table({
    head: ["Slug", "Name", "Todos", "Docs"],
    style: { head: ["cyan"] },
  });
  for (const p of projects) {
    t.push([chalk.dim(p.slug), colorProject(p.name, p.color),
      p._count?.todos ?? "–", p._count?.documents ?? "–"]);
  }
  console.log(t.toString());
}

export function printTodos(todos: any[]) {
  if (todos.length === 0) { console.log(chalk.dim("No tasks found.")); return; }
  const t = new Table({
    head: ["ID (short)", "Title", "Category", "Priority", "Status", "Due"],
    style: { head: ["cyan"] },
    colWidths: [12, 36, 10, 10, 14, 10],
    wordWrap: true,
  });
  for (const todo of todos) {
    const shortId = todo.id.slice(0, 8);
    const due = todo.dueDate
      ? new Date(todo.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : chalk.dim("–");
    t.push([
      chalk.dim(shortId),
      todo.status === "done" ? chalk.strikethrough(chalk.dim(todo.title)) : todo.title,
      chalk.dim(todo.category ?? "–"),
      colorPriority(todo.priority),
      colorStatus(todo.status),
      due,
    ]);
  }
  console.log(t.toString());
}

export function printDocs(docs: any[]) {
  if (docs.length === 0) { console.log(chalk.dim("No documents found.")); return; }
  const t = new Table({
    head: ["ID (short)", "Name", "Type", "Size", "Uploaded"],
    style: { head: ["cyan"] },
  });
  for (const d of docs) {
    const ext = d.filename.split(".").pop()?.toUpperCase() ?? "–";
    const size = d.sizeBytes < 1024 ? `${d.sizeBytes} B`
      : d.sizeBytes < 1048576 ? `${(d.sizeBytes / 1024).toFixed(0)} KB`
      : `${(d.sizeBytes / 1048576).toFixed(1)} MB`;
    const ago = (() => {
      const days = Math.floor((Date.now() - new Date(d.createdAt).getTime()) / 86400000);
      return days === 0 ? "Today" : `${days}d ago`;
    })();
    t.push([chalk.dim(d.id.slice(0, 8)), d.name, ext, size, chalk.dim(ago)]);
  }
  console.log(t.toString());
}

export function ok(msg: string) { console.log(chalk.green("✓"), msg); }
export function err(msg: string) { console.error(chalk.red("✗"), msg); }
export function info(msg: string) { console.log(chalk.dim(msg)); }
