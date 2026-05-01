import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ParticleBackground from './components/ParticleBackground';
import Home from './pages/Home';
import Explorer from './pages/Explorer';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import AdminAuth from './pages/AdminAuth';
import Profile from './pages/Profile';
import AiExplorer from './pages/AiExplorer';
import Leaderboard from './pages/Leaderboard';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.role === 'admin' || user?.user?.role === 'admin';

  return (
    <Router>
      <div className="flex flex-col h-screen w-full bg-[#030014] text-slate-100 overflow-y-auto overflow-x-hidden font-sans relative">
        <ParticleBackground />
        <div className="relative z-10 flex flex-col min-h-full">
          <Navbar />
        
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<Home />} />
          
          {/* Explorer Page */}
          <Route path="/explore" element={<Explorer />} />
          
          <Route path="/leaderboard" element={<Leaderboard />} />
          
          {/* Auth Page */}
          <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
          
          {/* User Part (Protected) */}
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/auth" />} />
          
          {/* Admin Part (Protected) */}
          <Route path="/admin/login" element={!isAdmin ? <AdminAuth /> : <Navigate to="/admin" />} />
          <Route path="/admin" element={isAdmin ? <AdminPanel /> : <Navigate to="/admin/login" />} />
          
          {/* Public Profile Page */}
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/ai-explorer" element={<AiExplorer />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;