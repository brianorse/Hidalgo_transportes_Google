
export enum Role {
  ADMIN = 'ADMIN',
  OPERADOR = 'OPERADOR',
  REPARTIDOR = 'REPARTIDOR'
}

export enum ShipmentStatus {
  PENDIENTE = 'PENDIENTE',
  ASIGNADO = 'ASIGNADO',
  EN_RUTA = 'EN_RUTA',
  ENTREGADO = 'ENTREGADO',
  INCIDENCIA = 'INCIDENCIA',
  DEVUELTO = 'DEVUELTO'
}

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: Role;
  activo: boolean;
  password_hash: string;
  fecha_nacimiento?: string;
  foto_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface Client {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
}

export interface POD {
  nombre_receptor: string;
  firma_data?: string;
  foto_data?: string;
  fecha: string;
}

export interface Shipment {
  id: string;
  referencia_externa: string;
  origen: string;
  destino: string;
  cliente: string;
  fecha: string;
  franja_horaria: string;
  bultos: number;
  peso: number;
  notas: string;
  estado: ShipmentStatus;
  repartidor_id?: string;
  repartidor_nombre?: string;
  pod?: POD;
  etiqueta_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TrackingEvent {
  id: string;
  envio_id: string;
  tipo_evento: string;
  payload_json: string;
  usuario_id: string;
  usuario_nombre: string;
  created_at: string;
}

export interface WebhookLog {
  id: string;
  proveedor: string;
  endpoint: string;
  status: number;
  request_body: string;
  response_body: string;
  created_at: string;
}
