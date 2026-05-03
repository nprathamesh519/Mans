import React, { useEffect } from 'react';
import { useAlertStore } from '../store/alertStore';

const AlertsPage: React.FC = () => {
  const { alerts, fetchAlerts, markAsRead } = useAlertStore();

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Security Alerts</h1>
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <p className="text-center text-gray-400 py-10">No alerts yet</p>
        ) : (
          alerts.map(a => (
            <div key={a.id} className={`p-4 rounded-xl border ${a.isRead ? 'bg-white opacity-60' : 'bg-red-50 border-red-200'}`}>
              <p className="font-bold">{a.type === 'SOS' ? 'EMERGENCY SOS' : 'Safe Zone Exit'}</p>
              <p className="text-sm">{a.message}</p>
              <p className="text-xs text-brand-text-light mt-1">{new Date(a.timestamp).toLocaleString()}</p>
              {!a.isRead && (
                <button onClick={() => markAsRead(a.id)} className="mt-2 text-xs font-bold text-brand-primary">
                  Mark as seen
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
