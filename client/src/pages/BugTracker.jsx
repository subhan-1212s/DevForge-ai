import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useWorkspaceStore } from '../store/workspaceStore';
import { 
  ArrowLeft, 
  AlertOctagon, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  User as UserIcon,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BugTracker() {
  const { workspaceId, projectId } = useParams();
  const { currentWorkspace, fetchWorkspaceDetails } = useWorkspaceStore();

  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals / Selection states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBug, setSelectedBug] = useState(null);

  // Filters State
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Bug Creation Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSeverity, setNewSeverity] = useState('medium');
  const [newSteps, setNewSteps] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');

  const fetchBugs = async () => {
    try {
      const { data } = await api.get(`/bugs?projectId=${projectId}`);
      setBugs(data.bugs);
    } catch (err) {
      setError('Failed to fetch bugs list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentWorkspace) {
      fetchWorkspaceDetails(workspaceId);
    }
    fetchBugs();
  }, [workspaceId, projectId]);

  const handleCreateBug = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const { data } = await api.post('/bugs', {
        title: newTitle,
        description: newDesc,
        severity: newSeverity,
        stepsToReproduce: newSteps,
        assignee: newAssigneeId || undefined,
        projectId,
        workspaceId
      });

      setBugs([...bugs, data.bug]);
      setShowCreateModal(false);

      // Reset
      setNewTitle('');
      setNewDesc('');
      setNewSeverity('medium');
      setNewSteps('');
      setNewAssigneeId('');
      
      fetchBugs(); // reload to get populate
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (bugId, status) => {
    try {
      const { data } = await api.put(`/bugs/${bugId}`, { status });
      setBugs(bugs.map(b => (b._id === bugId ? data.bug : b)));
      setSelectedBug(data.bug);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBug = async (bugId) => {
    if (!window.confirm('Delete this bug ticket?')) return;

    try {
      await api.delete(`/bugs/${bugId}`);
      setBugs(bugs.filter(b => b._id !== bugId));
      setSelectedBug(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered list computed
  const filteredBugs = bugs.filter(b => {
    const sevMatch = severityFilter === 'all' || b.severity === severityFilter;
    const statMatch = statusFilter === 'all' || b.status === statusFilter;
    return sevMatch && statMatch;
  });

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 font-bold uppercase tracking-wider text-[8px]">critical</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 font-bold uppercase tracking-wider text-[8px]">high</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold uppercase tracking-wider text-[8px]">medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-100 font-medium uppercase tracking-wider text-[8px]">low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-semibold text-[8px] uppercase tracking-wider">resolved</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-semibold text-[8px] uppercase tracking-wider">in progress</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100 font-semibold text-[8px] uppercase tracking-wider">open</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans text-[#1d1d1f]">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
        <div className="flex items-center gap-3">
          <Link 
            to={`/workspace/${workspaceId}/project/${projectId}`}
            className="p-2 rounded-lg bg-white border border-black/5 hover:bg-slate-100 text-slate-600 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-red-500" />
            <div>
              <span className="text-[9px] font-bold text-slate-400 font-display">QA TESTING ENGINE</span>
              <h1 className="text-xl sm:text-2xl font-extrabold font-display">Bug Tracker</h1>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-premium-primary inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Log Bug
        </button>
      </div>

      {/* Filter Tabs Panel */}
      <div className="flex flex-wrap items-center gap-4 bg-white border border-black/5 p-3 rounded-2xl">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Filter className="h-3.5 w-3.5" />
          <span className="font-semibold font-display">Filters:</span>
        </div>
        
        {/* Severity filter */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="glass-input p-1.5 text-xs bg-white text-slate-600 font-sans cursor-pointer"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="glass-input p-1.5 text-xs bg-white text-slate-600 font-sans cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Bugs Table Dashboard */}
      <div className="bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f5f5f7] border-b border-black/5 text-[9px] font-bold text-slate-400 uppercase tracking-wider font-display">
                <th className="p-4 pl-6">Bug Details</th>
                <th className="p-4">Severity</th>
                <th className="p-4">Status</th>
                <th className="p-4">Assignee</th>
                <th className="p-4 pr-6 text-right">Logged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-xs">
              {filteredBugs.map((bug) => (
                <tr 
                  key={bug._id}
                  onClick={() => setSelectedBug(bug)}
                  className="hover:bg-[#f5f5f7]/50 cursor-pointer transition-colors"
                >
                  <td className="p-4 pl-6">
                    <span className="font-semibold text-slate-700 block truncate max-w-sm">{bug.title}</span>
                    {bug.description && <span className="text-[10px] text-slate-400 block truncate max-w-xs">{bug.description}</span>}
                  </td>
                  <td className="p-4">{getSeverityBadge(bug.severity)}</td>
                  <td className="p-4">{getStatusBadge(bug.status)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-200 border border-black/5 flex items-center justify-center font-bold text-[8px] overflow-hidden">
                        {bug.assignee?.avatar ? (
                          <img src={bug.assignee.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          bug.assignee ? bug.assignee.name.substring(0, 2).toUpperCase() : 'US'
                        )}
                      </div>
                      <span className="text-slate-600 font-sans truncate">{bug.assignee?.name || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right text-[10px] text-slate-400">
                    {new Date(bug.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}

              {filteredBugs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-sans">
                    No matching bug tickets registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details drawer Overlay */}
      <AnimatePresence>
        {selectedBug && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-2xl border border-black/10 shadow-premium-lg overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-black/5 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(selectedBug.severity)}
                    {getStatusBadge(selectedBug.status)}
                  </div>
                  <h3 className="text-base font-bold font-display mt-2">{selectedBug.title}</h3>
                </div>
                <button onClick={() => setSelectedBug(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer text-xs font-bold font-sans">
                  Close
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh] font-sans">
                {selectedBug.description && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</h4>
                    <p className="text-xs text-slate-600 bg-[#f5f5f7] border border-black/5 p-3 rounded-xl leading-relaxed whitespace-pre-wrap">{selectedBug.description}</p>
                  </div>
                )}

                {selectedBug.stepsToReproduce && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Steps to Reproduce
                    </h4>
                    <pre className="text-[10px] font-mono text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-xl leading-relaxed whitespace-pre-wrap overflow-x-auto">
                      {selectedBug.stepsToReproduce}
                    </pre>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 border-t border-black/5 pt-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assignee</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-6 h-6 rounded-full bg-slate-200 border border-black/5 flex items-center justify-center font-bold text-[9px] overflow-hidden">
                        {selectedBug.assignee?.avatar ? (
                          <img src={selectedBug.assignee.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          selectedBug.assignee ? selectedBug.assignee.name.substring(0, 2).toUpperCase() : 'US'
                        )}
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{selectedBug.assignee?.name || 'Unassigned'}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Update Status</h4>
                    <select
                      value={selectedBug.status}
                      onChange={(e) => handleStatusChange(selectedBug._id, e.target.value)}
                      className="glass-input w-full p-2 text-xs bg-white text-slate-600 cursor-pointer"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-black/5 pt-4">
                  <button
                    onClick={() => handleDeleteBug(selectedBug._id)}
                    className="btn-premium-secondary flex-1 py-2 text-xs font-semibold rounded-lg text-red-500 border-red-200 hover:bg-red-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Ticket
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-2xl p-6 border border-black/10 shadow-premium-lg"
          >
            <h3 className="text-base font-bold text-[#1d1d1f] mb-5 font-display flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#0071e3]" />
              Log a Bug Ticket
            </h3>

            <form onSubmit={handleCreateBug} className="space-y-4 font-sans">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bug Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="E.g. Auth page throws 500 error on sign up"
                  className="glass-input w-full p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe what occurred..."
                  rows={2}
                  className="glass-input w-full p-2.5 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="glass-input w-full p-2.5 text-sm bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assignee</label>
                  <select
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                    className="glass-input w-full p-2.5 text-sm bg-white"
                  >
                    <option value="">Unassigned</option>
                    {currentWorkspace?.members && currentWorkspace.members.map((member) => (
                      <option key={member.user._id} value={member.user._id}>
                        {member.user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Steps to Reproduce</label>
                <textarea
                  value={newSteps}
                  onChange={(e) => setNewSteps(e.target.value)}
                  placeholder="1. Go to register&#10;2. Input details&#10;3. Hit Submit"
                  rows={3}
                  className="glass-input w-full p-2.5 text-xs font-mono resize-none"
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
                  disabled={!newTitle}
                  className="btn-premium-primary flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Save Ticket
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
