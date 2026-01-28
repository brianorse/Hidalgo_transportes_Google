
import React, { useState } from 'react';
import { Shipment, User, WebhookLog, ShipmentStatus, Role } from '../types';
import { Users, Package, Activity, Terminal, Globe, ArrowRight, Clock, CheckSquare, Square, Filter, Truck } from 'lucide-react';
import { STATUS_CONFIG } from '../constants';

interface DashboardAdminProps {
  stats: {
    shipments: Shipment[];
    users: User[];
    logs: WebhookLog[];
  };
  onNavigate: (view: string) => void;
  onAssignBatch?: (shipmentIds: string[], driverId: string) => void;
}

const DashboardAdmin: React.FC<DashboardAdminProps> = ({ stats, onNavigate, onAssignBatch }) => {
  const [filterText, setFilterText] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState('');

  const pendingAssignment = stats.shipments.filter(s => 
    s.estado === ShipmentStatus.PENDIENTE &&
    (s.cliente.toLowerCase().includes(filterText.toLowerCase()) || 
     s.destino.toLowerCase().includes(filterText.toLowerCase()) ||
     s.referencia_externa.toLowerCase().includes(filterText.toLowerCase()))
  );
  
  const drivers = stats.users.filter(u => u.rol === Role.REPARTIDOR);

  const kpi = [
    { label: 'Envíos Hoy', value: stats.shipments.length, icon: Package, color: 'text-brand-cyan', bg: 'bg-cyan-50', view: 'shipments' },
    { label: 'Entregados', value: stats.shipments.filter(s => s.estado === ShipmentStatus.ENTREGADO).length, icon: Activity, color: 'text-green-500', bg: 'bg-green-50', view: 'shipments' },
    { label: 'Repartidores', value: drivers.length, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50', view: 'users' },
    { label: 'Pendientes', value: stats.shipments.filter(s => s.estado === ShipmentStatus.PENDIENTE).length, icon: Clock, color: 'text-brand-orange', bg: 'bg-orange-50', view: 'shipments' },
  ];

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingAssignment.length && pendingAssignment.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingAssignment.map(s => s.id)));
    }
  };

  const executeBatchAssign = () => {
    if (onAssignBatch && selectedDriver) {
      onAssignBatch(Array.from(selectedIds), selectedDriver);
      setSelectedIds(new Set());
      setIsAssigning(false);
      setSelectedDriver('');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Hola, Iván</h2>
          <p className="text-sm text-slate-500">Gestión central de flota</p>
        </div>
        <button 
          onClick={() => onNavigate('api_config')}
          className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all text-slate-700"
        >
          <Globe size={16} className="text-brand-cyan" />
          API TALKUAL
        </button>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpi.map((item, i) => (
          <button 
            key={i} 
            onClick={() => onNavigate(item.view)}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition text-left relative overflow-hidden group"
          >
            <div className={`absolute -right-2 -top-2 w-12 h-12 ${item.bg} rounded-full opacity-50 group-hover:scale-150 transition-transform`}></div>
            <item.icon className={`${item.color} mb-3 relative z-10`} size={24} />
            <div className="text-2xl font-black text-slate-800 relative z-10">{item.value}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider relative z-10">{item.label}</div>
          </button>
        ))}
      </div>

      {/* DESPACHO INTELIGENTE (Asignación Masiva) */}
      <section className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-brand-orange rounded-full animate-pulse"></span>
            Despacho Inteligente
          </h3>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            {pendingAssignment.length} Pendientes
          </span>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filtrar zona (ej: Lleida, BCN)..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan outline-none transition-all"
            />
          </div>
          {pendingAssignment.length > 0 && (
             <button 
              onClick={toggleSelectAll}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
             >
               {selectedIds.size === pendingAssignment.length ? 'DESMARCAR' : 'TODOS'}
             </button>
          )}
        </div>

        {/* Lista Selectable */}
        <div className="space-y-2 max-h-80 overflow-y-auto mb-4 pr-1">
          {pendingAssignment.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
              No hay pedidos pendientes con este filtro.
            </div>
          ) : (
            pendingAssignment.map(s => (
              <div 
                key={s.id}
                onClick={() => toggleSelection(s.id)}
                className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedIds.has(s.id) 
                  ? 'bg-blue-50 border-blue-200 shadow-inner' 
                  : 'bg-white border-slate-100 hover:border-slate-300'
                }`}
              >
                <div className={`mr-3 ${selectedIds.has(s.id) ? 'text-blue-600' : 'text-slate-300'}`}>
                   {selectedIds.has(s.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <h4 className="font-bold text-slate-700 text-sm truncate">{s.destino}</h4>
                    <span className="text-[10px] font-mono text-slate-400">{s.referencia_externa}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{s.cliente} • {s.bultos} bultos</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
           <span className="text-xs font-bold text-slate-500">
             {selectedIds.size} seleccionados
           </span>
           <button 
             disabled={selectedIds.size === 0}
             onClick={() => setIsAssigning(true)}
             className="bg-brand-dark text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-brand-dark/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2 hover:bg-slate-800 transition-all"
           >
             <Truck size={16} /> ASIGNAR REPARTIDOR
           </button>
        </div>
      </section>

      {/* Modal de Asignación */}
      {isAssigning && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl scale-100">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Asignar {selectedIds.size} Pedidos</h3>
            <p className="text-sm text-slate-500 mb-4">Selecciona el repartidor responsable de esta zona:</p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
              {drivers.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDriver(d.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedDriver === d.id 
                    ? 'bg-brand-cyan text-white border-brand-cyan font-bold' 
                    : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  {d.nombre}
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsAssigning(false)} 
                className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition"
              >
                Cancelar
              </button>
              <button 
                onClick={executeBatchAssign}
                disabled={!selectedDriver}
                className="flex-[2] bg-brand-orange text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-orange/20 disabled:opacity-50"
              >
                CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Últimos Logs */}
      <section className="bg-brand-dark rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Actividad Talkual</h3>
          <Terminal size={18} className="text-brand-cyan" />
        </div>
        <div className="space-y-3">
          {stats.logs.slice(0, 3).map(log => (
            <div key={log.id} className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <span className={log.status < 300 ? 'text-green-400' : 'text-brand-orange'}>●</span>
                <span className="font-mono text-slate-300">{log.endpoint}</span>
              </div>
              <span className="text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardAdmin;
