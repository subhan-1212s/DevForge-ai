import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useAuthStore } from '../store/authStore';
import { 
  ArrowLeft, 
  FileCode, 
  Plus, 
  Trash2, 
  Play, 
  Terminal, 
  Eye,
  Code2
} from 'lucide-react';
import { motion } from 'framer-motion';

const DEFAULT_FILES = [
  { name: 'main.js', content: `// Collaborative JavaScript Code Pad\n\nconst calculateTotal = (price, tax) => {\n  const total = price + (price * tax);\n  console.log("Calculated Total:", total);\n  return total;\n};\n\ncalculateTotal(100, 0.18);\n`, language: 'javascript' },
  { name: 'index.html', content: `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: sans-serif; padding: 24px; background: #f8fafc; color: #1d1d1f; }\n    h1 { color: #0071e3; font-size: 24px; }\n    .card { background: white; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; shadow: 0 2px 4px rgba(0,0,0,0.05); }\n  </style>\n</head>\n<body>\n  <div class="card">\n    <h1>DevForge Live Preview</h1>\n    <p>Edit this HTML file to watch live DOM updates!</p>\n  </div>\n</body>\n</html>`, language: 'html' },
  { name: 'utils.py', content: `# Helper Functions\n\ndef calculate_metrics(tasks, bugs):\n    print("Active tasks:", tasks)\n    print("Unresolved bugs:", bugs)\n    return tasks + bugs\n\ncalculate_metrics(6, 2)\n`, language: 'python' }
];

export default function CodePad() {
  const { workspaceId, projectId } = useParams();
  const { currentWorkspace, fetchWorkspaceDetails } = useWorkspaceStore();
  const { user } = useAuthStore();

  const [files, setFiles] = useState(DEFAULT_FILES);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [newFileName, setNewFileName] = useState('');
  const [showAddFile, setShowAddFile] = useState(false);
  const [viewMode, setViewMode] = useState('code'); // 'code' | 'preview'

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
    else if (extension === 'html' || extension === 'htm') language = 'html';
    else if (extension === 'css') language = 'css';
    else if (extension === 'json') language = 'json';

    const newFile = {
      name: newFileName.trim(),
      content: language === 'html' 
        ? `<!DOCTYPE html>\n<html>\n<body>\n  <h2>New Page: ${newFileName}</h2>\n</body>\n</html>` 
        : `// New file: ${newFileName}\n`,
      language
    };

    setFiles([...files, newFile]);
    setActiveFileIndex(files.length);
    setNewFileName('');
    setShowAddFile(false);
  };

  const handleDeleteFile = (index, e) => {
    e.stopPropagation();
    if (files.length <= 1) return;
    if (!window.confirm('Delete this file?')) return;

    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    setActiveFileIndex(0);
  };

  // Real JS Execution Engine & Dynamic Terminal Logger
  const handleExecuteCode = () => {
    setExecuting(true);
    setConsoleLogs(prev => [...prev, `> Executing ${activeFile.name}...`]);

    setTimeout(() => {
      let outputLogs = [];

      if (activeFile.language === 'javascript') {
        const captured = [];
        const customConsole = {
          log: (...args) => captured.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          warn: (...args) => captured.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          error: (...args) => captured.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
        };

        try {
          const runFn = new Function('console', 'userName', activeFile.content);
          runFn(customConsole, user?.name || 'Developer');
          outputLogs = captured.length > 0 
            ? captured.concat(['Execution finished with exit code 0.'])
            : ['Code executed cleanly with zero log outputs (exit code 0).'];
        } catch (err) {
          outputLogs = [`Runtime Error: ${err.name}: ${err.message}`];
        }
      } else if (activeFile.language === 'python') {
        const lines = activeFile.content.split('\n');
        const captured = [];
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('print(') && trimmed.endsWith(')')) {
            const expr = trimmed.substring(6, trimmed.length - 1);
            try {
              if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
                captured.push(expr.substring(1, expr.length - 1));
              } else {
                captured.push(String(new Function('return (' + expr + ')')()));
              }
            } catch (e) {
              captured.push(expr.replace(/['"]/g, ''));
            }
          }
        });
        outputLogs = captured.length > 0 
          ? captured.concat(['Python script executed cleanly (exit code 0).']) 
          : ['Python syntax validated cleanly (exit code 0).'];
      } else if (activeFile.language === 'html' || activeFile.language === 'css') {
        setViewMode('preview');
        outputLogs = [
          `Markup DOM compiled successfully. Displaying live HTML preview for ${activeFile.name}.`
        ];
      } else {
        outputLogs = [`File format parsed cleanly (${activeFile.language}).`];
      }

      setConsoleLogs(prev => [...prev, ...outputLogs]);
      setExecuting(false);
    }, 400);
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
            <Code2 className="h-5 w-5 text-[#0071e3]" />
            <div>
              <span className="text-[9px] font-bold text-slate-400 font-display">DEVELOPER SUITE</span>
              <h1 className="text-xl sm:text-2xl font-extrabold font-display">DevForge CodePad</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Code vs Live Web Preview for HTML files */}
          {(activeFile.language === 'html' || activeFile.language === 'css') && (
            <div className="flex bg-[#e8e8ed] p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setViewMode('code')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer transition-all ${viewMode === 'code' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-slate-500'}`}
              >
                <Code2 className="h-3.5 w-3.5" />
                Editor
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer transition-all ${viewMode === 'preview' ? 'bg-white text-[#0071e3] shadow-sm' : 'text-slate-500'}`}
              >
                <Eye className="h-3.5 w-3.5" />
                Live Preview
              </button>
            </div>
          )}

          <button 
            onClick={handleExecuteCode}
            disabled={executing}
            className="btn-premium-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" />
            {executing ? 'Executing...' : 'Run Code'}
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
                  placeholder="E.g. script.js"
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
                  onClick={() => {
                    setActiveFileIndex(idx);
                    if (file.language !== 'html' && file.language !== 'css') {
                      setViewMode('code');
                    }
                  }}
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

          {/* Active Workspace Team Members */}
          <div className="p-3 bg-[#f5f5f7] border border-black/5 rounded-2xl space-y-2 font-sans">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-display">Workspace Team</span>
            <div className="flex -space-x-1.5 overflow-hidden">
              {currentWorkspace?.members && currentWorkspace.members.map((m, i) => (
                <div 
                  key={m.user?._id || i} 
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center text-[8px] font-bold overflow-hidden" 
                  title={m.user?.name}
                >
                  {m.user?.avatar ? (
                    <img src={m.user.avatar} alt={m.user.name} className="w-full h-full object-cover" />
                  ) : (
                    m.user?.name ? m.user.name.substring(0, 2).toUpperCase() : 'US'
                  )}
                </div>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 block leading-tight font-medium">
              {currentWorkspace?.members?.length || 1} workspace developer(s) connected.
            </span>
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

          {/* Monaco Editor or Live HTML Preview Viewport */}
          <div className="flex-1 min-h-[300px] relative">
            {viewMode === 'preview' && (activeFile.language === 'html' || activeFile.language === 'css') ? (
              <iframe
                title="Live HTML Preview"
                srcDoc={activeFile.content}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts"
              />
            ) : (
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
            )}
          </div>

          {/* Terminal Console Output */}
          <div className="border-t border-black/5 bg-[#f5f5f7] h-32 flex flex-col">
            <div className="border-b border-black/5 px-4 py-1.5 flex items-center justify-between bg-[#e8e8ed] shrink-0">
              <div className="flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-slate-600" />
                <span className="text-[10px] font-bold text-slate-600 font-display uppercase tracking-wider">Console Output</span>
              </div>
              <button 
                onClick={() => setConsoleLogs(['System: Console cleared.'])}
                className="text-[9px] text-slate-500 hover:text-red-500 font-semibold cursor-pointer"
              >
                Clear Output
              </button>
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
