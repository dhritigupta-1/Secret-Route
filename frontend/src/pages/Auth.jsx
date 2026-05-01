import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Lock, Mail, User, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuthStore } from '../store/useAuthStore';

const Auth = () => {
  const setUser = useAuthStore(state => state.setUser);
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = isLogin ? 'login' : 'register';
    try {
      const res = await api.post(`/auth/${endpoint}`, formData);
      if (isLogin) {
        setUser(res.data.user, res.data.refreshToken);
        toast.success("System Access Granted");
        navigate('/'); 
      } else {
        setIsLogin(true);
        toast.success("Network joined successfully! Please log in.");
      }
    } catch (err) {
      const errorPayload = err.response?.data;
      const errMsg = typeof errorPayload === 'string' ? errorPayload : (errorPayload?.message || "Authentication Error");
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-transparent relative overflow-hidden z-10">
      
      {/* INNOVATIVE BACKGROUND ELEMENTS */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      {/* MAIN CARD */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-4 relative group"
      >
        {/* Glowing Border Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
        
        <div className="relative bg-[#050505]/60 backdrop-blur-3xl border border-white/10 p-10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div 
              animate={{ rotate: isLogin ? 0 : 180 }}
              className="inline-block p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 ring-1 ring-indigo-500/20"
            >
              <Map size={32} />
            </motion.div>
            <h2 className="text-4xl font-black text-white tracking-tighter mb-2">
              {isAdminMode ? "ADMIN ACCESS" : isLogin ? "SIGN IN" : "REGISTER"}
            </h2>
            <div className="h-1 w-12 bg-indigo-500 mx-auto rounded-full" />
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative"
                >
                  <User className="absolute left-4 top-4 text-slate-500" size={18} />
                  <input 
                    className="w-full bg-[#0a0a0f]/80 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-500 shadow-inner"
                    placeholder="Full Name" required 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-4 text-slate-500" size={18} />
              <input 
                className="w-full bg-[#0a0a0f]/80 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-500 shadow-inner"
                type="email" placeholder="Email Address" required 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-4 text-slate-500" size={18} />
              <input 
                className="w-full bg-[#0a0a0f]/80 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-500 shadow-inner"
                type="password" placeholder="Password" required 
                onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
              />
            </div>

            {isLogin && !isAdminMode && (
                <div className="flex justify-end">
                    <Link to="/forgot-password" size={14} className="text-[10px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors">Forgot Password?</Link>
                </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full relative group overflow-hidden py-4 rounded-2xl font-black bg-indigo-500 text-[#050505] tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 shadow-[0_0_15px_-3px_rgba(99,102,241,0.4)]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? "PROCESSING..." : isLogin ? "ENTER SYSTEM" : "JOIN NETWORK"}
                <ArrowRight size={16} />
              </span>
            </button>


          </form>

          {/* Admin Login Portal - Moved Up */}
          <div className="mt-8 pt-6 border-t border-white/5">
                <button 
                type="button"
                onClick={() => { setIsAdminMode(!isAdminMode); if(!isAdminMode) setIsLogin(true); }}
                className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${isAdminMode ? 'bg-amber-500 text-[#050505] shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-[#0a0a0f]/50 border border-white/5 text-slate-400 hover:text-white hover:border-indigo-500/30'}`}
                >
                    {isAdminMode ? "← BACK TO DISCOVERY" : "🛡️ SECURE ADMIN LOGIN"}
                </button>
          </div>

          {/* Footer Toggle */}
          <div className="mt-6 text-center">
            {!isAdminMode && (
                <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="group text-xs font-bold text-slate-500 hover:text-indigo-400 transition-colors"
                >
                {isLogin ? "DON'T HAVE AN ACCESS KEY? " : "ALREADY IN THE DATABASE? "}
                <span className="text-indigo-500 group-hover:underline">
                    {isLogin ? "CREATE ONE" : "LOG IN"}
                </span>
                </button>
            )}
          </div>
        </div>

        {/* Floating Decorative Elements */}
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -top-6 -right-6 p-3 bg-[#0a0a0f] border border-white/5 rounded-2xl shadow-xl hidden md:block backdrop-blur-xl"
        >
          <Sparkles className="text-indigo-400" size={20} />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Auth;