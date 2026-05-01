import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import { Map, Zap, Users, Shield, ArrowRight, Compass, Navigation2 } from 'lucide-react';
import HeroSection from '../components/HeroSection';

const AnimatedCounter = ({ endValue, duration = 2 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      // Easing function: easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      
      setCount(Math.floor(easeProgress * endValue));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [endValue, duration]);

  return <span>{count.toLocaleString()}</span>;
};



const FeatureCard = ({ title, description, icon: Icon, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay }}
    className="group relative bg-[#050505] rounded-[1.25rem] border-t border-emerald-900/40 p-8 overflow-hidden hover:bg-[#070707] transition-all"
  >
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
    
    <div className="relative z-10">
      <div className="w-12 h-12 bg-emerald-950/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
        <Icon className="text-emerald-500 w-5 h-5" />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-white mb-3">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
    
    {/* Corner styling */}
    <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
      <div className="absolute top-0 right-0 w-[1px] h-8 bg-emerald-500/20 group-hover:h-full transition-all duration-700"></div>
      <div className="absolute top-0 right-0 w-8 h-[1px] bg-emerald-500/20 group-hover:w-full transition-all duration-700"></div>
    </div>
    <div className="absolute bottom-0 left-0 w-16 h-16 pointer-events-none">
      <div className="absolute bottom-0 left-0 w-[1px] h-8 bg-emerald-500/20 group-hover:h-full transition-all duration-700"></div>
      <div className="absolute bottom-0 left-0 w-8 h-[1px] bg-emerald-500/20 group-hover:w-full transition-all duration-700"></div>
    </div>
  </motion.div>
);

const Home = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const yHero = useTransform(scrollYProgress, [0, 1], [0, 400]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const { data: metrics } = useQuery({
    queryKey: ['home_metrics'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/metrics');
        return res.data;
      } catch (e) {
        return { totalUsers: 3421, totalSpots: 12845 }; 
      }
    },
    staleTime: 60000,
    retry: false
  });

  const spotsCount = metrics?.totalSpots || 12845;
  const usersCount = metrics?.totalUsers || 3421;

  return (
    <div className="min-h-screen text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden relative">
      <div className="relative z-10 pt-20">
        {/* ─── SCENE 1: HERO ─── */}
        <HeroSection />

        {/* ─── SCENE 2: FEATURES BENTO GRID ─── */}
        <section className="relative z-20 py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6"
          >
            The Explorer's Toolkit
          </motion.h2>
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            className="w-16 h-1 bg-emerald-900 rounded-full mx-auto"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard 
            delay={0.1}
            icon={Map}
            title="Encrypted Geospatial Mapping"
            description="Our advanced mapping engine obscures exact paths until you're within physical proximity of the waypoint, guaranteeing the preservation of untouched locations."
          />
          <FeatureCard 
            delay={0.2}
            icon={Zap}
            title="Real-time Synchronization"
            description="A high-performance socket layer beams down discoveries in real-time. Experience the thrill of new routes appearing globally the moment they are logged."
          />
          <FeatureCard 
            delay={0.3}
            icon={Users}
            title="Shadow Networks"
            description="Form alliances, share route collections anonymously, and compete on the global explorer leaderboard without sacrificing the integrity of the locations."
          />
          <FeatureCard 
            delay={0.4}
            icon={Shield}
            title="Algorithmic Evasion"
            description="No tourist traps. A strictly moderated community and advanced heuristics ensure only genuinely extraordinary and obscure locations surface."
          />
          <div className="col-span-1 lg:col-span-2 relative group overflow-hidden rounded-[1.25rem] bg-[#050505] border-t border-emerald-900/40 p-8 flex flex-col md:flex-row items-center gap-10 hover:bg-[#070707] transition-all">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
            <div className="flex-1 z-10">
              <div className="inline-flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-widest mb-4">
                <Zap className="w-3 h-3" /> System Uplink Status: Nominal
              </div>
              <h3 className="text-3xl font-black text-white mb-4">Join 3,000+ Shadow Navigators</h3>
              <p className="text-slate-400 mb-8 max-w-md">Our intelligence network is only as robust as its ground agents. Create your profile today to gain access to coordinates classified level 4 and higher.</p>
              <button 
                onClick={() => navigate('/register')}
                className="inline-flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-sm hover:text-emerald-300 transition-colors group/btn"
              >
                Establish Connection <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
              </button>
            </div>
            {/* Abstract visual for the large span feature box */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15)_0%,transparent_70%)] pointer-events-none"></div>
            <motion.div 
              className="relative w-48 h-48 md:w-64 md:h-64 border border-emerald-500/30 rounded-full flex items-center justify-center -mr-10 md:mr-0 z-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
               <div className="absolute w-[120%] h-[1px] bg-emerald-500/30"></div>
               <div className="absolute h-[120%] w-[1px] bg-emerald-500/30"></div>
               <div className="w-3/4 h-3/4 border border-dashed border-emerald-500/40 rounded-full"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── SCENE 3: LIVE METRICS ─── */}
      <section className="relative py-32 bg-black/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-8 items-center">
            <div>
              <motion.h2 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter"
              >
                The World <br/> Is Bigger Than <br/> You <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">Think.</span>
              </motion.h2>
              <motion.p
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="text-slate-400 max-w-md font-light leading-relax"
              >
                  Every second, our network discovers the forgotten. Our telemetry database aggregates coordinates globally, maintaining absolute secrecy until accessed by an authorized navigator.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
               <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="bg-[#050505] border-t border-emerald-900/40 rounded-[1.25rem] p-8 flex flex-col justify-center relative overflow-hidden group hover:bg-[#070707] transition-all"
                >
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
                  <Compass className="w-8 h-8 text-emerald-500 mb-6" />
                  <div className="text-5xl font-black text-white font-mono tracking-tighter mb-2">
                    <AnimatedCounter endValue={spotsCount} duration={2.5} />
                  </div>
                  <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Classified Waypoints</div>
               </motion.div>

               <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="bg-[#050505] border-t border-blue-900/40 rounded-[1.25rem] p-8 flex flex-col justify-center relative overflow-hidden group mt-0 sm:mt-12 hover:bg-[#070707] transition-all"
                >
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
                  <Users className="w-8 h-8 text-blue-500 mb-6" />
                  <div className="text-5xl font-black text-white font-mono tracking-tighter mb-2">
                    <AnimatedCounter endValue={usersCount} duration={2.5} />
                  </div>
                  <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Active Navigators</div>
               </motion.div>
            </div>
        </div>
      </section>

      {/* ─── SCENE 4: CTA ─── */}
      <section className="relative py-40 flex items-center justify-center text-center px-6 overflow-hidden">
        {/* Glow behind the CTA */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-3xl"
        >
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-8">
            The Map Awaits.
          </h2>
          <p className="text-xl text-slate-400 font-light mb-12">
            Step off the grid and into the extraordinary. Your expedition begins here.
          </p>
          <button 
            onClick={() => navigate('/explore')}
            className="group relative inline-flex items-center justify-center px-12 py-5 bg-white text-slate-950 font-black uppercase tracking-widest rounded-full overflow-hidden transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)]"
          >
            <div className="absolute inset-0 bg-emerald-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
            <span className="relative z-10">Initialize Tracker</span>
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-slate-600 text-sm relative z-20 flex flex-col md:flex-row justify-between items-center px-[8vw] gap-4 font-mono">
        <p>SECRETS_ROUTE_PLANNER © {new Date().getFullYear()}</p>
        <p className="hidden md:block">SYS_STATUS: ONLINE</p>
        <p className="hidden sm:block">ENCRYPTION: ACTIVE</p>
      </footer>
      </div>
    </div>
  );
};

export default Home;
