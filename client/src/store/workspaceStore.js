import { create } from 'zustand';
import api from '../services/api';

export const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  currentWorkspaceRole: null,
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/workspaces');
      set({ workspaces: data.workspaces, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error fetching workspaces', loading: false });
    }
  },

  fetchWorkspaceDetails: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/workspaces/${id}`);
      set({ 
        currentWorkspace: data.workspace, 
        currentWorkspaceRole: data.role,
        projects: data.workspace.projects || [],
        loading: false 
      });
      return data.workspace;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error fetching workspace details', loading: false });
      return null;
    }
  },

  createWorkspace: async (workspaceData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/workspaces', workspaceData);
      set((state) => ({ 
        workspaces: [...state.workspaces, data.workspace],
        loading: false 
      }));
      return data.workspace;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error creating workspace', loading: false });
      return null;
    }
  },

  joinWorkspace: async (inviteCode) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/workspaces/join', { inviteCode });
      set((state) => ({
        workspaces: [...state.workspaces, data.workspace],
        loading: false
      }));
      return data.workspace;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error joining workspace', loading: false });
      throw new Error(error.response?.data?.message || 'Error joining workspace');
    }
  },

  deleteWorkspace: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/workspaces/${id}`);
      set((state) => ({
        workspaces: state.workspaces.filter(w => w._id !== id),
        currentWorkspace: state.currentWorkspace?._id === id ? null : state.currentWorkspace,
        loading: false
      }));
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error deleting workspace', loading: false });
      return false;
    }
  },

  createProject: async (projectData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/projects', projectData);
      set((state) => ({
        projects: [...state.projects, data.project],
        loading: false
      }));
      return data.project;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error creating project', loading: false });
      return null;
    }
  },

  updateProject: async (projectId, projectData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.put(`/projects/${projectId}`, projectData);
      set((state) => ({
        projects: state.projects.map(p => p._id === projectId ? data.project : p),
        currentProject: state.currentProject?._id === projectId ? data.project : state.currentProject,
        loading: false
      }));
      return data.project;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error updating project', loading: false });
      return null;
    }
  },

  deleteProject: async (projectId) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/projects/${projectId}`);
      set((state) => ({
        projects: state.projects.filter(p => p._id !== projectId),
        currentProject: state.currentProject?._id === projectId ? null : state.currentProject,
        loading: false
      }));
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error deleting project', loading: false });
      return false;
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  clearWorkspaceStore: () => set({ workspaces: [], currentWorkspace: null, projects: [], currentProject: null })
}));
