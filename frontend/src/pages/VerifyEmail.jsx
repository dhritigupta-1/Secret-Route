import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error

    useEffect(() => {
        const verify = async () => {
            try {
                await api.get(`/auth/verify-email/${token}`);
                setStatus('success');
                toast.success("Identity Verified!");
                setTimeout(() => navigate('/auth'), 3000);
            } catch (err) {
                setStatus('error');
                toast.error("Verification link expired or invalid");
            }
        };
        verify();
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-transparent flex items-center justify-center p-4 relative z-10">
            <div className="bg-[#050505]/60 backdrop-blur-3xl border border-white/10 p-10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center max-w-md w-full">
                {status === 'verifying' && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="text-indigo-500 animate-spin" size={48} />
                        <h2 className="text-2xl font-black text-white">SECURE VERIFICATION</h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Validating your credentials with the main database...</p>
                    </div>
                )}
                
                {status === 'success' && (
                    <div className="flex flex-col items-center gap-4">
                        <CheckCircle className="text-indigo-500" size={48} />
                        <h2 className="text-2xl font-black text-white">ACCESS GRANTED</h2>
                        <p className="text-slate-400 text-sm">Your email has been verified. Redirecting you to login...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center gap-4">
                        <XCircle className="text-rose-500" size={48} />
                        <h2 className="text-2xl font-black text-white">VERIFICATION FAILED</h2>
                        <p className="text-slate-400 text-sm">This link is invalid or has expired. Please request a new one.</p>
                        <button onClick={() => navigate('/auth')} className="mt-4 px-6 py-2 bg-[#0a0a0f] border border-white/5 text-slate-300 rounded-xl font-bold hover:border-indigo-500/30 transition-all text-xs uppercase tracking-widest">Back to Login</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
