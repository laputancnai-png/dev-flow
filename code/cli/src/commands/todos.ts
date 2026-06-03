import { Command } from "commander";
import { api, ApiError, Todo } from "../api.js";
import { printTodos, ok, err, info } from "../fmt.js";
import chalk from "chalk";

// Resolve a short/full ID to a full UUID.
// If --project given, search that project's todos; otherwise require full UUID.
async function resolveId(id: string, slug?: string): Promise<string> {
  if (id.length === 36) return id; // already full UUID
  if (!slug) {
    err(`Short ID "${id}" requires --project <slug> to resolve. Or pass the full UUID.`);
    process.exit(1);
  }
  const todos = await api.todos.list(slug);
  const match = todos.filter(t => t.id.startsWith(id));
  if (match.length === 0) { err(`No task found with ID prefix "${id}" in project "${slug}"`); process.exit(1); }
  if (match.length > 1) { err(`Ambiguous ID prefix "${id}" matches ${match.length} tasks. Use more characters.`); process.exit(1); }
  return match[0].id;
}

export function todosCommand(program: Command) {
  const cmd = program.command("todos").alias("todo").description("Manage tasks");

  cmd.command("list <slug>")
    .description("List todos for a project")
    .option("-s, --status <status>", "Filter: todo|in_progress|done|blocked")
    .option("-p, --priority <priority>", "Filter: p1|p2|p3")
    .action(async (slug, opts) => {
      try {
        let todos = await api.todos.list(slug);
        if (opts.status)   todos = todos.filter(t => t.status === opts.status);
        if (opts.priority) todos = todos.filter(t => t.priority === opts.priority);
        printTodos(todos);
      } catch (e) { err((e as ApiError).message); process.exit(1); }
    });

  cmd.command("create <slug> <title>")
    .description("Create a new task")
    .option("-c, --content <text>",    "Notes / acceptance criteria")
    .option("--category <cat>",        "Category (Backend, Frontend, DevX…)", "Backend")
    .option("-p, --priority <p>",      "p1 | p2 | p3", "p2")
    .option("-s, --status <s>",        "todo | in_progress | done | blocked", "todo")
    .option("--due <date>",            "Due date (YYYY-MM-DD)")
    .option("-r, --remarks <text>",    "Blockers or extra context")
    .option("--agent",                 "Mark as created by agent (createdBy=agent)")
    .action(async (slug, title, opts) => {
      try {
        const todo = await api.todos.create(slug, {
          title, content: opts.content, category: opts.category,
          priority: opts.priority, status: opts.status,
          dueDate: opts.due, remarks: opts.remarks,
          createdBy: opts.agent ? "agent" : "user",
        });
        ok(`Created task ${chalk.bold(todo.title)} (${chalk.dim(todo.id.slice(0, 8))})`);
        info(`Full ID: ${todo.id}`);
      } catch (e) { err((e as ApiError).message); process.exit(1); }
    });

  cmd.command("update <id>")
    .description("Update task fields (use full UUID or short prefix with --project)")
    .option("--project <slug>",        "Project slug — enables short ID lookup")
    .option("-t, --title <title>",     "New title")
    .option("-c, --content <text>",    "New content / notes")
    .option("-s, --status <status>",   "todo | in_progress | done | blocked")
    .option("-p, --priority <p>",      "p1 | p2 | p3")
    .option("--category <cat>",        "New category")
    .option("--due <date>",            "Due date (YYYY-MM-DD)")
    .option("-r, --remarks <text>",    "Blockers or extra context")
    .action(async (id, opts) => {
      try {
        const fullId = await resolveId(id, opts.project);
        const body: Record<string, string> = {};
        if (opts.title)    body.title    = opts.title;
        if (opts.content)  body.content  = opts.content;
        if (opts.status)   body.status   = opts.status;
        if (opts.priority) body.priority = opts.priority;
        if (opts.category) body.category = opts.category;
        if (opts.due)      body.dueDate  = opts.due;
        if (opts.remarks)  body.remarks  = opts.remarks;
        if (Object.keys(body).length === 0) {
          err("No fields to update. Use --help to see options."); process.exit(1);
        }
        const todo = await api.todos.update(fullId, body);
        ok(`Updated task ${chalk.bold(todo.title)}`);
      } catch (e) { err((e as ApiError).message); process.exit(1); }
    });

  cmd.command("done <id>")
    .description("Mark a task as done")
    .option("--project <slug>", "Project slug — enables short ID lookup")
    .action(async (id, opts) => {
      try {
        const fullId = await resolveId(id, opts.project);
        const todo = await api.todos.update(fullId, { status: "done" });
        ok(`Marked "${chalk.bold(todo.title)}" as done ✓`);
      } catch (e) { err((e as ApiError).message); process.exit(1); }
    });

  cmd.command("delete <id>")
    .description("Delete a task")
    .option("--project <slug>", "Project slug — enables short ID lookup")
    .option("-y, --yes",        "Skip confirmation")
    .action(async (id, opts) => {
      try {
        const fullId = await resolveId(id, opts.project);
        if (!opts.yes) {
          const rl = (await import("readline")).createInterface({ input: process.stdin, output: process.stdout });
          const answer = await new Promise<string>(r => rl.question(`Delete task "${fullId.slice(0, 8)}"? (y/N) `, r));
          rl.close();
          if (answer.toLowerCase() !== "y") { console.log("Aborted."); return; }
        }
        await api.todos.delete(fullId);
        ok(`Deleted task "${fullId.slice(0, 8)}"`);
      } catch (e) { err((e as ApiError).message); process.exit(1); }
    });
}
