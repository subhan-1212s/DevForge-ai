import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WorkspaceDetail from './pages/WorkspaceDetail';
import ProjectDetail from './pages/ProjectDetail';
import KanbanBoard from './pages/KanbanBoard';
import ProjectChat from './pages/ProjectChat';
import CodePad from './pages/CodePad';
import Wiki from './pages/Wiki';
import BugTracker from './pages/BugTracker';
import AiSuite from './pages/AiSuite';
import Analytics from './pages/Analytics';
import { Terminal } from 'lucide-react';

function ProtectedRoute({ children }) {
  const { user, loading, checkAuth } = useAuthStore();

  useEffect(() => {
    let mounted = true;
    if (!user) {
      checkAuth();
    }
    // Safety timer to prevent infinite loading state if backend is unresponsive
    const timer = setTimeout(() => {
      if (mounted && useAuthStore.getState().loading) {
        useAuthStore.setState({ loading: false });
      }
    }, 2500);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-slate-100 gap-4 font-sans">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center animate-pulse">
          <Terminal className="h-6 w-6 text-indigo-400" />
        </div>
        <div className="w-36 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-pulse" style={{ width: '80%' }} />
        </div>
        <p className="text-xs text-slate-400 font-sans tracking-wide">Connecting DevForge Workspace Environment...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="workspace/:workspaceId" element={<WorkspaceDetail />} />
        <Route path="workspace/:workspaceId/project/:projectId" element={<ProjectDetail />} />
        <Route path="workspace/:workspaceId/project/:projectId/kanban" element={<KanbanBoard />} />
        <Route path="workspace/:workspaceId/project/:projectId/chat" element={<ProjectChat />} />
        <Route path="workspace/:workspaceId/project/:projectId/editor" element={<CodePad />} />
        <Route path="workspace/:workspaceId/project/:projectId/wiki" element={<Wiki />} />
        <Route path="workspace/:workspaceId/project/:projectId/bugs" element={<BugTracker />} />
        <Route path="workspace/:workspaceId/project/:projectId/ai" element={<AiSuite />} />
        <Route path="workspace/:workspaceId/project/:projectId/analytics" element={<Analytics />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
