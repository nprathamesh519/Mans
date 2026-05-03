import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import LucidiaAssistant from '../LucidiaAssistant';
import ReminderScheduler from '../ReminderScheduler';
import { useGpsStore, isOutsideZone } from '../../store/gpsStore';
import { useAlertStore } from '../../store/alertStore';
import { useReminderStore } from '../../store/reminderStore';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { BellIcon, BellAlertIcon, XMarkIcon } from '../icons/Icons';
import { speak } from '../../utils/helpers';

interface MainLayoutProps { children: React.ReactNode; }

interface PopupNotif {
  id: string;
  message: string;
  type: 'sos' | 'reminder' | 'info';
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<PopupNotif[]>([]);

  const { patientLocation, safeZones, updatePatientLocation } = useGpsStore();
  const { alerts, fetchAlerts, addAlert } = useAlertStore();
  const { reminders, fetchReminders } = useReminderStore();
  const { user } = useAuthStore();

  const wasOutsideRef    = useRef<Set<string>>(new Set());
  const seenAlertIds     = useRef<Set<string>>(new Set());
  const seenReminderIds  = useRef<Set<string>>(new Set());

  const addNotif = (notif: Omit<PopupNotif, 'id'>) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { ...notif, id }]);
    setTimeout(() => removeNotif(id), 8000);
  };

  const removeNotif = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // ── GPS safe zone simulation ──────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const newLat = patientLocation.location.lat + (Math.random() - 0.5) * 0.0005;
      const newLng = patientLocation.location.lng + (Math.random() - 0.5) * 0.0005;
      updatePatientLocation({ lat: newLat, lng: newLng });
      const currentLoc = { lat: newLat, lng: newLng };
      safeZones.forEach(zone => {
        const outside = isOutsideZone(currentLoc, zone);
        const wasOutside = wasOutsideRef.current.has(zone.id);
        if (outside && !wasOutside) {
          addAlert({ type: 'SafeZoneExit', message: `Patient has left the "${zone.name}" area.` });
          wasOutsideRef.current.add(zone.id);
        } else if (!outside && wasOutside) {
          wasOutsideRef.current.delete(zone.id);
        }
      });
    }, 10000);
    return () => clearInterval(id);
  }, [patientLocation, safeZones, updatePatientLocation, addAlert]);

  // ── CARETAKER: Poll alerts every 5s, popup on new SOS ────────────────────
  useEffect(() => {
    if (user?.role !== 'caretaker') return;

    // Seed seen IDs on first load so we don't popup old alerts
    const seed = () => {
      useAlertStore.getState().alerts.forEach(a => seenAlertIds.current.add(a.id));
    };

    fetchAlerts().then(seed);

    const id = setInterval(async () => {
      await fetchAlerts();
      const current = useAlertStore.getState().alerts;
      current.forEach(a => {
        if (!seenAlertIds.current.has(a.id)) {
          seenAlertIds.current.add(a.id);
          if (a.type === 'SOS') {
            addNotif({ message: `🚨 SOS: ${a.message}`, type: 'sos' });
            speak(`Emergency! ${a.message}`);
            // Browser notification
            if (Notification.permission === 'granted') {
              new Notification('🚨 SOS Alert', { body: a.message, icon: '/favicon.ico' });
            }
          } else if (a.type === 'SafeZoneExit') {
            addNotif({ message: `⚠️ ${a.message}`, type: 'info' });
          }
        }
      });
    }, 5000);

    return () => clearInterval(id);
  }, [user?.role]);

  // ── PATIENT: Poll reminders every 10s, popup on new reminder added ────────
  useEffect(() => {
    if (user?.role !== 'patient') return;

    // Seed seen IDs on first load
    const seed = () => {
      useReminderStore.getState().reminders.forEach(r => seenReminderIds.current.add(r.id));
    };

    fetchReminders().then(seed);

    const id = setInterval(async () => {
      await fetchReminders();
      const current = useReminderStore.getState().reminders;
      current.forEach(r => {
        if (!seenReminderIds.current.has(r.id) && !r.isCompleted) {
          seenReminderIds.current.add(r.id);
          const time = new Date(r.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          addNotif({ message: `🔔 New reminder: ${r.title} at ${time}`, type: 'reminder' });
          speak(`New reminder added: ${r.title} at ${time}`);
          // Browser notification
          if (Notification.permission === 'granted') {
            new Notification('🔔 New Reminder', { body: `${r.title} at ${time}`, icon: '/favicon.ico' });
          }
        }
      });
    }, 10000);

    return () => clearInterval(id);
  }, [user?.role]);

  // Request browser notification permission
  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission();
  }, []);

  return (
    <div className="flex h-screen bg-brand-background text-brand-text">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.hash}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {user?.role === 'patient' && <LucidiaAssistant />}
        <ReminderScheduler />

        {/* Popup notifications stack */}
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 w-full max-w-sm">
          <AnimatePresence>
            {notifications.map(n => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 ${
                  n.type === 'sos'
                    ? 'bg-red-600 text-white border-red-700'
                    : n.type === 'reminder'
                    ? 'bg-brand-primary text-white border-brand-primary'
                    : 'bg-white text-brand-text border-gray-200'
                }`}
                role="alert"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {n.type === 'sos' ? <BellAlertIcon /> : <BellIcon />}
                </div>
                <p className="flex-1 text-sm font-semibold">{n.message}</p>
                <button onClick={() => removeNotif(n.id)} className="flex-shrink-0 opacity-70 hover:opacity-100">
                  <XMarkIcon />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
