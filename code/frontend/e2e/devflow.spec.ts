import { test, expect } from '@playwright/test';

const API = 'http://localhost:3000/v1';

// Seed a known project for tests
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

test.beforeAll(async () => {
  await ensureProject('e2e-test-project', 'E2E Test Project');
});

test.describe('Overview Tab', () => {
  test('shows 4 stat cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.stats-row');
    const cards = page.locator('.stat-card');
    await expect(cards).toHaveCount(4);
  });

  test('shows Recent Tasks card', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.glass-card').first()).toContainText('Recent tasks');
  });

  test('shows Documents card', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('.glass-card');
    await expect(cards.nth(1)).toContainText('Documents');
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
    await expect(page.locator(".project-item", { hasText: "E2E Created Project" })).toBeVisible();
  });
});

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

  test('can toggle task completion via UI click', async ({ page }) => {
    await page.goto('/');
    const uniqueTitle = `Toggle-${Date.now()}`;

    // Create a task via UI
    await page.locator('.btn-primary', { hasText: 'New task' }).click();
    await page.locator('input[name="title"]').fill(uniqueTitle);
    await page.locator('.modal-footer .btn-primary').click();
    await page.waitForTimeout(600);

    // Switch to todo tab and wait for the row
    await page.locator('#tab-todo').click();
    await page.waitForSelector('.todo-table-header');
    const row = page.locator('.todo-full-row').filter({ hasText: uniqueTitle });
    await expect(row.locator('.status-pill')).toHaveClass(/st-todo/);

    // Click to toggle — now with fixed optimistic update (no unconditional refetch)
    await row.click();
    await expect(row.locator('.status-pill')).toHaveClass(/st-done/);
  });
});

test.describe('Todo View Filters', () => {
  test('filter chips are visible', async ({ page }) => {
    await page.goto('/');
    await page.locator('#tab-todo').click();
    const chips = page.locator('.filter-chip');
    await expect(chips).toHaveCount(7); // All + 4 statuses + Filter + Sort
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

test.describe('Documents Tab', () => {
  test('shows upload zone', async ({ page }) => {
    await page.goto('/');
    await page.locator('#tab-docs').click();
    await expect(page.locator('.upload-zone')).toBeVisible();
  });

  test('can upload a document', async ({ page }) => {
    await page.goto('/');
    await page.locator('#tab-docs').click();
    const uploadZone = page.locator('.upload-zone');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
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
