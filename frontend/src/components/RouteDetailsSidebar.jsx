import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, MapPin, Navigation, Send, MessageSquare, Globe, Loader2, BookmarkPlus, Plus } from 'lucide-react';
import { transformImage } from '../utils/cloudinary';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';

const RouteDetailsSidebar = ({ spot, onClose }) => {
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null); // { id, userName }
  const [hoverRating, setHoverRating] = useState(0);
  const [translatedDesc, setTranslatedDesc] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showCollections, setShowCollections] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();

  const userRatingInfo = spot?.ratings?.find(r => r.user === user?.user?.id || r.user === user?.id);

  useEffect(() => {
    if (spot?._id) {
      api.post(`/routes/${spot._id}/view`).catch(e => console.error("View tracking error", e));
    }
  }, [spot?._id]);

  const commentMutation = useMutation({
    mutationFn: async ({ text, parentId = null }) => {
      const res = await api.post(`/routes/${spot._id}/comment`, { 
        text, 
        userName: user?.user?.name || user?.name,
        parentId 
      });
      return res.data;
    },
    onSuccess: () => {
      setCommentText('');
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
        return await api.delete(`/social/routes/${spot._id}/comment/${commentId}`);
    },
    onSuccess: () => {
        toast.success("Comment deleted");
        queryClient.invalidateQueries({ queryKey: ['routes'] });
    }
  });

  const editCommentMutation = useMutation({
    mutationFn: async ({ commentId, text }) => {
        return await api.patch(`/social/routes/${spot._id}/comment/${commentId}`, { text });
    },
    onSuccess: () => {
        setEditingCommentId(null);
        toast.success("Comment updated");
        queryClient.invalidateQueries({ queryKey: ['routes'] });
    }
  });

  const rateMutation = useMutation({
    mutationFn: async (rating) => {
      const res = await api.post(`/routes/${spot._id}/rate`, { rating });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Rated successfully!");
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    }
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['myCollections'],
    queryFn: async () => {
        const res = await api.get('/social/collections/mine');
        return res.data;
    },
    enabled: !!user && showCollections
  });

  const addToCollectionMutation = useMutation({
    mutationFn: async (collectionId) => {
        return await api.patch(`/social/collections/${collectionId}/add`, { routeId: spot._id });
    },
    onSuccess: () => {
        toast.success("Added to collection!");
        setShowCollections(false);
    }
  });

  const createCollectionMutation = useMutation({
    mutationFn: async (name) => {
        return await api.post('/social/collections', { name });
    },
    onSuccess: () => {
        setNewCollectionName('');
        queryClient.invalidateQueries(['myCollections']);
        toast.success("Collection created!");
    }
  });

  const handleTranslate = async () => {
    if (translatedDesc) {
      setTranslatedDesc(null);
      return;
    }
    setIsTranslating(true);
    const loadingToast = toast.loading("AI is translating...");
    try {
      const languageName = new Intl.DisplayNames(['en'], { type: 'language' }).of(navigator.language.split('-')[0]) || navigator.language;
      const res = await api.post('/ai/translate', {
        text: spot.description,
        targetLanguage: languageName
      });
      setTranslatedDesc(res.data.translatedText);
      toast.success("Translated!", { id: loadingToast });
    } catch (err) {
      toast.error("Translation failed", { id: loadingToast });
    } finally {
      setIsTranslating(false);
    }
  };

  if (!spot) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute top-0 right-0 h-full w-full md:w-[450px] bg-[#050505]/95 backdrop-blur-2xl border-l border-white/5 z-[2000] shadow-[[-20px_0_50px_rgba(0,0,0,0.8)]] flex flex-col pt-16"
      >
        <button onClick={onClose} className="absolute top-20 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full z-10 transition-colors">
          <X size={20} />
        </button>

        <div className="overflow-y-auto flex-1 pb-24 custom-scrollbar">
          {spot.image ? (
            <img src={transformImage(spot.image)} className="w-full h-64 object-cover" alt="" />
          ) : (
            <div className="w-full h-64 bg-[#0a0a0f] flex items-center justify-center">
               <MapPin size={48} className="text-slate-600" />
            </div>
          )}

          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
               <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded">{spot.category}</span>
               <div className="flex items-center gap-1.5 text-rose-500 font-black">
                 <Star size={16} fill="currentColor" />
                 <span>{spot.ratingScore > 0 ? spot.ratingScore : "New"}</span>
                 <span className="text-slate-500 text-xs ml-1 font-bold">({spot.ratings?.length || 0})</span>
               </div>
            </div>

            <div className="flex justify-between items-end mb-2">
                <h2 className="text-3xl font-black text-white tracking-tight leading-tight">{spot.title}</h2>
                <button onClick={handleTranslate} disabled={isTranslating} className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-50" title="Translate Description">
                    {isTranslating ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
                </button>
            </div>
            
            <p className="text-sm text-slate-400 mb-6 leading-relaxed bg-[#0a0a0f]/50 p-4 rounded-2xl border border-white/5">
                {translatedDesc || spot.description}
            </p>

            <div className="flex items-center justify-between py-4 border-y border-white/5 mb-6">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-black shadow-lg">
                   {spot.creatorName?.charAt(0) || '?'}
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Discovered By</span>
                   <Link to={`/profile/${spot.createdBy}`} className="text-sm font-black text-slate-200 hover:text-emerald-400 transition-colors">{spot.creatorName || 'Explorer'}</Link>
                 </div>
               </div>
               
               <button 
                 onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`, '_blank')}
                 className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-4 py-2 rounded-xl font-bold transition-all shadow-lg"
               >
                 <Navigation size={14} fill="currentColor" /> Navigate
               </button>
            </div>

            {/* Collections Trigger */}
            {user && (
                <div className="mb-6 relative">
                   <button 
                       onClick={() => setShowCollections(!showCollections)}
                       className="w-full py-3 bg-[#0a0a0f] border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:border-emerald-500/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                   >
                       <BookmarkPlus size={14} /> Save to Collection
                   </button>

                   {showCollections && (
                       <div className="absolute top-12 left-0 w-full bg-[#050505] border border-white/5 rounded-2xl shadow-2xl z-30 p-2 overflow-hidden">
                           <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                               {collections.length === 0 ? (
                                   <p className="text-[10px] text-slate-500 text-center py-4 font-bold uppercase tracking-widest">No collections yet</p>
                               ) : (
                                   collections.map(c => (
                                       <button 
                                           key={c._id} 
                                           onClick={() => addToCollectionMutation.mutate(c._id)}
                                           className="w-full text-left p-3 hover:bg-emerald-500 hover:text-slate-950 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all mb-1 cursor-pointer flex items-center gap-2"
                                       >
                                           <span className="opacity-50">📁</span> {c.name}
                                       </button>
                                   ))
                               )}
                           </div>
                           <div className="mt-2 border-t border-white/5 p-2 flex gap-2">
                               <input 
                                   className="flex-1 bg-[#0a0a0f] border border-white/5 rounded-lg px-3 py-2 text-[10px] font-bold text-white outline-none focus:border-emerald-500/50 transition-colors"
                                   placeholder="New list name..."
                                   value={newCollectionName}
                                   onChange={(e) => setNewCollectionName(e.target.value)}
                               />
                               <button 
                                   onClick={() => newCollectionName && createCollectionMutation.mutate(newCollectionName)}
                                   className="p-2 bg-emerald-500 text-slate-950 rounded-lg hover:bg-emerald-400 transition-all cursor-pointer"
                                   title="Create Collection"
                               >
                                   <Plus size={14} />
                               </button>
                           </div>
                       </div>
                   )}
                </div>
            )}

            {/* Rating System */}
            {user && (
                <div className="mb-8 bg-[#0a0a0f]/40 p-4 rounded-2xl flex flex-col items-center border border-white/5">
                    <span className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">Rate this spot</span>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button 
                                key={star}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => rateMutation.mutate(star)}
                                disabled={rateMutation.isPending}
                            >
                                <Star 
                                    size={28} 
                                    className={`transition-all ${star <= (hoverRating || userRatingInfo?.rating || 0) ? 'text-rose-500 hover:scale-110 drop-shadow-md' : 'text-slate-600 hover:scale-110'}`}
                                    fill={star <= (hoverRating || userRatingInfo?.rating || 0) ? "currentColor" : "none"}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Comments Section */}
            <div className="mb-6 flex items-center gap-2 text-white font-black text-lg">
                <MessageSquare size={18} className="text-emerald-500" />
                <h3>Discussion <span className="text-slate-500 text-sm ml-1 font-bold">({spot.comments?.length || 0})</span></h3>
            </div>
            
            <div className="flex flex-col gap-4">
                {(spot.comments || []).length === 0 && (
                    <div className="text-center p-6 border border-white/10 border-dashed rounded-2xl text-slate-500 text-xs font-bold uppercase tracking-widest">No comments yet. Be the first!</div>
                )}
                
                {/* Render Top Level Comments & Their Replies */}
                {(spot.comments || []).filter(c => !c.parentId).map((c, i) => (
                    <div key={c._id || i} className="group/comment">
                        <div className="bg-[#0a0a0f]/60 p-4 rounded-2xl border border-white/5 shadow-inner group-hover/comment:border-emerald-500/30 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <Link to={`/profile/${c.user}`} className="text-xs font-black text-emerald-400 hover:text-emerald-300 transition-colors hover:underline">{c.userName || "Unknown"}</Link>
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : 'Just now'}</span>
                                    {(user?.user?.id === c.user || user?.id === c.user) && (
                                        <button onClick={() => deleteCommentMutation.mutate(c._id)} className="text-slate-600 hover:text-rose-500 transition-colors"><X size={10}/></button>
                                    )}
                                </div>
                            </div>
                            
                            {editingCommentId === c._id ? (
                                <div className="space-y-2">
                                    <input 
                                        className="w-full bg-black border border-white/5 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500/50"
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => editCommentMutation.mutate({ commentId: c._id, text: editText })} className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Update</button>
                                        <button onClick={() => setEditingCommentId(null)} className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-slate-300 leading-relaxed font-medium">{c.text}</p>
                                    <div className="flex gap-3 mt-2">
                                        <button 
                                            onClick={() => setReplyTo({ id: c._id, userName: c.userName })}
                                            className="text-[9px] font-black text-slate-500 hover:text-emerald-400 uppercase tracking-widest flex items-center gap-1 transition-colors"
                                        >
                                            <Send size={10} className="rotate-45" /> Reply
                                        </button>
                                        {(user?.user?.id === c.user || user?.id === c.user) && (
                                            <button 
                                                onClick={() => { setEditingCommentId(c._id); setEditText(c.text); }}
                                                className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Render Replies */}
                        <div className="ml-8 mt-3 space-y-3 border-l-2 border-white/5 pl-4">
                            {(spot.comments || []).filter(reply => reply.parentId === c._id).map((reply, ri) => (
                                <div key={reply._id || ri} className="bg-[#0a0a0f]/30 p-3 rounded-xl border border-white/5">
                                    <div className="flex items-center justify-between mb-1">
                                        <Link to={`/profile/${reply.user}`} className="text-[10px] font-bold text-emerald-400">{reply.userName}</Link>
                                        <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">{reply.createdAt ? formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true }) : 'Just now'}</span>
                                    </div>
                                    <p className="text-xs text-slate-400">{reply.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

          </div>
        </div>

        {/* Comment Input */}
        {user ? (
            <div className="absolute bottom-0 left-0 w-full p-4 bg-[#050505]/95 backdrop-blur-md border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] z-20">
                {replyTo && (
                    <div className="mb-2 flex items-center justify-between bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                        <span className="text-[10px] text-emerald-400 font-bold">Replying to <span className="underline">@{replyTo.userName}</span></span>
                        <button onClick={() => setReplyTo(null)} className="text-slate-500 hover:text-white"><X size={12}/></button>
                    </div>
                )}
                <form onSubmit={(e) => { e.preventDefault(); if(commentText) commentMutation.mutate({ text: commentText, parentId: replyTo?.id }); }} className="relative flex items-center">
                    <input 
                        type="text" 
                        placeholder={replyTo ? "Write a reply..." : "Share your thoughts..."} 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="w-full bg-[#0a0a0f] border border-white/5 rounded-2xl py-4 pl-5 pr-14 text-sm font-bold text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none placeholder:text-slate-600 shadow-inner"
                    />
                    <button type="submit" disabled={!commentText || commentMutation.isPending} className="absolute right-2 p-2.5 bg-emerald-500 text-emerald-950 rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-50">
                        <Send size={18} fill="currentColor" />
                    </button>
                </form>
            </div>
        ) : (
            <div className="absolute bottom-0 left-0 w-full p-6 bg-[#050505] border-t border-white/10 text-center shadow-[0_-10px_40px_rgba(0,0,0,0.8)] z-20">
                <Link to="/auth" className="text-xs text-white bg-[#0a0a0f] border border-white/5 hover:border-emerald-500/30 px-6 py-3 rounded-full font-black uppercase tracking-widest transition-colors">Log in to comment & rate</Link>
            </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default RouteDetailsSidebar;
