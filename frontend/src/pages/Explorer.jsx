import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import Map from '../components/Map';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { transformImage } from '../utils/cloudinary';
import { Heart, Sparkles, Loader2 } from 'lucide-react';
import RouteDetailsSidebar from '../components/RouteDetailsSidebar';

const Explorer = () => {
  const { user, setUser } = useAuthStore(state => state);
  const location = useLocation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('All');
  const [showSidebar, setShowSidebar] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(5);
  const [formData, setFormData] = useState({ title: '', description: '', category: 'Urban', lat: 0, lng: 0 });
  const [selectedSpotId, setSelectedSpotId] = useState(null);
  const [isAutoWriting, setIsAutoWriting] = useState(false);
  const [feedView, setFeedView] = useState('discovery'); // discovery or following

  const { data: routes = [] } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const res = await api.get('/routes');
      return res.data;
    }
  });

  const { data: followingRoutes = [], isLoading: isFeedLoading } = useQuery({
    queryKey: ['followingFeed'],
    queryFn: async () => {
        const res = await api.get('/social/feed');
        return res.data;
    },
    enabled: feedView === 'following' && !!user
  });

  useEffect(() => {
    if (location.state?.focusId && routes.length > 0) {
        const target = routes.find(r => r._id === location.state.focusId);
        if (target) {
            setMapCenter([target.lat, target.lng]);
            setMapZoom(16);
            setSelectedSpotId(target._id);
        }
    }
    if (location.state?.focusCoords) {
        setMapCenter([location.state.focusCoords.lat, location.state.focusCoords.lng]);
        setMapZoom(15);
        if (location.state.focusGeneratedSpot) {
            const spot = location.state.focusGeneratedSpot;
            setFormData(prev => ({
                ...prev,
                title: spot.title || '',
                description: spot.description || '',
                category: ['Urban', 'Nature', 'Food', 'Historical'].includes(spot.category) ? spot.category : 'Urban',
                lat: spot.lat,
                lng: spot.lng
            }));
            setSelectedSpotId(null);
            setShowSidebar(true);
        }
    }
  }, [location.state, routes]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    socket.on('new_spot', (spot) => {
      if (spot.createdBy !== user?.user?.id && spot.createdBy !== user?.id) {
        toast('New spot discovered: ' + spot.title, { icon: '📍' });
        queryClient.invalidateQueries({ queryKey: ['routes'] });
      }
    });
    return () => socket.disconnect();
  }, [queryClient, user]);

  const addRouteMutation = useMutation({
    mutationFn: async (newRoute) => {
      return await api.post('/routes/add', newRoute);
    },
    onSuccess: () => {
      setShowSidebar(false);
      toast.success("Spot added successfully!");
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      setFormData({ title: '', description: '', category: 'Urban', lat: 0, lng: 0 });
      setImageFile(null);
    },
    onError: () => {
      toast.error("Error adding secret route.");
    }
  });

  const uploadToCloudinary = async () => {
    if (!imageFile) return null;

    if (!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME === 'undefined') {
      toast.error("Cloudinary error: Dev Server must be restarted to load .env!");
      return null;
    }

    const data = new FormData();
    data.append("file", imageFile);
    data.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    try {
      const res = await axios.post(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, data);
      return res.data.secure_url;
    } catch (err) {
      console.error("Cloudinary Upload Error:", err.response?.data || err);
      toast.error(`Image Upload Failed: ${err.response?.data?.error?.message || err.message}`);
      return null;
    }
  };

  const handleAutoWrite = async () => {
    if (!formData.title) return toast.error("Please enter a Spot Title first!");
    setIsAutoWriting(true);
    const loadingToast = toast.loading("AI is writing description...");
    try {
      const res = await api.post('/ai/describe', {
         title: formData.title,
         category: formData.category,
         lat: formData.lat,
         lng: formData.lng
      });
      setFormData(prev => ({ ...prev, description: res.data.description }));
      toast.success("Description generated!", { id: loadingToast });
    } catch (err) {
      toast.error("Failed to generate description", { id: loadingToast });
    } finally {
      setIsAutoWriting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Login to add spots!");
    setIsUploading(true);
    const imageUrl = await uploadToCloudinary();

    addRouteMutation.mutate({
      ...formData,
      image: imageUrl,
      userName: user?.user?.name || user?.name || 'Explorer'
    });

    setIsUploading(false);
  };

  const favoriteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/routes/${id}/favorite`);
      return res.data;
    },
    onSuccess: (newFavorites) => {
      setUser({ ...user, user: { ...user.user, favorites: newFavorites } });
      toast.success("Favorites updated!");
    }
  });

  const filteredRoutes = filter === 'All' ? routes : routes.filter(r => r.category === filter);

  return (
    <div className="flex flex-1 overflow-hidden relative bg-transparent">
      {/* Sidebar Overlay (Mobile) */}
      <div className={`absolute lg:relative z-40 h-full bg-[#030014]/60 backdrop-blur-md border-r border-white/10 transition-all duration-300 w-80 lg:w-96 ${showSidebar || !user ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 h-full flex flex-col">
          {!showSidebar ? (
            <>
              {/* Feed Toggle */}
              {user && (
                <div className="flex bg-[#0a0a0f]/80 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl mb-6 shadow-xl">
                    <button 
                        onClick={() => setFeedView('discovery')}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${feedView === 'discovery' ? 'bg-sky-500 text-sky-950 shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]' : 'text-white/60 hover:text-white'}`}
                    >
                        Discovery
                    </button>
                    <button 
                        onClick={() => setFeedView('following')}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${feedView === 'following' ? 'bg-sky-500 text-sky-950 shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]' : 'text-white/60 hover:text-white'}`}
                    >
                        Following
                    </button>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-3">{feedView === 'discovery' ? 'Explore Categories' : 'Recent from Following'}</h3>
                {feedView === 'discovery' && (
                    <div className="flex flex-wrap gap-2">
                    {['All', 'Urban', 'Nature', 'Food', 'Historical'].map((cat) => (
                        <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-2 rounded-xl text-[9px] font-black tracking-widest transition-all border ${filter === cat ? 'bg-sky-500 border-sky-500 text-sky-950 shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]' : 'bg-[#0a0a0f]/50 border-white/10 text-white/70 hover:border-sky-500/50 hover:text-white'}`}>{cat.toUpperCase()}</button>
                    ))}
                    </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                {feedView === 'following' && followingRoutes.length === 0 && (
                    <div className="text-center p-8 bg-[#0a0a0f]/80 backdrop-blur-md rounded-[1.25rem] border border-white/10 border-dashed text-white/60 text-[10px] font-bold">
                        No recent spots from people you follow. Explore more to find favorites!
                    </div>
                )}
                {(feedView === 'discovery' ? filteredRoutes : followingRoutes).map(r => (
                  <div key={r._id} onClick={() => { setMapCenter([r.lat, r.lng]); setMapZoom(14); setSelectedSpotId(r._id); }} className="relative bg-[#050505]/80 backdrop-blur-sm rounded-[1.25rem] border-t border-sky-900/40 p-5 shadow-2xl overflow-hidden group hover:bg-[#070707] transition-all cursor-pointer">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/20 to-transparent"></div>
                    
                    {/* Corner styling */}
                    <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none z-20">
                      <div className="absolute top-0 right-0 w-[1px] h-6 bg-sky-500/40 group-hover:bg-sky-400 group-hover:h-full transition-all duration-700"></div>
                      <div className="absolute top-0 right-0 w-6 h-[1px] bg-sky-500/40 group-hover:bg-sky-400 group-hover:w-full transition-all duration-700"></div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-12 h-12 pointer-events-none z-20">
                      <div className="absolute bottom-0 left-0 w-[1px] h-6 bg-sky-500/40 group-hover:bg-sky-400 group-hover:h-full transition-all duration-700"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-[1px] bg-sky-500/40 group-hover:bg-sky-400 group-hover:w-full transition-all duration-700"></div>
                    </div>

                    <div className="relative z-10 flex gap-4 items-center">
                      {r.image && (
                          <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/5 group-hover:border-sky-500/50 transition-colors shrink-0">
                              <img src={transformImage(r.image)} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110" alt="" />
                          </div>
                      )}
                      <div className="overflow-hidden flex-1">
                        <p className="font-black text-sm text-white group-hover:text-sky-400 truncate tracking-tight">{r.title}</p>
                        <p className="text-[11px] text-white/60 truncate mt-1 group-hover:text-white/90 transition-colors">{r.description}</p>
                      </div>
                      {user && (
                        <button
                          onClick={(e) => { e.stopPropagation(); favoriteMutation.mutate(r._id); }}
                          className={`p-2.5 rounded-xl transition-all shadow-lg relative z-30 ${user?.user?.favorites?.includes(r._id) ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : 'bg-black/40 border border-white/10 text-white/50 hover:text-rose-400 hover:bg-black/60'}`}
                        >
                          <Heart size={14} fill={user?.user?.favorites?.includes(r._id) ? "currentColor" : "none"} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-xl font-bold">New Spot 📍</h2>
              {/* <div className="text-[10px] text-sky-500 font-bold tracking-widest bg-sky-500/10 p-2 rounded">
                Active Upload Preset: {import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET}
              </div> */}
              <input className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl p-3 text-sm outline-none focus:border-sky-500/50 transition-colors" placeholder="Spot Title" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              <div className="flex justify-between items-end mb-1 mt-2">
                <label className="text-xs text-white/80 font-bold uppercase tracking-widest">Description</label>
                <button type="button" onClick={handleAutoWrite} disabled={isAutoWriting} className="text-[10px] text-sky-400 font-bold flex items-center gap-1 hover:text-sky-300 transition-colors bg-sky-500/10 px-2 py-1 rounded disabled:opacity-50">
                    {isAutoWriting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} AUTO-WRITE
                </button>
              </div>
              <textarea className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl p-3 h-24 text-sm outline-none resize-none focus:border-sky-500/50 transition-colors" placeholder="The secret details..." required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              <select className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl p-3 text-sm outline-none text-slate-300 mb-4 focus:border-sky-500/50 transition-colors" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                <option value="Urban">🏢 Urban</option>
                <option value="Nature">🌲 Nature</option>
                <option value="Food">🍔 Food</option>
                <option value="Historical">🏛️ Historical</option>
              </select>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="text-[10px] text-white/70" />
              <button type="submit" disabled={isUploading} className="w-full py-4 bg-sky-500 text-slate-950 rounded-xl font-black tracking-widest">{isUploading ? "UPLOADING..." : "SAVE SPOT"}</button>
              <button type="button" onClick={() => setShowSidebar(false)} className="w-full py-2 text-xs text-white/50 font-bold hover:text-white">CANCEL</button>
            </form>
          )}
        </div>
      </div>

      <main className="flex-1 relative overflow-hidden">
        {selectedSpotId && (
          <RouteDetailsSidebar
            spot={routes.find(r => r._id === selectedSpotId)}
            onClose={() => setSelectedSpotId(null)}
          />
        )}
        <Map routes={filteredRoutes} onMapClick={(coords) => { setFormData({ ...formData, ...coords }); setShowSidebar(true); }} center={mapCenter} zoom={mapZoom} onMarkerClick={setSelectedSpotId} />
      </main>
    </div>
  );
};

export default Explorer;