
import React, { useState } from 'react';
import { User } from '../types';
import { RefreshCw } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email === username && u.password_hash === password);
    if (user) {
      onLogin(user);
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-brand-dark relative overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand-cyan/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-brand-orange/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/10 relative z-10">
        
        <div className="text-center mb-12 mt-4">
          <div className="flex items-center justify-center mb-2">
            <h1 className="text-5xl font-black tracking-tighter text-brand-cyan">hidal</h1>
            <div className="relative flex items-center">
              <h1 className="text-5xl font-black tracking-tighter text-brand-orange">go</h1>
              <RefreshCw className="text-brand-orange ml-1 stroke-[3]" size={32} />
            </div>
          </div>
          <p className="text-brand-cyan/60 font-medium tracking-[0.2em] text-sm uppercase">Transportes</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-cyan/80 uppercase tracking-widest ml-1">Usuario</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-brand-dark/50 border border-brand-cyan/20 text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all placeholder:text-white/20"
              placeholder="Ej: admin o user"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-cyan/80 uppercase tracking-widest ml-1">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-brand-dark/50 border border-brand-cyan/20 text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all placeholder:text-white/20"
              placeholder="••••••••"
              required
            />
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-3 rounded-xl text-center font-bold">
              {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-brand-orange to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-bold py-5 px-4 rounded-2xl shadow-lg shadow-brand-orange/20 transition-all active:scale-[0.98] text-lg uppercase tracking-wide mt-4"
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-white/5 text-center">
          <p className="text-[10px] text-white/30 uppercase tracking-widest">© 2024 Hidalgo Transportes S.L.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
