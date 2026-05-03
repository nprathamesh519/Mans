import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getNavLinks } from '../../constants';
import { UserRole } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ArrowLeftOnRectangleIcon } from '../icons/Icons';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuthStore();
  const navLinks = getNavLinks((user?.role as UserRole) || UserRole.PATIENT);

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: '-100%' },
  };

  const navItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05 + 0.1,
      },
    }),
  };

  const activeLinkStyle = {
    backgroundColor: '#C7D2FE',
    color: '#334155',
  };

  const renderLinks = () => navLinks.map((link, i) => (
    <motion.li key={link.href} custom={i} variants={navItemVariants}>
      <NavLink
        to={link.href}
        onClick={() => setIsOpen(false)}
        style={({ isActive }) => (isActive ? activeLinkStyle : {})}
        className="flex items-center p-3 my-1 rounded-xl text-brand-text-light hover:bg-brand-primary-light hover:text-brand-text transition-all duration-200"
      >
        <span className="w-6 h-6 mr-3">{link.icon}</span>
        <span className="font-semibold">{link.label}</span>
      </NavLink>
    </motion.li>
  ));

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-40 md:z-auto bg-brand-surface w-72 shadow-2xl md:shadow-none transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-slate-100 h-20">
            <h1 className="text-3xl font-black text-brand-primary tracking-tighter">Lucidia</h1>
            <button onClick={() => setIsOpen(false)} className="md:hidden p-2 text-brand-text-light hover:bg-slate-50 rounded-lg">
              <XMarkIcon />
            </button>
          </div>
          <nav className="flex-1 p-6 overflow-y-auto">
            <motion.ul
              initial="hidden"
              animate="visible"
              className="space-y-1"
            >
              {renderLinks()}
            </motion.ul>
          </nav>
          <div className="p-6 border-t border-slate-100">
            <div className="mb-4 px-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Profile</p>
                <p className="font-bold text-brand-text truncate">{user?.name}</p>
                <p className="text-xs text-brand-text-light capitalize">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center p-3 rounded-xl text-brand-text-light hover:bg-red-50 hover:text-red-700 transition-all duration-200"
            >
              <span className="w-6 h-6 mr-3"><ArrowLeftOnRectangleIcon /></span>
              <span className="font-bold">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;