import { useQuery } from '@tanstack/react-query';
import api from '../api';
import { Trophy, Medal, Award, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

const Leaderboard = () => {
  const { data: leaders = [], isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const res = await api.get('/auth/leaderboard');
      return res.data;
    }
  });

  const getRankIcon = (index) => {
    switch(index) {
        case 0: return <Trophy size={32} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />;
        case 1: return <Medal size={28} className="text-slate-300 drop-shadow-[0_0_10px_rgba(203,213,225,0.5)]" />;
        case 2: return <Medal size={26} className="text-amber-600 drop-shadow-[0_0_10px_rgba(217,119,6,0.5)]" />;
        default: return <span className="text-xl font-black text-slate-600 w-8 text-center">{index + 1}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col font-sans relative z-10">
      <div className="flex-1 max-w-4xl mx-auto w-full p-8 mt-16">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-black tracking-tighter mb-4 flex items-center justify-center gap-4">
                <Flame size={40} className="text-rose-500" /> 
                Global Leaderboard
                <Flame size={40} className="text-rose-500" />
            </h1>
            <p className="text-slate-500 font-bold tracking-widest uppercase text-sm">Top 10 Secret Route Explorers</p>
        </div>

        {isLoading ? (
            <div className="text-center text-yellow-500 font-bold animate-pulse uppercase tracking-widest text-sm">Loading rankings...</div>
        ) : (
            <div className="space-y-4">
                {leaders.map((u, idx) => (
                    <Link 
                        to={`/profile/${u._id}`} 
                        key={u._id} 
                        className={`flex items-center gap-6 p-6 rounded-[1.5rem] transition-all duration-300 hover:-translate-y-1 block ${idx === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-[#050505] border border-yellow-500/30 shadow-[0_0_30px_-5px_rgba(250,204,21,0.15)]' : 'bg-[#050505] border-t border-yellow-900/40 hover:bg-[#070707]'}`}
                    >
                        <div className="flex items-center justify-center w-12 h-12">
                            {getRankIcon(idx)}
                        </div>
                        <div className="w-14 h-14 rounded-full bg-[#0a0a0f] text-slate-300 flex items-center justify-center font-black text-2xl shadow-inner border border-white/5">
                            {u.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <h2 className={`text-2xl font-black tracking-tight ${idx === 0 ? 'text-yellow-400' : 'text-white'}`}>{u.name}</h2>
                            <div className="flex items-center gap-4 mt-1 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <span className={u.role === 'admin' ? 'text-rose-500' : ''}>{u.role}</span>
                                {u.badges && u.badges.length > 0 && (
                                    <span className="flex items-center gap-1 text-yellow-400"><Award size={12} /> {u.badges.length} Badges</span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-4xl font-black tracking-tighter ${idx === 0 ? 'text-yellow-400' : 'text-white'}`}>{u.points || 0}</div>
                            <div className="text-[10px] text-yellow-500 font-black uppercase tracking-widest">Points earned</div>
                        </div>
                    </Link>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
