import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Folder, Settings, Terminal, UserCircle,
  Plus, Folders, FileText, SquareCheck, X, Check, Trash2,
  Copy, ExternalLink,
} from 'lucide-react';
import './App.css';
import { api, API_BASE } from './api';
import type { Project, Todo, Doc } from './types';
import OverviewView from './views/OverviewView';
import TodoView from './views/TodoView';
import DocumentsView from './views/DocumentsView';

type Tab = 'overview' | 'docs' | 'todo';

const BACKEND_ROOT = API_BASE.replace('/v1', '');


// ── API Reference modal ───────────────────────────────────────────────────
function ApiReferenceModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'skills' | 'api' | 'cli'>('skills');
  const [copied, setCopied] = useState('');
  const [skillDoc, setSkillDoc] = useState<string | null>(null);
  const [showDoc, setShowDoc] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(false);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      /* clipboard write failed silently */
    }
  };

  const fetchSkillDoc = async (): Promise<string> => {
    const res = await fetch(`${BACKEND_ROOT}/agent-skill`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  };

  const fetchAndCopySkillDoc = async () => {
    setLoadingDoc(true);
    try {
      const text = await fetchSkillDoc();
      setSkillDoc(text);
      await navigator.clipboard.writeText(text);
      setCopied('fulldoc');
      setTimeout(() => setCopied(''), 2000);
    } catch {
      setSkillDoc('⚠ 无法加载文档，请确认后端服务已启动。');
    } finally {
      setLoadingDoc(false);
    }
  };

  const toggleDocPreview = async () => {
    if (!showDoc && !skillDoc) {
      setLoadingDoc(true);
      try {
        const text = await fetchSkillDoc();
        setSkillDoc(text);
      } catch {
        setSkillDoc('⚠ 无法加载文档，请确认后端服务已启动。');
      } finally {
        setLoadingDoc(false);
      }
    }
    setShowDoc(v => !v);
  };

  const CopyBtn = ({ text, label, id }: { text: string; label: string; id: string }) => (
    <button className="btn-ghost api-copy-btn" onClick={() => copy(text, id)}>
      {copied === id ? <Check size={12} /> : <Copy size={12} />}
      {copied === id ? 'Copied' : label}
    </button>
  );

  const apiEndpoints = [
    { method: 'GET',    path: '/v1/projects',                  desc: 'List projects' },
    { method: 'POST',   path: '/v1/projects',                  desc: 'Create project' },
    { method: 'DELETE', path: '/v1/projects/:slug',            desc: 'Delete project (cascade)' },
    { method: 'GET',    path: '/v1/projects/:slug/todos',      desc: 'List todos' },
    { method: 'POST',   path: '/v1/projects/:slug/todos',      desc: 'Create todo' },
    { method: 'PATCH',  path: '/v1/todos/:id',                 desc: 'Update todo (partial)' },
    { method: 'DELETE', path: '/v1/todos/:id',                 desc: 'Delete todo' },
    { method: 'GET',    path: '/v1/projects/:slug/documents',  desc: 'List documents' },
    { method: 'POST',   path: '/v1/projects/:slug/documents',  desc: 'Upload document' },
    { method: 'DELETE', path: '/v1/documents/:id',             desc: 'Delete document' },
    { method: 'GET',    path: '/uploads/:storageKey',          desc: 'Download file' },
  ];

  const cliCommands = [
    { cmd: 'devflow projects list',                     desc: '列出所有项目' },
    { cmd: 'devflow projects create <name>',            desc: '创建项目 [--color --description]' },
    { cmd: 'devflow projects delete <slug> --yes',      desc: '删除项目（级联）' },
    { cmd: 'devflow todos list <slug>',                 desc: '列出任务 [--status --priority]' },
    { cmd: 'devflow todos create <slug> <title>',       desc: '创建任务 [--priority --agent ...]' },
    { cmd: 'devflow todos update <id> --project <s>',   desc: '更新任务字段（部分更新）' },
    { cmd: 'devflow todos done <id> --project <s>',     desc: '标记完成（快捷方式）' },
    { cmd: 'devflow todos delete <id> --yes',           desc: '删除任务' },
    { cmd: 'devflow docs list <slug>',                  desc: '列出文档' },
    { cmd: 'devflow docs upload <slug> <file>',         desc: '上传文件' },
    { cmd: 'devflow docs delete <id> --yes',            desc: '删除文档' },
  ];

  const methodColor: Record<string, string> = {
    GET: '#1D9E75', POST: '#534AB7', PATCH: '#BA7517', DELETE: '#A32D2D',
  };

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal api-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Terminal size={16} style={{ color: '#534AB7' }} /> CLI / API
          </span>
          <X size={18} style={{ cursor: 'pointer', color: 'var(--color-text-tertiary)' }} onClick={onClose} />
        </div>

        {/* Tab bar */}
        <div className="api-tab-bar">
          <span className={`api-tab ${tab === 'skills' ? 'active' : ''}`} onClick={() => setTab('skills')}>
            🤖 Agent Skills
          </span>
          <span className={`api-tab ${tab === 'api' ? 'active' : ''}`} onClick={() => setTab('api')}>
            REST API
          </span>
          <span className={`api-tab ${tab === 'cli' ? 'active' : ''}`} onClick={() => setTab('cli')}>
            CLI
          </span>
        </div>

        <div className="modal-body api-modal-body">

          {/* ── Agent Skills tab ── */}
          {tab === 'skills' && (
            <div>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>
                将以下 URL 发给 AI Agent，它读取后即可自主操作 DevFlow 系统（创建项目、管理任务、上传文档）。
              </p>

              <SkillCard
                icon="📋"
                title="完整指南（REST API + CLI）"
                url={`${BACKEND_ROOT}/agent-skill`}
                description="包含所有端点、数据模型、CLI 命令和常见工作流。推荐首选。"
                onCopy={(url, id) => copy(url, id)}
                copied={copied}
                id="full"
              />

              <SkillCard
                icon="⌨️"
                title="CLI 专用指南"
                url={`${BACKEND_ROOT}/cli-skill`}
                description="只包含 CLI 命令参考和示例，适合偏好命令行操作的 Agent。"
                onCopy={(url, id) => copy(url, id)}
                copied={copied}
                id="cli"
              />

              {/* Full skill doc copy + inline preview */}
              <div className="skill-doc-section">
                <div className="skill-doc-header">
                  <span className="skill-doc-label">📄 完整 Skill 文档</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn-ghost api-copy-btn"
                      onClick={fetchAndCopySkillDoc}
                      disabled={loadingDoc}
                      title="复制完整 Markdown 文档，粘贴给 AI Agent 即可使用"
                    >
                      {copied === 'fulldoc' ? <Check size={12} /> : <Copy size={12} />}
                      {copied === 'fulldoc' ? '已复制' : loadingDoc ? '加载中…' : '复制全文'}
                    </button>
                    <button className="btn-ghost api-copy-btn" onClick={toggleDocPreview}>
                      {showDoc ? '收起' : '预览'}
                    </button>
                  </div>
                </div>
                <p className="skill-doc-hint">
                  将完整文档粘贴给任意 AI Agent（Claude、GPT、Gemini 等），Agent 即可自主操作此系统。
                </p>
                {showDoc && (
                  <pre className="api-code-block skill-doc-preview">
                    {skillDoc ?? '加载中…'}
                  </pre>
                )}
              </div>

              <div className="api-agent-note">
                <strong>Agent 使用提示：</strong>
                <ul style={{ margin: '6px 0 0 16px', lineHeight: 1.8 }}>
                  <li>创建任务时加 <code>--agent</code>（CLI）或 <code>"createdBy":"agent"</code>（API），便于区分 AI 创建的任务</li>
                  <li>短 ID 需配合 <code>--project &lt;slug&gt;</code> 使用，或直接用完整 UUID</li>
                  <li>所有接口无需认证，直接调用即可</li>
                </ul>
              </div>
            </div>
          )}

          {/* ── REST API tab ── */}
          {tab === 'api' && (
            <div>
              <div className="form-field" style={{ marginBottom: 12 }}>
                <div className="form-label">Base URL</div>
                <div className="api-base-url">
                  <code>{API_BASE}</code>
                  <CopyBtn text={API_BASE} label="复制" id="base" />
                </div>
              </div>

              <div className="form-label" style={{ marginBottom: 8 }}>端点速览 — 点击行复制 URL</div>
              <div className="api-endpoint-list">
                {apiEndpoints.map(ep => (
                  <div
                    key={ep.path}
                    className="api-endpoint-row"
                    onClick={() => copy(
                      ep.path.startsWith('/uploads') ? `${BACKEND_ROOT}${ep.path}` : `${API_BASE}${ep.path}`,
                      ep.path,
                    )}
                    title="点击复制完整 URL"
                  >
                    <span className="api-method-badge"
                      style={{ color: methodColor[ep.method] || '#534AB7', background: `${methodColor[ep.method]}18` }}>
                      {ep.method}
                    </span>
                    <code className="api-path">{ep.path}</code>
                    <span className="api-desc">{ep.desc}</span>
                    {copied === ep.path && <Check size={11} style={{ color: '#1D9E75', flexShrink: 0 }} />}
                  </div>
                ))}
              </div>

              <div className="form-label" style={{ marginTop: 14, marginBottom: 6 }}>curl 示例</div>
              <pre className="api-code-block">{`# 列出项目
curl ${API_BASE}/projects

# 创建任务（Agent 标记）
curl -X POST ${API_BASE}/projects/my-project/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Task","priority":"p1","createdBy":"agent"}'

# 更新状态
curl -X PATCH ${API_BASE}/todos/:id \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}'

# 上传文件
curl -X POST ${API_BASE}/projects/my-project/documents \
  -F "file=@./spec.pdf"`}</pre>
            </div>
          )}

          {/* ── CLI tab ── */}
          {tab === 'cli' && (
            <div>
              <div className="api-skill-banner" style={{ marginBottom: 14 }}>
                <div className="api-skill-label">Setup</div>
                <pre className="api-code-block" style={{ marginTop: 6 }}>{`cd code/cli && npm install
node bin/devflow.js --help`}</pre>
              </div>

              <div className="form-label" style={{ marginBottom: 8 }}>命令速览</div>
              <div className="api-endpoint-list">
                {cliCommands.map(c => (
                  <div
                    key={c.cmd}
                    className="api-endpoint-row cli-row"
                    onClick={() => copy(c.cmd, c.cmd)}
                    title="点击复制命令"
                  >
                    <code className="api-path cli-cmd">{c.cmd}</code>
                    <span className="api-desc">{c.desc}</span>
                    {copied === c.cmd && <Check size={11} style={{ color: '#1D9E75', flexShrink: 0 }} />}
                  </div>
                ))}
              </div>

              <div className="form-label" style={{ marginTop: 14, marginBottom: 6 }}>示例工作流</div>
              <pre className="api-code-block">{`# 查看所有项目
devflow projects list

# 创建项目并添加任务
devflow projects create "Sprint 43" --color "#534AB7"
devflow todos create sprint-43 "API design" --priority p1 --agent
devflow todos create sprint-43 "Implement" --priority p1 --agent

# 查看任务 / 按状态过滤
devflow todos list sprint-43
devflow todos list sprint-43 --status in_progress

# 更新进度（短 ID + --project）
devflow todos update <id> --project sprint-43 --status in_progress
devflow todos done   <id> --project sprint-43

# 上传文档
devflow docs upload sprint-43 ./spec.md`}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SkillCard({ icon, title, url, description, onCopy, copied, id }: {
  icon: string; title: string; url: string; description: string;
  onCopy: (url: string, id: string) => void; copied: string; id: string;
}) {
  return (
    <div className="skill-card">
      <div className="skill-card-icon">{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="skill-card-title">{title}</div>
        <div className="skill-card-desc">{description}</div>
        <div className="api-skill-url-row" style={{ marginTop: 8 }}>
          <code className="api-skill-url">{url}</code>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button className="btn-ghost api-copy-btn" onClick={() => onCopy(url, id)}>
              {copied === id ? <Check size={12} /> : <Copy size={12} />}
              {copied === id ? 'Copied' : '复制'}
            </button>
            <a href={url} target="_blank" rel="noreferrer"
               className="btn-ghost api-copy-btn" style={{ textDecoration: 'none' }}>
              <ExternalLink size={12} /> 预览
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Main App ─────────────────────────────────────────────────────────────
export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);

  useEffect(() => { fetchProjects(); }, []);

  useEffect(() => {
    if (activeProject) {
      fetchTodos(activeProject.slug);
      fetchDocs(activeProject.slug);
    }
  }, [activeProject]);

  const fetchProjects = async () => {
    const data = await api.projects.list().catch(() => []);
    setProjects(data);
    if (data.length > 0 && !activeProject) setActiveProject(data[0]);
  };

  const fetchTodos = async (slug: string) => {
    setLoading(true);
    const data = await api.todos.list(slug).catch(() => []);
    setTodos(data);
    setLoading(false);
  };

  const fetchDocs = async (slug: string) => {
    const data = await api.documents.list(slug).catch(() => []);
    setDocs(data);
  };

  const toggleTodo = async (todo: Todo) => {
    const newStatus = todo.status === 'done' ? 'todo' : 'done';
    setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, status: newStatus } : t));
    await api.todos.update(todo.id, { status: newStatus }).catch(() => {
      setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, status: todo.status } : t));
    });
  };

  const handleDeleteProject = async (project: Project) => {
    if (!window.confirm(`删除项目 "${project.name}" 及其所有任务和文档？`)) return;
    await api.projects.delete(project.slug).catch(console.error);
    const remaining = projects.filter(p => p.id !== project.id);
    setProjects(remaining);
    if (activeProject?.id === project.id) {
      setActiveProject(remaining[0] ?? null);
      setTodos([]);
      setDocs([]);
    }
  };

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api.todos.create(activeProject!.slug, {
      title: fd.get('title') as string,
      content: fd.get('content') as string,
      category: fd.get('category') as string,
      priority: fd.get('priority') as string,
      status: fd.get('status') as string,
      dueDate: fd.get('dueDate') as string || undefined,
      remarks: fd.get('remarks') as string,
    }).catch(console.error);
    setShowTaskModal(false);
    fetchTodos(activeProject!.slug);
  };

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const proj = await api.projects.create({
      name: fd.get('name') as string,
      description: fd.get('description') as string,
      color: fd.get('color') as string,
      defaultView: fd.get('defaultView') as string,
    }).catch(console.error);
    if (proj) {
      setProjects(prev => [...prev, proj]);
      setActiveProject(proj);
    }
    setShowProjectModal(false);
  };

  return (
    <div className="app-shell">
      <div className="blob blob1" />
      <div className="blob blob2" />
      <div className="blob blob3" />

      {/* Sidebar */}
      <nav className="sidebar glass">
        <div className="sidebar-logo">
          <div className="logo-icon"><Folders size={14} /></div>
          DevFlow
        </div>

        <div className="sidebar-section">Navigation</div>
        <div className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <LayoutDashboard size={15} /> Overview
        </div>
        <div className="nav-item">
          <Folder size={15} /> Projects
        </div>
        <div className="nav-item">
          <Settings size={15} /> Settings
        </div>

        <div className="sidebar-section">Projects</div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {projects.map(p => (
            <div
              key={p.id}
              className={`project-item ${activeProject?.id === p.id ? 'active' : ''}`}
              onClick={() => setActiveProject(p)}
              onMouseEnter={() => setHoveredProjectId(p.id)}
              onMouseLeave={() => setHoveredProjectId(null)}
            >
              <div className="project-dot" style={{ backgroundColor: p.color }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              {hoveredProjectId === p.id && (
                <button
                  className="project-delete-btn"
                  title="删除项目"
                  onClick={e => { e.stopPropagation(); handleDeleteProject(p); }}
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          ))}
          <button className="new-project-btn" onClick={() => setShowProjectModal(true)}>
            <Plus size={14} /> New Project
          </button>
        </div>

        <div className="sidebar-bottom">
          <div
            className="nav-item nav-item-clickable"
            onClick={() => setShowApiModal(true)}
            title="API 参考 & Agent Skill"
          >
            <Terminal size={15} /> CLI / API
          </div>
          <div className="nav-item">
            <UserCircle size={15} /> Account
          </div>
        </div>
      </nav>

      {/* Main */}
      <div className="main">
        <header className="topbar glass">
          <div className="breadcrumb">
            <span>Projects</span>
            <span className="sep">/</span>
            <span className="current">{activeProject?.name || 'Loading...'}</span>
          </div>
          <div className="topbar-actions">
            <button className="btn-ghost" onClick={() => setActiveTab('docs')}>
              <FileText size={14} /> Upload doc
            </button>
            <button className="btn-primary" onClick={() => setShowTaskModal(true)}>
              <Plus size={14} /> New task
            </button>
          </div>
        </header>

        <div className="tabbar">
          <TabItem id="tab-overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Overview" icon={<LayoutDashboard size={14} />} />
          <TabItem id="tab-docs" active={activeTab === 'docs'} onClick={() => setActiveTab('docs')} label="Documents" icon={<FileText size={14} />} badge={docs.length > 0 ? String(docs.length) : undefined} />
          <TabItem id="tab-todo" active={activeTab === 'todo'} onClick={() => setActiveTab('todo')} label="Todo" icon={<SquareCheck size={14} />} badge={todos.length > 0 ? String(todos.length) : undefined} />
        </div>

        <section className="content scrollbar-thin">
          {activeProject ? (
            <>
              {activeTab === 'overview' && (
                <OverviewView
                  todos={todos}
                  docs={docs}
                  onToggleTodo={toggleTodo}
                  onViewAll={tab => setActiveTab(tab as Tab)}
                  projectSlug={activeProject.slug}
                />
              )}
              {activeTab === 'todo' && (
                <TodoView
                  todos={todos}
                  loading={loading}
                  onToggleTodo={toggleTodo}
                  onTodosChange={() => fetchTodos(activeProject.slug)}
                />
              )}
              {activeTab === 'docs' && (
                <DocumentsView
                  docs={docs}
                  projectSlug={activeProject.slug}
                  onRefresh={() => fetchDocs(activeProject.slug)}
                />
              )}
            </>
          ) : (
            <div className="empty-state" style={{ marginTop: '60px' }}>
              Select a project or create a new one.
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      {showApiModal && <ApiReferenceModal onClose={() => setShowApiModal(false)} />}

      {showTaskModal && (
        <Modal title="New task" onClose={() => setShowTaskModal(false)}>
          <form onSubmit={handleCreateTask}>
            <div className="form-field">
              <label className="form-label">Title</label>
              <input name="title" required className="form-input" placeholder="What needs to be done?" />
            </div>
            <div className="form-field">
              <label className="form-label">Content / Notes</label>
              <textarea name="content" rows={2} className="form-input" placeholder="Details, acceptance criteria, links..." style={{ resize: 'none' }} />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Category</label>
                <select name="category" className="form-input">
                  <option value="Backend">Backend</option>
                  <option value="Frontend">Frontend</option>
                  <option value="DevX">DevX</option>
                  <option value="Design">Design</option>
                  <option value="Ops">Ops</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Priority</label>
                <select name="priority" className="form-input">
                  <option value="p1">P1 — High</option>
                  <option value="p2">P2 — Medium</option>
                  <option value="p3">P3 — Low</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Status</label>
                <select name="status" className="form-input">
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Due date</label>
                <input name="dueDate" type="date" className="form-input" />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Remarks</label>
              <input name="remarks" type="text" className="form-input" placeholder="Any blockers or extra context?" />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-ghost" onClick={() => setShowTaskModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary"><Check size={14} /> Create task</button>
            </div>
          </form>
        </Modal>
      )}

      {showProjectModal && (
        <Modal title="New project" onClose={() => setShowProjectModal(false)}>
          <form onSubmit={handleCreateProject}>
            <div className="form-field">
              <label className="form-label">Project name</label>
              <input name="name" required className="form-input" placeholder="e.g. Payment Service v2" />
            </div>
            <div className="form-field">
              <label className="form-label">Description</label>
              <textarea name="description" rows={3} className="form-input" placeholder="What are you building?" style={{ resize: 'none' }} />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Color</label>
                <select name="color" className="form-input">
                  <option value="#534AB7">Purple</option>
                  <option value="#1D9E75">Teal</option>
                  <option value="#D85A30">Coral</option>
                  <option value="#185FA5">Blue</option>
                  <option value="#D4537E">Pink</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Default view</label>
                <select name="defaultView" className="form-input">
                  <option value="overview">Overview</option>
                  <option value="todo">Todo list</option>
                  <option value="docs">Documents</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-ghost" onClick={() => setShowProjectModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary"><Check size={14} /> Create project</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function TabItem({ id, label, icon, active, onClick, badge }: {
  id: string; label: string; icon: React.ReactNode; active: boolean; onClick: () => void; badge?: string;
}) {
  return (
    <div id={id} className={`tab ${active ? 'active' : ''}`} onClick={onClick}>
      {icon} {label}
      {badge && <span className="tab-badge">{badge}</span>}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          {title}
          <X size={18} style={{ cursor: 'pointer', color: 'var(--color-text-tertiary)' }} onClick={onClose} />
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
