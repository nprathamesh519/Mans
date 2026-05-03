import { create } from 'zustand';
import { Reminder } from '../types';
import { addReminderApi, getRemindersApi, updateReminderApi } from '../src/api/reminderApi';

interface ReminderState {
  reminders: Reminder[];
  fetchReminders: () => Promise<void>;
  addReminder: (data: Omit<Reminder, 'id'>) => Promise<void>;
  markAsCompleted: (id: string) => Promise<void>;
  markAsNotified: (id: string) => Promise<void>;
  getDueReminder: () => Reminder | undefined;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],

  fetchReminders: async () => {
    try {
      const data = await getRemindersApi();

      // ✅ IMPORTANT FIX
      if (Array.isArray(data)) {
        set({ reminders: data });
      } else {
        console.error("Invalid reminders response:", data);
        set({ reminders: [] });
      }

    } catch (err) {
      console.error("Fetch reminders error:", err);
      set({ reminders: [] }); // ✅ prevent crash
    }
  },

  addReminder: async (data) => {
    try {
      const newReminder = await addReminderApi(data);
      set(state => ({
        reminders: [...state.reminders, newReminder]
      }));
    } catch (err) {
      console.error("Add reminder error:", err);
    }
  },

  markAsCompleted: async (id) => {
    try {
      await updateReminderApi(id, { isCompleted: true, notified: true });
      // Update local state immediately
      set(state => ({
        reminders: state.reminders.map(r =>
          r.id === id ? { ...r, isCompleted: true, notified: true } : r
        )
      }));
      // Re-fetch to sync with Firestore
      const data = await getRemindersApi();
      if (Array.isArray(data)) set({ reminders: data });
    } catch (err) {
      console.error('Mark completed error:', err);
    }
  },

  markAsNotified: async (id) => {
    try {
      await updateReminderApi(id, { notified: true });
      set(state => ({
        reminders: state.reminders.map(r =>
          r.id === id ? { ...r, notified: true } : r
        )
      }));
    } catch (err) {
      console.error("Notify error:", err);
    }
  },

  getDueReminder: () => {
    const now = Date.now();
    return get().reminders.find(r => {
      if (r.isCompleted || r.notified) return false;
      const diff = now - new Date(r.time).getTime();
      return diff >= 0 && diff <= 60_000;
    });
  },
}));