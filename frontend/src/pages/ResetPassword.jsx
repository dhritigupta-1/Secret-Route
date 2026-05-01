import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { Lock, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) return toast.error("Passwords do not match");
        
        setLoading(true);
        try {
            await api.post(`/auth/reset-password/${token}`, { password });
            toast.success("Password Updated!");
            setTimeout(() => navigate('/auth'), 2000);
        } catch (err) {
            toast.error(err.response?.data || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent flex items-center justify-center p-4 relative z-10">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#050505]/60 backdrop-blur-3xl border border-white/10 p-10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] max-w-md w-full relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-600" />
                
                <div className="text-center mb-10">
                    <div className="inline-block p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-2">NEW PASSWORD</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Enter your new secret credentials.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <Lock className="absolute left-4 top-4 text-slate-500" size={18} />
                        <input 
                            className="w-full bg-[#0a0a0f]/80 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-500 shadow-inner"
                            type="password" placeholder="New Password" required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-4 text-slate-500" size={18} />
                        <input 
                            className="w-full bg-[#0a0a0f]/80 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-500 shadow-inner"
                            type="password" placeholder="Confirm New Password" required 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading || !password}
                        className="w-full py-4 bg-indigo-500 text-[#050505] rounded-2xl font-black tracking-widest hover:bg-indigo-400 transition-all flex items-center justify-center gap-2 "
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                        UPDATE PASSWORD
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
