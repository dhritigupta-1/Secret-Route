import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../api';
import { transformImage } from '../utils/cloudinary';
import { MapPin, Heart, MessageSquare, Sparkles, UserPlus, UserMinus, Edit2, Check, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('discovered'); // discovered or collections
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      const res = await api.get(`/routes/user/${id}`);
      return res.data;
    }
  });

  const { data: recommendations = [], isLoading: isRecLoading } = useQuery({
    queryKey: ['recommendations', id],
    queryFn: async () => {
      if (!data?.user?.favorites || data.user.favorites.length === 0) return [];
      const res = await api.post('/ai/personalize', { favorites: data.user.favorites });
      return res.data.spots || [];
    },
    enabled: !!data?.user?.favorites?.length,
    staleTime: 1000 * 60 * 5,
  });

  const { data: followData } = useQuery({
    queryKey: ['followStatus', id],
    queryFn: async () => {
        const res = await api.get(`/social/is-following/${id}`);
        return res.data;
    },
    enabled: !!currentUser && currentUser?.user?.id !== id && currentUser?.id !== id
  });

  const followMutation = useMutation({
    mutationFn: async () => {
        return await api.post(`/social/follow/${id}`);
    },
    onSuccess: () => {
        queryClient.invalidateQueries(['followStatus', id]);
        toast.success(followData?.isFollowing ? 'Unfollowed user' : 'User followed!');
    }
  });

  const updateBioMutation = useMutation({
    mutationFn: async (newBio) => {
        return await api.patch('/auth/profile', { bio: newBio });
    },
    onSuccess: () => {
        setIsEditingBio(false);
        queryClient.invalidateQueries(['profile', id]);
        toast.success("Bio updated!");
    }
  });

  const { data: userCollections = [] } = useQuery({
    queryKey: ['userCollections', id],
    queryFn: async () => {
        const res = await api.get('/social/collections/mine'); // Simple for now, ideally needs /user/:id/collections
        return res.data;
    },
    enabled: activeTab === 'collections'
  });

  if (isLoading) return <div className="min-h-screen bg-transparent text-white flex items-center justify-center relative z-10">Loading...</div>;
  if (error || !data) return <div className="min-h-screen bg-transparent text-white flex items-center justify-center font-bold text-xl relative z-10">User not found</div>;

  const { user, spots } = data;

  if (user.role === 'admin') {
    return (
        <div className="min-h-screen bg-transparent text-white flex flex-col items-center justify-center gap-4 relative z-10">
            <div className="p-6 bg-[#050505] border border-white/5 rounded-[1.5rem] text-center shadow-2xl">
                <h2 className="text-2xl font-black text-cyan-400 mb-2">PRIVATE ACCOUNT</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Administrative profiles are hidden from public view.</p>
                <Link to="/" className="mt-6 inline-block bg-[#0a0a0f] border border-white/5 px-6 py-2 rounded-xl text-[10px] font-black hover:border-cyan-500/30 transition-all">RETURN TO MAP</Link>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col font-sans relative z-10">
      <div className="flex-1 max-w-5xl mx-auto w-full p-8 mt-16">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Left Sidebar Profile Info */}
          <div className="w-full md:w-1/3 bg-[#050505]/50 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 sticky top-24 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center text-2xl font-black text-[#050505] uppercase shadow-lg">
                {user.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight leading-none mb-1">{user.name}</h1>
                <div className="flex gap-2 items-center">
                    <span className="text-[10px] uppercase tracking-widest font-black text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded">{user.role}</span>
                    {currentUser && (currentUser?.user?.id === id || currentUser?.id === id) && (
                        <button onClick={() => { setIsEditingBio(true); setBioText(user.bio || ''); }} className="text-slate-500 hover:text-white transition-colors cursor-pointer"><Edit2 size={12} /></button>
                    )}
                </div>
              </div>
            </div>

            <div className="mb-6">
                {isEditingBio ? (
                    <div className="space-y-3">
                        <textarea 
                            className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl p-3 text-xs text-slate-300 h-24 resize-none outline-none focus:border-cyan-500/50 transition-colors"
                            value={bioText}
                            onChange={(e) => setBioText(e.target.value)}
                            placeholder="Tell the world about your discoveries..."
                        />
                        <div className="flex gap-2">
                             <button onClick={() => updateBioMutation.mutate(bioText)} className="flex-1 bg-cyan-500 text-[#050505] py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all flex items-center justify-center gap-1 shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]"><Check size={14}/> Save</button>
                             <button onClick={() => setIsEditingBio(false)} className="flex-1 bg-[#0a0a0f] border border-white/5 text-slate-400 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:border-rose-500/30 hover:text-rose-400 transition-all flex items-center justify-center gap-1"><X size={14}/> Cancel</button>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-slate-400 leading-relaxed italic">{user.bio || "This explorer prefers mystery (no bio yet)."}</p>
                )}
            </div>

            {currentUser && currentUser?.user?.id !== id && currentUser?.id !== id && (
                <button 
                    onClick={() => followMutation.mutate()}
                    disabled={followMutation.isLoading}
                    className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest mb-6 transition-all flex items-center justify-center gap-2 border ${followData?.isFollowing ? 'bg-[#0a0a0f] border-white/5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30' : 'bg-cyan-500 border-cyan-500 text-[#050505] hover:bg-cyan-400 shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]'}`}
                >
                    {followData?.isFollowing ? <><UserMinus size={16}/> Unfollow</> : <><UserPlus size={16}/> Follow Explorer</>}
                </button>
            )}
            
            {user.role !== 'admin' && (
              <>
                <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <span>Rank: {user.points >= 1000 ? 'Legend' : user.points >= 500 ? 'Master' : user.points >= 100 ? 'Explorer' : 'Novice'}</span>
                        <span>•</span>
                        <span className="text-amber-500">{user.badges?.length || 0} Badges</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                  <div className="bg-[#0a0a0f] p-4 rounded-2xl flex flex-col items-center justify-center border border-white/5">
                    <span className="text-3xl font-black text-white">{spots.length}</span>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 text-center">Spots Created</span>
                  </div>
                  <div className="bg-[#0a0a0f] p-4 rounded-2xl flex flex-col items-center justify-center border border-white/5">
                    <span className="text-3xl font-black text-yellow-500">{user.points || 0}</span>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 text-center">Rep Points</span>
                  </div>
                  <div className="bg-[#0a0a0f] p-4 rounded-2xl flex flex-col items-center justify-center border border-white/5">
                    <span className="text-3xl font-black text-blue-400">{spots.reduce((acc, s) => acc + (s.views || 0), 0)}</span>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 text-center">Total Views</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Sidebar Spots Grid */}
          <div className="w-full md:w-2/3">
            <div className="flex gap-8 border-b border-slate-800 mb-8">
                <button onClick={() => setActiveTab('discovered')} className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'discovered' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}>
                    Discovered Spots
                    {activeTab === 'discovered' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400" />}
                </button>
                <button onClick={() => setActiveTab('collections')} className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'collections' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}>
                    Collections
                    {activeTab === 'collections' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400" />}
                </button>
            </div>

            {activeTab === 'discovered' ? (
                <>
                <h2 className="text-3xl font-black tracking-tighter mb-6">{user.name}'s Discovered Spots</h2>
                {spots.length === 0 ? (
                    <div className="bg-[#050505] rounded-[2rem] border-t border-cyan-900/30 p-12 text-center text-slate-500 font-bold">No spots discovered yet.</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {spots.map(spot => (
                        <div key={spot._id} className="bg-[#050505] rounded-[1.25rem] overflow-hidden border-t border-cyan-900/40 shadow-xl group hover:bg-[#070707] transition-all">
                            <img src={transformImage(spot.image) || 'https://via.placeholder.com/300'} className="w-full h-48 object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                            <div className="p-6">
                                <h3 className="text-xl font-black tracking-tight mb-2 group-hover:text-cyan-400 transition-colors leading-tight">{spot.title}</h3>
                                <p className="text-slate-400 text-xs line-clamp-2">{spot.description}</p>
                                <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-black tracking-widest uppercase text-slate-500">
                                    <span className="flex items-center gap-1.5"><MapPin size={12} /> {spot.category}</span>
                                    <span className="flex items-center gap-1.5"><Heart size={12} className="text-rose-500" /> {spot.ratingScore || 0}/5</span>
                                    <span className="flex items-center gap-1.5"><MessageSquare size={12} className="text-emerald-500" /> {spot.comments?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    </div>
                )}
                </>
            ) : (
                <>
                <h2 className="text-3xl font-black tracking-tighter mb-6">{user.name}'s Collections</h2>
                {userCollections.length === 0 ? (
                    <div className="bg-[#050505] rounded-[2rem] border-t border-cyan-900/30 p-12 text-center text-slate-500 font-bold">No collections created yet.</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {userCollections.map(c => (
                            <div key={c._id} className="p-6 bg-[#050505] rounded-[1.25rem] border-t border-cyan-900/40 hover:bg-[#070707] transition-all group">
                                <span className="text-4xl mb-4 block">📁</span>
                                <h3 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors">{c.name}</h3>
                                <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-widest">{c.routes?.length || 0} SPOTS</p>
                            </div>
                        ))}
                    </div>
                )}
                </>
            )}
          </div>
        </div>

        {/* AI Recommendations Section */}
        {user.favorites?.length > 0 && (
          <div className="mt-16 w-full">
            <h2 className="text-3xl font-black tracking-tighter mb-2 flex items-center gap-2">
                <Sparkles size={24} className="text-cyan-400" /> AI Recommended For {user.name.split(' ')[0]}
            </h2>
            <p className="text-slate-500 font-bold mb-8 text-sm">Based on {user.name.split(' ')[0]}'s favorite map discoveries</p>
            
            {isRecLoading ? (
                <div className="flex items-center gap-4 text-cyan-500 font-bold uppercase tracking-widest text-xs animate-pulse">
                    <Sparkles size={16} /> Generating Magic...
                </div>
            ) : recommendations.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 font-bold">No new spots to recommend right now.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {recommendations.map(spot => (
                    <Link to="/" state={{ focusId: spot._id }} key={spot._id} className="bg-[#050505] rounded-[1.25rem] overflow-hidden border-t border-cyan-900/40 shadow-xl group hover:bg-[#070707] transition-all block">
                        <img src={transformImage(spot.image) || 'https://via.placeholder.com/300'} className="w-full h-40 object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                        <div className="p-6">
                            <h3 className="text-xl font-black tracking-tight mb-2 group-hover:text-cyan-400 transition-colors leading-tight">{spot.title}</h3>
                            <p className="text-slate-400 text-xs line-clamp-2">{spot.description}</p>
                            <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-black tracking-widest uppercase text-slate-500">
                                <span className="flex items-center gap-1.5"><MapPin size={12} /> {spot.category}</span>
                            </div>
                        </div>
                    </Link>
                ))}
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
