
import React, { useState } from 'react';
import { Shipment, ShipmentStatus } from '../types';
import { STATUS_CONFIG } from '../constants';
import { Search, Filter, ArrowRight, UserPlus, AlertCircle } from 'lucide-react';

interface DashboardOperadorProps {
  shipments: Shipment[];
  onSelectShipment: (id: string) => void;
  onViewPending: () => void;
}

const DashboardOperador: React.FC<DashboardOperadorProps> = ({ shipments, onSelectShipment, onViewPending }) => {
  const [filter, setFilter] = useState('');

  const filtered = shipments.filter(s => 
    s.referencia_externa.toLowerCase().includes(filter.toLowerCase()) || 
    s.cliente.toLowerCase().includes(filter.toLowerCase())
  );

  const pendingCount = shipments.filter(s => s.estado === ShipmentStatus.PENDIENTE).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Panel de Gestión</h2>
            <p className="text-slate-500">Control de pedidos de Talkual</p>
          </div>
          {pendingCount > 0 && (
            <button 
              onClick={onViewPending}
              className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse border border-red-100 hover:bg-red-100 transition shadow-sm"
            >
              <AlertCircle size={14} /> {pendingCount} SIN ASIGNAR
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por ref o cliente..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-brand-cyan"
            />
          </div>
        </div>
      </header>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
            No hay pedidos hoy.
          </div>
        ) : (
          filtered.map(s => (
            <button 
              key={s.id}
              onClick={() => onSelectShipment(s.id)}
              className={`w-full bg-white p-4 rounded-2xl border flex items-center justify-between group transition-all ${
                s.estado === ShipmentStatus.PENDIENTE ? 'border-red-100 bg-red-50/20' : 'border-slate-100 hover:border-brand-cyan'
              }`}
            >
              <div className="text-left flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${STATUS_CONFIG[s.estado].color}`}>
                    {STATUS_CONFIG[s.estado].label}
                  </span>
                  <span className="text-xs font-mono text-slate-400">#{s.referencia_externa}</span>
                </div>
                <h4 className="font-bold text-slate-800 truncate">{s.cliente}</h4>
                <div className="flex items-center gap-1 mt-1">
                  {s.repartidor_nombre ? (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <ArrowRight size={12} className="text-brand-cyan" /> {s.repartidor_nombre}
                    </span>
                  ) : (
                    <span className="text-xs text-red-500 font-bold flex items-center gap-1">
                      <UserPlus size={12} /> NECESITA REPARTIDOR
                    </span>
                  )}
                </div>
              </div>
              <div className={`ml-4 p-2 rounded-lg transition-colors ${
                s.estado === ShipmentStatus.PENDIENTE ? 'bg-red-500 text-white' : 'bg-slate-50 group-hover:bg-brand-cyan group-hover:text-white'
              }`}>
                <ArrowRight size={18} />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default DashboardOperador;
