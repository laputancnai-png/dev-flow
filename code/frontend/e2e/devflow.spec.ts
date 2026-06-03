import { test, expect } from '@playwright/test';

const API = 'http://localhost:3000/v1';

async function ensureProject(slug: string, name: string) {
  const res = await fetch(`${API}/projects`);
  const projects = await res.json();
  if (!projects.find((p: any) => p.slug === slug)) {
    await fetch(`${API}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color: '#534AB7' }),
    });
  }
}

const TEST_SLUG = 'e2e-test-project';
const TEST_NAME = 'E2E Test Project';

test.beforeAll(async () => {
  await ensureProject(TEST_SLUG, TEST_NAME);
  // Ensure test project has at least one todo
  const todosRes = await fetch(`${API}/projects/${TEST_SLUG}/todos`);
  const todos = await todosRes.json();
  if (todos.length === 0) {
    await fetch(`${API}/projects/${TEST_SLUG}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Seed todo', status: 'todo', priority: 'p2', category: 'Backend' }),
    });
  }
});

// ── Overview Tab ──────────────────────────────────────────────────────────
test.describe('Overview Tab', () => {
  test('shows 4 stat cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.stats-row');
    await expect(page.locator('.stat-card')).toHaveCount(4);
  });

  test('shows Recent Tasks card', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.glass-card').first()).toContainText('Recent tasks');
  });

  test('shows Documents card', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.glass-card').nth(1)).toContainText('Documents');
  });

  test('shows API hint bar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.api-hint')).toBeVisible();
  });

  test('View all → switches to Todo tab', async ({ page }) => {
    await page.goto('/');
    await page.locator('.view-all-link').first().click();
    await expect(page.locator('#tab-todo')).toHaveClass(/active/);
  });
});

// ── Project Management ────────────────────────────────────────────────────
test.describe('Project Management', () => {
  test('sidebar shows projects list', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.project-item').first()).toBeVisible();
  });

  test('can open New Project modal', async ({ page }) => {
    await page.goto('/');
    await page.locator('.new-project-btn').click();
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal-header')).toContainText('New project');
  });

  test('can create a new project', async ({ page }) => {
    await page.goto('/');
    await page.locator('.new-project-btn').click();
    await page.locator('input[name="name"]').fill('E2E Created Project');
    await page.locator('.modal-footer .btn-primary').click();
    await expect(page.locator('.project-item', { hasText: 'E2E Created Project' })).toBeVisible();
  });
});

// ── Task Management ───────────────────────────────────────────────────────
test.describe('Task Management', () => {
  test('can open New Task modal', async ({ page }) => {
    await page.goto('/');
    await page.locator('.btn-primary', { hasText: 'New task' }).click();
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal-header')).toContainText('New task');
  });

  test('new task modal has all fields', async ({ page }) => {
    await page.goto('/');
    await page.locator('.btn-primary', { hasText: 'New task' }).click();
    const modal = page.locator('.modal');
    await expect(modal.locator('input[name="title"]')).toBeVisible();
    await expect(modal.locator('textarea[name="content"]')).toBeVisible();
    await expect(modal.locator('select[name="category"]')).toBeVisible();
    await expect(modal.locator('select[name="priority"]')).toBeVisible();
    await expect(modal.locator('select[name="status"]')).toBeVisible();
    await expect(modal.locator('input[name="dueDate"]')).toBeVisible();
    await expect(modal.locator('input[name="remarks"]')).toBeVisible();
  });

  test('can create a task and it appears in the list', async ({ page }) => {
    await page.goto('/');
    await page.locator('.btn-primary', { hasText: 'New task' }).click();
    await page.locator('input[name="title"]').fill('E2E Test Task');
    await page.locator('textarea[name="content"]').fill('Created by E2E test');
    await page.locator('select[name="priority"]').selectOption('p1');
    await page.locator('.modal-footer .btn-primary').click();
    await page.locator('#tab-todo').click();
    await expect(page.locator('.glass-card')).toContainText('E2E Test Task');
  });

  test('can toggle task completion via checkbox', async ({ page }) => {
    const createRes = await page.request.post(`${API}/projects/${TEST_SLUG}/todos`, {
      headers: { 'Content-Type': 'application/json' },
      data: { title: `TGL-${Date.now()}`, status: 'todo', priority: 'p2', category: 'Backend' },
    });
    const todo = await createRes.json();

    await page.goto('/');
    await page.locator('.project-item', { hasText: TEST_NAME }).click();
    await page.locator('#tab-todo').click();
    await page.waitForSelector('.todo-table-header');
    const row = page.locator('.todo-full-row').filter({ hasText: todo.title });
    await expect(row).toBeVisible();

    const patchPromise = page.waitForResponse(
      r => r.url().includes('/v1/todos/') && r.request().method() === 'PATCH',
      { timeout: 5000 }
    );
    await row.locator('.todo-check').click();
    const patchRes = await patchPromise;
    expect(patchRes.ok()).toBeTruthy();
    const patched = await patchRes.json();
    expect(patched.status).toBe('done');

    await page.request.delete(`${API}/todos/${todo.id}`);
  });
});

// ── Todo View Filters ─────────────────────────────────────────────────────
test.describe('Todo View Filters', () => {
  test('filter chips are visible', async ({ page }) => {
    await page.goto('/');
    await page.locator('#tab-todo').click();
    const chips = page.locator('.filter-chip');
    await expect(chips).toHaveCount(7);
  });

  test('can filter by In Progress', async ({ page }) => {
    await page.goto('/');
    await page.locator('#tab-todo').click();
    await page.locator('.filter-chip', { hasText: 'In Progress' }).click();
    await expect(page.locator('.filter-chip.active')).toContainText('In Progress');
  });

  test('todo full row shows category, priority, status, date columns', async ({ page }) => {
    await page.goto('/');
    await page.locator('#tab-todo').click();
    await expect(page.locator('.todo-table-header')).toContainText('Category');
    await expect(page.locator('.todo-table-header')).toContainText('Priority');
    await expect(page.locator('.todo-table-header')).toContainText('Status');
    await expect(page.locator('.todo-table-header')).toContainText('Date');
  });
});

// ── Documents Tab ─────────────────────────────────────────────────────────
test.describe('Documents Tab', () => {
  test('shows upload zone', async ({ page }) => {
    await page.goto('/');
    await page.locator('#tab-docs').click();
    await expect(page.locator('.upload-zone')).toBeVisible();
  });

  test('can upload a document', async ({ page }) => {
    await page.goto('/');
    await page.locator('#tab-docs').click();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'test-e2e-doc.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('E2E test document content'),
    });
    await page.waitForTimeout(1000);
    await expect(page.locator('.docs-grid')).toBeVisible();
    await expect(page.locator('.doc-name').first()).toContainText('test-e2e-doc');
  });

  test('shows API hint in docs tab', async ({ page }) => {
    await page.goto('/');
    await page.locator('#tab-docs').click();
    await expect(page.locator('.api-hint')).toContainText('POST /v1/projects');
  });
});

// ── Project Deletion ──────────────────────────────────────────────────────
test.describe('Project Deletion', () => {
  test('delete button appears on hover over project item', async ({ page }) => {
    await page.goto('/');
    await page.locator('.project-item').first().hover();
    await expect(page.locator('.project-delete-btn').first()).toBeVisible();
  });

  test('can delete a project via API', async ({ page }) => {
    const res = await page.request.post(`${API}/projects`, {
      headers: { 'Content-Type': 'application/json' },
      data: { name: 'E2E Delete Me', color: '#534AB7' },
    });
    const proj = await res.json();
    expect(proj.slug).toBe('e2e-delete-me');

    const del = await page.request.delete(`${API}/projects/${proj.slug}`);
    expect((await del.json()).success).toBe(true);

    const list = await page.request.get(`${API}/projects`);
    const projects = await list.json();
    expect(projects.find((p: any) => p.slug === 'e2e-delete-me')).toBeUndefined();
  });
});

// ── Todo Edit Modal ───────────────────────────────────────────────────────
test.describe('Todo Edit Modal', () => {
  test('clicking todo row opens edit modal', async ({ page }) => {
    await page.goto('/');
    await page.locator('.project-item', { hasText: TEST_NAME }).click();
    await page.locator('#tab-todo').click();
    await page.waitForSelector('.todo-table-header');
    await page.locator('.todo-full-row').first().click();
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal-header')).toContainText('Edit task');
  });

  test('edit modal shows all fields', async ({ page }) => {
    await page.goto('/');
    await page.locator('.project-item', { hasText: TEST_NAME }).click();
    await page.locator('#tab-todo').click();
    await page.waitForSelector('.todo-full-row');
    await page.locator('.todo-full-row').first().click();
    const modal = page.locator('.modal');
    await expect(modal.locator('input[value]').first()).toBeVisible();
    await expect(modal.locator('textarea')).toBeVisible();
    await expect(modal.locator('select').first()).toBeVisible();
  });

  test('can edit and save a todo', async ({ page }) => {
    const res = await page.request.post(`${API}/projects/${TEST_SLUG}/todos`, {
      headers: { 'Content-Type': 'application/json' },
      data: { title: `EDIT-${Date.now()}`, status: 'todo', priority: 'p2', category: 'Backend' },
    });
    const todo = await res.json();

    await page.goto('/');
    await page.locator('.project-item', { hasText: TEST_NAME }).click();
    await page.locator('#tab-todo').click();
    await page.waitForSelector('.todo-full-row');

    await page.locator('.todo-full-row').filter({ hasText: todo.title }).click();
    await expect(page.locator('.modal')).toBeVisible();

    // Triple-click to select all text, then type replacement
    const titleInput = page.locator('.modal').getByRole('textbox').first();
    await titleInput.click({ clickCount: 3 });
    await page.keyboard.type('-UPD');

    const patchPromise = page.waitForResponse(
      r => r.url().includes(`/todos/${todo.id}`) && r.request().method() === 'PATCH',
      { timeout: 5000 }
    );
    await page.locator('.modal-footer .btn-primary').click();
    const patchRes = await patchPromise;
    expect(patchRes.ok()).toBeTruthy();

    await page.request.delete(`${API}/todos/${todo.id}`);
  });

  test('checkbox click toggles done without opening modal', async ({ page }) => {
    await page.goto('/');
    await page.locator('.project-item', { hasText: TEST_NAME }).click();
    await page.locator('#tab-todo').click();
    await page.waitForSelector('.todo-full-row');
    const row = page.locator('.todo-full-row').first();
    await row.locator('.todo-check').click();
    await expect(page.locator('.modal')).not.toBeVisible();
  });
});

// ── Document Download ─────────────────────────────────────────────────────
test.describe('Document Download', () => {
  test('doc card shows download hint on hover', async ({ page }) => {
    await page.goto('/');
    await page.locator('#tab-docs').click();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'dl-hint-test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('download hint test'),
    });
    await page.waitForTimeout(1000);
    const card = page.locator('.doc-card').filter({ hasText: 'dl-hint-test' }).first();
    await card.hover();
    await expect(card.locator('.doc-download-hint')).toBeVisible();
  });

  test('doc download URL is correct', async ({ page }) => {
    const docsRes = await page.request.get(`${API}/projects/${TEST_SLUG}/documents`);
    const docs = await docsRes.json();
    if (docs.length > 0) {
      const doc = docs[0];
      const downloadRes = await page.request.get(`http://localhost:3000/uploads/${doc.storageKey}`);
      expect(downloadRes.ok()).toBeTruthy();
    }
  });
});
