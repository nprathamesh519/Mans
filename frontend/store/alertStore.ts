import { create } from 'zustand';
import { Alert } from '../types';
import { useAuthStore } from './authStore';
import { addAlertDoc, updateAlertDoc } from '../src/api/apiClient';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const getToken = () => localStorage.getItem('token');

interface AlertState {
  alerts: Alert[];
  fetchAlerts: () => Promise<void>;
  addAlert: (alertData: Omit<Alert, 'id' | 'timestamp' | 'isRead'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],

  fetchAlerts: async () => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return;
      const targetId = user.role === 'patient' ? user.id : user.patientId;
      if (!targetId) return;
      const res = await fetch(`${BASE_URL}/alerts?ownerId=${targetId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) set({ alerts: data });
    } catch {
      set({ alerts: [] });
    }
  },

  addAlert: async (alertData) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return;
      const targetId = user.role === 'patient' ? user.id : user.patientId!;
      await addAlertDoc({ ...alertData, ownerId: targetId });
      get().fetchAlerts();
    } catch (err) {
      console.error('Add alert error:', err);
    }
  },

  markAsRead: async (id) => {
    try {
      await updateAlertDoc(id, { isRead: true });
      set(state => ({
        alerts: state.alerts.map(a => a.id === id ? { ...a, isRead: true } : a)
      }));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  },

  markAllAsRead: async () => {
    try {
      const alerts = get().alerts;
      await Promise.all(alerts.filter(a => !a.isRead).map(a => updateAlertDoc(a.id, { isRead: true })));
      set(state => ({ alerts: state.alerts.map(a => ({ ...a, isRead: true })) }));
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  },
}));
