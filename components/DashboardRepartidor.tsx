
import React from 'react';
import { Shipment, ShipmentStatus } from '../types';
import { STATUS_CONFIG } from '../constants';
import { MapPin, ChevronRight, Scan } from 'lucide-react';

interface DashboardRepartidorProps {
  shipments: Shipment[];
  onSelectShipment: (id: string) => void;
  onScan: () => void;
}

const DashboardRepartidor: React.FC<DashboardRepartidorProps> = ({ shipments, onSelectShipment, onScan }) => {
  const pending = shipments.filter(s => s.estado === ShipmentStatus.ASIGNADO || s.estado === ShipmentStatus.EN_RUTA);
  const completed = shipments.filter(s => s.estado === ShipmentStatus.ENTREGADO);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-brand-dark to-[#0f3066] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/20 rounded-full blur-3xl translate-x-10 -translate-y-10"></div>
        
        <h2 className="text-xl font-bold mb-1 relative z-10">Tu Ruta de Hoy</h2>
        <p className="text-brand-cyan opacity-90 relative z-10">{pending.length} entregas pendientes</p>
        
        <button 
          onClick={onScan}
          className="mt-6 flex items-center justify-center gap-2 w-full bg-brand-orange text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-orange/20 active:scale-[0.98] transition hover:bg-orange-500 relative z-10"
        >
          <Scan size={20} />
          ESCANEAR ETIQUETA
        </button>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 px-1">Entregas Pendientes</h3>
        <div className="space-y-3">
          {pending.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500">
              No tienes entregas pendientes para hoy.
            </div>
          ) : (
            pending.map(s => (
              <button 
                key={s.id}
                onClick={() => onSelectShipment(s.id)}
                className="w-full bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group active:bg-slate-50 transition hover:border-brand-cyan/30"
              >
                <div className="flex flex-col items-start text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${STATUS_CONFIG[s.estado].color}`}>
                      {STATUS_CONFIG[s.estado].label}
                    </span>
                    <span className="text-xs font-medium text-slate-400">Ref: {s.referencia_externa}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 line-clamp-1">{s.cliente}</h4>
                  <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                    <MapPin size={14} className="text-brand-orange" />
                    <span className="line-clamp-1">{s.destino}</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg group-hover:bg-brand-cyan group-hover:text-white transition-colors">
                  <ChevronRight size={18} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {completed.length > 0 && (
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-lg font-bold text-slate-400 mb-4 px-1">Completadas ({completed.length})</h3>
          <div className="space-y-2 opacity-60">
            {completed.map(s => (
              <div key={s.id} className="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-slate-100">
                <span className="text-sm font-medium text-slate-600">{s.cliente}</span>
                <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded">ENTREGADO</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardRepartidor;
