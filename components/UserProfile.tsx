
import React, { useState, useRef } from 'react';
import { User, Role } from '../types';
import { ArrowLeft, Camera, Calendar, Mail, Lock, User as UserIcon, Save, Key } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onUpdateProfile: (updatedUser: User) => void;
  onBack: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateProfile, onBack }) => {
  const [formData, setFormData] = useState({
    nombre: user.nombre,
    email: user.email,
    fecha_nacimiento: user.fecha_nacimiento || '',
    foto_url: user.foto_url || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const age = calculateAge(formData.fecha_nacimiento);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormData(prev => ({ ...prev, foto_url: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Password Validation
    if (isEditingPassword) {
      if (formData.current_password !== user.password_hash) {
        alert('La contraseña actual no es correcta.');
        return;
      }
      if (formData.new_password !== formData.confirm_password) {
        alert('Las nuevas contraseñas no coinciden.');
        return;
      }
      if (formData.new_password.length < 4) {
        alert('La nueva contraseña debe tener al menos 4 caracteres.');
        return;
      }
    }

    const updatedUser: User = {
      ...user,
      nombre: formData.nombre,
      email: formData.email,
      fecha_nacimiento: formData.fecha_nacimiento,
      foto_url: formData.foto_url,
      password_hash: isEditingPassword ? formData.new_password : user.password_hash,
      updated_at: new Date().toISOString()
    };

    onUpdateProfile(updatedUser);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 bg-white rounded-full border shadow-sm"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-bold">Mi Perfil</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Header / Avatar */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-brand-dark to-brand-cyan/80"></div>
          
          <div className="relative mt-8 mb-4 group">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 flex items-center justify-center">
              {formData.foto_url ? (
                <img src={formData.foto_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={48} className="text-slate-300" />
              )}
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-brand-orange text-white rounded-full shadow-md hover:scale-110 transition"
            >
              <Camera size={18} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handlePhotoUpload}
            />
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-800">{user.nombre}</h3>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
              {user.rol}
            </span>
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">Información Personal</h3>
          
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Nombre Completo</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
                disabled={user.rol === Role.REPARTIDOR}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-brand-cyan ${
                  user.rol === Role.REPARTIDOR ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white'
                }`}
              />
            </div>
            {user.rol === Role.REPARTIDOR && (
              <p className="text-[10px] text-slate-400 mt-1 ml-1">Contacta con administración para cambiar tu nombre.</p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-brand-cyan"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-500 mb-1 block">Fecha de Nacimiento</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="date" 
                  value={formData.fecha_nacimiento}
                  onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-brand-cyan"
                />
              </div>
            </div>
            {age !== null && (
              <div className="w-24">
                <label className="text-xs font-bold text-slate-500 mb-1 block">Edad</label>
                <div className="w-full py-3 bg-slate-50 border rounded-xl text-center font-bold text-slate-700">
                  {age} años
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase">Seguridad</h3>
            <button 
              type="button"
              onClick={() => {
                setIsEditingPassword(!isEditingPassword);
                setFormData(prev => ({ ...prev, current_password: '', new_password: '', confirm_password: '' }));
              }}
              className="text-xs font-bold text-brand-cyan flex items-center gap-1 hover:underline"
            >
              <Key size={14} /> {isEditingPassword ? 'Cancelar cambio' : 'Cambiar contraseña'}
            </button>
          </div>

          {isEditingPassword && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Contraseña Actual</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    value={formData.current_password}
                    onChange={e => setFormData({...formData, current_password: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-brand-cyan"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Nueva Contraseña</label>
                  <input 
                    type="password" 
                    value={formData.new_password}
                    onChange={e => setFormData({...formData, new_password: e.target.value})}
                    className="w-full px-4 py-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-brand-cyan"
                    placeholder="Mínimo 4 caracteres"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Confirmar Nueva</label>
                  <input 
                    type="password" 
                    value={formData.confirm_password}
                    onChange={e => setFormData({...formData, confirm_password: e.target.value})}
                    className="w-full px-4 py-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-brand-cyan"
                    placeholder="Repetir contraseña"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <button 
          type="submit"
          className="w-full bg-brand-dark text-white font-bold py-4 rounded-2xl shadow-xl shadow-brand-dark/20 flex items-center justify-center gap-2 hover:bg-slate-800 transition active:scale-[0.98]"
        >
          <Save size={20} /> GUARDAR CAMBIOS
        </button>
      </form>
    </div>
  );
};

export default UserProfile;
