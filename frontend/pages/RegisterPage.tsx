
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { ArrowLeftIcon } from '../components/icons/Icons';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-slate-100 backdrop-blur-sm"></div>
      <div className="max-w-md w-full p-12 glass-card relative z-10 border border-white/40 shadow-2xl">
        <button 
          onClick={() => navigate('/login')}
          className="absolute top-8 left-8 p-2 text-brand-text-light hover:text-brand-primary transition-colors"
          title="Back to Login"
        >
          <ArrowLeftIcon />
        </button>
        <div className="text-center">
            <h1 className="text-4xl font-extrabold text-brand-primary">Join Lucidia</h1>
            <p className="mt-3 text-brand-text-light text-lg">Choose your journey.</p>
        </div>
        <div className="mt-10 space-y-4">
            <Button onClick={() => navigate('/register/patient')} className="w-full py-5 text-lg rounded-2xl shadow-xl font-bold">I am a Patient</Button>
            <Button onClick={() => navigate('/register/caretaker')} variant="secondary" className="w-full py-5 text-lg rounded-2xl text-brand-text font-bold">I am a Caretaker</Button>
        </div>
        <div className="pt-8 text-center mt-6">
            <p className="text-brand-text-light">Already registered? <Link to="/login" className="font-bold text-brand-primary">Sign in here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
