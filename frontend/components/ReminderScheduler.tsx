import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReminderStore } from '../store/reminderStore';
import { BellIcon, XMarkIcon } from './icons/Icons';
import { speak } from '../utils/helpers';

interface ActiveReminder {
  id: string;
  title: string;
  time: string;
  type: string;
}

const FETCH_INTERVAL_MS = 20_000;
const CHECK_INTERVAL_MS = 5_000;
const TRIGGER_WINDOW_MS = 5 * 60 * 1000; // 5 min window
const REPEAT_DELAY_MS   = 4_000;
const VALID_RESPONSES   = ['yes', 'done', 'haan', 'yeah', 'ok', 'okay'];

const listenForConfirmation = (): Promise<string> => {
  return new Promise((resolve) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { resolve(''); return; }
    const r = new SR();
    r.lang = 'en-IN';
    r.interimResults = false;
    r.maxAlternatives = 1;
    const t = setTimeout(() => { try { r.stop(); } catch (_) {} resolve(''); }, 6000);
    r.onresult = (e: any) => { clearTimeout(t); resolve(e.results[0][0].transcript.toLowerCase().trim()); };
    r.onerror  = () => { clearTimeout(t); resolve(''); };
    r.onend    = () => { clearTimeout(t); resolve(''); };
    try { r.start(); } catch (_) { resolve(''); }
  });
};

const ReminderScheduler: React.FC = () => {
  const [activeReminder, setActiveReminder] = useState<ActiveReminder | null>(null);
  const [isListening,    setIsListening]    = useState(false);
  const [statusText,     setStatusText]     = useState('');

  // All mutable state in refs — intervals read these directly, no stale closures
  const storeRef           = useRef(useReminderStore.getState());
  const notifiedIds        = useRef<Set<string>>(new Set());
  const lastTriggered      = useRef<Record<string, string>>({});
  const confirmLoopActive  = useRef(false);
  const activeReminderRef  = useRef<ActiveReminder | null>(null);
  const setActiveFn        = useRef(setActiveReminder);
  const setListeningFn     = useRef(setIsListening);
  const setStatusFn        = useRef(setStatusText);

  // Keep storeRef in sync with zustand store
  useEffect(() => {
    return useReminderStore.subscribe(state => { storeRef.current = state; });
  }, []);

  // All logic in a single stable ref — never recreated
  const logic = useRef({
    async executeReminder(reminder: ActiveReminder) {
      confirmLoopActive.current = true;
      const prompt = `Hello. It is time to ${reminder.title}. Please say YES, or DONE, when you are finished.`;

      while (confirmLoopActive.current) {
        setStatusFn.current('Speaking...');
        await speak(prompt);
        if (!confirmLoopActive.current) break;

        setListeningFn.current(true);
        setStatusFn.current('Listening for confirmation...');
        const response = await listenForConfirmation();
        setListeningFn.current(false);
        if (!confirmLoopActive.current) break;

        if (VALID_RESPONSES.some(w => response.includes(w))) {
          setStatusFn.current('');
          await speak('Very good. Reminder completed.');
          confirmLoopActive.current = false;
          storeRef.current.markAsCompleted(reminder.id);
          setActiveFn.current(null);
          activeReminderRef.current = null;
        } else {
          setStatusFn.current('No confirmation. Repeating in 4 seconds...');
          await new Promise(res => setTimeout(res, REPEAT_DELAY_MS));
        }
      }
    },

    triggerReminder(due: { id: string; title: string; time: string; type: string }) {
      notifiedIds.current.add(due.id);
      lastTriggered.current[due.id] = new Date().toISOString().slice(0, 10);
      storeRef.current.markAsNotified(due.id);

      const active: ActiveReminder = { id: due.id, title: due.title, time: due.time, type: due.type };
      activeReminderRef.current = active;
      setActiveFn.current(active);

      speak(`Reminder: ${due.title}`);

      if (Notification.permission === 'granted') {
        new Notification('⏰ Lucidia Reminder', { body: due.title, icon: '/favicon.ico' });
      }

      this.executeReminder(active);
    },

    checkDue() {
      if (confirmLoopActive.current) return;

      const reminders = storeRef.current.reminders;
      if (!reminders.length) return;

      const now   = Date.now();
      const today = new Date().toISOString().slice(0, 10);

      const due = reminders.find(r => {
        if (r.isCompleted || r.notified)           return false;
        if (notifiedIds.current.has(r.id))         return false;
        if (lastTriggered.current[r.id] === today) return false;
        const diff = now - new Date(r.time).getTime();
        return diff >= 0 && diff <= TRIGGER_WINDOW_MS;
      });

      if (due) this.triggerReminder(due);
    }
  });

  // FETCH interval — empty deps, runs once, never restarts
  useEffect(() => {
    const doFetch = async () => {
      await storeRef.current.fetchReminders();
      setTimeout(() => logic.current.checkDue(), 300);
    };
    doFetch();
    const id = setInterval(doFetch, FETCH_INTERVAL_MS);
    return () => clearInterval(id);
  }, []); // ← truly stable, no deps needed

  // CHECK interval — empty deps, runs once, never restarts
  useEffect(() => {
    const id = setInterval(() => logic.current.checkDue(), CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []); // ← truly stable

  // Notification permission
  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission();
  }, []);

  const handleDismiss = () => {
    confirmLoopActive.current = false;
    window.speechSynthesis?.cancel();
    setIsListening(false);
    setStatusText('');
    const current = activeReminderRef.current;
    if (current) storeRef.current.markAsCompleted(current.id);
    setActiveReminder(null);
    activeReminderRef.current = null;
  };

  return (
    <AnimatePresence>
      {activeReminder && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-brand-primary/20 overflow-hidden">

            <div className="bg-brand-primary px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold">
                <BellIcon />
                <span>⏰ Reminder</span>
              </div>
              <button onClick={handleDismiss} className="text-white/80 hover:text-white transition-colors">
                <XMarkIcon />
              </button>
            </div>

            <div className="px-5 py-4 space-y-1">
              <p className="text-lg font-bold text-brand-text">{activeReminder.title}</p>
              <p className="text-sm text-brand-text-light">
                Scheduled for{' '}
                {new Date(activeReminder.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-brand-text-light capitalize">Type: {activeReminder.type}</p>
            </div>

            {statusText && (
              <div className="px-5 pb-2 flex items-center gap-2 text-sm text-brand-primary font-medium">
                {isListening && (
                  <span className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:0.3s]" />
                  </span>
                )}
                <span>{statusText}</span>
              </div>
            )}

            <div className="px-5 pb-2">
              <p className="text-xs text-gray-400">
                Say <span className="font-semibold text-brand-primary">"Yes"</span>,{' '}
                <span className="font-semibold text-brand-primary">"Done"</span> or{' '}
                <span className="font-semibold text-brand-primary">"Haan"</span> to confirm
              </p>
            </div>

            <div className="px-5 pb-4">
              <button
                onClick={handleDismiss}
                className="w-full py-2.5 bg-brand-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Done ✓
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReminderScheduler;
