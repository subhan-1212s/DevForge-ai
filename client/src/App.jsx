import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

function ProtectedRoute({ children }) {
  const { user, loading, checkAuth } = useAuthStore();

  useEffect(() => {
    // Perform background check to ensure session validity
    checkAuth();
  }, []);

  // Show a minimal spinner only if there's no stored user and initial check is active
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
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
        <Route path="workspace/:workspaceId/project/:projectId/codepad" element={<CodePad />} />
        <Route path="workspace/:workspaceId/project/:projectId/wiki" element={<Wiki />} />
        <Route path="workspace/:workspaceId/project/:projectId/bugs" element={<BugTracker />} />
        <Route path="workspace/:workspaceId/project/:projectId/ai" element={<AiSuite />} />
        <Route path="workspace/:workspaceId/project/:projectId/ai-suite" element={<AiSuite />} />
        <Route path="workspace/:workspaceId/project/:projectId/analytics" element={<Analytics />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
