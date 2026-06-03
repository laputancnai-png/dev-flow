import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create a demo project
  const project = await prisma.project.upsert({
    where: { slug: "api-gw-v2" },
    update: {},
    create: {
      name: "API Gateway v2",
      slug: "api-gw-v2",
      description: "Next-gen gateway with OAuth2 and rate limiting",
      color: "#1D9E75",
    },
  });

  console.log("Created project:", project.name);

  // Create some tasks
  const tasks = [
    {
      title: "Set up OAuth2 flow with refresh tokens",
      category: "Backend",
      priority: "p3",
      status: "done",
    },
    {
      title: "Implement rate limiting middleware",
      category: "Backend",
      priority: "p1",
      status: "in_progress",
    },
    {
      title: "Write OpenAPI 3.0 spec",
      category: "DevX",
      priority: "p2",
      status: "todo",
      remarks: "Cover all v2 endpoints",
    },
    {
      title: "Frontend error boundary for API failures",
      category: "Frontend",
      priority: "p3",
      status: "todo",
    },
  ];

  for (const task of tasks) {
    await prisma.todo.create({
      data: {
        ...task,
        projectId: project.id,
      },
    });
  }

  console.log("Seed data created successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
