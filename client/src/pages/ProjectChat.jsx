import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { socket } from '../services/socket';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, MessageSquare, User as UserIcon, Smile } from 'lucide-react';

export default function ProjectChat() {
  const { workspaceId, projectId } = useParams();
  const { user } = useAuthStore();
  const { currentWorkspace, fetchWorkspaceDetails } = useWorkspaceStore();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const { data } = await api.get(`/messages?workspaceId=${workspaceId}&projectId=${projectId}`);
      setMessages(data.messages);
    } catch (err) {
      setError('Failed to load chat logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentWorkspace) {
      fetchWorkspaceDetails(workspaceId);
    }
    fetchMessages();

    // Socket Connection
    socket.connect();
    socket.emit('join_project', projectId);

    // Socket message event listener
    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.emit('leave_project', projectId);
      socket.disconnect();
    };
  }, [workspaceId, projectId]);

  // Scroll to bottom whenever messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Send via socket connection
    socket.emit('send_message', {
      text: inputText,
      workspaceId,
      projectId,
      senderId: user.id
    });

    setInputText('');
  };

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col bg-white border border-black/5 rounded-2xl shadow-sm overflow-hidden font-sans text-[#1d1d1f]">
      {/* Chat Header */}
      <div className="p-4 border-b border-black/5 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
          <Link 
            to={`/workspace/${workspaceId}/project/${projectId}`}
            className="p-2 rounded-lg bg-[#f5f5f7] border border-black/5 hover:bg-slate-200 text-slate-600 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#0071e3]" />
            <div>
              <h2 className="text-sm font-bold font-display leading-tight">Project Collaboration Chat</h2>
              <p className="text-[10px] text-slate-400">Real-time team synchronization channel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Scroll viewport */}
      <div className="flex-1 p-6 overflow-y-auto bg-[#f5f5f7]/40 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender?._id === user.id || msg.sender === user.id;
            return (
              <div 
                key={msg._id || i}
                className={`flex gap-3 max-w-[75%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* User avatar */}
                <div className="w-7 h-7 rounded-full bg-slate-200 border border-black/5 flex items-center justify-center font-bold text-[10px] text-slate-600 overflow-hidden shrink-0">
                  {msg.sender?.avatar ? (
                    <img src={msg.sender.avatar} alt="Sender avatar" className="w-full h-full object-cover" />
                  ) : (
                    msg.sender?.name ? msg.sender.name.substring(0, 2).toUpperCase() : 'US'
                  )}
                </div>

                {/* Message bubble */}
                <div>
                  <div className={`flex items-center gap-1.5 text-[9px] text-slate-400 mb-0.5 ${isMe ? 'justify-end' : ''}`}>
                    <span className="font-semibold text-slate-600">{msg.sender?.name || 'Developer'}</span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-sm border ${isMe ? 'bg-[#0071e3] text-white border-transparent rounded-tr-none' : 'bg-white text-[#1d1d1f] border-black/5 rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-2">
            <MessageSquare className="h-8 w-8 text-slate-300" />
            <p className="text-xs font-semibold">No messages in this project channel yet</p>
            <p className="text-[10px] max-w-xs">Be the first to send a message to start syncing with your team developers.</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Panel */}
      <form onSubmit={handleSend} className="p-4 border-t border-black/5 flex gap-2.5 items-center bg-white shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Message project channel..."
          className="glass-input flex-1 p-3 text-xs"
        />
        <button 
          type="submit" 
          disabled={!inputText.trim()}
          className="btn-premium-primary p-3 rounded-lg text-white disabled:opacity-50 cursor-pointer"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
