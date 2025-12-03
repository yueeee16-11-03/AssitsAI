import { create } from 'zustand';
import NotificationApi from '../api/notificationApi';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,
  lastSync: null,
  _unsubscribe: null,

  setNotifications: (items) => set({ notifications: items }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (err) => set({ error: err }),

  initialize: async (limit = 200) => {
    if (get()._unsubscribe) return; // already subscribed
    set({ isLoading: true, error: null });
    try {
      const unsub = NotificationApi.subscribe(rawItems => {
        const items = rawItems.map(d => {
          const createdAt = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : new Date());
          return {
            id: d.id,
            type: d.type || 'reminder',
            title: d.title || '',
            message: d.message || d.body || '',
            timestamp: createdAt,
            read: !!d.read,
            icon: d.icon || 'bell-outline',
            color: d.color || '#10B981',
            actionRoute: d.actionRoute || undefined,
          };
        });
        set({ notifications: items, isLoading: false, lastSync: new Date().toISOString() });
      }, limit);

      set({ _unsubscribe: unsub });
      return unsub;
    } catch (e) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  cleanup: () => {
    const u = get()._unsubscribe;
    if (u) {
      try { u(); } catch (e) { /* ignore */ }
      set({ _unsubscribe: null });
    }
  },

  createNotification: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await NotificationApi.createNotification(payload);
      set({ isLoading: false, lastSync: new Date().toISOString() });
      return res;
    } catch (e) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  markAsRead: async (id) => {
    try {
      await NotificationApi.markAsRead(id);
      set(state => ({ notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n) }));
    } catch (e) {
      set({ error: e.message });
      throw e;
    }
  },

  markAllRead: async () => {
    try {
      await NotificationApi.markAllRead();
      set(state => ({ notifications: state.notifications.map(n => ({ ...n, read: true })) }));
    } catch (e) {
      set({ error: e.message });
      throw e;
    }
  },

  deleteNotification: async (id) => {
    try {
      await NotificationApi.deleteNotification(id);
      set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }));
    } catch (e) {
      set({ error: e.message });
      throw e;
    }
  }
}));

export default useNotificationStore;
