
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
import { DatabaseSetup } from './components/DatabaseSetup'; // Nueva pantalla de ayuda
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { mockShipments, mockUsers, mockLogs } from './mockData';

// --- SECURITY UTILS ---
const Security = {
  sanitize: (input: any): any => {
    if (typeof input === 'string') {
      return input.replace(/[<>]/g, '').trim().substring(0, 500); 
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
  requestHistory: [] as number[],
  checkRateLimit: (): boolean => {
    const now = Date.now();
    const windowMs = 60000; 
    const maxRequests = 20; 
    Security.requestHistory = Security.requestHistory.filter(time => now - time < windowMs);
    if (Security.requestHistory.length >= maxRequests) return false;
    Security.requestHistory.push(now);
    return true;
  }
};

// Error Boundary Component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 border-2 border-red-200 rounded-3xl text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">Algo salió mal</h2>
          <p className="text-sm text-red-600 mb-4">{this.state.error?.message || 'Error desconocido'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold"
          >
            RECARGAR APLICACIÓN
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [shipmentListFilter, setShipmentListFilter] = useState<ShipmentStatus | 'TODO'>('TODO');
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false); // Estado para mostrar pantalla de ayuda DB
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // 1. INITIAL SESSION CHECK & DATA LOADING
  useEffect(() => {
    const initialize = async () => {
      // MODO DEMO: Si Supabase no está configurado, usamos datos falsos
      if (!isSupabaseConfigured) {
        console.warn('⚠️ Supabase no configurado. Iniciando Modo Demo.');
        setUsers(mockUsers);
        setShipments(mockShipments);
        setLogs(mockLogs);
        setLoading(false);
        return;
      }

      try {
        // --- HEALTH CHECK: Ver si existen las tablas ---
        // Intentamos leer la tabla users. Si falla con error 42P01, es que no existe.
        const { error: healthError } = await supabase.from('users').select('id').limit(1);
        
        if (healthError) {
          if (healthError.code === '42P01' || healthError.message.includes('does not exist')) {
             console.error("Tablas no encontradas. Mostrando asistente de setup.");
             setShowSetup(true);
             setLoading(false);
             return;
          } else if (healthError.code === '42P17') {
             // Si es un error de recursión (42P17), es un problema de RLS pero la conexión funciona
             console.warn("Aviso de RLS (Recursión detectada), pero hay conexión con el servidor.");
             setConnectionError(null);
          } else {
             console.error("Error de conexión inicial:", healthError);
             // Si es un error de conexión (ej. proyecto pausado), lo guardamos para mostrarlo
             setConnectionError(`Error de conexión (${healthError.code || '?' }): ${healthError.message}. Comprueba que el proyecto no esté pausado en Supabase.`);
          }
        } else {
          setConnectionError(null);
        }
        // ------------------------------------------------

        // Check active session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session && session.user) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('users')
            .select('id, nombre, email, rol, activo, foto_url, fecha_nacimiento, created_at')
            .eq('id', session.user.id)
            .single();
          
          if (profile) setUser(profile as User);
        }
      } catch (err: any) {
        console.error("Error conectando a Supabase:", err);
        setConnectionError("Error crítico de conexión: " + (err.message || "Desconocido"));
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // 2. FETCH DATA WHEN USER IS AUTHENTICATED (ONLY REAL MODE)
  useEffect(() => {
    if (!user || !isSupabaseConfigured || showSetup) return;

    const fetchData = async () => {
      // Fetch Shipments
      const { data: shipmentsData } = await supabase
        .from('shipments')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (shipmentsData) setShipments(shipmentsData as Shipment[]);

      // Fetch Users
      const { data: usersData } = await supabase
        .from('users')
        .select('id, nombre, email, rol, activo, foto_url, fecha_nacimiento, created_at');
      if (usersData) setUsers(usersData as User[]);

      // Fetch Logs (Admin only)
      if (user.rol === Role.ADMIN) {
        const { data: logsData } = await supabase
          .from('webhook_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (logsData) setLogs(logsData as WebhookLog[]);
      }

      // Fetch Events
      const { data: eventsData } = await supabase
        .from('tracking_events')
        .select('*')
        .order('created_at', { ascending: false });
      if (eventsData) setEvents(eventsData as TrackingEvent[]);
    };

    fetchData();

    // 3. REALTIME SUBSCRIPTION (ONLY REAL MODE)
    const channel = supabase
      .channel('hidalgo_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setShipments(prev => [payload.new as Shipment, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setShipments(prev => prev.map(s => s.id === payload.new.id ? payload.new as Shipment : s));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [user, showSetup]);

  const handleLogin = (u: User) => {
    setConnectionError(null); // Limpiamos cualquier error previo al entrar
    setUser(u);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setCurrentView('login');
  };

  const handleNavigate = (view: string) => {
    if (view === 'shipments') {
      setShipmentListFilter('TODO');
    }
    setCurrentView(view);
  };

  const handleUpdateProfile = async (updatedUser: User) => {
    // Optimistic Update
    setUser(updatedUser);
    
    // DB Update only if configured
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('users')
        .update({
          nombre: updatedUser.nombre,
          foto_url: updatedUser.foto_url,
          fecha_nacimiento: updatedUser.fecha_nacimiento,
        })
        .eq('id', updatedUser.id);

      if (error) {
        alert('Error actualizando perfil: ' + error.message);
      } else {
        alert('Perfil actualizado correctamente');
        setCurrentView('dashboard');
      }
    } else {
      alert('Perfil actualizado (Modo Demo)');
      setCurrentView('dashboard');
    }
  };

  const updateShipmentStatus = useCallback(async (id: string, newStatus: ShipmentStatus, note?: string, pod?: POD) => {
    const currentShipment = shipments.find(s => s.id === id);
    if (currentShipment?.estado === ShipmentStatus.ENTREGADO && user?.rol !== Role.ADMIN) {
      return; 
    }

    // 1. Optimistic Update (Local State)
    setShipments(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          estado: newStatus,
          updated_at: new Date().toISOString(),
          notas: note ? Security.sanitize(note) : s.notas,
          pod: pod || s.pod
        };
      }
      return s;
    }));

    // 2. DB Update (if configured)
    if (isSupabaseConfigured) {
      const updates: any = {
        estado: newStatus,
        updated_at: new Date().toISOString(),
        notas: note ? Security.sanitize(note) : currentShipment?.notas
      };
      if (pod) updates.pod = pod;

      const { error: shipError } = await supabase
        .from('shipments')
        .update(updates)
        .eq('id', id);

      if (!shipError) {
        await supabase.from('tracking_events').insert({
          id: Math.random().toString(36).substr(2, 9),
          envio_id: id,
          tipo_evento: `CAMBIO_ESTADO_${newStatus}`,
          payload_json: JSON.stringify({ note: Security.sanitize(note), prevStatus: currentShipment?.estado, hasPOD: !!pod }),
          usuario_id: user?.id || 'system',
          usuario_nombre: user?.nombre || 'Sistema',
          created_at: new Date().toISOString()
        });
      }
    }
  }, [user, shipments]);

  const assignDriver = async (shipmentId: string, driverId: string) => {
    const driver = users.find(u => u.id === driverId);
    if (!driver) return;

    // Optimistic
    setShipments(prev => prev.map(s => s.id === shipmentId ? {
      ...s,
      estado: ShipmentStatus.ASIGNADO,
      repartidor_id: driverId,
      repartidor_nombre: driver.nombre,
      updated_at: new Date().toISOString()
    } : s));

    if (isSupabaseConfigured) {
      await supabase
        .from('shipments')
        .update({
          estado: ShipmentStatus.ASIGNADO,
          repartidor_id: driverId,
          repartidor_nombre: driver.nombre,
          updated_at: new Date().toISOString()
        })
        .eq('id', shipmentId);
    }
  };

  const assignDriverBatch = async (shipmentIds: string[], driverId: string) => {
    const driver = users.find(u => u.id === driverId);
    if (!driver) return;

    // Optimistic
    setShipments(prev => prev.map(s => shipmentIds.includes(s.id) ? {
      ...s,
      estado: ShipmentStatus.ASIGNADO,
      repartidor_id: driverId,
      repartidor_nombre: driver.nombre,
      updated_at: new Date().toISOString()
    } : s));

    if (isSupabaseConfigured) {
      await supabase
        .from('shipments')
        .update({
          estado: ShipmentStatus.ASIGNADO,
          repartidor_id: driverId,
          repartidor_nombre: driver.nombre,
          updated_at: new Date().toISOString()
        })
        .in('id', shipmentIds);
    }
    
    alert(`Asignación masiva completada.`);
  };

  const updateShipment = async (id: string, updates: Partial<Shipment>) => {
    // Optimistic
    setShipments(prev => prev.map(s => s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s));

    if (isSupabaseConfigured) {
      await supabase
        .from('shipments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
    }
  };

  // --- API SIMULATION ENGINE ---
  const handleApiRequest = (method: string, endpoint: string, body: any): { status: number; data: any } => {
    if (!Security.checkRateLimit()) return { status: 429, data: { error: 'Too many requests.' } };
    const sanitizedBody = Security.sanitize(body);

    const newShipment: Shipment = {
      id: `SH${Math.floor(Math.random() * 10000)}`,
      referencia_externa: sanitizedBody.referencia_externa,
      cliente_nombre: sanitizedBody.cliente_nombre || sanitizedBody.cliente,
      cliente_telefono: sanitizedBody.cliente_telefono || '',
      cliente_email: sanitizedBody.cliente_email || '',
      destino_calle: sanitizedBody.destino_calle || sanitizedBody.destino,
      destino_poblacion: sanitizedBody.destino_poblacion || '',
      destino_provincia: sanitizedBody.destino_provincia || '',
      destino_codigo_postal: sanitizedBody.destino_codigo_postal || '',
      destino_pais: sanitizedBody.destino_pais || 'España',
      origen: sanitizedBody.origen || 'Almacén Central',
      fecha_entrega_estimada: sanitizedBody.fecha_entrega_estimada || new Date().toISOString().split('T')[0],
      franja_horaria: sanitizedBody.franja_horaria || '09:00 - 18:00',
      total_bultos: sanitizedBody.total_bultos || sanitizedBody.bultos || 1,
      total_peso: sanitizedBody.total_peso || sanitizedBody.peso || 1,
      total_volumen: sanitizedBody.total_volumen || 0.1,
      packages: sanitizedBody.packages || [],
      notas: sanitizedBody.notas || '',
      estado: ShipmentStatus.PENDIENTE,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Simulate DB insert
    if (endpoint === '/api/public/shipments' && method === 'POST') {
      setShipments(prev => [newShipment, ...prev]);
      
      if (isSupabaseConfigured) {
        (async () => {
          await supabase.from('shipments').insert(newShipment);
          await supabase.from('webhook_logs').insert({
             id: Math.random().toString(36).substr(2, 9),
             proveedor: 'Talkual',
             endpoint: `${method} ${endpoint}`,
             status: 200,
             request_body: JSON.stringify(sanitizedBody),
             response_body: '{"success": true}',
             created_at: new Date().toISOString()
          });
        })();
      }
      return { status: 201, data: { success: true, message: 'Envío creado' } };
    }
    
    return { status: 200, data: { success: true, message: 'Petición procesada' } };
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-brand-cyan font-bold tracking-widest animate-pulse">CARGANDO HIDALGO TRANSPORTES...</div>;

  // Si necesitamos setup de DB, mostramos esa pantalla exclusivamente
  if (showSetup) return <DatabaseSetup />;

  const renderContent = () => {
    if (!user) return <Login onLogin={handleLogin} users={users} initialError={connectionError} />;

    switch (currentView) {
      case 'dashboard':
        if (user.rol === Role.ADMIN) return <DashboardAdmin stats={{ shipments, users, logs }} onNavigate={handleNavigate} onAssignBatch={assignDriverBatch} />;
        if (user.rol === Role.OPERADOR) return <DashboardOperador 
          shipments={shipments} 
          onSelectShipment={(id) => { setSelectedShipmentId(id); handleNavigate('shipment_detail'); }} 
          onViewPending={() => {
            setShipmentListFilter(ShipmentStatus.PENDIENTE);
            handleNavigate('shipments');
          }}
        />;
        if (user.rol === Role.REPARTIDOR) return <DashboardRepartidor shipments={shipments.filter(s => s.repartidor_id === user.id)} onSelectShipment={(id) => { setSelectedShipmentId(id); handleNavigate('shipment_detail'); }} onScan={() => handleNavigate('scanner')} />;
        return null;
      
      case 'profile':
        return <UserProfile user={user} onUpdateProfile={handleUpdateProfile} onBack={() => handleNavigate('dashboard')} />;

      case 'shipments':
        return <ShipmentList 
          shipments={user.rol === Role.REPARTIDOR ? shipments.filter(s => s.repartidor_id === user.id) : shipments} 
          onSelect={(id) => { setSelectedShipmentId(id); handleNavigate('shipment_detail'); }}
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
          onUpdateShipment={updateShipment}
          onBack={() => handleNavigate('dashboard')}
        />;

      case 'scanner':
        return <Scanner 
          onScan={(code) => {
            const sanitizedCode = Security.sanitize(code);
            const found = shipments.find(s => s.referencia_externa === sanitizedCode || s.id === sanitizedCode);
            if (found) {
              setSelectedShipmentId(found.id);
              handleNavigate('shipment_detail');
            } else {
              alert('Envío no encontrado: ' + sanitizedCode);
            }
          }} 
          onCancel={() => handleNavigate('dashboard')} 
        />;

      case 'users':
        return <UserManagement 
          users={users} 
          setUsers={setUsers} 
          shipments={shipments} 
          onBack={() => handleNavigate('dashboard')} 
        />;

      case 'logs':
        return <LogsView logs={logs} onBack={() => handleNavigate('dashboard')} />;

      case 'api_config':
        return <ApiConfig onBack={() => handleNavigate('dashboard')} onSimulateApi={handleApiRequest} />;

      default:
        return <div>Vista no implementada</div>;
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {user && <Navbar currentView={currentView} onNavigate={handleNavigate} user={user} onLogout={handleLogout} />}
      <main className="max-w-4xl mx-auto p-4">
        <ErrorBoundary>
          {renderContent()}
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;
