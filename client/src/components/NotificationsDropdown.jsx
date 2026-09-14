import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../services/socket';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { usePresenceStore } from '../store/presenceStore';
import { 
  Bell, 
  Check, 
  Trash2, 
  ClipboardList, 
  MessageSquare, 
  AlertOctagon, 
  Layers, 
  BookOpen, 
  X, 
  Search, 
  ExternalLink,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationsDropdown() {
  const { user } = useAuthStore();
  const { initPresence } = usePresenceStore();

  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [showSeeAllModal, setShowSeeAllModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'unread' | 'tasks' | 'bugs'

  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    initPresence();

    // Register user private socket room
    if (user) {
      if (!socket.connected) {
        socket.connect();
      }
      const userIdStr = (user.id || user._id || '').toString();
      socket.emit('join_user', userIdStr);

      // Listen for real-time incoming notification alerts
      const handleNotificationReceived = (notification) => {
        setNotifications((prev) => [notification, ...prev]);
      };

      socket.on('notification_received', handleNotificationReceived);

      return () => {
        socket.off('notification_received', handleNotificationReceived);
      };
    }
  }, [user, initPresence]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all notifications?')) return;
    try {
      await api.delete('/notifications');
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'task_assigned':
      case 'task_created':
      case 'task_updated':
        return <ClipboardList className="h-4 w-4 text-[#0071e3]" />;
      case 'bug_logged':
      case 'bug_updated':
        return <AlertOctagon className="h-4 w-4 text-red-500" />;
      case 'project_updated':
        return <Layers className="h-4 w-4 text-emerald-500" />;
      case 'comment_added':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  const filteredNotificationsModal = notifications.filter(n => {
    const matchesSearch = modalSearch.trim() === '' || 
      n.message?.toLowerCase().includes(modalSearch.toLowerCase()) ||
      n.sender?.name?.toLowerCase().includes(modalSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'unread') return !n.read;
    if (filterType === 'tasks') return n.type?.includes('task');
    if (filterType === 'bugs') return n.type?.includes('bug');
    return true;
  });

  return (
    <div className="relative font-sans text-[#1d1d1f]" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button 
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg bg-[#f5f5f7] border border-black/5 hover:bg-[#e8e8ed] transition-colors cursor-pointer"
        title="Notifications"
      >
        <Bell className="h-4.5 w-4.5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#0071e3] text-[9px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-84 bg-white border border-black/10 rounded-2xl shadow-premium-lg z-50 overflow-hidden"
          >
            {/* Popover Header */}
            <div className="p-3.5 border-b border-black/5 flex items-center justify-between bg-white">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold font-display">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[9px] font-bold bg-[#0071e3]/10 text-[#0071e3] px-1.5 py-0.2 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-[#0071e3] font-semibold hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    title="Clear all"
                    className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Notification Popover List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-black/5 bg-[#f5f5f7]/30">
              {notifications.slice(0, 5).map((n) => (
                <div 
                  key={n._id} 
                  className={`p-3 flex items-start gap-2.5 hover:bg-[#f5f5f7] transition-colors relative group cursor-pointer ${!n.read ? 'bg-white font-medium' : ''}`}
                  onClick={() => handleMarkAsRead(n._id)}
                >
                  {!n.read && (
                    <div className="absolute left-1.5 top-[18px] w-1.5 h-1.5 bg-[#0071e3] rounded-full" />
                  )}

                  <div className="p-1.5 rounded-lg bg-[#f5f5f7] border border-black/5 shrink-0 mt-0.5 ml-1">
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <p className="text-[11px] text-[#1d1d1f] leading-snug">
                      <span className="font-semibold">{n.sender?.name || 'System'}</span> {n.message}
                    </p>
                    <span className="text-[8px] text-slate-400 block mt-1">
                      {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteNotification(e, n._id)}
                    title="Delete notification"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                  <Bell className="h-6 w-6 text-slate-300 mx-auto" />
                  <span>No notifications yet</span>
                </div>
              )}
            </div>

            {/* See All Button */}
            <div className="p-2.5 border-t border-black/5 bg-white text-center">
              <button
                onClick={() => {
                  setOpen(false);
                  setShowSeeAllModal(true);
                }}
                className="w-full py-1.5 text-xs font-bold text-[#0071e3] hover:bg-[#0071e3]/5 rounded-lg transition-colors cursor-pointer"
              >
                See All Notifications ({notifications.length})
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL NOTIFICATIONS MODAL */}
      {showSeeAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-white rounded-2xl border border-black/10 shadow-premium-lg overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-black/5 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#0071e3]/10 text-[#0071e3]">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1d1d1f] font-display leading-tight">Activity Notifications Center</h2>
                  <p className="text-xs text-slate-400">All real-time team changes, ticket updates, and system alerts</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete All
                  </button>
                )}
                <button
                  onClick={() => setShowSeeAllModal(false)}
                  className="p-2 rounded-lg bg-[#f5f5f7] hover:bg-slate-200 text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-black/5 bg-[#f5f5f7]/50 flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
              <div className="relative flex-1 w-full">
                <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Search notifications or sender name..."
                  className="glass-input pl-9 pr-3 py-2 text-xs w-full"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${filterType === 'all' ? 'bg-[#0071e3] text-white' : 'bg-white text-slate-600 border border-black/5'}`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilterType('unread')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${filterType === 'unread' ? 'bg-[#0071e3] text-white' : 'bg-white text-slate-600 border border-black/5'}`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  onClick={() => setFilterType('tasks')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${filterType === 'tasks' ? 'bg-[#0071e3] text-white' : 'bg-white text-slate-600 border border-black/5'}`}
                >
                  Tasks
                </button>
                <button
                  onClick={() => setFilterType('bugs')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${filterType === 'bugs' ? 'bg-[#0071e3] text-white' : 'bg-white text-slate-600 border border-black/5'}`}
                >
                  Bugs
                </button>
              </div>
            </div>

            {/* Modal List View */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f5f5f7]/20">
              {filteredNotificationsModal.map((n) => (
                <div 
                  key={n._id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${!n.read ? 'bg-white border-[#0071e3]/30 shadow-sm' : 'bg-white/80 border-black/5'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#f5f5f7] border border-black/5 flex items-center justify-center shrink-0 mt-0.5">
                      {n.sender?.avatar ? (
                        <img src={n.sender.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        getIcon(n.type)
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1d1d1f]">{n.sender?.name || 'System User'}</span>
                        <span className="text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          {n.type?.replace(/_/g, ' ')}
                        </span>
                        {!n.read && (
                          <span className="text-[9px] font-bold bg-[#0071e3]/10 text-[#0071e3] px-2 py-0.5 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1.5 block">
                        {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!n.read && (
                      <button
                        onClick={() => handleMarkAsRead(n._id)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteNotification(e, n._id)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredNotificationsModal.length === 0 && (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Bell className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold">No notifications match your search</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
