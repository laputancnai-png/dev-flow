import { FastifyInstance } from "fastify";
import prisma from "../lib/prisma";
import { pipeline } from "stream/promises";
import { createWriteStream } from "fs";
import { unlink } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "../../uploads");

export async function documentRoutes(fastify: FastifyInstance) {
  // List documents for a project
  fastify.get("/projects/:slug/documents", async (request: any, reply) => {
    const { slug } = request.params;
    const project = await prisma.project.findUnique({ where: { slug } });
    if (!project) return reply.code(404).send({ error: "Project not found" });

    const documents = await prisma.document.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
    });
    return documents;
  });

  // Upload a document
  fastify.post("/projects/:slug/documents", async (request: any, reply) => {
    const { slug } = request.params;
    const project = await prisma.project.findUnique({ where: { slug } });
    if (!project) return reply.code(404).send({ error: "Project not found" });

    const data = await request.file();
    if (!data) return reply.code(400).send({ error: "No file provided" });

    const ext = path.extname(data.filename);
    const storageKey = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filePath = path.join(UPLOADS_DIR, storageKey);

    await pipeline(data.file, createWriteStream(filePath));

    const sizeBytes = (await import("fs")).statSync(filePath).size;

    const doc = await prisma.document.create({
      data: {
        projectId: project.id,
        name: data.filename.replace(/\.[^/.]+$/, ""),
        filename: data.filename,
        mimeType: data.mimetype,
        sizeBytes,
        storageKey,
        uploadedBy: "user",
      },
    });
    return doc;
  });

  // Delete a document
  fastify.delete("/documents/:id", async (request: any, reply) => {
    const { id } = request.params;
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return reply.code(404).send({ error: "Document not found" });

    const filePath = path.join(UPLOADS_DIR, doc.storageKey);
    try {
      await unlink(filePath);
    } catch {
      // File may already be deleted
    }

    await prisma.document.delete({ where: { id } });
    return { success: true };
  });
}
