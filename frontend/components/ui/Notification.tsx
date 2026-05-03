import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { BellIcon, XMarkIcon } from '../icons/Icons';

interface NotificationProps {
  message: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.5 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="fixed bottom-5 right-5 z-50 w-full max-w-sm p-4 bg-brand-surface rounded-xl shadow-lg"
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 text-brand-primary">
          <BellIcon />
        </div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium text-brand-text">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={onClose}
            className="inline-flex text-brand-text-light rounded-md hover:text-brand-text focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
          >
            <span className="sr-only">Close</span>
            <XMarkIcon />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Notification;