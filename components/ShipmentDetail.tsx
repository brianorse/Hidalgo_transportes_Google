
import React, { useState, useRef, useEffect } from 'react';
import { 
  Shipment, 
  ShipmentStatus, 
  Role, 
  User, 
  TrackingEvent,
  POD
} from '../types';
import { STATUS_CONFIG } from '../constants';
import { 
  ArrowLeft, 
  Phone, 
  MapPin, 
  Package, 
  History, 
  Camera, 
  UserPlus,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  FileCheck,
  FileText
} from 'lucide-react';

interface ShipmentDetailProps {
  shipment: Shipment;
  events: TrackingEvent[];
  userRole: Role;
  drivers: User[];
  onUpdateStatus: (id: string, status: ShipmentStatus, note?: string, pod?: POD) => void;
  onAssignDriver: (shipmentId: string, driverId: string) => void;
  onBack: () => void;
}

const ShipmentDetail: React.FC<ShipmentDetailProps> = ({ 
  shipment, 
  events, 
  userRole, 
  drivers, 
  onUpdateStatus, 
  onAssignDriver, 
  onBack 
}) => {
  const [showAssign, setShowAssign] = useState(false);
  const [showPod, setShowPod] = useState(false);
  const [podName, setPodName] = useState('');
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDrawing = useRef(false);

  // Signature Canvas Configuration
  useEffect(() => {
    if (isSigning && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1e40af'; // blue-800
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isSigning]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling on touch
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    if (canvasRef.current) {
      setSignatureData(canvasRef.current.toDataURL());
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !canvasRef.current) return;
    e.preventDefault(); // Prevent scrolling on touch
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);

    ctx.lineTo(x, y);
    ctx.stroke();
    // Start a new path from the current point to ensure smooth continuous drawing segments
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearSignature = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setSignatureData(null);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotoData(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStatusUpdate = (status: ShipmentStatus) => {
    if (status === ShipmentStatus.ENTREGADO && !showPod) {
      setShowPod(true);
      return;
    }

    if (status === ShipmentStatus.ENTREGADO) {
      const pod: POD = {
        nombre_receptor: podName,
        firma_data: signatureData || undefined,
        foto_data: photoData || undefined,
        fecha: new Date().toISOString()
      };
      onUpdateStatus(shipment.id, status, `Receptor: ${podName}`, pod);
      setShowPod(false);
    } else {
      onUpdateStatus(shipment.id, status);
    }
  };

  return (
    <div className="pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 bg-white rounded-full border shadow-sm"><ArrowLeft size={20}/></button>
        <div>
          <h2 className="text-xl font-bold">Detalle Envío</h2>
          <p className="text-sm text-gray-500">Ref: {shipment.referencia_externa}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className={`p-4 flex items-center justify-between border-b ${STATUS_CONFIG[shipment.estado].color}`}>
          <div className="flex items-center gap-2">
            {STATUS_CONFIG[shipment.estado].icon}
            <span className="font-bold">{STATUS_CONFIG[shipment.estado].label}</span>
          </div>
          <span className="text-xs opacity-75">{new Date(shipment.updated_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div className="p-5 space-y-6">
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Cliente y Destino</h3>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><MapPin size={20}/></div>
              <div>
                <p className="font-bold text-gray-800">{shipment.cliente}</p>
                <p className="text-gray-600 text-sm">{shipment.destino}</p>
                <div className="flex gap-2 mt-2">
                  <button className="flex items-center gap-1 text-xs bg-gray-100 px-3 py-1.5 rounded-full font-bold text-gray-600 hover:bg-gray-200">
                    <Phone size={14}/> LLAMAR
                  </button>
                  <button className="flex items-center gap-1 text-xs bg-blue-100 px-3 py-1.5 rounded-full font-bold text-blue-600 hover:bg-blue-200">
                    VER MAPA
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Paquete</h3>
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                <Package size={16}/>
                <span>{shipment.bultos} bultos / {shipment.peso}kg</span>
              </div>
              {shipment.etiqueta_url && (
                <a 
                  href={shipment.etiqueta_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 font-bold hover:bg-blue-100"
                >
                  <FileText size={12}/> VER ETIQUETA
                </a>
              )}
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Horario</h3>
              <div className="text-sm text-gray-700">{shipment.franja_horaria}</div>
            </div>
          </section>

          {shipment.pod && (
            <section className="bg-green-50 p-4 rounded-xl border border-green-100">
              <h3 className="text-xs font-bold text-green-700 uppercase mb-3 flex items-center gap-2">
                <FileCheck size={14}/> Comprobante de Entrega
              </h3>
              <div className="space-y-3">
                <p className="text-sm font-medium">Receptor: <span className="font-bold">{shipment.pod.nombre_receptor}</span></p>
                <div className="flex gap-3">
                  {shipment.pod.foto_data && (
                    <div className="w-20 h-20 bg-white border rounded-lg overflow-hidden shadow-sm">
                      <img src={shipment.pod.foto_data} alt="Foto entrega" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {shipment.pod.firma_data && (
                    <div className="w-32 h-20 bg-white border rounded-lg overflow-hidden shadow-sm">
                      <img src={shipment.pod.firma_data} alt="Firma" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {shipment.notas && (
            <section className="bg-yellow-50 p-3 rounded-xl border border-yellow-100">
              <h3 className="text-[10px] font-bold text-yellow-700 uppercase mb-1">Notas</h3>
              <p className="text-sm text-yellow-800 italic">"{shipment.notas}"</p>
            </section>
          )}

          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Repartidor Asignado</h3>
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-sm font-medium">{shipment.repartidor_nombre || 'Sin asignar'}</span>
              {(userRole === Role.ADMIN || userRole === Role.OPERADOR) && (
                <button 
                  onClick={() => setShowAssign(!showAssign)}
                  className="text-blue-600 text-xs font-bold flex items-center gap-1"
                >
                  <UserPlus size={14}/> CAMBIAR
                </button>
              )}
            </div>
            {showAssign && (
              <div className="mt-2 space-y-1 p-2 bg-white border rounded-xl shadow-sm max-h-40 overflow-y-auto">
                {drivers.map(d => (
                  <button 
                    key={d.id} 
                    onClick={() => { onAssignDriver(shipment.id, d.id); setShowAssign(false); }}
                    className="w-full text-left p-2 text-sm hover:bg-blue-50 rounded"
                  >
                    {d.nombre}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Proof of Delivery Modal */}
      {showPod && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Comprobante de Entrega</h3>
              <button onClick={() => setShowPod(false)} className="p-1 hover:bg-gray-100 rounded-full"><X/></button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Receptor</label>
                <input 
                  type="text" 
                  value={podName}
                  onChange={e => setPodName(e.target.value)}
                  className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Ej: Juan López"
                />
              </div>

              {/* Photo Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-700">Foto de la Entrega</label>
                  {photoData && (
                    <button onClick={() => setPhotoData(null)} className="text-red-500 text-xs font-bold flex items-center gap-1">
                      <Trash2 size={12}/> ELIMINAR
                    </button>
                  )}
                </div>
                {!photoData ? (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-all"
                  >
                    <Camera size={32} className="mb-2"/>
                    <span className="text-xs font-bold uppercase">Hacer Foto</span>
                  </button>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border bg-gray-100 aspect-video">
                    <img src={photoData} alt="Captura" className="w-full h-full object-cover" />
                  </div>
                )}
                <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handlePhotoCapture} className="hidden" />
              </div>

              {/* Signature Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-700">Firma del Receptor</label>
                  {signatureData && (
                    <button onClick={clearSignature} className="text-red-500 text-xs font-bold flex items-center gap-1">
                      <Trash2 size={12}/> BORRAR
                    </button>
                  )}
                </div>
                
                {!isSigning && !signatureData ? (
                  <button 
                    onClick={() => setIsSigning(true)}
                    className="w-full py-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-all"
                  >
                    <div className="text-2xl font-serif mb-2 italic">Sign</div>
                    <span className="text-xs font-bold uppercase">Firmar en pantalla</span>
                  </button>
                ) : isSigning ? (
                  <div className="bg-white border-2 border-blue-100 rounded-2xl overflow-hidden touch-none select-none">
                    <canvas 
                      ref={canvasRef}
                      width={400}
                      height={200}
                      className="w-full h-48 cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseOut={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    <div className="p-2 bg-blue-50 flex justify-between">
                      <button onClick={() => { setIsSigning(false); clearSignature(); }} className="text-xs font-bold text-gray-500 px-3 py-1">Cancelar</button>
                      <button onClick={() => setIsSigning(false)} className="text-xs font-bold text-blue-600 bg-white px-4 py-1 rounded-lg border shadow-sm">Listo</button>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-2xl bg-white p-2">
                    <img src={signatureData!} alt="Firma" className="w-full h-24 object-contain" />
                    <button onClick={() => setIsSigning(true)} className="w-full py-1 text-[10px] font-bold text-blue-600 hover:underline uppercase mt-1">Volver a firmar</button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <button onClick={() => setShowPod(false)} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition">Cerrar</button>
                <button 
                  disabled={!podName || (!photoData && !signatureData)}
                  onClick={() => handleStatusUpdate(ShipmentStatus.ENTREGADO)}
                  className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-100 disabled:opacity-50 disabled:shadow-none transition-all"
                >
                  CONFIRMAR ENTREGA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Actions for Driver */}
      {userRole === Role.REPARTIDOR && (
        <div className="fixed bottom-24 left-4 right-4 flex flex-col gap-3 md:relative md:bottom-0 md:left-0 md:mt-6">
          {shipment.estado === ShipmentStatus.ASIGNADO && (
            <button 
              onClick={() => handleStatusUpdate(ShipmentStatus.EN_RUTA)}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Package size={20}/> COMENZAR REPARTO
            </button>
          )}
          {shipment.estado === ShipmentStatus.EN_RUTA && (
            <div className="flex gap-3">
              <button 
                onClick={() => handleStatusUpdate(ShipmentStatus.INCIDENCIA)}
                className="flex-1 bg-red-100 text-red-600 font-bold py-4 rounded-2xl border border-red-200 flex items-center justify-center gap-2 hover:bg-red-200 transition-all"
              >
                <AlertCircle size={20}/> INCIDENCIA
              </button>
              <button 
                onClick={() => handleStatusUpdate(ShipmentStatus.ENTREGADO)}
                className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <CheckCircle2 size={20}/> ENTREGADO
              </button>
            </div>
          )}
        </div>
      )}

      {/* Historial Tracking */}
      <section className="mt-8 px-2">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
          <History size={16}/> Historial de Seguimiento
        </h3>
        <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
          {events.length === 0 ? (
            <p className="text-sm text-gray-400 pl-8 italic">Sin actividad registrada aún.</p>
          ) : (
            events.map(e => (
              <div key={e.id} className="pl-8 relative">
                <div className="absolute left-[9px] top-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-xs font-bold text-gray-800 uppercase">{e.tipo_evento.replace('CAMBIO_ESTADO_', '')}</p>
                <p className="text-xs text-gray-500">{new Date(e.created_at).toLocaleString()}</p>
                <p className="text-xs text-gray-400">Por {e.usuario_nombre}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default ShipmentDetail;
