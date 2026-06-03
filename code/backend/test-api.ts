import fetch from 'node-fetch';

const API_BASE = "http://localhost:3000/v1";

async function runTests() {
  console.log("🧪 开始后端 API 集成测试...");

  try {
    // 1. 测试列出项目
    const projectsRes = await fetch(`${API_BASE}/projects`);
    const projects = await projectsRes.json();
    if (!Array.isArray(projects)) throw new Error("Projects API should return an array");
    console.log(`✅ 项目列表接口正常 (发现 ${projects.length} 个项目)`);

    if (projects.length > 0) {
      const slug = projects[0].slug;
      
      // 2. 测试获取项目任务
      const todosRes = await fetch(`${API_BASE}/projects/${slug}/todos`);
      const todos = await todosRes.json();
      if (!Array.isArray(todos)) throw new Error("Todos API should return an array");
      console.log(`✅ 任务列表接口正常 (项目 ${slug} 下有 ${todos.length} 个任务)`);

      if (todos.length > 0) {
        const todo = todos[0];
        const originalStatus = todo.status;
        const targetStatus = originalStatus === 'done' ? 'todo' : 'done';

        // 3. 测试更新任务状态 (PATCH)
        const updateRes = await fetch(`${API_BASE}/todos/${todo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: targetStatus })
        });
        const updatedTodo = await updateRes.json();
        
        if (updatedTodo.status === targetStatus) {
          console.log(`✅ 任务状态更新测试成功: ${originalStatus} -> ${targetStatus}`);
        } else {
          throw new Error("Update failed to change status");
        }

        // 还原状态
        await fetch(`${API_BASE}/todos/${todo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: originalStatus })
        });
      }
    }

    console.log("\n🎉 所有后端测试通过！");
  } catch (err) {
    console.error("\n❌ 测试失败:", err.message);
    process.exit(1);
  }
}

runTests();
