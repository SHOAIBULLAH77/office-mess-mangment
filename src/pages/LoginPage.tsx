import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Utensils, User, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export function LoginPage() {
  const { user, login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password.trim()) {
      setError('Please enter both username/email and password.');
      return;
    }
    
    setError(null);
    setLoading(true);
    try {
      const res = await login(emailOrUsername, password);
      if (!res.success) {
        setError(res.error || 'Failed to login. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await login();
      if (!res.success) {
        setError(res.error || 'OAuth login failed.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-orange-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100/80 relative overflow-hidden"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-6 shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-500 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Utensils className="text-white relative z-10" size={30} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Zikriya Mess App</h2>
          <p className="mt-2 text-gray-500 font-medium">Please sign in to access admin console</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-sm"
          >
            <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
            <span className="font-medium">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block pl-1">
              Username or Email
            </label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <input
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="e.g. admin"
                disabled={loading}
                className="w-full bg-gray-50/50 hover:bg-gray-50 border border-gray-200/80 focus:border-gray-900 focus:bg-white py-3 pl-12 pr-4 rounded-xl text-gray-900 placeholder-gray-400 outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block pl-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full bg-gray-50/50 hover:bg-gray-50 border border-gray-200/80 focus:border-gray-900 focus:bg-white py-3 pl-12 pr-4 rounded-xl text-gray-900 placeholder-gray-400 outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 px-4 rounded-xl font-bold hover:bg-gray-800 active:scale-[0.98] transition-all shadow-md shadow-gray-900/10 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <Loader2 className="animate-spin animate-duration-1000" size={18} />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold text-gray-400">
            <span className="bg-white px-4">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 py-3.5 px-4 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-[0.98] cursor-pointer disabled:opacity-50 text-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Google Authentication
        </button>

        <p className="text-[11px] text-gray-400 text-center mt-8 leading-relaxed">
          Access is strictly restricted to authorized admin staff.
          <br /> Unauthorized access is logged.
        </p>
      </motion.div>
    </div>
  );
}
