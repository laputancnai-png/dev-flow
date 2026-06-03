import { FastifyInstance } from "fastify";
import prisma from "../lib/prisma";

export async function todoRoutes(fastify: FastifyInstance) {
  // List todos for a project
  fastify.get("/projects/:slug/todos", async (request: any, reply) => {
    const { slug } = request.params;
    const project = await prisma.project.findUnique({ where: { slug } });
    if (!project) return reply.code(404).send({ error: "Project not found" });

    const todos = await prisma.todo.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
    });
    return todos;
  });

  // Create todo
  fastify.post("/projects/:slug/todos", async (request: any, reply) => {
    const { slug } = request.params;
    const project = await prisma.project.findUnique({ where: { slug } });
    if (!project) return reply.code(404).send({ error: "Project not found" });

    const { title, content, category, priority, status, dueDate, remarks } = request.body;
    const todo = await prisma.todo.create({
      data: {
        projectId: project.id,
        title,
        content,
        category,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        remarks,
      },
    });
    return todo;
  });

  // Update todo
  fastify.patch("/todos/:id", async (request: any, reply) => {
    const { id } = request.params;
    const data = request.body;
    
    if (data.dueDate) data.dueDate = new Date(data.dueDate);

    const todo = await prisma.todo.update({
      where: { id },
      data,
    });
    return todo;
  });

  // Delete todo
  fastify.delete("/todos/:id", async (request: any, reply) => {
    const { id } = request.params;
    await prisma.todo.delete({ where: { id } });
    return { success: true };
  });
}
