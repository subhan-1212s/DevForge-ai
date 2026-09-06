import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { 
  Terminal, 
  Layers, 
  Users, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Plus, 
  FolderGit, 
  Menu, 
  X,
  User as UserIcon
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
    <div className="min-h-screen flex bg-[#f5f5f7] text-[#1d1d1f] overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-black/5 h-screen relative z-10 shrink-0 font-sans">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-black/5 gap-3">
          <Terminal className="h-5 w-5 text-[#1d1d1f]" />
          <span className="font-display font-bold text-md text-[#1d1d1f]">
            DevForge <span className="text-[#0071e3] font-medium">AI</span>
          </span>
        </div>

        {/* Workspace Switcher */}
        <div className="p-4 border-b border-black/5 relative">
          <button 
            onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-[#f5f5f7] border border-black/5 hover:bg-[#e8e8ed] transition-all duration-200 text-left cursor-pointer"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-md bg-[#1d1d1f] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {currentWorkspace?.name ? currentWorkspace.name.substring(0, 2).toUpperCase() : 'DF'}
              </div>
              <span className="font-semibold text-xs text-[#1d1d1f] truncate">
                {currentWorkspace?.name || 'Select Workspace'}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          </button>

          {/* Switcher Dropdown */}
          <AnimatePresence>
            {showWorkspaceDropdown && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute left-4 right-4 mt-1.5 p-1.5 rounded-xl bg-white border border-black/10 shadow-premium-lg z-50"
              >
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {workspaces.map((ws) => (
                    <button
                      key={ws._id}
                      onClick={() => handleWorkspaceChange(ws._id)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs hover:bg-[#f5f5f7] transition-colors ${currentWorkspace?._id === ws._id ? 'bg-[#0071e3]/10 text-[#0071e3] font-semibold' : 'text-[#1d1d1f]'}`}
                    >
                      <div className="w-5 h-5 rounded bg-[#f5f5f7] border border-black/5 text-[#1d1d1f] flex items-center justify-center text-[10px] font-bold shrink-0">
                        {ws.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate">{ws.name}</span>
                    </button>
                  ))}
                  {workspaces.length === 0 && (
                    <div className="p-2 text-[10px] text-slate-500 text-center">No workspaces found</div>
                  )}
                </div>
                <div className="border-t border-black/5 mt-1.5 pt-1.5">
                  <Link 
                    to="/" 
                    onClick={() => setShowWorkspaceDropdown(false)}
                    className="flex items-center justify-center gap-1.5 p-2 text-[11px] text-[#0071e3] hover:underline font-semibold rounded-lg bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Manage Workspaces
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {currentWorkspace ? (
            <>
              <div className="text-[9px] font-bold tracking-widest text-[#86868b] uppercase px-3 mb-2 font-display">Workspace Navigation</div>
              <Link 
                to={`/workspace/${currentWorkspace._id}`}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all duration-200"
              >
                <Layers className="h-4 w-4 text-[#0071e3]" />
                <span>Dashboard Overview</span>
              </Link>

              <div className="text-[9px] font-bold tracking-widest text-[#86868b] uppercase px-3 pt-5 mb-2 font-display">Projects</div>
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                {currentWorkspace.projects && currentWorkspace.projects.map((proj) => (
                  <Link
                    key={proj._id}
                    to={`/workspace/${currentWorkspace._id}/project/${proj._id}`}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] text-slate-500 hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors truncate"
                  >
                    <FolderGit className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                    <span className="truncate">{proj.name}</span>
                  </Link>
                ))}
                {(!currentWorkspace.projects || currentWorkspace.projects.length === 0) && (
                  <div className="px-3 py-1.5 text-[10px] text-slate-400 italic">No projects yet</div>
                )}
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-black/5 rounded-xl">
              Select or create a workspace to begin.
            </div>
          )}
        </nav>

        {/* Sidebar Footer / User Profile */}
        <div className="p-4 border-t border-black/5 space-y-3">
          <div className="flex items-center gap-3 px-2 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="User avatar" className="w-8 h-8 rounded-full object-cover border border-black/5" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#f5f5f7] border border-black/5 flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-slate-600" />
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-[#1d1d1f] truncate">{user?.name}</p>
              <p className="text-[9px] text-[#86868b] truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all duration-200 cursor-pointer font-semibold"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-black/5 bg-white/80 backdrop-blur-md relative z-10 shrink-0 font-sans">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg bg-[#f5f5f7] border border-black/5 hover:bg-[#e8e8ed] md:hidden cursor-pointer"
            >
              <Menu className="h-4 w-4 text-[#1d1d1f]" />
            </button>
            <h2 className="text-sm font-bold text-[#1d1d1f] truncate font-display">
              {currentWorkspace ? currentWorkspace.name : 'Workspace Launcher'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <NotificationsDropdown />
            {currentWorkspace && (
              <div className="px-2.5 py-0.5 rounded-full bg-[#0071e3]/10 border border-[#0071e3]/20 text-[10px] text-[#0071e3] font-semibold uppercase tracking-wider">
                {currentWorkspace?.members?.find(m => m.user?._id === user?.id)?.role || 'owner'}
              </div>
            )}
          </div>
        </header>

        {/* Content Panel */}
        <main className="flex-1 overflow-y-auto relative p-6 md:p-8 bg-[#f5f5f7]">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden font-sans">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            />
            {/* Sidebar content */}
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative flex flex-col w-64 bg-white border-r border-black/10 h-full p-4 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-black/5">
                <div className="flex items-center gap-2.5">
                  <Terminal className="h-5 w-5 text-[#1d1d1f]" />
                  <span className="font-display font-bold text-md text-[#1d1d1f]">DevForge AI</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Workspace details */}
              <div className="space-y-4 flex-1 overflow-y-auto">
                <div>
                  <label className="text-[9px] font-bold tracking-widest text-[#86868b] uppercase px-2 font-display">Workspaces</label>
                  <div className="mt-2 space-y-0.5">
                    {workspaces.map((ws) => (
                      <button
                        key={ws._id}
                        onClick={() => {
                          handleWorkspaceChange(ws._id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-xs ${currentWorkspace?._id === ws._id ? 'bg-[#0071e3]/10 text-[#0071e3] font-semibold' : 'text-slate-600'}`}
                      >
                        <div className="w-5 h-5 rounded bg-[#f5f5f7] border border-black/5 text-[#1d1d1f] flex items-center justify-center text-[9px] font-bold">
                          {ws.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="truncate">{ws.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {currentWorkspace && (
                  <div>
                    <label className="text-[9px] font-bold tracking-widest text-[#86868b] uppercase px-2 font-display">Active Projects</label>
                    <div className="mt-2 space-y-0.5">
                      {currentWorkspace.projects && currentWorkspace.projects.map((proj) => (
                        <Link
                          key={proj._id}
                          to={`/workspace/${currentWorkspace._id}/project/${proj._id}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-[#1d1d1f]"
                        >
                          <FolderGit className="h-3.5 w-3.5 text-purple-500" />
                          <span className="truncate">{proj.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar footer logout */}
              <div className="border-t border-black/5 pt-4">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-all duration-200"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
