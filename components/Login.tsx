
import React, { useState } from 'react';
import { User } from '../types';
import { RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import bcrypt from 'bcryptjs';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[]; 
  initialError?: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, users, initialError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(initialError || '');
  const [loading, setLoading] = useState(false);

  // Update error if initialError changes
  React.useEffect(() => {
    if (initialError) setError(initialError);
  }, [initialError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // LOGIC: Allow username login by appending domain if '@' is missing
    const emailToUse = email.includes('@') ? email : `${email}@hidalgo.app`;

    // --- MODO DEMO CHECK ---
    if (!isSupabaseConfigured) {
      setTimeout(() => {
        const mockUser = users.find(u => u.email.toLowerCase() === emailToUse.toLowerCase());
        
        if (mockUser && mockUser.password_hash && bcrypt.compareSync(password, mockUser.password_hash)) {
           onLogin(mockUser);
        } else {
           setError('Modo Demo: Usuario "ivan" o "marta", pass "hidalgo123"');
        }
        setLoading(false);
      }, 500); // Fake delay
      return;
    }
    // -----------------------

    try {
      // 1. Intento principal: Supabase Auth (Sistema real)
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (authError) {
        // Si falla Auth, lanzamos error para que lo capture el catch y probemos el fallback
        throw authError;
      }

      if (data.user) {
        // Fetch extended user profile data from our 'users' table
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id) 
          .single();
        
        if (profileError || !profileData) {
           console.error("Error fetching profile", profileError);
           throw new Error("Perfil de usuario no encontrado en la base de datos.");
        }

        onLogin(profileData as User);
        return; // Éxito vía Auth
      }
      
    } catch (err: any) {
      console.log("Auth error, trying DB fallback:", err.message);

      // 2. FALLBACK: Verificar vía RPC (Función segura en el servidor)
      try {
        // Usamos una función RPC para que el hash nunca sea accesible públicamente por RLS
        const { data: dbUser, error: rpcError } = await supabase
          .rpc('verify_user_login', { 
            p_email: emailToUse 
          })
          .maybeSingle();

        if (rpcError) {
           throw new Error(`Error RPC: ${rpcError.message}`);
        }

        if (dbUser) {
          const userWithHash = dbUser as User;
          // Verificamos si la contraseña coincide (el hash ya está en dbUser)
          const isMatch = bcrypt.compareSync(password, userWithHash.password_hash);
          
          if (isMatch) {
            console.log("Login exitoso vía RPC Fallback");
            const { password_hash, ...userWithoutHash } = userWithHash;
            onLogin(userWithoutHash as User);
            return;
          } else {
            throw new Error("Contraseña incorrecta.");
          }
        } else {
          throw new Error("Usuario no encontrado o inactivo.");
        }
      } catch (fallbackErr: any) {
        console.error("Fallback error", fallbackErr);
        setError(fallbackErr.message);
        setLoading(false);
        return;
      }

      // Si llegamos aquí, ambos métodos fallaron
      setError('Usuario o contraseña incorrectos. Verifica el SQL en Supabase.');
    } finally {
      if (isSupabaseConfigured) setLoading(false);
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
          {!isSupabaseConfigured && (
            <span className="inline-block mt-2 px-2 py-1 bg-yellow-500/20 text-yellow-200 text-[10px] font-bold rounded uppercase border border-yellow-500/30">
              Modo Demo Activo
            </span>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-cyan/80 uppercase tracking-widest ml-1">Usuario</label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              className="w-full px-5 py-4 rounded-2xl bg-brand-dark/50 border border-brand-cyan/20 text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all placeholder:text-white/20"
              placeholder="Ej: ivan, marta o admin@empresa.com"
              required
              autoCapitalize="none"
              autoCorrect="off"
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
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-3 rounded-xl text-center font-bold animate-pulse">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-orange to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-bold py-5 px-4 rounded-2xl shadow-lg shadow-brand-orange/20 transition-all active:scale-[0.98] text-lg uppercase tracking-wide mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Validando...' : 'Iniciar Sesión'}
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
