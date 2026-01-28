
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Role, 
  User, 
  Shipment, 
  ShipmentStatus, 
  TrackingEvent, 
  WebhookLog,
  POD
} from './types';
import Login from './components/Login';
import DashboardAdmin from './components/DashboardAdmin';
import DashboardOperador from './components/DashboardOperador';
import DashboardRepartidor from './components/DashboardRepartidor';
import ShipmentList from './components/ShipmentList';
import ShipmentDetail from './components/ShipmentDetail';
import Scanner from './components/Scanner';
import UserManagement from './components/UserManagement';
import UserProfile from './components/UserProfile';
import LogsView from './components/LogsView';
import ApiConfig from './components/ApiConfig';
import Navbar from './components/Navbar';
import { mockShipments, mockUsers, mockLogs } from './mockData';

// --- SECURITY UTILS ---
const Security = {
  // 1. Input Sanitization (Prevents XSS)
  sanitize: (input: any): any => {
    if (typeof input === 'string') {
      return input.replace(/[<>]/g, '').trim().substring(0, 500); // Remove scripts tags, limit length
    }
    if (typeof input === 'object' && input !== null) {
      const newObj: any = Array.isArray(input) ? [] : {};
      for (const key in input) {
        newObj[key] = Security.sanitize(input[key]);
      }
      return newObj;
    }
    return input;
  },

  // 2. Rate Limiting Simulation (Prevents DoS)
  requestHistory: [] as number[],
  checkRateLimit: (): boolean => {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 20; // Max requests per minute
    
    // Filter requests older than window
    Security.requestHistory = Security.requestHistory.filter(time => now - time < windowMs);
    
    if (Security.requestHistory.length >= maxRequests) {
      return false;
    }
    Security.requestHistory.push(now);
    return true;
  }
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [shipmentListFilter, setShipmentListFilter] = useState<ShipmentStatus | 'TODO'>('TODO');

  // Initialize Data
  useEffect(() => {
    const storedShipments = localStorage.getItem('hidalgo_shipments');
    const storedUsers = localStorage.getItem('hidalgo_users');
    const storedLogs = localStorage.getItem('hidalgo_logs');
    
    if (storedShipments) setShipments(JSON.parse(storedShipments));
    else setShipments(mockShipments);

    if (storedUsers) setUsers(JSON.parse(storedUsers));
    else setUsers(mockUsers);

    if (storedLogs) setLogs(JSON.parse(storedLogs));
    else setLogs(mockLogs);
  }, []);

  // Save Persistence
  useEffect(() => {
    if (shipments.length > 0) localStorage.setItem('hidalgo_shipments', JSON.stringify(shipments));
    if (users.length > 0) localStorage.setItem('hidalgo_users', JSON.stringify(users));
    if (logs.length > 0) localStorage.setItem('hidalgo_logs', JSON.stringify(logs));
  }, [shipments, users, logs]);

  const handleLogin = (u: User) => {
    setUser(u);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
  };

  const handleNavigate = (view: string) => {
    // Reset filter when navigating to shipments via navbar
    if (view === 'shipments') {
      setShipmentListFilter('TODO');
    }
    setCurrentView(view);
  };

  const handleUpdateProfile = (updatedUser: User) => {
    // Update current session
    setUser(updatedUser);
    // Update database (mock)
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    alert('Perfil actualizado correctamente');
    setCurrentView('dashboard');
  };

  const updateShipmentStatus = useCallback((id: string, newStatus: ShipmentStatus, note?: string, pod?: POD) => {
    setShipments(prev => prev.map(s => {
      if (s.id === id) {
        // Validation: Cannot update delivered status unless authorized
        if (s.estado === ShipmentStatus.ENTREGADO && user?.rol !== Role.ADMIN) {
          // In a real backend, this would throw a 403
          return s; 
        }

        const updated = { 
          ...s, 
          estado: newStatus, 
          updated_at: new Date().toISOString(),
          pod: pod || s.pod,
          notas: note ? Security.sanitize(note) : s.notas // Sanitize notes
        };
        // Create tracking event
        const newEvent: TrackingEvent = {
          id: Math.random().toString(36).substr(2, 9),
          envio_id: id,
          tipo_evento: `CAMBIO_ESTADO_${newStatus}`,
          payload_json: JSON.stringify({ note: Security.sanitize(note), prevStatus: s.estado, hasPOD: !!pod }),
          usuario_id: user?.id || 'system',
          usuario_nombre: user?.nombre || 'Sistema',
          created_at: new Date().toISOString()
        };
        setEvents(e => [newEvent, ...e]);
        return updated;
      }
      return s;
    }));
  }, [user]);

  const assignDriver = (shipmentId: string, driverId: string) => {
    const driver = users.find(u => u.id === driverId);
    if (!driver) return;

    setShipments(prev => prev.map(s => {
      if (s.id === shipmentId) {
        return { 
          ...s, 
          estado: ShipmentStatus.ASIGNADO, 
          repartidor_id: driverId, 
          repartidor_nombre: driver.nombre,
          updated_at: new Date().toISOString() 
        };
      }
      return s;
    }));
  };

  // --- NEW: BULK ASSIGNMENT ---
  const assignDriverBatch = (shipmentIds: string[], driverId: string) => {
    const driver = users.find(u => u.id === driverId);
    if (!driver) return;

    setShipments(prev => prev.map(s => {
      if (shipmentIds.includes(s.id)) {
        return { 
          ...s, 
          estado: ShipmentStatus.ASIGNADO, 
          repartidor_id: driverId, 
          repartidor_nombre: driver.nombre,
          updated_at: new Date().toISOString() 
        };
      }
      return s;
    }));
    
    alert(`Se han asignado ${shipmentIds.length} pedidos a ${driver.nombre} correctamente.`);
  };

  // --- API SIMULATION ENGINE ---
  const handleApiRequest = (method: string, endpoint: string, body: any): { status: number; data: any } => {
    // 1. Security Check: Rate Limiting
    if (!Security.checkRateLimit()) {
      const errorLog: WebhookLog = {
        id: Math.random().toString(36).substr(2, 9),
        proveedor: 'Talkual',
        endpoint: `${method} ${endpoint}`,
        status: 429,
        request_body: 'BLOCKED',
        response_body: 'Too Many Requests',
        created_at: new Date().toISOString()
      };
      setLogs(prev => [errorLog, ...prev]);
      return { status: 429, data: { error: 'Too many requests. Try again later.' } };
    }

    // 2. Security Check: Input Sanitization
    const sanitizedBody = Security.sanitize(body);

    const logEntry: WebhookLog = {
      id: Math.random().toString(36).substr(2, 9),
      proveedor: 'Talkual',
      endpoint: `${method} ${endpoint}`,
      status: 200,
      request_body: JSON.stringify(sanitizedBody),
      response_body: '',
      created_at: new Date().toISOString()
    };

    let response = { status: 200, data: {} as any };

    try {
      // 1. POST /api/public/shipments (Create)
      if (endpoint === '/api/public/shipments' && method === 'POST') {
        if (!sanitizedBody.referencia_externa || !sanitizedBody.cliente || !sanitizedBody.destino) {
          throw new Error('Faltan campos obligatorios: referencia_externa, cliente, destino');
        }
        
        const newShipment: Shipment = {
          id: `SH${Math.floor(Math.random() * 10000)}`,
          referencia_externa: sanitizedBody.referencia_externa,
          cliente: sanitizedBody.cliente,
          destino: sanitizedBody.destino,
          origen: sanitizedBody.origen || 'Almacén Central',
          fecha: new Date().toISOString().split('T')[0],
          franja_horaria: sanitizedBody.franja_horaria || '09:00 - 18:00',
          bultos: sanitizedBody.bultos || 1,
          peso: sanitizedBody.peso || 1,
          notas: sanitizedBody.notas || '',
          estado: ShipmentStatus.PENDIENTE,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        setShipments(prev => [newShipment, ...prev]);
        response = { status: 201, data: { success: true, id: newShipment.id, message: 'Envío creado correctamente' } };
      }
      
      // 2. PUT /api/public/shipments/{id} (Update)
      else if (endpoint.startsWith('/api/public/shipments/') && !endpoint.endsWith('/labels') && method === 'PUT') {
        const id = endpoint.split('/').pop();
        const existingIndex = shipments.findIndex(s => s.id === id);
        
        if (existingIndex === -1) {
          response = { status: 404, data: { error: 'Envío no encontrado' } };
        } else {
          // Validation: Validate status if present
          if (sanitizedBody.estado && !Object.values(ShipmentStatus).includes(sanitizedBody.estado)) {
             throw new Error('Estado inválido. Valores permitidos: ' + Object.values(ShipmentStatus).join(', '));
          }

          setShipments(prev => prev.map(s => {
            if (s.id === id) {
              // Sanitization: Exclude id, created_at from update
              const { id: _, created_at: __, ...updatableFields } = sanitizedBody;
              return { ...s, ...updatableFields, updated_at: new Date().toISOString() };
            }
            return s;
          }));
          response = { status: 200, data: { success: true, message: 'Envío actualizado' } };
        }
      }

      // 3. POST /api/public/shipments/{id}/labels (Add Label)
      else if (endpoint.match(/\/api\/public\/shipments\/.*\/labels/) && method === 'POST') {
        const id = endpoint.split('/')[4]; // Extract ID
        const existingIndex = shipments.findIndex(s => s.id === id);

        if (existingIndex === -1) {
          response = { status: 404, data: { error: 'Envío no encontrado' } };
        } else if (!sanitizedBody.label_url) {
          throw new Error('Campo requerido: label_url');
        } else {
           setShipments(prev => prev.map(s => {
            if (s.id === id) {
              return { ...s, etiqueta_url: sanitizedBody.label_url, updated_at: new Date().toISOString() };
            }
            return s;
          }));
          response = { status: 200, data: { success: true, message: 'Etiqueta adjuntada correctamente' } };
        }
      }
      
      else {
        response = { status: 404, data: { error: 'Endpoint no encontrado' } };
      }

    } catch (error: any) {
      response = { status: 400, data: { error: error.message } };
    }

    // Finalize Log
    logEntry.status = response.status;
    logEntry.response_body = JSON.stringify(response.data);
    setLogs(prev => [logEntry, ...prev]);

    return response;
  };

  const renderContent = () => {
    if (!user) return <Login onLogin={handleLogin} users={users} />;

    switch (currentView) {
      case 'dashboard':
        if (user.rol === Role.ADMIN) return <DashboardAdmin stats={{ shipments, users, logs }} onNavigate={setCurrentView} onAssignBatch={assignDriverBatch} />;
        if (user.rol === Role.OPERADOR) return <DashboardOperador 
          shipments={shipments} 
          onSelectShipment={(id) => { setSelectedShipmentId(id); setCurrentView('shipment_detail'); }} 
          onViewPending={() => {
            setShipmentListFilter(ShipmentStatus.PENDIENTE);
            setCurrentView('shipments');
          }}
        />;
        if (user.rol === Role.REPARTIDOR) return <DashboardRepartidor shipments={shipments.filter(s => s.repartidor_id === user.id)} onSelectShipment={(id) => { setSelectedShipmentId(id); setCurrentView('shipment_detail'); }} onScan={() => setCurrentView('scanner')} />;
        return null;
      
      case 'profile':
        return <UserProfile user={user} onUpdateProfile={handleUpdateProfile} onBack={() => setCurrentView('dashboard')} />;

      case 'shipments':
        return <ShipmentList 
          shipments={user.rol === Role.REPARTIDOR ? shipments.filter(s => s.repartidor_id === user.id) : shipments} 
          onSelect={(id) => { setSelectedShipmentId(id); setCurrentView('shipment_detail'); }}
          initialFilter={shipmentListFilter}
        />;

      case 'shipment_detail':
        const shipment = shipments.find(s => s.id === selectedShipmentId);
        if (!shipment) return <div>No encontrado</div>;
        return <ShipmentDetail 
          shipment={shipment} 
          events={events.filter(e => e.envio_id === shipment.id)}
          userRole={user.rol}
          drivers={users.filter(u => u.rol === Role.REPARTIDOR)}
          onUpdateStatus={updateShipmentStatus}
          onAssignDriver={assignDriver}
          onBack={() => setCurrentView('dashboard')}
        />;

      case 'scanner':
        return <Scanner 
          onScan={(code) => {
            const sanitizedCode = Security.sanitize(code);
            const found = shipments.find(s => s.referencia_externa === sanitizedCode || s.id === sanitizedCode);
            if (found) {
              setSelectedShipmentId(found.id);
              setCurrentView('shipment_detail');
            } else {
              alert('Envío no encontrado: ' + sanitizedCode);
            }
          }} 
          onCancel={() => setCurrentView('dashboard')} 
        />;

      case 'users':
        return <UserManagement 
          users={users} 
          setUsers={setUsers} 
          shipments={shipments} 
          onBack={() => setCurrentView('dashboard')} 
        />;

      case 'logs':
        return <LogsView logs={logs} onBack={() => setCurrentView('dashboard')} />;

      case 'api_config':
        return <ApiConfig onBack={() => setCurrentView('dashboard')} onSimulateApi={handleApiRequest} />;

      default:
        return <div>Vista no implementada</div>;
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {user && <Navbar currentView={currentView} onNavigate={handleNavigate} user={user} onLogout={handleLogout} />}
      <main className="max-w-4xl mx-auto p-4">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
