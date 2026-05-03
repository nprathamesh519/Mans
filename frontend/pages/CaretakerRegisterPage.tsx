import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import { ShieldCheckIcon, ArrowLeftIcon } from '../components/icons/Icons';
import { UserRole } from '../types';
import { findPatient, linkPatient } from '../src/api/userApi';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const CaretakerRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [patientCode, setPatientCode] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ STEP 1: Register caretaker in backend
      const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role: UserRole.CARETAKER
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // 🔥 STEP 2: LOGIN using Firebase (THIS WAS MISSING)
      const userCred = await signInWithEmailAndPassword(auth, email, password);

      const token = await userCred.user.getIdToken();

      console.log("FIREBASE TOKEN:", token);

      localStorage.setItem("token", token);

      // ✅ STEP 3: Find patient
      const patient = await findPatient(patientCode.toUpperCase());

      console.log("PATIENT RESPONSE:", patient);

      // ✅ Firestore uses "id" not "_id"
      const patientId = patient?.id;

      if (!patientId) {
        throw new Error("Invalid Patient Code");
      }

      // ✅ STEP 4: Link patient
      await linkPatient(patientId);

      setIsSubmitted(true);

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong");
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
            className="absolute top-6 left-6 p-2 text-brand-text-light hover:text-brand-primary"
          >
            <ArrowLeftIcon />
          </button>
        )}

        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleRegister}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold text-center">Caretaker Account</h1>

              <input type="text" value={name} onChange={e => setName(e.target.value)} className="form-input" placeholder="Full Name" required />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-input" placeholder="Email" required />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="form-input" placeholder="Password" required />
              <input type="text" value={patientCode} onChange={e => setPatientCode(e.target.value)} className="form-input text-center font-mono" placeholder="Patient Unique ID" required />

              <Button type="submit" loading={loading} className="w-full rounded-2xl py-4">
                Link & Register
              </Button>
            </motion.form>
          ) : (
            <motion.div key="success" initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center">
              <ShieldCheckIcon />
              <h1 className="text-3xl font-bold mt-4">Linked Successfully!</h1>
              <p className="mt-4">You can now monitor your patient.</p>
              <Button onClick={() => navigate('/login')} className="w-full mt-6">
                Go to Login
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default CaretakerRegisterPage;