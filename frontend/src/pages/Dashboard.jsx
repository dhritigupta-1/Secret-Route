import { useQuery } from '@tanstack/react-query';
import api from '../api';
import { useAuthStore } from '../store/useAuthStore';
import { transformImage } from '../utils/cloudinary';
import { Heart, MessageSquare, MapPin } from 'lucide-react';

const Dashboard = () => {
  const user = useAuthStore(state => state.user);

  const { data: mySpots = [], isLoading, error } = useQuery({
    queryKey: ['mySpots'],
    queryFn: async () => {
      const res = await api.get('/routes/mine');
      return res.data;
    },
    enabled: !!user
  });

  return (
    <div className="p-10 overflow-y-auto h-full bg-transparent relative z-10">
      <h1 className="text-4xl font-black text-white mb-2 italic">Welcome, {user?.name || user?.user?.name || 'Explorer'}</h1>
      <p className="text-slate-500 mb-8 uppercase tracking-widest text-xs font-bold">Your Secret Discoveries</p>

      {isLoading && <p className="text-blue-500 font-bold animate-pulse tracking-widest text-xs">LOADING DISCOVERIES...</p>}
      {error && <p className="text-rose-500">Error syncing data.</p>}
      
      {!isLoading && !error && mySpots.length === 0 ? (
        <p className="text-slate-400">You haven't logged any secret spots yet. Go to the Map to start!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {mySpots.map(spot => (
            <div key={spot._id} className="bg-[#050505] rounded-[1.25rem] overflow-hidden border-t border-blue-900/40 shadow-2xl group hover:bg-[#070707] transition-all">
              <img src={transformImage(spot.image) || 'https://via.placeholder.com/300'} className="w-full h-48 object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{spot.title}</h3>
                <p className="text-slate-400 text-xs line-clamp-2">{spot.description}</p>
                <div className="mt-6 flex flex-wrap gap-4 text-[10px] font-black tracking-widest uppercase text-slate-500 items-center justify-start">
                  <span className="flex items-center gap-1.5 bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded"><MapPin size={12} /> {spot.category}</span>
                  <span className="flex items-center gap-1.5"><Heart size={12} className="text-rose-500" /> {spot.ratingScore || 0}/5</span>
                  <span className="flex items-center gap-1.5"><MessageSquare size={12} className="text-indigo-400" /> {spot.comments?.length || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;