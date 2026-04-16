import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
import { login } from '../api.js';

export function Login({ onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login({ email, password });
      onAuthSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-full h-full max-w-4xl opacity-30">
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-sky-300 rounded-full filter blur-[100px] animate-blob" />
        <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-indigo-300 rounded-full filter blur-[100px] animate-blob animation-delay-2000" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[460px]"
      >
        <div className="mb-10 flex flex-col items-center text-center">
          <Link to="/" className="group mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-900">
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
            Back to home
          </Link>
          <motion.div
            whileHover={{ rotate: 180 }}
            className="h-20 w-20 mb-6 rounded-3xl bg-slate-900 border-[8px] border-white shadow-2xl flex items-center justify-center"
          >
            <div className="h-8 w-2 bg-sky-400 rounded-full" />
          </motion.div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Welcome back</h1>
          <p className="text-slate-500 font-medium">Continue your workspace journey.</p>
        </div>

        <div className="glass rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <form className="space-y-6 relative" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-5">Email Address</label>
              <div className="relative group/input">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within/input:text-sky-500">
                  <Mail size={18} />
                </div>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full rounded-[2rem] border border-slate-100 bg-slate-50/50 py-5 pl-16 pr-8 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-8 focus:ring-sky-500/5 placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-5">Password</label>
              <div className="relative group/input">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within/input:text-sky-500">
                  <Lock size={18} />
                </div>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-[2rem] border border-slate-100 bg-slate-50/50 py-5 pl-16 pr-8 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-8 focus:ring-sky-500/5 placeholder:text-slate-300"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-rose-50 border border-rose-100 p-4"
              >
                <p className="text-sm font-bold text-rose-600 text-center">{error}</p>
              </motion.div>
            )}

            <button
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-[2rem] bg-slate-900 px-8 py-5 text-sm font-black text-white shadow-xl shadow-slate-900/10 transition-all hover:bg-black active:scale-[0.98] disabled:opacity-70"
            >
              <div className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <Loader2 size={18} className="animate-spin text-sky-400" />
                ) : (
                  <>
                    <span>Sign in to Dashboard</span>
                    <ChevronRight size={18} className="transition-transform group-hover:translate-x-1 text-sky-400" />
                  </>
                )}
              </div>
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-slate-50 flex flex-col items-center gap-4 relative">
            <p className="text-sm font-bold text-slate-400">
              New to BlockNote?{' '}
              <Link className="text-sky-500 hover:text-sky-600 ml-1 transition-colors" to="/register">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
