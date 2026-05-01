import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { ShieldAlert, LockKeyhole } from 'lucide-react';

const AdminAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/admin/login', { email, password });
      login(res.data.user, res.data.token);
      toast.success('Admin authorization granted.');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data || "Access Denied");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 p-10 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-rose-600 to-rose-500"></div>
        <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center border-2 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                <ShieldAlert size={32} className="text-rose-500" />
            </div>
        </div>
        <h1 className="text-3xl font-black text-white text-center tracking-tighter mb-2">RESTRICTED AREA</h1>
        <p className="text-slate-500 text-center text-[10px] font-black uppercase tracking-widest mb-8">Authorized Personnel Only</p>
        
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full mt-1 bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white focus:border-rose-500 focus:outline-none transition-colors shadow-inner" 
              required 
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full mt-1 bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white focus:border-rose-500 focus:outline-none transition-colors shadow-inner" 
              required 
            />
          </div>
          <button type="submit" disabled={loading} className="w-full mt-6 bg-rose-600 hover:bg-rose-500 text-white font-black tracking-widest py-4 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 border border-rose-400/50">
            {loading ? 'AUTHENTICATING...' : <><LockKeyhole size={18} /> ACCESS TERMINAL</>}
          </button>
        </form>
      </div>
    </div>
  );
};
export default AdminAuth;
