import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { motion } from 'framer-motion';
import { User, Lock, Mail, Terminal, AlertTriangle } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      setAuth(data.user, data.accessToken);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#f5f5f7] px-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white border border-black/5 mb-3 shadow-sm">
            <Terminal className="h-6 w-6 text-[#1d1d1f]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1d1d1f]">
            DevForge <span className="text-[#0071e3] font-medium">AI</span>
          </h1>
          <p className="mt-1 text-sm text-[#86868b]">
            The collaborative workspace for modern developer teams
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl p-8 border border-black/5 shadow-premium-lg relative overflow-hidden">
          <h2 className="text-xl font-bold text-[#1d1d1f] mb-6">
            Create Account
          </h2>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="glass-input w-full py-2.5 pl-9 pr-4 text-sm font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="glass-input w-full py-2.5 pl-9 pr-4 text-sm font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• (Min. 6 characters)"
                  className="glass-input w-full py-2.5 pl-9 pr-4 text-sm font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-premium-primary w-full py-2.5 rounded-lg text-xs font-semibold text-white uppercase tracking-wider disabled:opacity-50 cursor-pointer pt-3 pb-3 mt-2"
            >
              {loading ? 'Registering...' : 'Initialize Profile'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-[#86868b]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#0071e3] font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
