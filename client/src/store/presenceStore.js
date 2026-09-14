import { create } from 'zustand';
import { socket } from '../services/socket';

export const usePresenceStore = create((set, get) => ({
  onlineUserIds: new Set(),

  initPresence: () => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('get_online_users');

    const handleUsersList = (userIds) => {
      if (Array.isArray(userIds)) {
        set({ onlineUserIds: new Set(userIds.map(id => id.toString())) });
      }
    };

    const handlePresenceChange = ({ userId, isOnline, onlineUserIds }) => {
      if (onlineUserIds && Array.isArray(onlineUserIds)) {
        set({ onlineUserIds: new Set(onlineUserIds.map(id => id.toString())) });
      } else {
        set((state) => {
          const nextSet = new Set(state.onlineUserIds);
          const strId = (userId || '').toString();
          if (strId) {
            if (isOnline) {
              nextSet.add(strId);
            } else {
              nextSet.delete(strId);
            }
          }
          return { onlineUserIds: nextSet };
        });
      }
    };

    socket.on('online_users_list', handleUsersList);
    socket.on('user_presence_change', handlePresenceChange);
  },

  isUserOnline: (userId) => {
    if (!userId) return false;
    const strId = (userId._id || userId.id || userId).toString();
    return get().onlineUserIds.has(strId);
  }
}));
