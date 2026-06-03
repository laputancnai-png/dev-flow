import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Folder, Settings, Terminal, UserCircle,
  Plus, Folders, FileText, SquareCheck, X, Check,
} from 'lucide-react';
import './App.css';
import { api } from './api';
import type { Project, Todo, Doc } from './types';
import OverviewView from './views/OverviewView';
import TodoView from './views/TodoView';
import DocumentsView from './views/DocumentsView';

type Tab = 'overview' | 'docs' | 'todo';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

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
      // revert optimistic update on failure
      setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, status: todo.status } : t));
    });
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
            >
              <div className="project-dot" style={{ backgroundColor: p.color }} />
              <span>{p.name}</span>
            </div>
          ))}
          <button
            className="new-project-btn"
            onClick={() => setShowProjectModal(true)}
          >
            <Plus size={14} /> New Project
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="nav-item"><Terminal size={15} /> CLI / API</div>
          <div className="nav-item"><UserCircle size={15} /> Account</div>
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
                  onViewAll={(tab) => setActiveTab(tab as Tab)}
                  projectSlug={activeProject.slug}
                />
              )}
              {activeTab === 'todo' && (
                <TodoView todos={todos} loading={loading} onToggleTodo={toggleTodo} />
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

      {/* New Task Modal */}
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

      {/* New Project Modal */}
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
