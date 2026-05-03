
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';
import Button from '../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedPortal, setSelectedPortal] = useState<UserRole>(UserRole.CARETAKER);

 const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  
  try {
    const data = await login(email, password); // ✅ get user

    // 🔥 NEW: Role-based redirect
    if (data.role === "patient") {
      navigate('/dashboard');
    } else if (data.role === "caretaker") {
      navigate('/dashboard');
    } else {
      throw new Error("Invalid user role");
    }

  } catch (err: any) {
    let message = err.message || 'An error occurred during login.';
    if (err.code === 'auth/invalid-credential') {
      message = 'Invalid email or password. Please check your details.';
    }
    setError(message);
  } finally {
    setLoading(false);
  }
};

  const portalStyles = {
    [UserRole.CARETAKER]: {
      bg: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop',
      title: 'Caretaker Portal',
      subtitle: 'Access professional tools and monitoring.',
      accent: 'brand-primary'
    },
    [UserRole.PATIENT]: {
      bg: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=2000&auto=format&fit=crop',
      title: 'Patient Portal',
      subtitle: 'Welcome home. I am here to help you remember.',
      accent: 'brand-accent'
    }
  };

  const currentStyle = portalStyles[selectedPortal];

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div 
          key={selectedPortal}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url("${currentStyle.bg}")` }}
        >
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[4px]"></div>
        </motion.div>
      </AnimatePresence>

      <div className="max-w-md w-full p-1 lg:p-0 relative z-10">
        <div className="flex justify-center mb-6">
          <div className="bg-white/30 backdrop-blur-xl p-1.5 rounded-2xl border border-white/40 flex gap-1 shadow-lg">
            <button 
              onClick={() => setSelectedPortal(UserRole.CARETAKER)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedPortal === UserRole.CARETAKER ? 'bg-white text-brand-primary shadow-md' : 'text-white hover:bg-white/10'}`}
            >
              Caretaker
            </button>
            <button 
              onClick={() => setSelectedPortal(UserRole.PATIENT)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedPortal === UserRole.PATIENT ? 'bg-white text-brand-accent shadow-md' : 'text-white hover:bg-white/10'}`}
            >
              Patient
            </button>
          </div>
        </div>

        <motion.div layout className="glass-card p-10 lg:p-12 border border-white/50 shadow-2xl">
          <div className="text-center mb-10">
            <motion.h1 layout className={`text-5xl font-black ${selectedPortal === UserRole.PATIENT ? 'text-brand-accent' : 'text-brand-primary'} tracking-tighter`}>
              Lucidia
            </motion.h1>
            <motion.h2 key={`${selectedPortal}-title`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-2xl font-bold text-brand-text">
              {currentStyle.title}
            </motion.h2>
            <motion.p key={`${selectedPortal}-sub`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-brand-text-light font-medium">
              {currentStyle.subtitle}
            </motion.p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium">
                {error}
              </motion.div>
            )}
            <div className="space-y-4">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input py-4 bg-white/60" placeholder="Email Address" required />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input py-4 bg-white/60" placeholder="Password" required />
            </div>
            <Button type="submit" variant={selectedPortal === UserRole.PATIENT ? 'danger' : 'primary'} className="w-full py-5 rounded-2xl shadow-xl font-bold" loading={loading} size="lg">
              Sign In
            </Button>
          </form>

          <div className="text-sm text-center pt-8 border-t border-brand-text/5 mt-8 space-y-4">
            <p className="text-brand-text-light">
              Don't have an account? <Link to="/register" className={`font-bold ${selectedPortal === UserRole.PATIENT ? 'text-brand-accent' : 'text-brand-primary'}`}>Get started</Link>
            </p>
            <Link to="/forgot-password" title="Recover Password" className="text-xs font-semibold text-brand-text-light hover:text-brand-primary">I forgot my password</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
