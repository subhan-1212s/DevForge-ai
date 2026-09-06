import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { 
  ArrowLeft, 
  FileCode, 
  Plus, 
  Trash2, 
  Play, 
  Terminal, 
  Save,
  CheckCircle,
  Code
} from 'lucide-react';
import { motion } from 'framer-motion';

const DEFAULT_FILES = [
  { name: 'main.js', content: `// Collaborative JavaScript Code Pad\n\nconst greet = (user) => {\n  console.log(\`Welcome to DevForge AI, \${user}!\`);\n};\n\ngreet("Developer");\n`, language: 'javascript' },
  { name: 'index.html', content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>DevForge AI Pad</title>\n</head>\n<body>\n  <h1>Collaborate in Realtime</h1>\n</body>\n</html>`, language: 'html' },
  { name: 'utils.py', content: `# Helper Functions\n\ndef calculate_metrics(tasks, bugs):\n    print(f"Active tasks: {tasks}, unresolved bugs: {bugs}")\n    return tasks + bugs\n`, language: 'python' }
];

export default function CodePad() {
  const { workspaceId, projectId } = useParams();
  const { currentWorkspace, fetchWorkspaceDetails } = useWorkspaceStore();

  const [files, setFiles] = useState(DEFAULT_FILES);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [newFileName, setNewFileName] = useState('');
  const [showAddFile, setShowAddFile] = useState(false);

  // Console terminal logs state
  const [consoleLogs, setConsoleLogs] = useState([
    'System: Monaco environment compiled successfully.',
    'System: Ready for collaborative coding.'
  ]);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (!currentWorkspace) {
      fetchWorkspaceDetails(workspaceId);
    }
  }, [workspaceId]);

  const activeFile = files[activeFileIndex] || files[0];

  const handleEditorChange = (value) => {
    setFiles(prev => 
      prev.map((f, i) => i === activeFileIndex ? { ...f, content: value || '' } : f)
    );
  };

  const handleCreateFile = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const extension = newFileName.split('.').pop() || '';
    let language = 'javascript';
    if (extension === 'py') language = 'python';
    else if (extension === 'html') language = 'html';
    else if (extension === 'css') language = 'css';
    else if (extension === 'json') language = 'json';

    const newFile = {
      name: newFileName.trim(),
      content: `// New file: ${newFileName}\n`,
      language
    };

    setFiles([...files, newFile]);
    setActiveFileIndex(files.length);
    setNewFileName('');
    setShowAddFile(false);
  };

  const handleDeleteFile = (index, e) => {
    e.stopPropagation();
    if (files.length <= 1) return; // Prevent deleting all files
    if (!window.confirm('Delete this file?')) return;

    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    setActiveFileIndex(0);
  };

  const handleExecuteCode = () => {
    setExecuting(true);
    setConsoleLogs(prev => [...prev, `> Executing ${activeFile.name}...`]);

    setTimeout(() => {
      let output = '';
      if (activeFile.language === 'javascript') {
        output = 'Welcome to DevForge AI, Developer!\nExecution finished with exit code 0.';
      } else if (activeFile.language === 'python') {
        output = 'Active tasks: 5, unresolved bugs: 2\nExecution finished with exit code 0.';
      } else {
        output = 'Markup/Static layout rendered successfully in preview engine.';
      }

      setConsoleLogs(prev => [...prev, output]);
      setExecuting(false);
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans text-[#1d1d1f]">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-black/5 pb-4">
        <div className="flex items-center gap-3">
          <Link 
            to={`/workspace/${workspaceId}/project/${projectId}`}
            className="p-2 rounded-lg bg-white border border-black/5 hover:bg-slate-100 text-slate-600 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-[#0071e3]" />
            <div>
              <span className="text-[9px] font-bold text-slate-400 font-display">DEVELOPER SUITE</span>
              <h1 className="text-xl sm:text-2xl font-extrabold font-display">DevForge CodePad</h1>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleExecuteCode}
            disabled={executing}
            className="btn-premium-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" />
            {executing ? 'Compiling...' : 'Run Code'}
          </button>
        </div>
      </div>

      {/* Editor Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch h-[68vh]">
        {/* Sidebar explorer */}
        <div className="bg-white border border-black/5 rounded-2xl p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-black/5">
              <span className="text-xs font-bold text-slate-400 font-display uppercase tracking-wider">File Explorer</span>
              <button 
                onClick={() => setShowAddFile(!showAddFile)}
                className="p-1 rounded-md hover:bg-slate-100 text-[#0071e3]"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Create file field */}
            {showAddFile && (
              <form onSubmit={handleCreateFile} className="flex gap-1.5">
                <input
                  type="text"
                  required
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="E.g. utils.py"
                  className="glass-input flex-1 p-2 text-xs"
                />
                <button type="submit" className="btn-premium-primary px-3 py-1.5 text-[10px] rounded-lg">
                  Add
                </button>
              </form>
            )}

            {/* File List */}
            <div className="space-y-1.5 overflow-y-auto max-h-[40vh]">
              {files.map((file, idx) => (
                <div
                  key={file.name}
                  onClick={() => setActiveFileIndex(idx)}
                  className={`flex justify-between items-center p-2.5 rounded-xl text-xs cursor-pointer transition-colors group ${activeFileIndex === idx ? 'bg-[#0071e3]/5 border border-[#0071e3]/10 text-[#0071e3] font-semibold' : 'border border-transparent hover:bg-[#f5f5f7] text-slate-600'}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className="h-4 w-4 shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  {files.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteFile(idx, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-500 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Active Collaborators Mock indicator */}
          <div className="p-3 bg-[#f5f5f7] border border-black/5 rounded-2xl space-y-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-display">Active in Pad</span>
            <div className="flex -space-x-1.5 overflow-hidden">
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-300 flex items-center justify-center text-[9px] font-bold">ME</div>
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-amber-200 flex items-center justify-center text-[9px] font-bold">JD</div>
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-purple-200 flex items-center justify-center text-[9px] font-bold">AM</div>
            </div>
            <span className="text-[10px] text-slate-500 block leading-tight">3 developers editing active files.</span>
          </div>
        </div>

        {/* Editor & Console center panel */}
        <div className="lg:col-span-3 flex flex-col bg-white border border-black/5 rounded-2xl overflow-hidden">
          {/* File Tab indicator */}
          <div className="bg-[#f5f5f7] border-b border-black/5 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[#1d1d1f] font-semibold">
              <FileCode className="h-4 w-4 text-[#0071e3]" />
              <span>{activeFile.name}</span>
            </div>
            <span className="text-[10px] text-slate-400 capitalize bg-white border border-black/5 px-2 py-0.5 rounded-md">
              {activeFile.language}
            </span>
          </div>

          {/* Monaco Editor viewport */}
          <div className="flex-1 min-h-[300px]">
            <Editor
              height="100%"
              language={activeFile.language}
              value={activeFile.content}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                fontFamily: 'SF Mono, Monaco, Courier New, monospace',
                lineHeight: 18,
                roundedSelection: true,
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8
                }
              }}
            />
          </div>

          {/* Console Console/Drawer */}
          <div className="border-t border-black/5 bg-[#f5f5f7] h-32 flex flex-col">
            <div className="border-b border-black/5 px-4 py-1.5 flex items-center gap-1.5 bg-[#e8e8ed] shrink-0">
              <Terminal className="h-3.5 w-3.5 text-slate-600" />
              <span className="text-[10px] font-bold text-slate-600 font-display uppercase tracking-wider">Console Output</span>
            </div>
            <div className="flex-1 p-3.5 overflow-y-auto font-mono text-[10px] text-slate-600 space-y-1 bg-white">
              {consoleLogs.map((log, i) => (
                <div key={i} className="whitespace-pre-wrap">{log}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
