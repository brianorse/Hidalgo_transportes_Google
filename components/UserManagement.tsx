
import React, { useState } from 'react';
import { User, Role, Shipment, ShipmentStatus } from '../types';
import { ArrowLeft, UserPlus, Trash2, Mail, Shield, X, Package, CheckCircle, AlertTriangle, Truck, Key } from 'lucide-react';
import { STATUS_CONFIG } from '../constants';

interface UserManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  shipments: Shipment[];
  onBack: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, setUsers, shipments, onBack }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ nombre: '', email: '', rol: Role.REPARTIDOR });
  
  // Admin changing user password state
  const [showPwdReset, setShowPwdReset] = useState(false);
  const [newAdminPwd, setNewAdminPwd] = useState('');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const created: User = {
      id: Math.random().toString(36).substr(2, 9),
      nombre: newUser.nombre,
      email: newUser.email,
      rol: newUser.rol,
      activo: true,
      password_hash: '123',
      created_at: new Date().toISOString()
    };
    setUsers([...users, created]);
    setShowAdd(false);
    setNewUser({ nombre: '', email: '', rol: Role.REPARTIDOR });
  };

  const handleAdminResetPassword = () => {
    if (!selectedUser || !newAdminPwd) return;
    setUsers(prev => prev.map(u => 
      u.id === selectedUser.id ? { ...u, password_hash: newAdminPwd } : u
    ));
    alert(`Contraseña de ${selectedUser.nombre} actualizada.`);
    setShowPwdReset(false);
    setNewAdminPwd('');
  };

  const getDriverStats = (userId: string) => {
    const driverShipments = shipments.filter(s => s.repartidor_id === userId);
    return {
      total: driverShipments.length,
      delivered: driverShipments.filter(s => s.estado === ShipmentStatus.ENTREGADO).length,
      pending: driverShipments.filter(s => s.estado === ShipmentStatus.ASIGNADO || s.estado === ShipmentStatus.EN_RUTA).length,
      issues: driverShipments.filter(s => s.estado === ShipmentStatus.INCIDENCIA).length,
      recent: driverShipments.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5)
    };
  };

  const extractZone = (name: string) => {
    const match = name.match(/\(([^)]+)\)/);
    return match ? match[1] : 'Sin zona asignada';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white rounded-full border shadow-sm"><ArrowLeft size={20}/></button>
          <h2 className="text-xl font-bold">Gestión de Usuarios</h2>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
        >
          <UserPlus size={18}/> NUEVO
        </button>
      </div>

      <div className="grid gap-3">
        {users.map(u => (
          <div 
            key={u.id} 
            onClick={() => u.rol === Role.REPARTIDOR ? setSelectedUser(u) : null}
            className={`bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between transition-all ${u.rol === Role.REPARTIDOR ? 'cursor-pointer hover:border-blue-400 hover:shadow-md' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                {u.foto_url ? (
                  <img src={u.foto_url} alt={u.nombre} className="w-full h-full object-cover" />
                ) : (
                  u.nombre.charAt(0)
                )}
              </div>
              <div>
                <h4 className="font-bold text-gray-800">{u.nombre}</h4>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Mail size={12}/> {u.email}</span>
                  <span className={`text-xs font-bold flex items-center gap-1 ${u.rol === Role.ADMIN ? 'text-purple-500' : 'text-blue-500'}`}>
                    <Shield size={12}/> {u.rol}
                  </span>
                </div>
              </div>
            </div>
            {u.rol === Role.REPARTIDOR && (
              <div className="hidden md:block text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                Click para detalles
              </div>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); /* Logic to delete */ }} 
              className="text-gray-300 hover:text-red-500 p-2"
            >
              <Trash2 size={18}/>
            </button>
          </div>
        ))}
      </div>

      {/* DRIVER DETAILS MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-brand-dark p-6 text-white relative">
              <button 
                onClick={() => { setSelectedUser(null); setShowPwdReset(false); }}
                className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-brand-cyan rounded-full flex items-center justify-center text-brand-dark text-2xl font-bold overflow-hidden border-2 border-white/20">
                  {selectedUser.foto_url ? (
                    <img src={selectedUser.foto_url} alt={selectedUser.nombre} className="w-full h-full object-cover" />
                  ) : (
                    selectedUser.nombre.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.nombre}</h3>
                  <p className="text-brand-cyan text-sm flex items-center gap-2">
                    <Truck size={14} /> {extractZone(selectedUser.nombre)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
              
              {/* Admin Actions Area */}
              <div className="mb-6 border-b pb-6">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Shield size={16} className="text-purple-600"/> Acciones Administrativas
                </h4>
                
                {!showPwdReset ? (
                   <button 
                    onClick={() => setShowPwdReset(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition"
                   >
                     <Key size={16} /> Cambiar Contraseña del Usuario
                   </button>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Nueva Contraseña para {selectedUser.nombre}</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newAdminPwd}
                        onChange={e => setNewAdminPwd(e.target.value)}
                        placeholder="Escribe nueva contraseña"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      />
                      <button 
                        onClick={handleAdminResetPassword}
                        disabled={newAdminPwd.length < 3}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                      >
                        Guardar
                      </button>
                      <button 
                         onClick={() => setShowPwdReset(false)}
                         className="text-slate-400 px-2 hover:text-slate-600"
                      >
                        <X size={18}/>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {(() => {
                const stats = getDriverStats(selectedUser.id);
                return (
                  <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50 p-3 rounded-2xl text-center border border-blue-100">
                        <div className="text-2xl font-black text-blue-600">{stats.total}</div>
                        <div className="text-[10px] font-bold text-blue-400 uppercase">Total Asignados</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-2xl text-center border border-green-100">
                        <div className="text-2xl font-black text-green-600">{stats.delivered}</div>
                        <div className="text-[10px] font-bold text-green-400 uppercase">Entregados</div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-2xl text-center border border-orange-100">
                        <div className="text-2xl font-black text-orange-600">{stats.pending}</div>
                        <div className="text-[10px] font-bold text-orange-400 uppercase">Pendientes</div>
                      </div>
                    </div>

                    {/* Recent History */}
                    <div>
                      <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Package size={18} className="text-gray-400" />
                        Historial Reciente
                      </h4>
                      <div className="space-y-2">
                        {stats.recent.length === 0 ? (
                          <p className="text-sm text-gray-400 italic">No hay actividad reciente.</p>
                        ) : (
                          stats.recent.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <div>
                                <p className="text-xs font-bold text-gray-700">{s.cliente}</p>
                                <p className="text-[10px] text-gray-400">{new Date(s.updated_at).toLocaleDateString()}</p>
                              </div>
                              <span className={`text-[10px] px-2 py-1 rounded-lg font-bold ${STATUS_CONFIG[s.estado].color}`}>
                                {STATUS_CONFIG[s.estado].label}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {stats.issues > 0 && (
                      <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                        <AlertTriangle className="text-red-500 shrink-0" size={20} />
                        <div>
                          <p className="text-sm font-bold text-red-700">Atención Requerida</p>
                          <p className="text-xs text-red-600 mt-1">
                            Este repartidor tiene {stats.issues} entregas con incidencias reportadas.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Crear Usuario</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Nombre Completo</label>
                <input 
                  type="text" 
                  value={newUser.nombre}
                  onChange={e => setNewUser({...newUser, nombre: e.target.value})}
                  className="w-full p-2 border-b outline-none focus:border-blue-500" 
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
                <input 
                  type="email" 
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="w-full p-2 border-b outline-none focus:border-blue-500" 
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Rol</label>
                <select 
                  value={newUser.rol}
                  onChange={e => setNewUser({...newUser, rol: e.target.value as Role})}
                  className="w-full p-2 border-b outline-none focus:border-blue-500 bg-white"
                >
                  <option value={Role.ADMIN}>ADMIN</option>
                  <option value={Role.OPERADOR}>OPERADOR</option>
                  <option value={Role.REPARTIDOR}>REPARTIDOR</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 text-gray-500 font-bold">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-xl">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
