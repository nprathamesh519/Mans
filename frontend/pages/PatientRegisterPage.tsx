
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import { ShieldCheckIcon, ArrowLeftIcon } from '../components/icons/Icons';
import { useUserStore } from '../store/userStore';
import { UserRole } from '../types';
import { registerUser } from '../../backend/auth';

const PatientRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { addUser } = useUserStore();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [patientCode, setPatientCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await registerUser(email, password, { name, role: UserRole.PATIENT, patientCode: newCode });
      setPatientCode(newCode);
      setIsSubmitted(true);
    } catch (err: any) {
      alert(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full p-10 glass-card bg-white shadow-2xl rounded-3xl relative">
        {!isSubmitted && (
          <button 
            onClick={() => navigate('/register')}
            className="absolute top-6 left-6 p-2 text-brand-text-light hover:text-brand-primary transition-colors"
            title="Back"
          >
            <ArrowLeftIcon />
          </button>
        )}
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleRegister} className="space-y-6">
              <h1 className="text-3xl font-bold text-center">Patient Profile</h1>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="form-input" placeholder="Full Name" required />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-input" placeholder="Email" required />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="form-input" placeholder="Password" required />
              <Button type="submit" loading={loading} className="w-full rounded-2xl py-4">Create Account</Button>
            </motion.form>
          ) : (
            <motion.div key="success" initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center">
              <ShieldCheckIcon />
              <h1 className="text-3xl font-bold mt-4">Verified!</h1>
              <p className="mt-4">Give this Unique ID to your caretaker:</p>
              <p className="text-4xl font-mono font-black my-6 bg-slate-100 p-4 rounded-xl">{patientCode}</p>
              <Button onClick={() => navigate('/login')} className="w-full">Back to Login</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PatientRegisterPage;
