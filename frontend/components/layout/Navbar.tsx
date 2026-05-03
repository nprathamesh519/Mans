import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { BellIcon, Bars3Icon, UserCircleIcon } from '../icons/Icons';
import { motion } from 'framer-motion';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user } = useAuthStore();

  return (
    <header className="bg-brand-surface shadow-sm sticky top-0 z-10">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-primary"
            >
              <Bars3Icon />
            </button>
            <div className="hidden md:block ml-4 text-xl font-semibold text-brand-text">
              Welcome, {user?.name}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full text-brand-text-light hover:text-brand-primary hover:bg-brand-primary-light"
            >
              <BellIcon />
            </motion.button>
            <div className="relative group">
              <button className="flex items-center space-x-2 p-2 rounded-full hover:bg-brand-primary-light">
                <UserCircleIcon />
                <span className="hidden sm:inline text-brand-text-light group-hover:text-brand-text">{user?.name}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;