import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { Plus, Users, LayoutGrid, Terminal, ArrowRight, Code } from 'lucide-react';

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
    <div className="max-w-6xl mx-auto space-y-10 py-4 font-sans">
      {/* Welcome header banner */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-black/5 pb-6"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-[#86868b] text-xs sm:text-sm mt-1">
            Access your workspaces or initialize a new collaborative environment.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-premium-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white shadow-sm cursor-pointer shrink-0 font-sans"
        >
          <Plus className="h-4 w-4" />
          Create Workspace
        </button>
      </motion.div>

      {/* Grid: Main sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Workspaces list */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center gap-2 mb-3">
            <LayoutGrid className="h-4.5 w-4.5 text-[#0071e3]" />
            <h2 className="text-md font-bold text-[#1d1d1f] font-display">Active Workspaces</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {workspaces.map((ws) => (
              <motion.div
                key={ws._id}
                whileHover={{ y: -3 }}
                onClick={() => navigate(`/workspace/${ws._id}`)}
                className="glass-card rounded-2xl p-5 border border-black/5 cursor-pointer relative overflow-hidden group"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#f5f5f7] border border-black/5 text-[#1d1d1f] flex items-center justify-center font-bold text-md shadow-sm">
                    {ws.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-[#86868b] bg-[#f5f5f7] border border-black/5 px-2 py-0.5 rounded-full">
                    {ws.owner?._id === user?.id ? 'Owner' : 'Member'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors font-display truncate">
                  {ws.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 h-8 font-sans">
                  {ws.description || 'No description provided.'}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-3.5 text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-1.5 font-sans">
                    <Users className="h-3.5 w-3.5 text-[#0071e3]" />
                    <span>{ws.members?.length || 1} members</span>
                  </div>
                  <span className="inline-flex items-center gap-0.5 text-[#0071e3] group-hover:translate-x-0.5 transition-transform duration-200">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </motion.div>
            ))}

            {workspaces.length === 0 && (
              <div className="col-span-full py-12 px-6 rounded-2xl border border-dashed border-black/10 text-center bg-white shadow-sm">
                <Terminal className="h-7 w-7 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">No workspaces available</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Create a new space above, or join your team via an invitation code.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Join workspace widget */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 mb-3">
            <Code className="h-4.5 w-4.5 text-[#0071e3]" />
            <h2 className="text-md font-bold text-[#1d1d1f] font-display">Join Workspace</h2>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm relative overflow-hidden">
            <p className="text-xs text-[#86868b] font-sans mb-3">
              Enter an 8-character invitation code to join an existing workspace:
            </p>

            {joinError && (
              <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-lg mb-3">
                {joinError}
              </p>
            )}

            <form onSubmit={handleJoin} className="space-y-3">
              <input
                type="text"
                maxLength={8}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="A1B2C3D4"
                className="glass-input w-full p-2.5 text-center uppercase tracking-widest text-md font-bold font-mono"
              />
              <button
                type="submit"
                disabled={loading || !inviteCode}
                className="btn-premium-primary w-full py-2 rounded-lg text-xs font-semibold text-white uppercase tracking-wider disabled:opacity-50 cursor-pointer pt-2.5 pb-2.5"
              >
                {loading ? 'Joining...' : 'Submit Code'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-2xl p-6 border border-black/10 shadow-premium-lg relative overflow-hidden"
          >
            <h3 className="text-lg font-bold text-[#1d1d1f] mb-5 font-display">Create a New Workspace</h3>
            
            {createError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-lg mb-3">
                {createError}
              </p>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">Workspace Name</label>
                <input
                  type="text"
                  required
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="E.g. DevForge Engineering"
                  className="glass-input w-full p-2.5 text-sm font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">Description</label>
                <textarea
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  placeholder="Describe your workspace (optional)..."
                  rows={2}
                  className="glass-input w-full p-2.5 text-sm font-sans resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-premium-secondary flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newWsName}
                  className="btn-premium-primary flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {loading ? 'Creating...' : 'Create Space'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
