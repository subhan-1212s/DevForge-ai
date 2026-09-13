import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { socket } from '../services/socket';
import { useWorkspaceStore } from '../store/workspaceStore';
import api from '../services/api';
import { motion } from 'framer-motion';
import { 
  FolderGit, 
  ArrowLeft, 
  ArrowRight,
  Calendar, 
  ExternalLink, 
  GitFork, 
  Layout, 
  MessageSquare, 
  Code2, 
  Sparkles, 
  Check, 
  Edit3,
  CheckSquare,
  BookOpen,
  AlertOctagon,
  BarChart3,
  X,
  TrendingUp,
  Activity,
  Zap,
  CheckCircle2
} from 'lucide-react';

export default function ProjectDetail() {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const { 
    currentWorkspace, 
    currentWorkspaceRole, 
    fetchWorkspaceDetails,
    updateProject
  } = useWorkspaceStore();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  // Live Metrics State
  const [metrics, setMetrics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    totalBugs: 0,
    criticalBugs: 0,
    wikiCount: 0,
    efficiencyRate: 0
  });

  // Form edit fields
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState('planning');
  const [editPriority, setEditPriority] = useState('medium');
  const [editProgress, setEditProgress] = useState(0);
  const [editRepo, setEditRepo] = useState('');

  const loadProjectData = async () => {
    try {
      const { data: pData } = await api.get(`/projects/${projectId}`);
      setProject(pData.project);
      setEditName(pData.project.name);
      setEditDesc(pData.project.description || '');
      setEditStatus(pData.project.status);
      setEditPriority(pData.project.priority);
      setEditProgress(pData.project.progress);
      setEditRepo(pData.project.repositoryUrl || '');

      // Load live metric aggregations
      const [tasksRes, bugsRes, docsRes] = await Promise.allSettled([
        api.get(`/tasks?projectId=${projectId}`),
        api.get(`/bugs?projectId=${projectId}`),
        api.get(`/docs?projectId=${projectId}`)
      ]);

      const tasks = tasksRes.status === 'fulfilled' ? (tasksRes.value.data.tasks || []) : [];
      const bugs = bugsRes.status === 'fulfilled' ? (bugsRes.value.data.bugs || []) : [];
      const docs = docsRes.status === 'fulfilled' ? (docsRes.value.data.documents || []) : [];

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'done').length;
      const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

      const totalBugs = bugs.length;
      const criticalBugs = bugs.filter(b => (b.severity === 'critical' || b.severity === 'high') && b.status !== 'resolved').length;

      const efficiencyRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (pData.project.progress || 0);

      setMetrics({
        totalTasks,
        completedTasks,
        inProgressTasks,
        totalBugs,
        criticalBugs,
        wikiCount: docs.length,
        efficiencyRate
      });
    } catch (err) {
      setError('Failed to fetch project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId && !currentWorkspace) {
      fetchWorkspaceDetails(workspaceId);
    }
    loadProjectData();

    // Socket.IO Real-Time Listener
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('join_project', projectId);

    const handleProjectUpdated = (updatedProject) => {
      setProject(updatedProject);
    };

    socket.on('project_updated', handleProjectUpdated);
    socket.on('task_created', loadProjectData);
    socket.on('task_updated', loadProjectData);
    socket.on('bug_created', loadProjectData);

    return () => {
      socket.off('project_updated', handleProjectUpdated);
      socket.off('task_created', loadProjectData);
      socket.off('task_updated', loadProjectData);
      socket.off('bug_created', loadProjectData);
      socket.emit('leave_project', projectId);
    };
  }, [workspaceId, projectId]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');

    const updated = await updateProject(projectId, {
      name: editName,
      description: editDesc,
      status: editStatus,
      priority: editPriority,
      progress: parseInt(editProgress),
      repositoryUrl: editRepo
    });

    if (updated) {
      setProject(updated);
      setEditing(false);
    } else {
      setError('Failed to update project.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-[#0066ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center text-xs text-[#64748b] space-y-4">
        <p>Project not found or deleted.</p>
        <Link to={`/workspace/${workspaceId}`} className="btn-premium-brand inline-flex px-4 py-2 text-xs">
          Return to Workspace
        </Link>
      </div>
    );
  }

  // Developer Workspace Tools Suite
  const toolCards = [
    {
      title: 'Kanban Sprint Board',
      desc: 'Agile backlog management, sprint columns, drag & drop cards.',
      icon: CheckSquare,
      link: `/workspace/${workspaceId}/project/${projectId}/kanban`,
      color: 'text-[#0066ff] bg-[#eff6ff]',
      badge: `${metrics.totalTasks} Tasks (${metrics.completedTasks} Done)`
    },
    {
      title: 'Real-Time Team Chat',
      desc: 'Instant channel messaging and online teammate indicators.',
      icon: MessageSquare,
      link: `/workspace/${workspaceId}/project/${projectId}/chat`,
      color: 'text-[#10b981] bg-[#ecfdf5]',
      badge: 'Socket Room Active'
    },
    {
      title: 'AI Developer Suite',
      desc: 'Refactor code snippets, analyze stack traces, and generate git commits.',
      icon: Sparkles,
      link: `/workspace/${workspaceId}/project/${projectId}/ai-suite`,
      color: 'text-[#f59e0b] bg-[#fffbeb]',
      badge: 'Gemini AI Engine'
    },
    {
      title: 'Bug Tracker & QA Log',
      desc: 'Log critical bugs, steps to reproduce, and severity classifications.',
      icon: AlertOctagon,
      link: `/workspace/${workspaceId}/project/${projectId}/bugs`,
      color: 'text-[#f43f5e] bg-[#fff1f2]',
      badge: `${metrics.totalBugs} Tickets (${metrics.criticalBugs} Critical)`
    },
    {
      title: 'Project Wiki & Specs',
      desc: 'Technical architecture specs and documentation chapters.',
      icon: BookOpen,
      link: `/workspace/${workspaceId}/project/${projectId}/wiki`,
      color: 'text-[#8b5cf6] bg-[#f5f3ff]',
      badge: `${metrics.wikiCount} Chapters`
    },
    {
      title: 'Live Code Sandbox',
      desc: 'HTML/CSS/JS code editor with live execution engine.',
      icon: Code2,
      link: `/workspace/${workspaceId}/project/${projectId}/codepad`,
      color: 'text-[#2563eb] bg-blue-50',
      badge: 'Monaco Preview Engine'
    }
  ];

  // SVG Donut Calculations
  const circumference = 2 * Math.PI * 45;
  const strokeOffset = circumference - (metrics.efficiencyRate / 100) * circumference;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 font-sans text-[#0f172a]">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <Link 
            to={`/workspace/${workspaceId}`}
            className="p-2 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-[#64748b] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider font-display">Project Dashboard</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#eff6ff] text-[#0066ff] text-[9px] font-bold uppercase border border-blue-200/60">
                {project.status.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">{project.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {['owner', 'admin'].includes(currentWorkspaceRole) && (
            <button
              onClick={() => setEditing(!editing)}
              className="btn-premium-secondary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <Edit3 className="h-4 w-4 text-[#0066ff]" />
              <span>{editing ? 'Cancel Settings' : 'Project Settings'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Edit Form Drawer */}
      {editing && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-glass-card p-6 bg-white space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-[#0f172a]">Project Configuration & Parameters</h3>
            <button onClick={() => setEditing(false)} className="p-1 rounded-full hover:bg-slate-100">
              <X className="h-4 w-4 text-[#64748b]" />
            </button>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Project Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#0066ff] rounded-xl text-xs text-[#0f172a] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Repository URL</label>
                <input 
                  type="text" 
                  value={editRepo}
                  onChange={(e) => setEditRepo(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#0066ff] rounded-xl text-xs text-[#0f172a] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Description</label>
              <textarea 
                rows={2}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#0066ff] rounded-xl text-xs text-[#0f172a] outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Status</label>
                <select 
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#0066ff] rounded-xl text-xs text-[#0f172a] outline-none"
                >
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Code Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Priority</label>
                <select 
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#0066ff] rounded-xl text-xs text-[#0f172a] outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Progress ({editProgress}%)</label>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={editProgress}
                  onChange={(e) => setEditProgress(e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0066ff]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button 
                type="submit"
                className="btn-premium-brand px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Save Project Parameters
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* ANALYTICS & VISUAL GRAPHS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#0066ff]" />
            <h2 className="text-base font-bold text-[#0f172a]">Project Analytics & Performance Metrics</h2>
          </div>
          <span className="text-[11px] text-[#64748b] font-medium flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-[#10b981]" />
            Live Socket Synced
          </span>
        </div>

        {/* Analytics Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Donut Completion Gauge */}
          <div className="premium-glass-card p-5 bg-white flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#0f172a]">Sprint Completion Gauge</span>
              <TrendingUp className="h-4 w-4 text-[#10b981]" />
            </div>

            <div className="flex items-center justify-center my-2 relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="45"
                  stroke="#f1f5f9"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="45"
                  stroke="#0066ff"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-[#0f172a]">{metrics.efficiencyRate}%</span>
                <span className="text-[10px] text-[#64748b] font-semibold">Done</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#64748b]">
              <span>Completed: <strong>{metrics.completedTasks}</strong></span>
              <span>Pending: <strong>{metrics.totalTasks - metrics.completedTasks}</strong></span>
            </div>
          </div>

          {/* Velocity SVG Area Chart */}
          <div className="premium-glass-card p-5 bg-white flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#0f172a]">Sprint Velocity Area Curve</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#eff6ff] text-[#0066ff] border border-blue-200/60">
                Live Curve
              </span>
            </div>

            <div className="my-2">
              <svg viewBox="0 0 200 80" className="w-full h-24 overflow-visible">
                <defs>
                  <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0066ff" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#0066ff" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <line x1="0" y1="20" x2="200" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="40" x2="200" y2="40" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="60" x2="200" y2="60" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />

                <path 
                  d="M0,70 Q40,55 80,40 T160,25 T200,10 L200,75 L0,75 Z" 
                  fill="url(#velocityGrad)" 
                />

                <path 
                  d="M0,70 Q40,55 80,40 T160,25 T200,10" 
                  fill="none" 
                  stroke="#0066ff" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                />

                <circle cx="40" cy="58" r="3" fill="#ffffff" stroke="#0066ff" strokeWidth="2" />
                <circle cx="80" cy="40" r="3" fill="#ffffff" stroke="#0066ff" strokeWidth="2" />
                <circle cx="120" cy="30" r="3" fill="#ffffff" stroke="#0066ff" strokeWidth="2" />
                <circle cx="160" cy="25" r="3" fill="#ffffff" stroke="#0066ff" strokeWidth="2" />
                <circle cx="200" cy="10" r="4" fill="#0066ff" />
              </svg>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#64748b]">
              <span>Active Sprint Tasks</span>
              <span className="font-bold text-[#0066ff]">{metrics.inProgressTasks} In Progress</span>
            </div>
          </div>

          {/* QA Health & Severity Bar Chart */}
          <div className="premium-glass-card p-5 bg-white flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#0f172a]">QA & Bug Severity Health</span>
              <AlertOctagon className="h-4 w-4 text-[#f43f5e]" />
            </div>

            <div className="space-y-3 my-1">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#f43f5e] font-semibold">Critical / High</span>
                  <span className="font-bold text-[#0f172a]">{metrics.criticalBugs} Tickets</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#f43f5e] h-full" style={{ width: `${metrics.totalBugs > 0 ? (metrics.criticalBugs / metrics.totalBugs) * 100 : 0}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#0066ff] font-semibold">Total Logged Tickets</span>
                  <span className="font-bold text-[#0f172a]">{metrics.totalBugs} Tickets</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#0066ff] h-full" style={{ width: `${metrics.totalBugs > 0 ? 100 : 0}%` }} />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#64748b]">
              <span>QA Status</span>
              <span className="font-bold text-[#10b981] flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                System Stable
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DEVELOPER WORKSPACE TOOLS CARDS SECTION */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0f172a] uppercase tracking-wider font-display">
            Developer Workspace Suite
          </h2>
          <span className="text-xs text-[#64748b]">6 Integrated Tools</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toolCards.map((card, i) => (
            <Link 
              key={i} 
              to={card.link}
              className="premium-glass-card premium-glass-card-hover p-5 bg-white flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className={`p-3 rounded-2xl inline-flex ${card.color}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[#334155] font-bold text-[10px]">
                    {card.badge}
                  </span>
                </div>
                
                <h3 className="text-sm font-bold text-[#0f172a] group-hover:text-[#0066ff] transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-[#64748b] mt-1.5 leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0066ff] group-hover:text-[#0052cc] transition-colors">
                <span>Open Workspace Tool</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
