import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { 
  Terminal, 
  Layers, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Plus, 
  FolderGit, 
  Menu, 
  X,
  User as UserIcon,
  Search,
  Grid,
  CheckCircle2,
  Sparkles,
  LayoutDashboard,
  Command,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationsDropdown from '../components/NotificationsDropdown';

export default function DashboardLayout() {
  const { user, clearAuth } = useAuthStore();
  const { 
    workspaces, 
    currentWorkspace, 
    fetchWorkspaces, 
    fetchWorkspaceDetails,
    clearWorkspaceStore
  } = useWorkspaceStore();

  const { workspaceId } = useParams();
  const navigate = useNavigate();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceDetails(workspaceId);
    }
  }, [workspaceId, fetchWorkspaceDetails]);

  const handleLogout = async () => {
    try {
      await useAuthStore.getState().clearAuth();
      clearWorkspaceStore();
      navigate('/login');
    } catch (error) {
      console.error(error);
    }
  };

  const handleWorkspaceChange = (id) => {
    setShowWorkspaceDropdown(false);
    navigate(`/workspace/${id}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7fb] text-[#0f172a] overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white/90 backdrop-blur-md border-b border-slate-200/80 relative z-30 shrink-0 shadow-xs">
        {/* Left Section: Mobile Menu, Brand Emblem & Workspace Picker */}
        <div className="flex items-center gap-3 md:gap-6">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-100 md:hidden cursor-pointer text-[#64748b] transition-colors"
            title="Toggle Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0066ff] via-[#8b5cf6] to-[#ec4899] p-0.5 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Terminal className="h-5 w-5 text-[#0066ff]" />
              </div>
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-[#0f172a]">
              DevForge <span className="gradient-text-blue font-extrabold">AI</span>
            </span>
          </Link>

          {/* Workspace Selector Pill */}
          <div className="relative hidden sm:block ml-2">
            <button 
              onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-100/80 hover:bg-slate-200/70 transition-colors text-xs font-semibold text-[#334155] cursor-pointer border border-slate-200/60"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#0066ff] to-[#2563eb] text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-2xs">
                {currentWorkspace?.name ? currentWorkspace.name.substring(0, 2).toUpperCase() : 'DF'}
              </div>
              <span className="max-w-[140px] truncate">{currentWorkspace?.name || 'Select Workspace'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#64748b]" />
            </button>

            <AnimatePresence>
              {showWorkspaceDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute left-0 mt-2 w-64 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xl z-50"
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold text-[#64748b] uppercase tracking-wider font-display">
                    Your Workspaces
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {workspaces.map((ws) => (
                      <button
                        key={ws._id}
                        onClick={() => handleWorkspaceChange(ws._id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-colors ${currentWorkspace?._id === ws._id ? 'bg-[#eff6ff] text-[#0066ff] font-bold border border-blue-200/60' : 'text-[#334155] hover:bg-slate-100'}`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-slate-100 text-[#0f172a] flex items-center justify-center text-[10px] font-bold shrink-0">
                          {ws.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="truncate flex-1">{ws.name}</span>
                        {currentWorkspace?._id === ws._id && <CheckCircle2 className="h-3.5 w-3.5 text-[#0066ff]" />}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 mt-2 pt-2">
                    <Link 
                      to="/" 
                      onClick={() => setShowWorkspaceDropdown(false)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-[#0066ff] hover:bg-[#eff6ff] font-semibold rounded-xl transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Manage All Workspaces
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center Section: Search Bar with Shortcut Badge */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#64748b]" />
            <input 
              type="text" 
              placeholder="Search projects, sprint tasks, or wiki docs..."
              className="w-full pl-10 pr-12 py-2 bg-slate-100/90 focus:bg-white border border-slate-200/60 focus:border-[#0066ff] rounded-full text-xs text-[#0f172a] transition-all outline-none"
            />
            <div className="absolute right-3 top-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-200/60 text-[10px] font-mono text-[#64748b]">
              <Command className="h-2.5 w-2.5" /> K
            </div>
          </div>
        </div>

        {/* Right Section: Notifications & User Profile Avatar */}
        <div className="flex items-center gap-3">
          <NotificationsDropdown />

          {/* User Profile Button */}
          <div className="relative">
            <button 
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="User avatar" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0066ff] to-[#7c3aed] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </button>

            <AnimatePresence>
              {showUserDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute right-0 mt-2 w-64 p-3 rounded-2xl bg-white border border-slate-200 shadow-xl z-50"
                >
                  <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 mb-2">
                    <div className="w-9 h-9 rounded-full bg-[#0066ff] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-[#0f172a] truncate">{user?.name}</p>
                      <p className="text-[11px] text-[#64748b] truncate">{user?.email}</p>
                    </div>
                  </div>

                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-[#f43f5e] hover:bg-[#fff1f2] transition-colors font-semibold cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out of DevForge</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 h-[calc(100vh-4rem)] shrink-0">
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            {currentWorkspace ? (
              <>
                <div className="px-3 pb-2 text-[10px] font-bold text-[#64748b] uppercase tracking-wider font-display">
                  Workspace Navigation
                </div>
                
                <Link 
                  to={`/workspace/${currentWorkspace._id}`}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-full text-xs text-[#334155] hover:bg-[#eff6ff] hover:text-[#0066ff] font-semibold transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 text-[#0066ff]" />
                  <span>Dashboard Overview</span>
                </Link>

                <div className="px-3 pt-6 pb-2 text-[10px] font-bold text-[#64748b] uppercase tracking-wider font-display">
                  Active Projects
                </div>

                <div className="space-y-1">
                  {currentWorkspace.projects && currentWorkspace.projects.map((proj) => (
                    <Link
                      key={proj._id}
                      to={`/workspace/${currentWorkspace._id}/project/${proj._id}`}
                      className="flex items-center gap-3 px-4 py-2 rounded-full text-xs text-[#64748b] hover:text-[#0f172a] hover:bg-slate-100 font-medium transition-colors"
                    >
                      <FolderGit className="h-4 w-4 text-[#8b5cf6] shrink-0" />
                      <span className="truncate">{proj.name}</span>
                    </Link>
                  ))}
                  {(!currentWorkspace.projects || currentWorkspace.projects.length === 0) && (
                    <div className="px-4 py-2 text-xs text-[#94a3b8] italic">No active projects</div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-xs text-[#64748b] border border-dashed border-slate-200 rounded-2xl">
                Select a workspace to begin.
              </div>
            )}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs text-[#64748b]">
              <Sparkles className="h-4 w-4 text-[#0066ff]" />
              <span className="font-semibold">DevForge AI Suite v2.5</span>
            </div>
          </div>
        </aside>

        {/* Dynamic Content View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#f5f7fb]">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden font-sans">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />

            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative flex flex-col w-72 bg-white h-full p-4 space-y-6 z-10 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <Terminal className="h-5 w-5 text-[#0066ff]" />
                  <span className="font-display font-bold text-base text-[#0f172a]">DevForge AI</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-full hover:bg-slate-100">
                  <X className="h-5 w-5 text-[#64748b]" />
                </button>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto">
                <div>
                  <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider px-2 mb-2 font-display">Workspaces</div>
                  <div className="space-y-1">
                    {workspaces.map((ws) => (
                      <button
                        key={ws._id}
                        onClick={() => {
                          handleWorkspaceChange(ws._id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs ${currentWorkspace?._id === ws._id ? 'bg-[#eff6ff] text-[#0066ff] font-bold' : 'text-[#334155]'}`}
                      >
                        <div className="w-5 h-5 rounded-md bg-slate-100 text-[#0f172a] flex items-center justify-center text-[10px] font-bold">
                          {ws.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="truncate">{ws.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {currentWorkspace && (
                  <div>
                    <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider px-2 mb-2 font-display">Projects</div>
                    <div className="space-y-1">
                      {currentWorkspace.projects && currentWorkspace.projects.map((proj) => (
                        <Link
                          key={proj._id}
                          to={`/workspace/${currentWorkspace._id}/project/${proj._id}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#64748b] hover:text-[#0f172a]"
                        >
                          <FolderGit className="h-4 w-4 text-[#8b5cf6]" />
                          <span className="truncate">{proj.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
