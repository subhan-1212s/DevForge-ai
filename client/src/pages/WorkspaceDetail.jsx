import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useAuthStore } from '../store/authStore';
import { usePresenceStore } from '../store/presenceStore';
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
  Trash2,
  Settings,
  Shield,
  ShieldCheck,
  Key,
  RefreshCw,
  UserCheck,
  UserMinus,
  Edit3,
  Crown
} from 'lucide-react';

export default function WorkspaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isUserOnline } = usePresenceStore();
  const { 
    currentWorkspace, 
    currentWorkspaceRole, 
    projects, 
    fetchWorkspaceDetails, 
    createProject,
    deleteProject,
    updateWorkspace,
    updateMemberRole,
    removeMember,
    regenerateInviteCode,
    deleteWorkspace
  } = useWorkspaceStore();

  const onlineMembersCount = currentWorkspace?.members?.filter(m => isUserOnline(m.user?._id || m.user?.id || m.user)).length || 0;

  const [copied, setCopied] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'admin'
  const [loading, setLoading] = useState(false);

  // Form State for Project
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projStack, setProjStack] = useState('');
  const [projPriority, setProjPriority] = useState('medium');
  const [projDeadline, setProjDeadline] = useState('');
  const [projRepo, setProjRepo] = useState('');
  const [formError, setFormError] = useState('');

  // Form State for Admin Settings
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    fetchWorkspaceDetails(id);
  }, [id, fetchWorkspaceDetails]);

  useEffect(() => {
    if (currentWorkspace) {
      setWsName(currentWorkspace.name || '');
      setWsDesc(currentWorkspace.description || '');
    }
  }, [currentWorkspace]);

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

  const handleUpdateWorkspaceSettings = async (e) => {
    e.preventDefault();
    setAdminSuccess('');
    setAdminError('');

    const updated = await updateWorkspace(currentWorkspace._id, {
      name: wsName,
      description: wsDesc
    });

    if (updated) {
      setAdminSuccess('Workspace details updated successfully!');
      setTimeout(() => setAdminSuccess(''), 3000);
    } else {
      setAdminError('Failed to update workspace details.');
    }
  };

  const handleRegenerateCode = async () => {
    if (!window.confirm('Regenerating invite code will invalidate the old code. Proceed?')) return;
    setAdminSuccess('');
    setAdminError('');

    const newCode = await regenerateInviteCode(currentWorkspace._id);
    if (newCode) {
      setAdminSuccess(`New Invite Code generated: ${newCode}`);
      setTimeout(() => setAdminSuccess(''), 4000);
    } else {
      setAdminError('Failed to regenerate invite code.');
    }
  };

  const handleRoleChange = async (memberUserId, newRole) => {
    setAdminSuccess('');
    setAdminError('');

    const updated = await updateMemberRole(currentWorkspace._id, memberUserId, newRole);
    if (updated) {
      setAdminSuccess(`Member role updated to ${newRole.toUpperCase()}!`);
      setTimeout(() => setAdminSuccess(''), 3000);
    } else {
      setAdminError('Failed to update member role.');
    }
  };

  const handleRemoveMember = async (memberUserId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) return;
    setAdminSuccess('');
    setAdminError('');

    const updated = await removeMember(currentWorkspace._id, memberUserId);
    if (updated) {
      setAdminSuccess(`${memberName} was removed from workspace.`);
      setTimeout(() => setAdminSuccess(''), 3000);
    } else {
      setAdminError('Failed to remove member.');
    }
  };

  const handleDeleteWorkspaceObj = async () => {
    if (!window.confirm('WARNING: Deleting this workspace will permanently destroy all projects and files. Type YES mentally to proceed.')) return;
    const success = await deleteWorkspace(currentWorkspace._id);
    if (success) {
      navigate('/');
    } else {
      setAdminError('Failed to delete workspace.');
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const userId = user?.id || user?._id;
  const isOwner = currentWorkspaceRole === 'owner' || (currentWorkspace.owner?._id || currentWorkspace.owner) === userId;
  const isAdmin = currentWorkspaceRole === 'admin';
  const hasAdminAccess = isOwner || isAdmin;

  const isEligibleToCreate = ['owner', 'admin', 'developer'].includes(currentWorkspaceRole);
  const isEligibleToDelete = ['owner', 'admin'].includes(currentWorkspaceRole);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* Workspace top header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-black/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] font-display">WORKSPACE PANEL</span>
            {isOwner && (
              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 font-display">
                <Crown className="h-3 w-3 text-amber-500" /> Workspace Owner
              </span>
            )}
            {isAdmin && !isOwner && (
              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 border border-purple-500/20 font-display">
                <ShieldCheck className="h-3 w-3 text-purple-500" /> Workspace Admin
              </span>
            )}
            {!hasAdminAccess && (
              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-black/5 font-display">
                {currentWorkspaceRole || 'Member'}
              </span>
            )}
          </div>
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

      {/* Admin / Overview Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-black/5 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'overview' ? 'bg-[#0071e3] text-white shadow-sm' : 'bg-white border border-black/5 text-slate-600 hover:bg-slate-50'}`}
        >
          <Layers className="h-3.5 w-3.5" />
          Overview & Projects
        </button>

        {hasAdminAccess && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'admin' ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100'}`}
          >
            <Settings className="h-3.5 w-3.5" />
            Admin Control Panel
            <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-white/20">Admin</span>
          </button>
        )}
      </div>

      {/* TAB 1: OVERVIEW & PROJECTS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
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
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-lg font-bold text-[#1d1d1f]">{currentWorkspace.members?.length || 1}</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {onlineMembersCount} Online
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4.5 border border-black/5 flex items-center gap-4 shadow-sm">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 font-display">Active Role</p>
                <p className="text-lg font-bold text-[#1d1d1f] capitalize mt-0.5">{currentWorkspaceRole || 'Member'}</p>
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
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors border border-transparent cursor-pointer"
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

            {/* Member management sidebar (1 col) */}
            <div className="space-y-5">
              <h2 className="text-md font-bold text-[#1d1d1f] flex items-center gap-2 font-display">
                <Users className="h-4.5 w-4.5 text-[#0071e3]" />
                Workspace Members
              </h2>

              <div className="bg-white rounded-2xl p-4.5 border border-black/5 shadow-sm space-y-4">
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {currentWorkspace.members && currentWorkspace.members.map((member, i) => {
                    const isOnline = isUserOnline(member.user?._id || member.user?.id || member.user);
                    return (
                      <div key={i} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-[#f5f5f7] border border-black/5">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="relative shrink-0">
                            {member.user?.avatar ? (
                              <img src={member.user.avatar} alt="Avatar" className="w-7 h-7 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-200 border border-black/5 flex items-center justify-center font-bold text-[10px] text-slate-600 shrink-0">
                                {member.user?.name ? member.user.name.substring(0, 2).toUpperCase() : 'US'}
                              </div>
                            )}
                            <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-semibold text-[#1d1d1f] truncate">{member.user?.name}</p>
                            <p className="text-[9px] text-slate-500 truncate">{member.user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${isOnline ? 'bg-emerald-50 text-emerald-600 font-semibold' : 'bg-slate-100 text-slate-400'}`}>
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${member.role === 'owner' ? 'bg-[#0071e3]/10 text-[#0071e3]' : member.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-slate-200 text-slate-600'}`}>
                            {member.role}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADMIN CONTROL PANEL (Owner & Admin Only) */}
      {activeTab === 'admin' && hasAdminAccess && (
        <div className="space-y-6">
          {adminSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              {adminSuccess}
            </div>
          )}
          {adminError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {adminError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. Workspace General Settings (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Settings Card */}
              <div className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-black/5 pb-3">
                  <Edit3 className="h-4.5 w-4.5 text-[#0071e3]" />
                  <h2 className="text-sm font-bold text-[#1d1d1f] font-display">Workspace General Settings</h2>
                </div>

                <form onSubmit={handleUpdateWorkspaceSettings} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1 font-display">Workspace Name</label>
                    <input
                      type="text"
                      required
                      value={wsName}
                      onChange={(e) => setWsName(e.target.value)}
                      className="glass-input w-full p-2.5 text-xs font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1 font-display">Description</label>
                    <textarea
                      value={wsDesc}
                      onChange={(e) => setWsDesc(e.target.value)}
                      rows={3}
                      className="glass-input w-full p-2.5 text-xs font-sans resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="btn-premium-primary px-4 py-2 text-xs rounded-lg text-white font-semibold cursor-pointer"
                    >
                      Save Workspace Changes
                    </button>
                  </div>
                </form>
              </div>

              {/* Member Management Table */}
              <div className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-black/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4.5 w-4.5 text-purple-600" />
                    <h2 className="text-sm font-bold text-[#1d1d1f] font-display">Team Roles & Member Management</h2>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">{currentWorkspace.members?.length || 0} Total Members</span>
                </div>

                <div className="space-y-3">
                  {currentWorkspace.members && currentWorkspace.members.map((member) => {
                    const isMemOwner = member.role === 'owner' || (currentWorkspace.owner?._id || currentWorkspace.owner) === member.user?._id;
                    const isCurrentUser = member.user?._id === userId;
                    const isOnline = isUserOnline(member.user?._id || member.user?.id || member.user);

                    return (
                      <div key={member.user?._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#f5f5f7] border border-black/5">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="relative shrink-0">
                            {member.user?.avatar ? (
                              <img src={member.user.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-200 border border-black/5 flex items-center justify-center font-bold text-xs text-slate-600 shrink-0">
                                {member.user?.name ? member.user.name.substring(0, 2).toUpperCase() : 'US'}
                              </div>
                            )}
                            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                          </div>
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-[#1d1d1f] truncate">{member.user?.name}</p>
                              {isCurrentUser && (
                                <span className="text-[9px] bg-[#0071e3]/10 text-[#0071e3] px-1.5 py-0.2 rounded font-bold uppercase">You</span>
                              )}
                              <span className={`text-[9px] font-medium px-1.5 py-0.2 rounded-full ${isOnline ? 'bg-emerald-50 text-emerald-600 font-semibold border border-emerald-200/60' : 'bg-slate-200/60 text-slate-400'}`}>
                                {isOnline ? 'Online' : 'Offline'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">{member.user?.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Role Selector or Static Owner Badge */}
                          {isMemOwner ? (
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center gap-1 font-display">
                              <Crown className="h-3 w-3 text-amber-500" /> Owner
                            </span>
                          ) : (
                            <select
                              disabled={!isOwner && member.role === 'admin'}
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.user?._id, e.target.value)}
                              className="text-xs font-semibold p-1.5 rounded-lg border border-black/10 bg-white text-slate-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <option value="admin">Admin</option>
                              <option value="developer">Developer</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          )}

                          {/* Remove member button */}
                          {!isMemOwner && !isCurrentUser && (
                            <button
                              onClick={() => handleRemoveMember(member.user?._id, member.user?.name)}
                              title="Remove member from workspace"
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors border border-red-100 cursor-pointer"
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Admin Side Controls (1 col) */}
            <div className="space-y-6">
              {/* Access Control & Invite Code Admin */}
              <div className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-black/5 pb-3">
                  <Key className="h-4.5 w-4.5 text-amber-500" />
                  <h2 className="text-sm font-bold text-[#1d1d1f] font-display">Invite Code & Access</h2>
                </div>

                <p className="text-xs text-slate-500">
                  Team members can join this workspace using this unique 8-character invite code.
                </p>

                <div className="p-3 bg-[#f5f5f7] rounded-xl border border-black/5 flex items-center justify-between">
                  <span className="font-mono text-sm font-bold tracking-wider text-[#1d1d1f]">
                    {currentWorkspace.inviteCode}
                  </span>
                  <button
                    onClick={copyInviteCode}
                    className="p-1.5 rounded-lg bg-white border border-black/10 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <button
                  onClick={handleRegenerateCode}
                  className="w-full btn-premium-secondary py-2 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                  Regenerate Invite Code
                </button>
              </div>

              {/* Danger Zone (Owner Only) */}
              {isOwner && (
                <div className="bg-red-50/50 rounded-2xl p-6 border border-red-200/80 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-red-700 font-bold text-xs font-display">
                    <Trash2 className="h-4 w-4" />
                    Danger Zone
                  </div>
                  <p className="text-[11px] text-red-600 leading-relaxed">
                    Permanently delete this workspace along with all attached projects, bug logs, and chat histories. This action cannot be undone.
                  </p>
                  <button
                    onClick={handleDeleteWorkspaceObj}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    Delete Workspace Permanently
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

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
