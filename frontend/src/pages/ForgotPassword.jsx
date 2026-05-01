import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Loader2, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
            toast.success("Reset link sent!");
        } catch (err) {
            toast.error(err.response?.data || "Failed to send reset link");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 p-10 rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-600" />
                
                <Link to="/auth" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-8">
                    <ArrowLeft size={14} /> Back to Login
                </Link>

                <div className="text-center mb-10">
                    <div className="inline-block p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4">
                        <Mail size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-2">FORGOT PASSWORD?</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Enter your email to receive a recovery link.</p>
                </div>

                {!sent ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <Mail className="absolute left-4 top-4 text-slate-500" size={18} />
                            <input 
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                                type="email" placeholder="Email Address" required 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading || !email}
                            className="w-full py-4 bg-indigo-500 text-slate-950 rounded-2xl font-black tracking-widest hover:bg-indigo-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            SEND RESET LINK
                        </button>
                    </form>
                ) : (
                    <div className="text-center py-8">
                        <div className="bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20 mb-6">
                            <p className="text-indigo-400 text-sm font-medium">If an account exists for {email}, you will receive a reset link shortly.</p>
                        </div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Didn't receive it? Check your spam or try again.</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
