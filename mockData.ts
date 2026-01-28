
import { Role, User, Shipment, ShipmentStatus, WebhookLog } from './types';

// Security: In a real app, password_hash would be a bcrypt hash, not plain text.
export const mockUsers: User[] = [
  { 
    id: 'admin-ivan', 
    nombre: 'Ivan Hidalgo', 
    email: 'ivan', 
    rol: Role.ADMIN, 
    activo: true, 
    password_hash: 'hidalgo123', 
    created_at: new Date().toISOString() 
  },
  { 
    id: 'driver-lleida', 
    nombre: 'Carlos (Lleida)', 
    email: 'carlos', 
    rol: Role.REPARTIDOR, 
    activo: true, 
    password_hash: 'hidalgo123', 
    created_at: new Date().toISOString() 
  },
  { 
    id: 'driver-bcn', 
    nombre: 'Marta (BCN)', 
    email: 'marta', 
    rol: Role.REPARTIDOR, 
    activo: true, 
    password_hash: 'hidalgo123', 
    created_at: new Date().toISOString() 
  },
  { 
    id: 'driver-tgn', 
    nombre: 'Jordi (Tarragona)', 
    email: 'jordi', 
    rol: Role.REPARTIDOR, 
    activo: true, 
    password_hash: 'hidalgo123', 
    created_at: new Date().toISOString() 
  },
  { 
    id: 'driver-gir', 
    nombre: 'Ana (Girona)', 
    email: 'ana', 
    rol: Role.REPARTIDOR, 
    activo: true, 
    password_hash: 'hidalgo123', 
    created_at: new Date().toISOString() 
  },
  { 
    id: 'driver-zgz', 
    nombre: 'Luis (Zaragoza)', 
    email: 'luis', 
    rol: Role.REPARTIDOR, 
    activo: true, 
    password_hash: 'hidalgo123', 
    created_at: new Date().toISOString() 
  }
];

// Helper to generate shipments
const generateBulkShipments = (count: number, startId: number) => {
  const cities = ['Lleida', 'Barcelona', 'Tarragona', 'Girona', 'Zaragoza'];
  const clients = ['Frutas Manolo', 'Supermercados Dia', 'Mercadona', 'Tienda Local'];
  const res: Shipment[] = [];
  
  for (let i = 0; i < count; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)];
    res.push({
      id: `SH${startId + i}`, 
      referencia_externa: `TK-${99000 + i}`, 
      origen: 'Almacén Central', 
      destino: `Calle Mayor ${i}, ${city}`, 
      cliente: clients[Math.floor(Math.random() * clients.length)], 
      fecha: new Date().toISOString().split('T')[0], 
      franja_horaria: '09:00 - 18:00', 
      bultos: Math.floor(Math.random() * 5) + 1, 
      peso: Math.floor(Math.random() * 20) + 1, 
      notas: '', 
      estado: ShipmentStatus.PENDIENTE, 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    });
  }
  return res;
};

export const mockShipments: Shipment[] = [
  ...generateBulkShipments(200, 100), // Generate 200 random pending shipments
  { 
    id: 'SH001', 
    referencia_externa: 'TK-99283', 
    origen: 'Almacén Central', 
    destino: 'Polígono Ind. El Segre, Lleida', 
    cliente: 'AgroLleida S.L.', 
    fecha: new Date().toISOString().split('T')[0], 
    franja_horaria: '09:00 - 14:00', 
    bultos: 20, 
    peso: 150.5, 
    notas: 'Entregar en muelle 4', 
    estado: ShipmentStatus.PENDIENTE, 
    created_at: new Date().toISOString(), 
    updated_at: new Date().toISOString() 
  },
  { 
    id: 'SH002', 
    referencia_externa: 'TK-11223', 
    origen: 'Almacén Central', 
    destino: 'Av. Diagonal 440, Barcelona', 
    cliente: 'Oficinas Centrales', 
    fecha: new Date().toISOString().split('T')[0], 
    franja_horaria: '16:00 - 20:00', 
    bultos: 1, 
    peso: 5.0, 
    notas: 'Dejar en recepción', 
    estado: ShipmentStatus.ASIGNADO, 
    repartidor_id: 'driver-bcn', 
    repartidor_nombre: 'Marta (BCN)', 
    created_at: new Date().toISOString(), 
    updated_at: new Date().toISOString() 
  }
];

export const mockLogs: WebhookLog[] = [
  { id: 'L1', proveedor: 'Talkual', endpoint: '/api/public/shipments', status: 201, request_body: '{"referencia_externa": "TK-99283", ...}', response_body: '{"success": true}', created_at: new Date().toISOString() },
];
