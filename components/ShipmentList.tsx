
import React, { useState, useEffect } from 'react';
import { Shipment, ShipmentStatus } from '../types';
import { STATUS_CONFIG } from '../constants';
import { Search, MapPin } from 'lucide-react';

interface ShipmentListProps {
  shipments: Shipment[];
  onSelect: (id: string) => void;
  initialFilter?: ShipmentStatus | 'TODO';
}

const ShipmentList: React.FC<ShipmentListProps> = ({ shipments, onSelect, initialFilter = 'TODO' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatus, setActiveStatus] = useState<ShipmentStatus | 'TODO'>(initialFilter);

  useEffect(() => {
    setActiveStatus(initialFilter);
  }, [initialFilter]);

  const filtered = shipments.filter(s => {
    const matchesSearch = s.referencia_externa.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.destino.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = activeStatus === 'TODO' || s.estado === activeStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="sticky top-0 md:static bg-gray-50 pt-2 pb-4 z-10 space-y-4">
        <h2 className="text-xl font-bold px-1">Todos los Envíos</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Referencia, cliente o dirección..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
          <button 
            onClick={() => setActiveStatus('TODO')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition ${
              activeStatus === 'TODO' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-100'
            }`}
          >
            TODOS
          </button>
          {Object.values(ShipmentStatus).map(status => (
            <button 
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition ${
                activeStatus === status ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-100'
              }`}
            >
              {STATUS_CONFIG[status].label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            No se encontraron envíos con estos filtros.
          </div>
        ) : (
          filtered.map(s => (
            <button 
              key={s.id}
              onClick={() => onSelect(s.id)}
              className="w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3 hover:shadow-md transition active:bg-gray-50"
            >
              <div className={`p-3 rounded-xl ${STATUS_CONFIG[s.estado].color}`}>
                {STATUS_CONFIG[s.estado].icon}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-mono font-bold text-gray-400">{s.referencia_externa}</span>
                  <span className="text-[10px] text-gray-400 font-medium">{new Date(s.fecha).toLocaleDateString()}</span>
                </div>
                <h4 className="font-bold text-gray-800 truncate">{s.cliente}</h4>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <MapPin size={12} className="flex-shrink-0" />
                  <span className="truncate">{s.destino}</span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default ShipmentList;
