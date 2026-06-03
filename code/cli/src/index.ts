import { Command } from "commander";
import { projectsCommand } from "./commands/projects.js";
import { todosCommand } from "./commands/todos.js";
import { docsCommand } from "./commands/docs.js";
import { BASE_URL } from "./config.js";

const program = new Command();

program
  .name("devflow")
  .description("DevFlow CLI — manage projects, tasks, and documents")
  .version("0.1.0")
  .addHelpText("after", `\nAPI: ${BASE_URL}  (override with DEVFLOW_URL env var)`);

projectsCommand(program);
todosCommand(program);
docsCommand(program);

program.parse();
