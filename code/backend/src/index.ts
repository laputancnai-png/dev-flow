import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import staticPlugin from "@fastify/static";
import { projectRoutes } from "./routes/projects";
import { todoRoutes } from "./routes/todos";
import { documentRoutes } from "./routes/documents";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fastify = Fastify({ logger: true });

const start = async () => {
  try {
    await fastify.register(cors, { origin: "*" });
    await fastify.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });
    await fastify.register(staticPlugin, {
      root: path.join(__dirname, "../uploads"),
      prefix: "/uploads/",
    });

    await fastify.register(projectRoutes, { prefix: "/v1/projects" });
    await fastify.register(todoRoutes, { prefix: "/v1" });
    await fastify.register(documentRoutes, { prefix: "/v1" });

    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Server listening on http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
