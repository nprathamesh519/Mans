import { create } from 'zustand';

interface SettingsState {
  pushNotifications: boolean;
  emailSummary: boolean;
  togglePushNotifications: () => void;
  toggleEmailSummary: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  pushNotifications: true,
  emailSummary: false,
  togglePushNotifications: () => set(state => ({ pushNotifications: !state.pushNotifications })),
  toggleEmailSummary: () => set(state => ({ emailSummary: !state.emailSummary })),
}));