import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import Button from '../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheckIcon } from '../components/icons/Icons';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      switch (err.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Please try again later.');
          break;
        default:
          setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full glass-card p-10 bg-white shadow-2xl rounded-3xl">
        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-3xl font-bold text-brand-primary text-center">Forgot Password</h1>
              <p className="mt-3 text-brand-text-light text-center text-sm">
                Enter your registered email and we'll send you a password reset link.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="Email address"
                  required
                />

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                  >
                    {error}
                  </motion.p>
                )}

                <Button type="submit" className="w-full py-4 rounded-2xl" loading={loading}>
                  Send Reset Link
                </Button>

                <div className="text-center">
                  <Link to="/login" className="text-sm font-bold text-brand-primary hover:underline">
                    Back to Login
                  </Link>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-4"
            >
              <div className="flex justify-center text-green-500">
                <ShieldCheckIcon />
              </div>
              <h1 className="text-2xl font-bold text-brand-text">Check your email</h1>
              <p className="text-brand-text-light text-sm">
                A password reset link has been sent to <span className="font-semibold text-brand-text">{email}</span>.
                Check your inbox and follow the instructions.
              </p>
              <p className="text-xs text-brand-text-light">
                Didn't receive it? Check your spam folder or{' '}
                <button
                  onClick={() => { setSent(false); setError(''); }}
                  className="font-bold text-brand-primary hover:underline"
                >
                  try again
                </button>
              </p>
              <Link to="/login">
                <Button className="w-full mt-4 rounded-2xl">Back to Login</Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
