import { Command } from "commander";
import { api, ApiError } from "../api.js";
import { printProjects, ok, err } from "../fmt.js";
import chalk from "chalk";

export function projectsCommand(program: Command) {
  const cmd = program.command("projects").description("Manage projects");

  cmd.command("list")
    .description("List all active projects")
    .action(async () => {
      try {
        const projects = await api.projects.list();
        printProjects(projects);
      } catch (e) { err((e as ApiError).message); process.exit(1); }
    });

  cmd.command("create <name>")
    .description("Create a new project")
    .option("-d, --description <text>", "Project description")
    .option("-c, --color <hex>", "Color hex (e.g. #534AB7)", "#534AB7")
    .option("--view <view>", "Default view: overview|todo|docs", "overview")
    .action(async (name, opts) => {
      try {
        const proj = await api.projects.create({
          name, description: opts.description, color: opts.color, defaultView: opts.view,
        });
        ok(`Created project ${chalk.bold(proj.name)} (slug: ${chalk.dim(proj.slug)})`);
      } catch (e) { err((e as ApiError).message); process.exit(1); }
    });

  cmd.command("delete <slug>")
    .description("Delete a project and all its tasks & documents")
    .option("-y, --yes", "Skip confirmation")
    .action(async (slug, opts) => {
      try {
        if (!opts.yes) {
          const readline = await import("readline");
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
          const answer = await new Promise<string>(resolve =>
            rl.question(`Delete project "${slug}" and all its data? (y/N) `, resolve)
          );
          rl.close();
          if (answer.toLowerCase() !== "y") { console.log("Aborted."); return; }
        }
        await api.projects.delete(slug);
        ok(`Deleted project "${slug}"`);
      } catch (e) { err((e as ApiError).message); process.exit(1); }
    });
}
