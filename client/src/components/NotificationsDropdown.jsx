import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../services/socket';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Bell, Check, Trash2, Calendar, ClipboardList, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationsDropdown() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Register user private socket room
    if (user) {
      socket.connect();
      socket.emit('join_user', user.id);

      // Listen for incoming alerts
      socket.on('notification_received', (notification) => {
        setNotifications((prev) => [notification, ...prev]);
      });
    }

    // Close on click outside
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (user) {
        socket.disconnect();
      }
    };
  }, [user]);

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

  const getIcon = (type) => {
    switch (type) {
      case 'task_assigned':
        return <ClipboardList className="h-4 w-4 text-[#0071e3]" />;
      case 'comment_added':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative font-sans text-[#1d1d1f]" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button 
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg bg-[#f5f5f7] border border-black/5 hover:bg-[#e8e8ed] transition-colors cursor-pointer"
      >
        <Bell className="h-4.5 w-4.5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#0071e3] text-[9px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover list */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-80 bg-white border border-black/10 rounded-2xl shadow-premium-lg z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-3.5 border-b border-black/5 flex items-center justify-between bg-white">
              <span className="text-xs font-bold font-display">Notifications</span>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllRead}
                  className="text-[10px] text-[#0071e3] font-semibold hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-black/5 bg-[#f5f5f7]/30">
              {notifications.map((n) => (
                <div 
                  key={n._id} 
                  className={`p-3 flex items-start gap-2.5 hover:bg-[#f5f5f7] transition-colors relative cursor-pointer ${!n.read ? 'bg-white font-medium' : ''}`}
                  onClick={() => handleMarkAsRead(n._id)}
                >
                  {/* Read indicator dot */}
                  {!n.read && (
                    <div className="absolute left-1.5 top-[18px] w-1.5 h-1.5 bg-[#0071e3] rounded-full" />
                  )}

                  {/* Icon */}
                  <div className="p-1.5 rounded-lg bg-[#f5f5f7] border border-black/5 shrink-0 mt-0.5 ml-1">
                    {getIcon(n.type)}
                  </div>

                  {/* Message body */}
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[11px] text-[#1d1d1f] leading-snug">
                      <span className="font-semibold">{n.sender?.name || 'System'}</span> {n.message}
                    </p>
                    <span className="text-[8px] text-slate-400 block mt-1">
                      {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  <Bell className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                  <span>No notifications yet</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
