import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { socket } from '../services/socket';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { usePresenceStore } from '../store/presenceStore';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, MessageSquare, User as UserIcon, Smile } from 'lucide-react';

export default function ProjectChat() {
  const { workspaceId, projectId } = useParams();
  const { user } = useAuthStore();
  const { currentWorkspace, fetchWorkspaceDetails } = useWorkspaceStore();
  const { isUserOnline } = usePresenceStore();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const userRef = useRef(user);

  // Keep userRef updated without re-triggering socket room re-subscriptions
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const fetchMessages = async () => {
    try {
      const { data } = await api.get(`/messages?workspaceId=${workspaceId}&projectId=${projectId}`);
      setMessages(data.messages || []);
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

    // Helper to join room when socket is connected
    const joinRoom = () => {
      if (socket.connected) {
        if (projectId) {
          socket.emit('join_project', projectId);
        } else if (workspaceId) {
          socket.emit('join_workspace', workspaceId);
        }
      }
    };

    // Socket Connection Setup
    if (!socket.connected) {
      socket.connect();
    } else {
      joinRoom();
    }

    socket.on('connect', joinRoom);

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => {
        // If message with same _id already exists, return prev
        if (prev.some((m) => m._id === msg._id)) return prev;

        // Check if this incoming socket message replaces an optimistic temp message from me
        const currentUser = userRef.current;
        const currentUserId = (currentUser?.id || currentUser?._id || '').toString();
        const msgSenderId = (msg.sender?._id || msg.sender || '').toString();

        if (msgSenderId && currentUserId && msgSenderId === currentUserId) {
          const tempIdx = prev.findIndex((m) => m.isOptimistic && m.text === msg.text);
          if (tempIdx !== -1) {
            const updated = [...prev];
            updated[tempIdx] = msg;
            return updated;
          }
        }

        return [...prev, msg];
      });
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('receive_message', handleReceiveMessage);
      if (projectId) {
        socket.emit('leave_project', projectId);
      } else if (workspaceId) {
        socket.emit('leave_workspace', workspaceId);
      }
    };
  }, [workspaceId, projectId]);

  // Scroll to bottom whenever messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const currentText = inputText.trim();
    setInputText('');

    // Instant optimistic update for 0ms latency display
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const tempMsg = {
      _id: tempId,
      text: currentText,
      workspaceId,
      projectId,
      sender: user ? {
        _id: user.id || user._id,
        name: user.name || 'You',
        avatar: user.avatar,
        email: user.email
      } : { _id: 'me', name: 'You' },
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      // Send via HTTP API (Saves to DB and server broadcasts socket event to room)
      const { data } = await api.post('/messages', {
        text: currentText,
        workspaceId,
        projectId
      });

      if (data.success && data.message) {
        setMessages((prev) => {
          const tempIdx = prev.findIndex((m) => m._id === tempId);
          if (tempIdx !== -1) {
            const updated = [...prev];
            updated[tempIdx] = data.message;
            return updated;
          }
          if (prev.some((m) => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });
      }
    } catch (err) {
      console.error('Failed to send chat message:', err);
      // Remove failed optimistic message
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setError('Failed to send message. Please try again.');
    }
  };

  const userId = (user?.id || user?._id || '').toString();

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
            const senderId = (msg.sender?._id || msg.sender?.id || msg.sender || '').toString();
            const isMe = userId && senderId && userId === senderId;
            const isOnline = isUserOnline(senderId);
            return (
              <div 
                key={msg._id || i}
                className={`flex gap-3 max-w-[75%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* User avatar */}
                <div className="relative shrink-0">
                  <div className="w-7 h-7 rounded-full bg-slate-200 border border-black/5 flex items-center justify-center font-bold text-[10px] text-slate-600 overflow-hidden shrink-0">
                    {msg.sender?.avatar ? (
                      <img src={msg.sender.avatar} alt="Sender avatar" className="w-full h-full object-cover" />
                    ) : (
                      msg.sender?.name ? msg.sender.name.substring(0, 2).toUpperCase() : 'US'
                    )}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                </div>

                {/* Message bubble */}
                <div>
                  <div className={`flex items-center gap-1.5 text-[9px] text-slate-400 mb-0.5 ${isMe ? 'justify-end' : ''}`}>
                    <span className="font-semibold text-slate-600">{msg.sender?.name || (isMe ? (user?.name || 'You') : 'Team Member')}</span>
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
