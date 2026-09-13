import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, LayoutGrid, Terminal, ArrowRight, Code, X, Sparkles, FolderGit, Layers, Activity } from 'lucide-react';

export default function Dashboard() {
  const { workspaces, fetchWorkspaces, createWorkspace, joinWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [createError, setCreateError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!newWsName.trim()) return;

    setLoading(true);
    const ws = await createWorkspace({ name: newWsName, description: newWsDesc });
    setLoading(false);
    
    if (ws) {
      setNewWsName('');
      setNewWsDesc('');
      setShowCreateModal(false);
      navigate(`/workspace/${ws._id}`);
    } else {
      setCreateError('Failed to create workspace. Try again.');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinError('');
    if (!inviteCode.trim()) return;

    setLoading(true);
    try {
      const ws = await joinWorkspace(inviteCode);
      if (ws) {
        setInviteCode('');
        navigate(`/workspace/${ws._id}`);
      }
    } catch (err) {
      setJoinError(err.message || 'Failed to join. Double check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4 font-sans text-[#0f172a]">
      {/* Welcome Hero Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-200/80 pb-6">
        <div>
          <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider font-display">DevForge Workspace Portal</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight mt-0.5">
            Welcome back, <span className="gradient-text-blue">{user?.name}</span>
          </h1>
          <p className="text-[#64748b] text-xs sm:text-sm mt-1">
            Access active engineering workspaces or initialize a new team environment.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-premium-brand inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-semibold shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Workspace
        </button>
      </div>

      {/* Grid: Main sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Workspaces list */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center gap-2 mb-3">
            <LayoutGrid className="h-5 w-5 text-[#0066ff]" />
            <h2 className="text-base font-bold text-[#0f172a]">Active Workspaces ({workspaces.length})</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {workspaces.map((ws) => (
              <motion.div
                key={ws._id}
                onClick={() => navigate(`/workspace/${ws._id}`)}
                className="premium-glass-card premium-glass-card-hover p-5 bg-white cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0066ff] to-[#7c3aed] text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                      {ws.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-[#334155]">
                      {ws.projects ? ws.projects.length : 0} Projects
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#0f172a] group-hover:text-[#0066ff] transition-colors">
                    {ws.name}
                  </h3>
                  <p className="text-xs text-[#64748b] mt-1 line-clamp-2 leading-relaxed">
                    {ws.description || 'DevForge collaborative workspace.'}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0066ff] group-hover:text-[#0052cc] transition-colors">
                  <span>Enter Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}

            {workspaces.length === 0 && (
              <div className="col-span-2 premium-glass-card p-8 bg-white text-center space-y-3">
                <Terminal className="h-10 w-10 text-[#94a3b8] mx-auto" />
                <p className="text-xs text-[#64748b]">No workspaces initialized yet. Create your first workspace to start collaborating.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Join by Invite Code */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-[#10b981]" />
            <h2 className="text-base font-bold text-[#0f172a]">Join Existing Workspace</h2>
          </div>

          <div className="premium-glass-card p-5 bg-white space-y-4">
            <p className="text-xs text-[#64748b] leading-relaxed">
              Have a workspace invitation code from a teammate? Paste it below to join immediately.
            </p>

            <form onSubmit={handleJoin} className="space-y-3">
              <div>
                <input 
                  type="text" 
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter 8-digit invite code..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#0066ff] rounded-xl text-xs text-[#0f172a] outline-none"
                />
              </div>

              {joinError && (
                <p className="text-[11px] text-[#f43f5e]">{joinError}</p>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full btn-premium-secondary py-2.5 rounded-xl text-xs font-semibold"
              >
                Join Workspace
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Create Workspace Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl z-10 p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-[#0f172a]">Create New Workspace</h3>
                <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-full hover:bg-slate-100">
                  <X className="h-4 w-4 text-[#64748b]" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Workspace Name *</label>
                  <input 
                    type="text" 
                    required
                    value={newWsName}
                    onChange={(e) => setNewWsName(e.target.value)}
                    placeholder="e.g. DevForge Engineering"
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#0066ff] rounded-xl text-xs text-[#0f172a] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Description</label>
                  <textarea 
                    rows={3}
                    value={newWsDesc}
                    onChange={(e) => setNewWsDesc(e.target.value)}
                    placeholder="Brief description of projects and goals..."
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#0066ff] rounded-xl text-xs text-[#0f172a] outline-none resize-none"
                  />
                </div>

                {createError && (
                  <p className="text-[11px] text-[#f43f5e]">{createError}</p>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs text-[#64748b] hover:bg-slate-100 font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="btn-premium-brand px-4 py-2 rounded-xl text-xs font-semibold"
                  >
                    Initialize Workspace
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
