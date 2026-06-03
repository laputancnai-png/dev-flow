import { FastifyInstance } from "fastify";
import prisma from "../lib/prisma";

export async function projectRoutes(fastify: FastifyInstance) {
  // List all projects
  fastify.get("/", async (request, reply) => {
    const projects = await prisma.project.findMany({
      where: { archived: false },
      include: {
        _count: {
          select: { todos: true, documents: true },
        },
      },
    });
    return projects;
  });

  // Create project
  fastify.post("/", async (request: any, reply) => {
    const { name, description, color, defaultView } = request.body;
    const slug = name.toLowerCase().replace(/ /g, "-");
    const project = await prisma.project.create({
      data: {
        name,
        slug,
        description,
        color,
        defaultView,
      },
    });
    return project;
  });

  // Get project by slug
  fastify.get("/:slug", async (request: any, reply) => {
    const { slug } = request.params;
    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        todos: true,
        documents: true,
      },
    });
    if (!project) {
      return reply.code(404).send({ error: "Project not found" });
    }
    return project;
  });
}
