
import { Role, User, Shipment, ShipmentStatus, WebhookLog } from './types';
import bcrypt from 'bcryptjs';

// Pre-calculate hash for 'hidalgo123' to keep it consistent
const DEFAULT_HASH = bcrypt.hashSync('hidalgo123', 10);

// Security: In a real app, password_hash would be a bcrypt hash, not plain text.
export const mockUsers: User[] = [
  { 
    id: 'admin-ivan', 
    nombre: 'Ivan Hidalgo', 
    email: 'ivan@hidalgo.app', 
    rol: Role.ADMIN, 
    activo: true, 
    password_hash: DEFAULT_HASH, 
    created_at: new Date().toISOString() 
  },
  { 
    id: 'driver-lleida', 
    nombre: 'Carlos (Lleida)', 
    email: 'carlos@hidalgo.app', 
    rol: Role.REPARTIDOR, 
    activo: true, 
    password_hash: DEFAULT_HASH, 
    created_at: new Date().toISOString() 
  },
  { 
    id: 'driver-bcn', 
    nombre: 'Marta (BCN)', 
    email: 'marta@hidalgo.app', 
    rol: Role.REPARTIDOR, 
    activo: true, 
    password_hash: DEFAULT_HASH, 
    created_at: new Date().toISOString() 
  },
  { 
    id: 'driver-tgn', 
    nombre: 'Jordi (Tarragona)', 
    email: 'jordi@hidalgo.app', 
    rol: Role.REPARTIDOR, 
    activo: true, 
    password_hash: DEFAULT_HASH, 
    created_at: new Date().toISOString() 
  },
  { 
    id: 'driver-gir', 
    nombre: 'Ana (Girona)', 
    email: 'ana@hidalgo.app', 
    rol: Role.REPARTIDOR, 
    activo: true, 
    password_hash: DEFAULT_HASH, 
    created_at: new Date().toISOString() 
  },
  { 
    id: 'driver-zgz', 
    nombre: 'Luis (Zaragoza)', 
    email: 'luis@hidalgo.app', 
    rol: Role.REPARTIDOR, 
    activo: true, 
    password_hash: DEFAULT_HASH, 
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
      destino_calle: `Calle Mayor ${i}`,
      destino_codigo_postal: '25001',
      destino_poblacion: city,
      destino_provincia: city,
      destino_pais: 'España',
      cliente_nombre: clients[Math.floor(Math.random() * clients.length)], 
      cliente_telefono: '600000000',
      cliente_email: 'cliente@ejemplo.com',
      fecha_entrega_estimada: new Date().toISOString().split('T')[0], 
      franja_horaria: '09:00 - 18:00', 
      total_bultos: 1, 
      total_peso: 5.0, 
      total_volumen: 0.1,
      notas: '', 
      estado: ShipmentStatus.PENDIENTE, 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    });
  }
  return res;
};

export const mockShipments: Shipment[] = [
  ...generateBulkShipments(200, 100),
  { 
    id: 'SH001', 
    referencia_externa: 'TK-99283', 
    origen: 'Almacén Central', 
    destino_calle: 'Polígono Ind. El Segre',
    destino_codigo_postal: '25191',
    destino_poblacion: 'Lleida',
    destino_provincia: 'Lleida',
    destino_pais: 'España',
    cliente_nombre: 'AgroLleida S.L.', 
    cliente_telefono: '973000000',
    fecha_entrega_estimada: new Date().toISOString().split('T')[0], 
    franja_horaria: '09:00 - 14:00', 
    total_bultos: 20, 
    total_peso: 150.5, 
    total_volumen: 2.5,
    notas: 'Entregar en muelle 4', 
    estado: ShipmentStatus.PENDIENTE, 
    created_at: new Date().toISOString(), 
    updated_at: new Date().toISOString() 
  },
  { 
    id: 'SH002', 
    referencia_externa: 'TK-11223', 
    origen: 'Almacén Central', 
    destino_calle: 'Av. Diagonal 440',
    destino_codigo_postal: '08037',
    destino_poblacion: 'Barcelona',
    destino_provincia: 'Barcelona',
    destino_pais: 'España',
    cliente_nombre: 'Oficinas Centrales', 
    cliente_telefono: '930000000',
    fecha_entrega_estimada: new Date().toISOString().split('T')[0], 
    franja_horaria: '16:00 - 20:00', 
    total_bultos: 1, 
    total_peso: 5.0, 
    total_volumen: 0.05,
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
