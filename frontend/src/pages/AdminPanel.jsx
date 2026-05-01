import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const AdminPanel = () => {
  const queryClient = useQueryClient();

  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['admin_metrics'],
    queryFn: async () => {
      const res = await api.get('/admin/metrics');
      return res.data;
    }
  });

  const { data: allUsers = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data;
    }
  });

  const blockMutation = useMutation({
    mutationFn: async (id) => {
      return await api.patch(`/admin/users/${id}/block`);
    },
    onSuccess: () => {
      toast.success("User status updated.");
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      queryClient.invalidateQueries({ queryKey: ['admin_metrics'] });
    }
  });



  return (
    <div className="p-10 overflow-y-auto h-full bg-transparent relative z-10">
      <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">Admin Control Center</h1>
      <p className="text-slate-500 mb-8 font-bold tracking-widest uppercase text-[10px]">Platform Metrics & Moderation</p>

        {/* Dashboard Metrics */}
        {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-[#050505] border border-white/5 rounded-[1.5rem] p-8 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="text-slate-400 font-black tracking-widest uppercase text-[10px] mb-2">Total Explorers</div>
                    <div className="text-5xl font-black text-white tracking-tighter">{metrics.totalUsers}</div>
                </div>
                <div className="bg-[#050505] border border-white/5 rounded-[1.5rem] p-8 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="text-slate-400 font-black tracking-widest uppercase text-[10px] mb-2">Total Discoveries</div>
                    <div className="text-5xl font-black text-white tracking-tighter">{metrics.totalSpots}</div>
                </div>
                <div className="bg-[#050505] border border-white/5 rounded-[1.5rem] p-8 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="text-slate-400 font-black tracking-widest uppercase text-[10px] mb-2">Platform Views</div>
                    <div className="text-5xl font-black text-white tracking-tighter">{metrics.totalViews}</div>
                </div>

                {/* Categories CSS Chart */}
                <div className="md:col-span-3 bg-[#050505] border border-white/5 rounded-[1.5rem] p-8 shadow-xl">
                    <div className="text-slate-400 font-black tracking-widest uppercase text-[10px] mb-6">Category Distribution ({metrics.totalSpots} Total)</div>
                    <div className="flex w-full h-8 rounded-full overflow-hidden mb-4 border border-slate-700/50">
                        <div style={{ width: `${((metrics.categoryStats?.Urban || 0) / (metrics.totalSpots || 1)) * 100}%`}} className="bg-blue-500 hover:bg-blue-400 transition-colors"></div>
                        <div style={{ width: `${((metrics.categoryStats?.Nature || 0) / (metrics.totalSpots || 1)) * 100}%`}} className="bg-emerald-500 hover:bg-emerald-400 transition-colors"></div>
                        <div style={{ width: `${((metrics.categoryStats?.Food || 0) / (metrics.totalSpots || 1)) * 100}%`}} className="bg-amber-500 hover:bg-amber-400 transition-colors"></div>
                        <div style={{ width: `${((metrics.categoryStats?.Historical || 0) / (metrics.totalSpots || 1)) * 100}%`}} className="bg-purple-500 hover:bg-purple-400 transition-colors"></div>
                    </div>
                    <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-widest text-slate-300 pointer-events-none">
                        <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div> Urban ({metrics.categoryStats?.Urban || 0})</span>
                        <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div> Nature ({metrics.categoryStats?.Nature || 0})</span>
                        <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div> Food ({metrics.categoryStats?.Food || 0})</span>
                        <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div> Historical ({metrics.categoryStats?.Historical || 0})</span>
                    </div>
                </div>
            </div>
        )}

      <div className="w-full h-px bg-slate-800 my-10"></div>
      <h2 className="text-2xl font-black text-white mb-6 tracking-tighter">User Management</h2>
      
      <div className="space-y-4">
        {allUsers.map(user => (
          <div key={user._id} className={`bg-[#050505] border ${user.isBlocked ? 'border-rose-500/50 grayscale' : 'border-white/5'} p-6 rounded-[1.5rem] flex items-center justify-between transition-all`}>
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#0a0a0f] rounded-full flex items-center justify-center font-black text-slate-400 border border-white/5">
                    {user.name.charAt(0)}
                </div>
                <div>
                    <h3 className="font-bold text-white flex items-center gap-2">
                        {user.name} 
                        {user.isBlocked && <span className="text-[8px] bg-rose-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">SUSPENDED</span>}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{user.email} • {user.points || 0} PTS</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Link 
                    to={`/profile/${user._id}`}
                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#0a0a0f] border border-white/5 text-slate-400 hover:text-white transition-all"
                >
                    VIEW ACTIVITY
                </Link>
                <button 
                    onClick={() => blockMutation.mutate(user._id)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${user.isBlocked ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white'}`}
                >
                    {user.isBlocked ? 'REINSTATE USER' : 'BLOCK USER'}
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPanel;