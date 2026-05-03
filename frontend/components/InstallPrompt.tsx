import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWAInstall } from '../hooks/usePWAInstall';

const Toast: React.FC<{ message: string; onDone: () => void }> = ({ message, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-xl text-sm font-semibold"
    >
      {message}
    </motion.div>
  );
};

const Feature: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="flex items-center gap-2 text-sm text-gray-700">
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pink-100 text-pink-600 text-xs font-bold">✓</span>
    {children}
  </li>
);

const InstallPrompt: React.FC = () => {
  const { visible, install, dismiss, isIOSDevice, installed } = usePWAInstall();
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (installed) return null;

  const handleInstall = async () => {
    if (isIOSDevice) {
      setToast('Tap Share → Add to Home Screen');
      return;
    }
    setBusy(true);
    const outcome = await install();
    setBusy(false);
    if (outcome === 'accepted') setToast('App Installed 🎉');
  };

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={dismiss}
          >
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-white to-pink-50 shadow-xl p-6 relative"
              role="dialog"
              aria-modal="true"
              aria-labelledby="install-title"
            >
              <div className="flex justify-center -mt-14 mb-3">
                <img
                  src="/icons/icon-192.png"
                  alt="NaariCare"
                  width={72}
                  height={72}
                  className="rounded-2xl shadow-lg ring-4 ring-white"
                />
              </div>

              <h2 id="install-title" className="text-center text-xl font-bold text-gray-900">
                Install NaariCare
              </h2>
              <p className="text-center text-sm text-gray-500 mt-1">
                Get faster access, offline support &amp; better experience
              </p>

              <ul className="mt-5 space-y-2">
                <Feature>Works offline</Feature>
                <Feature>Quick home screen access</Feature>
                <Feature>Secure health tracking</Feature>
              </ul>

              {isIOSDevice && (
                <div className="mt-4 rounded-xl bg-pink-50 border border-pink-100 p-3 text-xs text-pink-800">
                  On iOS: tap <span className="font-semibold">Share</span> → <span className="font-semibold">Add to Home Screen</span>
                </div>
              )}

              <div className="mt-6 space-y-2">
                <button
                  onClick={handleInstall}
                  disabled={busy}
                  className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-pink-500 to-rose-400 shadow-md hover:shadow-lg active:scale-[0.99] transition disabled:opacity-60"
                >
                  {busy ? 'Installing…' : 'Install Now'}
                </button>
                <button
                  onClick={dismiss}
                  className="w-full py-3 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast key="toast" message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </>
  );
};

export default InstallPrompt;