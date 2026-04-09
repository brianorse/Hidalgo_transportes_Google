
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

export interface Package {
  id: string;
  shipment_id: string;
  peso: number;
  volumen: number;
  descripcion?: string;
  created_at: string;
}

export interface Shipment {
  id: string;
  referencia_externa: string;
  origen: string;
  // Dirección detallada
  destino_calle: string;
  destino_codigo_postal: string;
  destino_poblacion: string;
  destino_provincia: string;
  destino_pais: string;
  
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_email?: string;
  
  fecha_entrega_estimada: string; // delivery_date
  franja_horaria: string;
  
  // Totales calculados
  total_bultos: number;
  total_peso: number;
  total_volumen: number;
  
  notas: string;
  estado: ShipmentStatus;
  repartidor_id?: string;
  repartidor_nombre?: string;
  pod?: POD;
  etiqueta_url?: string;
  packages?: Package[]; // Lista detallada de bultos
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
