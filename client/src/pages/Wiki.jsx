import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useWorkspaceStore } from '../store/workspaceStore';
import { 
  ArrowLeft, 
  BookOpen, 
  Edit2, 
  Save, 
  Plus, 
  Trash2, 
  ChevronRight,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';

// Minimal parser to convert basic markdown into nice HTML elements safely
const renderSimpleMarkdown = (text = '') => {
  if (!text) return <p className="text-slate-400 italic text-xs">No content in this chapter yet.</p>;

  const lines = text.split('\n');
  return lines.map((line, idx) => {
    // Header 1
    if (line.startsWith('# ')) {
      return <h2 key={idx} className="text-lg font-bold border-b border-black/5 pb-1 mt-4 mb-2 text-[#1d1d1f] font-display">{line.substring(2)}</h2>;
    }
    // Header 2
    if (line.startsWith('## ')) {
      return <h3 key={idx} className="text-sm font-bold mt-3 mb-1.5 text-[#1d1d1f] font-display">{line.substring(3)}</h3>;
    }
    // Bullets
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return <li key={idx} className="ml-4 list-disc text-xs text-slate-600 leading-relaxed">{line.substring(2)}</li>;
    }
    // Code blocks
    if (line.startsWith('```')) {
      return null; // hide tags
    }
    if (line.trim() === '') {
      return <div key={idx} className="h-2" />;
    }
    
    // Normal paragraph
    return <p key={idx} className="text-xs text-slate-600 leading-relaxed mb-1.5">{line}</p>;
  });
};

export default function Wiki() {
  const { workspaceId, projectId } = useParams();
  const { currentWorkspace, fetchWorkspaceDetails } = useWorkspaceStore();

  const [documents, setDocuments] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit / Add state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [showAddDoc, setShowAddDoc] = useState(false);

  const fetchDocs = async () => {
    try {
      const { data } = await api.get(`/docs?projectId=${projectId}`);
      setDocuments(data.documents);
      if (data.documents.length > 0) {
        setEditTitle(data.documents[0].title);
        setEditContent(data.documents[0].content);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentWorkspace) {
      fetchWorkspaceDetails(workspaceId);
    }
    fetchDocs();
  }, [workspaceId, projectId]);

  const activeDoc = documents[activeIndex];

  const handleSelectDoc = (idx) => {
    setActiveIndex(idx);
    const doc = documents[idx];
    setEditTitle(doc.title);
    setEditContent(doc.content);
    setEditMode(false);
  };

  const handleCreateDoc = async (e) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    try {
      const { data } = await api.post('/docs', {
        title: newDocTitle.trim(),
        content: `# ${newDocTitle.trim()}\n\nWrite documentation markdown logs here...`,
        projectId,
        workspaceId
      });

      const updated = [...documents, data.document];
      setDocuments(updated);
      setActiveIndex(updated.length - 1);
      setEditTitle(data.document.title);
      setEditContent(data.document.content);
      setNewDocTitle('');
      setShowAddDoc(false);
      setEditMode(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDoc = async () => {
    if (!activeDoc) return;

    try {
      const { data } = await api.put(`/docs/${activeDoc._id}`, {
        title: editTitle,
        content: editContent
      });

      setDocuments(prev => 
        prev.map((d, i) => i === activeIndex ? data.document : d)
      );
      setEditMode(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDoc = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this wiki page?')) return;

    try {
      await api.delete(`/docs/${id}`);
      const updated = documents.filter(d => d._id !== id);
      setDocuments(updated);
      setActiveIndex(0);
      if (updated.length > 0) {
        setEditTitle(updated[0].title);
        setEditContent(updated[0].content);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans text-[#1d1d1f]">
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-black/5 pb-4">
        <div className="flex items-center gap-3">
          <Link 
            to={`/workspace/${workspaceId}/project/${projectId}`}
            className="p-2 rounded-lg bg-white border border-black/5 hover:bg-slate-100 text-slate-600 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#0071e3]" />
            <div>
              <span className="text-[9px] font-bold text-slate-400 font-display">DOCUMENTATION WIKI</span>
              <h1 className="text-xl sm:text-2xl font-extrabold font-display">Project Docs</h1>
            </div>
          </div>
        </div>

        {activeDoc && (
          <div className="flex gap-2">
            {editMode ? (
              <button 
                onClick={handleSaveDoc}
                className="btn-premium-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            ) : (
              <button 
                onClick={() => setEditMode(true)}
                className="btn-premium-secondary inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
              >
                <Edit2 className="h-4 w-4" />
                Edit Wiki
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main split dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Side: Wiki pages explorer */}
        <div className="bg-white border border-black/5 rounded-2xl p-4 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-black/5">
            <span className="text-xs font-bold text-slate-400 font-display uppercase tracking-wider">Chapters</span>
            <button 
              onClick={() => setShowAddDoc(!showAddDoc)}
              className="p-1 rounded hover:bg-slate-100 text-[#0071e3]"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {showAddDoc && (
            <form onSubmit={handleCreateDoc} className="flex gap-1.5">
              <input
                type="text"
                required
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="Chapter title..."
                className="glass-input flex-1 p-2 text-xs"
              />
              <button type="submit" className="btn-premium-primary px-3 py-1.5 text-[10px] rounded-lg">
                Create
              </button>
            </form>
          )}

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-1.5">
              {documents.map((doc, idx) => (
                <div
                  key={doc._id}
                  onClick={() => handleSelectDoc(idx)}
                  className={`flex justify-between items-center p-2.5 rounded-xl text-xs cursor-pointer transition-colors group ${activeIndex === idx ? 'bg-[#0071e3]/5 border border-[#0071e3]/10 text-[#0071e3] font-semibold' : 'border border-transparent hover:bg-[#f5f5f7] text-slate-600'}`}
                >
                  <span className="truncate pr-1">{doc.title}</span>
                  <button
                    onClick={(e) => handleDeleteDoc(doc._id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-500 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {documents.length === 0 && (
                <span className="text-[10px] text-slate-400 block text-center py-4">No wiki logs registered.</span>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Document content display or edit text editor */}
        <div className="md:col-span-3 bg-white border border-black/5 rounded-2xl p-6 min-h-[480px]">
          {activeDoc ? (
            editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Chapter Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="glass-input w-full p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Content (Markdown logs)</label>
                  <textarea
                    rows={12}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="glass-input w-full p-3 font-mono text-xs resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-b border-black/5 pb-3">
                  <h1 className="text-xl font-extrabold text-[#1d1d1f] font-display">{activeDoc.title}</h1>
                  <span className="text-[9px] text-slate-400 block mt-1">
                    Written by {activeDoc.author?.name || 'Developer'} • Last updated {new Date(activeDoc.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                
                {/* Renders markup text */}
                <div className="prose prose-slate max-w-none pt-2">
                  {renderSimpleMarkdown(activeDoc.content)}
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[380px] text-center text-slate-400 space-y-2">
              <BookOpen className="h-8 w-8 text-slate-300 animate-bounce" />
              <p className="text-xs font-semibold">Select or Create a Document Chapter</p>
              <p className="text-[10px] max-w-xs">Wiki documents help summarize workspace credentials, endpoints mappings, and system specs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
