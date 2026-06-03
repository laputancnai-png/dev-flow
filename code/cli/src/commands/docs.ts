import { Command } from "commander";
import { api, ApiError } from "../api.js";
import { printDocs, ok, err } from "../fmt.js";
import chalk from "chalk";

export function docsCommand(program: Command) {
  const cmd = program.command("docs").description("Manage project documents");

  cmd.command("list <slug>")
    .description("List documents for a project")
    .action(async (slug) => {
      try {
        const docs = await api.docs.list(slug);
        printDocs(docs);
      } catch (e) { err((e as ApiError).message); process.exit(1); }
    });

  cmd.command("upload <slug> <file>")
    .description("Upload a document to a project")
    .action(async (slug, file) => {
      try {
        const { existsSync } = await import("fs");
        if (!existsSync(file)) { err(`File not found: ${file}`); process.exit(1); }
        const doc = await api.docs.upload(slug, file);
        ok(`Uploaded ${chalk.bold(doc.name)} (${doc.filename}) to project "${slug}"`);
      } catch (e) { err((e as ApiError).message); process.exit(1); }
    });

  cmd.command("delete <id>")
    .description("Delete a document")
    .option("-y, --yes", "Skip confirmation")
    .action(async (id, opts) => {
      try {
        if (!opts.yes) {
          const readline = await import("readline");
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
          const answer = await new Promise<string>(resolve =>
            rl.question(`Delete document "${id}"? (y/N) `, resolve)
          );
          rl.close();
          if (answer.toLowerCase() !== "y") { console.log("Aborted."); return; }
        }
        await api.docs.delete(id);
        ok(`Deleted document "${id}"`);
      } catch (e) { err((e as ApiError).message); process.exit(1); }
    });
}
