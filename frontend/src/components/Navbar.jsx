import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Bell, User as UserIcon } from 'lucide-react';
import api from '../api';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchNotifs = async () => {
        try {
          const res = await api.get('/social/notifications');
          setNotifications(res.data);
        } catch (err) {
          console.error("Notifs error:", err);
        }
      };
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRead = async () => {
    setShowNotifs(!showNotifs);
    if (!showNotifs && unreadCount > 0) {
      try {
        await api.patch('/social/notifications/read');
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const isAdmin = user?.role === 'admin' || user?.user?.role === 'admin';

  return (
    <nav className="h-16 bg-[#050505]/60 backdrop-blur-md flex items-center justify-between px-8 z-[1001] relative group">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sky-500/20 to-transparent group-hover:via-sky-400/40 transition-all duration-500"></div>
      
      <Link to="/" className="text-xl font-black text-sky-400 tracking-tighter hover:text-sky-300 transition-colors">HIDDEN PATH</Link>
      
      <div className="flex gap-6 items-center text-xs font-bold tracking-widest text-white/70">
        <Link to="/" className="relative px-2 py-1 hover:text-white transition-colors group/nav">
          <span className="relative z-10">HOME</span>
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-sky-500/0 group-hover/nav:border-sky-500/50 transition-all duration-300 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-sky-500/0 group-hover/nav:border-sky-500/50 transition-all duration-300 pointer-events-none"></div>
        </Link>
        <Link to="/explore" className="relative px-2 py-1 text-sky-400 hover:text-sky-300 transition-colors group/nav">
          <span className="relative z-10">EXPLORER</span>
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-sky-500/0 group-hover/nav:border-sky-500/50 transition-all duration-300 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-sky-500/0 group-hover/nav:border-sky-500/50 transition-all duration-300 pointer-events-none"></div>
        </Link>
        <Link to="/leaderboard" className="relative px-2 py-1 hover:text-yellow-400 transition-colors flex items-center gap-1 group/nav">
          <span className="relative z-10 flex items-center gap-1">LEADERBOARD 🏆</span>
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-yellow-500/0 group-hover/nav:border-yellow-500/50 transition-all duration-300 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-yellow-500/0 group-hover/nav:border-yellow-500/50 transition-all duration-300 pointer-events-none"></div>
        </Link>
        
        {user ? (
          <>
            {isAdmin ? (
              <Link to="/admin" className="relative px-2 py-1 hover:text-white transition-colors group/nav">
                 <span className="relative z-10">USER MANAGEMENT</span>
                 <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/0 group-hover/nav:border-white/50 transition-all duration-300 pointer-events-none"></div>
                 <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/0 group-hover/nav:border-white/50 transition-all duration-300 pointer-events-none"></div>
              </Link>
            ) : (
              <Link to="/dashboard" className="relative px-2 py-1 hover:text-blue-400 transition-colors group/nav">
                 <span className="relative z-10">MY SPOTS</span>
                 <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-blue-500/0 group-hover/nav:border-blue-500/50 transition-all duration-300 pointer-events-none"></div>
                 <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-blue-500/0 group-hover/nav:border-blue-500/50 transition-all duration-300 pointer-events-none"></div>
              </Link>
            )}
            <Link to="/ai-explorer" className="relative px-2 py-1 text-purple-400 font-black hover:text-purple-300 transition-colors flex items-center gap-1 group/nav">
                <span className="relative z-10 flex items-center gap-1">AI CONCIERGE ✨</span>
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-purple-500/0 group-hover/nav:border-purple-500/50 transition-all duration-300 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-purple-500/0 group-hover/nav:border-purple-500/50 transition-all duration-300 pointer-events-none"></div>
            </Link>
            
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={handleRead}
                className="p-2 bg-[#050505] border border-sky-900/40 rounded-xl hover:bg-[#070707] transition-all text-slate-300 relative group cursor-pointer"
              >
                <Bell size={18} className={unreadCount > 0 ? 'animate-bounce text-sky-400' : 'group-hover:text-sky-400 transition-colors'} />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-slate-900">{unreadCount}</span>}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/20 to-transparent"></div>
              </button>

              {showNotifs && (
                <div className="absolute top-12 right-0 w-72 bg-[#050505] backdrop-blur-2xl border border-sky-900/40 rounded-[1.25rem] shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden z-50">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/20 to-transparent"></div>
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#070707]">
                    <h4 className="text-[10px] font-black text-white/90 uppercase tracking-widest">Notifications</h4>
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-white/50 text-[10px]">No new alerts</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n._id} className={`p-4 border-b border-white/5 text-[10px] transition-colors ${n.read ? 'bg-transparent hover:bg-[#070707]' : 'bg-sky-500/10'}`}>
                          <p className="text-slate-100 italic flex items-center gap-2">
                             {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0"></span>}
                            <span><span className="font-bold text-sky-400">@{n.sender?.name}</span> {n.message}</span>
                          </p>
                          <span className="text-[8px] text-white/50 mt-1 block pl-3">{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {!isAdmin && (
              <Link to={`/profile/${user?.user?.id || user?.id}`} className="relative px-2 py-1 hover:text-cyan-400 text-white/70 transition-colors group/nav">
                 <span className="relative z-10">MY PROFILE</span>
                 <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/0 group-hover/nav:border-cyan-500/50 transition-all duration-300 pointer-events-none"></div>
                 <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/0 group-hover/nav:border-cyan-500/50 transition-all duration-300 pointer-events-none"></div>
              </Link>
            )}
            <button onClick={handleLogout} className="bg-rose-500/10 text-rose-500 px-4 py-1.5 rounded-xl text-[10px] uppercase font-black hover:bg-rose-500 hover:text-[#050505] transition-all cursor-pointer shadow-[0_0_15px_-3px_rgba(244,63,94,0.0)] hover:shadow-[0_0_15px_-3px_rgba(244,63,94,0.4)]">LOGOUT</button>
          </>
        ) : (
          <Link to="/auth" className="relative group overflow-hidden bg-[#050505] border border-sky-900/40 text-sky-400 px-6 py-2 rounded-xl text-[10px] uppercase font-black hover:bg-sky-500 hover:text-[#050505] transition-all shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]">
              <span className="relative z-10">SIGN IN</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;