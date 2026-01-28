
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings, 
  LogOut, 
  ScanLine,
  ShieldCheck,
  RefreshCw,
  Maximize,
  Minimize,
  User as UserIcon
} from 'lucide-react';
import { User, Role } from '../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user: User;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, user, onLogout }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: string; icon: any; label: string }) => (
    <button 
      onClick={() => onNavigate(view)}
      className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-2 rounded-lg transition-colors ${
        currentView === view ? 'text-brand-cyan bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={20} />
      <span className="text-[10px] md:text-sm font-medium">{label}</span>
    </button>
  );

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex bg-brand-dark border-b border-white/10 sticky top-0 z-50 px-6 py-3 items-center justify-between shadow-lg">
        <div className="flex items-center gap-6">
          {/* Logo Brand */}
          <div className="flex items-center">
            <span className="text-2xl font-black text-brand-cyan tracking-tighter">hidal</span>
            <span className="text-2xl font-black text-brand-orange tracking-tighter">go</span>
            <RefreshCw className="text-brand-orange ml-1 stroke-[3]" size={18} />
          </div>
          
          <div className="h-6 w-px bg-white/10"></div>

          <nav className="flex gap-2">
            <NavItem view="dashboard" icon={LayoutDashboard} label="Inicio" />
            <NavItem view="shipments" icon={Package} label="Todos los Envíos" />
            {user.rol === Role.ADMIN && (
              <>
                <NavItem view="users" icon={Users} label="Repartidores" />
                <NavItem view="api_config" icon={ShieldCheck} label="API Talkual" />
                <NavItem view="logs" icon={Settings} label="Logs" />
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleFullScreen}
            className="text-slate-400 hover:text-white p-2 transition bg-white/5 rounded-full"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
          
          {/* User Profile Trigger */}
          <button 
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition group"
          >
            <div className="text-right">
              <p className="text-xs font-bold text-brand-cyan uppercase group-hover:text-brand-orange transition-colors">{user.rol}</p>
              <p className="text-sm font-medium text-white">{user.nombre}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden border border-white/10">
              {user.foto_url ? (
                <img src={user.foto_url} alt={user.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50">
                  <UserIcon size={20} />
                </div>
              )}
            </div>
          </button>

          <button onClick={onLogout} className="text-slate-400 hover:text-red-500 p-2 transition"><LogOut size={20} /></button>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-dark border-t border-white/10 flex justify-around p-3 z-50 safe-bottom">
        <NavItem view="dashboard" icon={LayoutDashboard} label="Inicio" />
        {user.rol === Role.ADMIN ? (
          <>
            <NavItem view="shipments" icon={Package} label="Envíos" />
            <NavItem view="api_config" icon={ShieldCheck} label="API" />
          </>
        ) : (
          <>
            <button 
              onClick={() => onNavigate('scanner')}
              className="flex flex-col items-center -mt-10 bg-brand-orange text-white p-4 rounded-full shadow-lg shadow-brand-orange/30 border-4 border-slate-50"
            >
              <ScanLine size={24} />
            </button>
            <NavItem view="shipments" icon={Package} label="Ruta" />
          </>
        )}
        <button 
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${currentView === 'profile' ? 'text-brand-cyan' : 'text-slate-500'}`}
        >
          {user.foto_url ? (
             <img src={user.foto_url} alt="Profile" className="w-5 h-5 rounded-full object-cover mb-0.5 border border-current" />
          ) : (
             <UserIcon size={20} className="mb-0.5" />
          )}
          <span className="text-[10px]">Perfil</span>
        </button>
      </nav>
    </>
  );
};

export default Navbar;
