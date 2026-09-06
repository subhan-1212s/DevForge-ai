import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  ArrowLeft, 
  Sparkles, 
  Code, 
  Cpu, 
  Terminal, 
  GitBranch, 
  MessageSquare,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AiSuite() {
  const { workspaceId, projectId } = useParams();

  const [activeTab, setActiveTab] = useState('optimize');
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  
  // Results states
  const [optimizerResult, setOptimizerResult] = useState(null);
  const [reviewerResult, setReviewerResult] = useState(null);
  const [bugResult, setBugResult] = useState(null);
  const [commitResult, setCommitResult] = useState(null);
  const [assistantLogs, setAssistantLogs] = useState([
    { sender: 'ai', text: 'Hi! I am your DevForge Workspace Assistant. Ask me to explain bugs, optimize code, review PRs, or check project milestones.' }
  ]);

  const handleRunAI = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    try {
      if (activeTab === 'optimize') {
        const { data } = await api.post('/ai/optimize', { code: inputText });
        setOptimizerResult(data.result);
      } else if (activeTab === 'review') {
        const { data } = await api.post('/ai/review', { code: inputText });
        setReviewerResult(data.result);
      } else if (activeTab === 'bug') {
        const { data } = await api.post('/ai/explain-bug', { errorLog: inputText });
        setBugResult(data.result);
      } else if (activeTab === 'commit') {
        const { data } = await api.post('/ai/commit', { diff: inputText });
        setCommitResult(data.result);
      } else if (activeTab === 'chat') {
        const userMsg = { sender: 'user', text: inputText };
        setAssistantLogs(prev => [...prev, userMsg]);
        const currentInput = inputText;
        setInputText('');

        const { data } = await api.post('/ai/assistant', { query: currentInput });
        setAssistantLogs(prev => [...prev, { sender: 'ai', text: data.response }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setInputText('');
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
            <Sparkles className="h-5 w-5 text-[#0071e3]" />
            <div>
              <span className="text-[9px] font-bold text-slate-400 font-display">INTELLIGENCE SERVICES</span>
              <h1 className="text-xl sm:text-2xl font-extrabold font-display">AI Developer Suite</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-black/5 gap-6 text-xs font-semibold overflow-x-auto pb-1 shrink-0">
        <button
          onClick={() => handleTabChange('optimize')}
          className={`flex items-center gap-1.5 pb-2.5 px-1 border-b-2 cursor-pointer transition-all ${activeTab === 'optimize' ? 'border-[#0071e3] text-[#0071e3]' : 'border-transparent text-slate-400'}`}
        >
          <Cpu className="h-4.5 w-4.5" />
          Code Optimizer
        </button>
        <button
          onClick={() => handleTabChange('review')}
          className={`flex items-center gap-1.5 pb-2.5 px-1 border-b-2 cursor-pointer transition-all ${activeTab === 'review' ? 'border-[#0071e3] text-[#0071e3]' : 'border-transparent text-slate-400'}`}
        >
          <Code className="h-4.5 w-4.5" />
          Code Reviewer
        </button>
        <button
          onClick={() => handleTabChange('bug')}
          className={`flex items-center gap-1.5 pb-2.5 px-1 border-b-2 cursor-pointer transition-all ${activeTab === 'bug' ? 'border-[#0071e3] text-[#0071e3]' : 'border-transparent text-slate-400'}`}
        >
          <Terminal className="h-4.5 w-4.5" />
          Bug Explainer
        </button>
        <button
          onClick={() => handleTabChange('commit')}
          className={`flex items-center gap-1.5 pb-2.5 px-1 border-b-2 cursor-pointer transition-all ${activeTab === 'commit' ? 'border-[#0071e3] text-[#0071e3]' : 'border-transparent text-slate-400'}`}
        >
          <GitBranch className="h-4.5 w-4.5" />
          Commit Builder
        </button>
        <button
          onClick={() => handleTabChange('chat')}
          className={`flex items-center gap-1.5 pb-2.5 px-1 border-b-2 cursor-pointer transition-all ${activeTab === 'chat' ? 'border-[#0071e3] text-[#0071e3]' : 'border-transparent text-slate-400'}`}
        >
          <MessageSquare className="h-4.5 w-4.5" />
          Workspace Assistant
        </button>
      </div>

      {/* Grid: Inputs & Results Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Side: Inputs */}
        <div className="bg-white border border-black/5 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <form onSubmit={handleRunAI} className="flex-1 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-bold text-[#1d1d1f] font-display uppercase tracking-wider mb-2">
                {activeTab === 'optimize' && 'Paste code to optimize'}
                {activeTab === 'review' && 'Paste code to review'}
                {activeTab === 'bug' && 'Paste error log / stack trace'}
                {activeTab === 'commit' && 'Paste git diff report'}
                {activeTab === 'chat' && 'Query your Workspace Assistant'}
              </h3>
              
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                required={activeTab !== 'chat'}
                rows={10}
                placeholder={
                  activeTab === 'optimize' ? '// Write code here...\nfunction add(a, b) {\n  var total = a+b;\n  return total;\n}' :
                  activeTab === 'review' ? '// Paste file contents here...' :
                  activeTab === 'bug' ? 'TypeError: Cannot read properties of undefined (reading "map")\n  at project/dashboard line 42' :
                  activeTab === 'commit' ? 'diff --git a/server.js b/server.js\n- console.log("running")\n+ server.listen(PORT)' :
                  'Ask me: "Summarize sprint work", "Do I have pending tasks?", or "Search for bugs"...'
                }
                className="glass-input w-full p-3 font-mono text-xs resize-none flex-1 min-h-[220px]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-premium-primary w-full py-3.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating answers...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Run AI Processor
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Processed Output */}
        <div className="bg-white border border-black/5 rounded-2xl p-6 flex flex-col overflow-y-auto max-h-[500px]">
          <h3 className="text-xs font-bold text-[#1d1d1f] font-display uppercase tracking-wider mb-4 border-b border-black/5 pb-2">
            AI Generated Report
          </h3>

          <div className="flex-1 space-y-4">
            {/* 1. Optimize Tab */}
            {activeTab === 'optimize' && optimizerResult && (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Optimized Syntax</span>
                  <pre className="p-3 bg-slate-50 border border-slate-200 font-mono text-[10px] text-[#0071e3] rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {optimizerResult.optimizedCode}
                  </pre>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Complexity Shifts</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#f5f5f7] p-2.5 rounded-xl border border-black/5 text-center">
                      <span className="text-[9px] text-slate-400 block font-semibold">BEFORE</span>
                      <span className="font-mono text-red-500 font-bold text-[10px]">{optimizerResult.complexityBefore}</span>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-center">
                      <span className="text-[9px] text-emerald-600 block font-bold">AFTER</span>
                      <span className="font-mono text-emerald-600 font-bold text-[10px]">{optimizerResult.complexityAfter}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Optimization Notes</span>
                  <div className="bg-[#f5f5f7] p-3 rounded-xl border border-black/5 leading-relaxed whitespace-pre-wrap">
                    {optimizerResult.explanation}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Review Tab */}
            {activeTab === 'review' && reviewerResult && (
              <div className="space-y-4 text-xs">
                <div className="bg-[#f5f5f7] p-3 rounded-xl border border-black/5 leading-relaxed">
                  <span className="font-bold text-[#1d1d1f] font-display block mb-1.5">Executive Summary</span>
                  <p className="text-slate-600">{reviewerResult.summary}</p>
                </div>
                
                {/* Bugs */}
                {reviewerResult.bugs.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" /> Code Smells / Security Flags
                    </span>
                    {reviewerResult.bugs.map((bug, i) => (
                      <div key={i} className="p-3 bg-red-50/50 border border-red-100 rounded-xl space-y-1">
                        <p className="font-semibold text-slate-700 leading-snug">{bug.description}</p>
                        <p className="text-[10px] text-slate-500"><span className="font-bold text-slate-600">Suggested Fix:</span> {bug.fix}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. Bug Explanation Tab */}
            {activeTab === 'bug' && bugResult && (
              <div className="space-y-4 text-xs leading-relaxed">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Potential Cause</span>
                  <p className="p-3 bg-red-50/30 border border-red-100 text-slate-600 rounded-xl">{bugResult.cause}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Recommended Fix</span>
                  <p className="p-3 bg-[#f5f5f7] border border-black/5 text-slate-600 rounded-xl font-mono">{bugResult.fix}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Best Practices Prevention</span>
                  <div className="p-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl whitespace-pre-wrap">
                    {bugResult.prevention}
                  </div>
                </div>
              </div>
            )}

            {/* 4. Commit Builder Tab */}
            {activeTab === 'commit' && commitResult && (
              <div className="space-y-3 text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">Standard Commit Message Log</span>
                <pre className="p-3 bg-[#f5f5f7] border border-black/5 font-mono text-[10px] text-slate-700 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {commitResult.commitMessage}
                </pre>
              </div>
            )}

            {/* 5. Chat Assistant Tab */}
            {activeTab === 'chat' && (
              <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                {assistantLogs.map((log, i) => {
                  const isAi = log.sender === 'ai';
                  return (
                    <div 
                      key={i} 
                      className={`flex gap-2.5 max-w-[85%] ${!isAi ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      <div className={`w-6.5 h-6.5 rounded-full border border-black/5 flex items-center justify-center font-bold text-[9px] shrink-0 overflow-hidden ${isAi ? 'bg-indigo-50 text-[#0071e3]' : 'bg-slate-200 text-slate-700'}`}>
                        {isAi ? 'AI' : 'ME'}
                      </div>
                      <div className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-sm border ${isAi ? 'bg-white text-[#1d1d1f] border-black/5 rounded-tl-none' : 'bg-[#0071e3] text-white border-transparent rounded-tr-none'}`}>
                        {log.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty view */}
            {!optimizerResult && !reviewerResult && !bugResult && !commitResult && activeTab !== 'chat' && (
              <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center text-slate-400 space-y-2">
                <Sparkles className="h-6 w-6 text-slate-300 animate-pulse" />
                <span className="text-xs">Awaiting input snippet...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
