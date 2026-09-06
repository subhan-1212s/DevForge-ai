import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  BarChart3
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

  // Form edit fields
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState('planning');
  const [editPriority, setEditPriority] = useState('medium');
  const [editProgress, setEditProgress] = useState(0);
  const [editRepo, setEditRepo] = useState('');

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/projects/${projectId}`);
        setProject(data.project);
        setEditName(data.project.name);
        setEditDesc(data.project.description || '');
        setEditStatus(data.project.status);
        setEditPriority(data.project.priority);
        setEditProgress(data.project.progress);
        setEditRepo(data.project.repositoryUrl || '');
      } catch (err) {
        setError('Failed to fetch project details.');
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId && !currentWorkspace) {
      fetchWorkspaceDetails(workspaceId);
    }
    loadProject();
  }, [workspaceId, projectId, fetchWorkspaceDetails, currentWorkspace]);

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
        <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Project details could not be loaded.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-[#0071e3] flex items-center justify-center gap-2 mx-auto">
          <ArrowLeft className="h-4 w-4" /> Go Back
        </button>
      </div>
    );
  }

  const isEligibleToEdit = ['owner', 'admin', 'developer'].includes(currentWorkspaceRole);

  const toolCards = [
    { title: 'Kanban Board', icon: Layout, color: 'text-indigo-600', desc: 'Manage tasks and drag cards between columns', link: `/workspace/${workspaceId}/project/${projectId}/kanban` },
    { title: 'Project Chat', icon: MessageSquare, color: 'text-purple-600', desc: 'Realtime chat, emojis, and media attachments', link: `/workspace/${workspaceId}/project/${projectId}/chat` },
    { title: 'Live Code Editor', icon: Code2, color: 'text-emerald-600', desc: 'Collaborative code pad powered by Monaco Editor', link: `/workspace/${workspaceId}/project/${projectId}/editor` },
    { title: 'AI Assistant', icon: Sparkles, color: 'text-amber-600', desc: 'Workspace-aware AI model for code review and docs', link: `/workspace/${workspaceId}/project/${projectId}/ai` },
    { title: 'Wiki & Docs', icon: BookOpen, color: 'text-sky-600', desc: 'Markdown wiki logs, specifications, and endpoints mapping', link: `/workspace/${workspaceId}/project/${projectId}/wiki` },
    { title: 'Bug Tracker', icon: AlertOctagon, color: 'text-red-500', desc: 'Log issues, severities, steps to reproduce, and assignees', link: `/workspace/${workspaceId}/project/${projectId}/bugs` },
    { title: 'Project Analytics', icon: BarChart3, color: 'text-rose-500', desc: 'View developer velocity rates, completed tasks, and bug charts', link: `/workspace/${workspaceId}/project/${projectId}/analytics` },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-black/5 pb-4">
        <Link 
          to={`/workspace/${workspaceId}`} 
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0071e3] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Workspace Overview</span>
        </Link>

        {isEligibleToEdit && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="btn-premium-secondary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit Settings
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs">
          {error}
        </div>
      )}

      {/* Main Info Card */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-black/5 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-[#0071e3]" />
        
        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">Project Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="glass-input w-full p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">Repository URL</label>
                <input
                  type="url"
                  value={editRepo}
                  onChange={(e) => setEditRepo(e.target.value)}
                  placeholder="https://github.com/org/repo"
                  className="glass-input w-full p-2.5 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">Description</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className="glass-input w-full p-2.5 text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="glass-input w-full p-2.5 text-sm bg-white"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">Priority</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="glass-input w-full p-2.5 text-sm bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">Progress ({editProgress}%)</label>
                <div className="flex items-center gap-4 mt-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editProgress}
                    onChange={(e) => setEditProgress(e.target.value)}
                    className="w-full h-1.5 bg-[#e8e8ed] rounded-lg appearance-none cursor-pointer accent-[#0071e3]"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-black/5">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn-premium-secondary flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-premium-primary flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#1d1d1f] font-display">{project.name}</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20">
                  {project.status}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${project.priority === 'critical' ? 'bg-red-50 text-red-600 border border-red-100' : project.priority === 'high' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-500 border border-black/5'}`}>
                  {project.priority} priority
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-2xl">{project.description || 'No description provided.'}</p>
            </div>

            {/* Bottom details block */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-black/5">
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#86868b] font-display">Tech Stack</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {project.techStack && project.techStack.map((tech, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-[#f5f5f7] border border-black/5 text-slate-600 font-mono text-[9px]">
                      {tech}
                    </span>
                  ))}
                  {(!project.techStack || project.techStack.length === 0) && (
                    <span className="text-xs text-slate-400 italic">None specified</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#86868b] font-display">Repository Link</span>
                <div className="mt-1">
                  {project.repositoryUrl ? (
                    <a 
                      href={project.repositoryUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1 text-xs text-[#0071e3] hover:underline"
                    >
                      <GitFork className="h-3.5 w-3.5" />
                      <span>{new URL(project.repositoryUrl).hostname}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No repository linked</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-[#86868b] font-display">
                  <span>Development Progress</span>
                  <span className="text-[#0071e3]">{project.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#e8e8ed] rounded-full overflow-hidden border border-black/5 mt-1">
                  <div 
                    className="h-full bg-[#0071e3] rounded-full"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Developer Tools List */}
      <div>
        <div className="flex items-center gap-2 mb-4 font-display">
          <Sparkles className="h-4.5 w-4.5 text-[#0071e3]" />
          <h2 className="text-md font-bold text-[#1d1d1f]">Developer Workspace Suites</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {toolCards.map((card, i) => (
            <Link 
              key={i} 
              to={card.link}
              className="block bg-white rounded-2xl p-5 border border-black/5 shadow-sm relative overflow-hidden group hover:border-black/15 transition-all duration-200"
            >
              <div className={`p-2.5 rounded-xl bg-slate-100 inline-flex ${card.color} mb-3`}>
                <card.icon className="h-5 w-5" />
              </div>
              
              <h3 className="text-sm font-bold text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors font-display">
                {card.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {card.desc}
              </p>

              <div className="mt-5 flex items-center gap-1 text-[9px] font-bold tracking-widest text-slate-400 uppercase font-display">
                <span>Phase {i === 0 ? '2' : i === 1 ? '2' : i === 2 ? '3' : i === 3 ? '4' : i === 4 ? '3' : i === 5 ? '3' : '5'} integration</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
