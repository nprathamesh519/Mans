import React from 'react';
import { useSettingsStore } from '../store/settingsStore';

const SettingsPage: React.FC = () => {
  const { pushNotifications, emailSummary, togglePushNotifications, toggleEmailSummary } = useSettingsStore();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">App Settings</h1>
      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <label className="font-medium">Push Notifications</label>
          <input type="checkbox" checked={pushNotifications} onChange={togglePushNotifications} className="w-6 h-6" />
        </div>
        <div className="flex items-center justify-between">
          <label className="font-medium">Daily Email Summary</label>
          <input type="checkbox" checked={emailSummary} onChange={toggleEmailSummary} className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
export default SettingsPage;