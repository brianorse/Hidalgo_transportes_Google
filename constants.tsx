
import React from 'react';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  AlertTriangle, 
  RotateCcw, 
  Clock 
} from 'lucide-react';
import { ShipmentStatus } from './types';

export const STATUS_CONFIG: Record<ShipmentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  [ShipmentStatus.PENDIENTE]: { 
    label: 'Pendiente', 
    color: 'bg-gray-100 text-gray-700', 
    icon: <Clock size={16} /> 
  },
  [ShipmentStatus.ASIGNADO]: { 
    label: 'Asignado', 
    color: 'bg-blue-100 text-blue-700', 
    icon: <Package size={16} /> 
  },
  [ShipmentStatus.EN_RUTA]: { 
    label: 'En Ruta', 
    color: 'bg-yellow-100 text-yellow-700', 
    icon: <Truck size={16} /> 
  },
  [ShipmentStatus.ENTREGADO]: { 
    label: 'Entregado', 
    color: 'bg-green-100 text-green-700', 
    icon: <CheckCircle size={16} /> 
  },
  [ShipmentStatus.INCIDENCIA]: { 
    label: 'Incidencia', 
    color: 'bg-red-100 text-red-700', 
    icon: <AlertTriangle size={16} /> 
  },
  [ShipmentStatus.DEVUELTO]: { 
    label: 'Devuelto', 
    color: 'bg-purple-100 text-purple-700', 
    icon: <RotateCcw size={16} /> 
  },
};
