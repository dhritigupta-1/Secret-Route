import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Sparkles, Send, MapPin, Eraser, Loader2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AiExplorer = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('ai_chat_history');
    if (saved) return JSON.parse(saved);
    return [
      { role: 'ai', text: "Hello! I am your Hidden Path Concierge. Tell me what kind of vibe you are looking for today, and I'll find the perfect secret spots for you! ✨" }
    ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('ai_chat_history', JSON.stringify(messages));
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const res = await api.post('/ai/recommend', { prompt: input });
      const aiMessage = { 
        role: 'ai', 
        text: res.data.text,
        spots: res.data.spots,
        isItinerary: res.data.isItinerary
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      toast.error("The AI is resting right now. Try again later!");
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-transparent text-slate-100 overflow-hidden relative z-10">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#050505]/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
                    AI CONCIERGE <Sparkles size={18} className="text-purple-400 animate-pulse" />
                </h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Powered by Google Gemini</p>
            </div>
        </div>
        <button 
            onClick={() => setMessages([{ role: 'ai', text: "Hello! I am your Hidden Path Concierge. Tell me what kind of vibe you are looking for today, and I'll find the perfect secret spots for you! ✨" }])}
            className="text-[10px] font-bold text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
        >
            <Eraser size={12} /> CLEAR CHAT
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] lg:max-w-[60%] space-y-4`}>
                <div className={`p-5 rounded-2xl text-sm leading-relaxed shadow-xl border ${
                  m.role === 'user' 
                  ? 'bg-purple-500 border-purple-500 text-[#050505] font-bold rounded-tr-none shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)]' 
                  : 'bg-[#0a0a0f] border-white/5 text-slate-200 rounded-tl-none'
                }`}>
                  {m.text}
                </div>

                {/* AI Recommendations Cards */}
                {m.spots && m.spots.length > 0 && (
                  <div className={m.isItinerary ? "flex flex-col gap-4 mt-6 pl-5 border-l-2 border-dashed border-purple-500/50" : "grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4"}>
                    {m.spots.map((spot, idx) => (
                      <motion.div 
                        whileHover={{ y: -5 }}
                        key={spot._id} 
                        className="bg-[#050505] border-t border-purple-900/40 shadow-lg p-3 rounded-[1.25rem] flex items-center gap-3 group transition-all hover:bg-[#070707] relative"
                      >
                        {m.isItinerary && (
                            <div className="absolute -left-[35px] top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-purple-500 border-[3px] border-slate-900 flex items-center justify-center text-[10px] font-black text-[#050505] z-10 shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)]" title={`Stop ${idx + 1}`}>
                                {idx + 1}
                            </div>
                        )}
                        {spot.image ? (
                            <img src={spot.image} className="w-12 h-12 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all" />
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center text-xl shadow-inner">📍</div>
                        )}
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors truncate">{spot.title}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-black">{spot.category}</p>
                        </div>
                        <button 
                          onClick={() => navigate('/', { 
                            state: spot.isGenerated 
                              ? { focusCoords: { lat: spot.lat, lng: spot.lng }, focusGeneratedSpot: spot }
                              : { focusId: spot._id } 
                          })}
                          className="p-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500 hover:text-white transition-all shadow-sm"
                          title="View on Map"
                        >
                          <MapPin size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
            <div className="flex justify-start">
                <div className="bg-[#0a0a0f] border border-white/5 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                    <Loader2 size={16} className="animate-spin text-purple-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Generating map magic...</span>
                </div>
            </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-[#030014]/80 backdrop-blur-md border-t border-white/5">
        <div className="max-w-4xl mx-auto relative group">
          <input 
            type="text" 
            placeholder="Ask anything... 'I want to find architecture' or 'Find me a quiet park'"
            className="w-full bg-[#0a0a0f] border border-white/5 rounded-2xl py-5 px-6 pr-16 text-sm outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all group-hover:border-white/10 shadow-2xl placeholder:text-slate-500"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-purple-500 text-[#050505] rounded-xl hover:bg-purple-400 disabled:opacity-50 disabled:grayscale transition-all shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)] active:scale-95"
          >
            <Send size={20} strokeWidth={3} />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-4 font-bold tracking-widest uppercase">
            Tips: Mention vibes, categories, or specific activities for better results.
        </p>
      </div>
    </div>
  );
};

export default AiExplorer;
