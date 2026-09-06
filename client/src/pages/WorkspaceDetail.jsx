import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { 
  FolderGit, 
  Users, 
  Copy, 
  Check, 
  Plus, 
  Terminal, 
  Calendar, 
  Layers, 
  Activity, 
  ExternalLink,
  Trash2
} from 'lucide-react';

export default function WorkspaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    currentWorkspace, 
    currentWorkspaceRole, 
    projects, 
    fetchWorkspaceDetails, 
    createProject,
    deleteProject
  } = useWorkspaceStore();

  const [copied, setCopied] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projStack, setProjStack] = useState('');
  const [projPriority, setProjPriority] = useState('medium');
  const [projDeadline, setProjDeadline] = useState('');
  const [projRepo, setProjRepo] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchWorkspaceDetails(id);
  }, [id, fetchWorkspaceDetails]);

  const copyInviteCode = () => {
    if (!currentWorkspace?.inviteCode) return;
    navigator.clipboard.writeText(currentWorkspace.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!projName.trim()) return;

    setLoading(true);
    const techStackArray = projStack.split(',').map(s => s.trim()).filter(Boolean);
    const proj = await createProject({
      name: projName,
      description: projDesc,
      techStack: techStackArray,
      priority: projPriority,
      deadline: projDeadline ? new Date(projDeadline) : undefined,
      repositoryUrl: projRepo,
      workspaceId: currentWorkspace._id
    });
    setLoading(false);

    if (proj) {
      setProjName('');
      setProjDesc('');
      setProjStack('');
      setProjPriority('medium');
      setProjDeadline('');
      setProjRepo('');
      setShowProjectModal(false);
      fetchWorkspaceDetails(id);
    } else {
      setFormError('Failed to create project. Verify permissions.');
    }
  };

  const handleDeleteProj = async (e, projId) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    const success = await deleteProject(projId);
    if (success) {
      fetchWorkspaceDetails(id);
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isEligibleToCreate = ['owner', 'admin', 'developer'].includes(currentWorkspaceRole);
  const isEligibleToDelete = ['owner', 'admin'].includes(currentWorkspaceRole);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* Workspace top header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-black/5 pb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] font-display">WORKSPACE PANEL</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] tracking-tight mt-0.5">{currentWorkspace.name}</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl">{currentWorkspace.description || 'No description provided.'}</p>
        </div>

        {/* Copy Invite Code Widget */}
        <div className="flex items-center gap-4 shrink-0 bg-white border border-black/5 p-3.5 rounded-2xl relative overflow-hidden shadow-sm">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#0071e3]" />
          <div>
            <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400 font-display">Workspace Invite Code</p>
            <p className="text-sm font-bold font-mono tracking-wider text-[#1d1d1f] mt-0.5">{currentWorkspace.inviteCode}</p>
          </div>
          <button 
            onClick={copyInviteCode}
            className="p-1.5 rounded-lg bg-[#f5f5f7] border border-black/5 hover:bg-[#e8e8ed] text-slate-600 transition-colors cursor-pointer"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Stats summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-4.5 border border-black/5 flex items-center gap-4 shadow-sm">
          <div className="p-2.5 rounded-xl bg-[#0071e3]/10 text-[#0071e3]">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 font-display">Projects</p>
            <p className="text-lg font-bold text-[#1d1d1f] mt-0.5">{projects.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-black/5 flex items-center gap-4 shadow-sm">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 font-display">Team Members</p>
            <p className="text-lg font-bold text-[#1d1d1f] mt-0.5">{currentWorkspace.members?.length || 1}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-black/5 flex items-center gap-4 shadow-sm">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 font-display">Active Status</p>
            <p className="text-lg font-bold text-[#1d1d1f] mt-0.5">Online</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Projects & Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Projects Listing (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-md font-bold text-[#1d1d1f] flex items-center gap-2 font-display">
              <FolderGit className="h-4.5 w-4.5 text-[#0071e3]" />
              Active Projects
            </h2>
            {isEligibleToCreate && (
              <button
                onClick={() => setShowProjectModal(true)}
                className="btn-premium-secondary inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Project
              </button>
            )}
          </div>

          <div className="space-y-4">
            {projects.map((proj) => (
              <Link
                key={proj._id}
                to={`/workspace/${currentWorkspace._id}/project/${proj._id}`}
                className="block glass-card rounded-2xl p-5 border border-black/5 relative overflow-hidden group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors font-display truncate">
                      {proj.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 h-8 font-sans">{proj.description || 'No description provided.'}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${proj.priority === 'critical' ? 'bg-red-50 text-red-600 border border-red-100' : proj.priority === 'high' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-500 border border-black/5'}`}>
                      {proj.priority}
                    </span>
                    {isEligibleToDelete && (
                      <button 
                        onClick={(e) => handleDeleteProj(e, proj._id)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors border border-transparent"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Status: <span className="text-slate-600 capitalize font-medium">{proj.status}</span></span>
                    <span className="font-semibold text-[#0071e3]">{proj.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#e8e8ed] rounded-full overflow-hidden border border-black/5">
                    <div 
                      className="h-full bg-[#0071e3] rounded-full"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>

                {/* Tech stack & info */}
                <div className="mt-4 pt-3.5 border-t border-black/5 flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-400">
                  <div className="flex flex-wrap gap-1">
                    {proj.techStack && proj.techStack.map((tech, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-[#f5f5f7] border border-black/5 text-slate-600 font-mono text-[9px]">
                        {tech}
                      </span>
                    ))}
                  </div>
                  {proj.deadline && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(proj.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}

            {projects.length === 0 && (
              <div className="py-10 text-center rounded-2xl border border-dashed border-black/10 bg-white shadow-sm">
                <FolderGit className="h-7 w-7 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">No projects generated yet</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Initialize your first project code modules to manage files and tasks.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Member management (1 col) */}
        <div className="space-y-5">
          <h2 className="text-md font-bold text-[#1d1d1f] flex items-center gap-2 font-display">
            <Users className="h-4.5 w-4.5 text-[#0071e3]" />
            Workspace Members
          </h2>

          <div className="bg-white rounded-2xl p-4.5 border border-black/5 shadow-sm space-y-4">
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {currentWorkspace.members && currentWorkspace.members.map((member, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-[#f5f5f7] border border-black/5">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {member.user?.avatar ? (
                      <img src={member.user.avatar} alt="Avatar" className="w-7 h-7 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-200 border border-black/5 flex items-center justify-center font-bold text-[10px] text-slate-600 shrink-0">
                        {member.user?.name ? member.user.name.substring(0, 2).toUpperCase() : 'US'}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-[#1d1d1f] truncate">{member.user?.name}</p>
                      <p className="text-[9px] text-slate-500 truncate">{member.user?.email}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${member.role === 'owner' ? 'bg-[#0071e3]/10 text-[#0071e3]' : member.role === 'admin' ? 'bg-purple-50 text-purple-600 bg-purple-50' : 'bg-slate-200 text-slate-600'}`}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-2xl p-6 border border-black/10 shadow-premium-lg relative overflow-hidden"
          >
            <h3 className="text-lg font-bold text-[#1d1d1f] mb-5 font-display">Create a New Project</h3>
            
            {formError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-lg mb-3">
                {formError}
              </p>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">Project Name</label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  placeholder="E.g. Authentication Service"
                  className="glass-input w-full p-2.5 text-sm font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">Description</label>
                <textarea
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Briefly describe the scope of this project..."
                  rows={2}
                  className="glass-input w-full p-2.5 text-sm font-sans resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">Priority</label>
                  <select
                    value={projPriority}
                    onChange={(e) => setProjPriority(e.target.value)}
                    className="glass-input w-full p-2.5 text-sm font-sans bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">Deadline</label>
                  <input
                    type="date"
                    value={projDeadline}
                    onChange={(e) => setProjDeadline(e.target.value)}
                    className="glass-input w-full p-2.5 text-sm font-sans text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">Tech Stack (comma-separated)</label>
                <input
                  type="text"
                  value={projStack}
                  onChange={(e) => setProjStack(e.target.value)}
                  placeholder="E.g. Node.js, Express, MongoDB"
                  className="glass-input w-full p-2.5 text-sm font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">Repository URL</label>
                <input
                  type="url"
                  value={projRepo}
                  onChange={(e) => setProjRepo(e.target.value)}
                  placeholder="E.g. https://github.com/myorg/myrepo"
                  className="glass-input w-full p-2.5 text-sm font-sans"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="btn-premium-secondary flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !projName}
                  className="btn-premium-primary flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer font-sans"
                >
                  {loading ? 'Creating...' : 'Initialize Project'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
