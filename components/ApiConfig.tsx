
import React, { useState } from 'react';
import { ArrowLeft, Copy, ShieldCheck, Globe, Code, Play, CheckCircle, AlertTriangle } from 'lucide-react';

interface ApiConfigProps {
  onBack: () => void;
  onSimulateApi?: (method: string, endpoint: string, body: any) => { status: number; data: any };
}

const ApiConfig: React.FC<ApiConfigProps> = ({ onBack, onSimulateApi }) => {
  const apiKey = "hk_live_7248923hh8923u_talkual_prod";
  
  // Console State
  const [selectedMethod, setSelectedMethod] = useState('POST');
  const [endpointInput, setEndpointInput] = useState('/api/public/shipments');
  const [requestBody, setRequestBody] = useState('{\n  "referencia_externa": "TK-TEST-001",\n  "cliente": "Cliente Test API",\n  "destino": "Calle Pruebas 123",\n  "bultos": 2\n}');
  const [response, setResponse] = useState<{status: number, data: any} | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado al portapapeles');
  };

  const handleSendRequest = () => {
    if (onSimulateApi) {
      try {
        const body = JSON.parse(requestBody);
        const res = onSimulateApi(selectedMethod, endpointInput, body);
        setResponse(res);
      } catch (e) {
        setResponse({ status: 400, data: { error: 'JSON Inválido en el cuerpo de la petición' } });
      }
    }
  };

  const loadTemplate = (type: 'create' | 'update' | 'label') => {
    setResponse(null);
    if (type === 'create') {
      setSelectedMethod('POST');
      setEndpointInput('/api/public/shipments');
      setRequestBody('{\n  "referencia_externa": "TK-' + Math.floor(Math.random()*1000) + '",\n  "cliente": "Talkual Cliente",\n  "destino": "Av. Diagonal 123, BCN",\n  "bultos": 1,\n  "peso": 3.5,\n  "franja_horaria": "10:00 - 14:00"\n}');
    } else if (type === 'update') {
      setSelectedMethod('PUT');
      setEndpointInput('/api/public/shipments/SH001');
      setRequestBody('{\n  "notas": "ACTUALIZADO VÍA API: Cliente llama para confirmar horario",\n  "franja_horaria": "16:00 - 19:00"\n}');
    } else if (type === 'label') {
      setSelectedMethod('POST');
      setEndpointInput('/api/public/shipments/SH001/labels');
      setRequestBody('{\n  "label_url": "https://example.com/labels/label_123.pdf",\n  "format": "PDF"\n}');
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 bg-white rounded-full border shadow-sm"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-bold">Configuración API Pública</h2>
      </div>

      {/* API Key Card */}
      <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="text-blue-400" size={20} />
          <span className="text-xs font-bold uppercase tracking-wider opacity-70">Tu Clave de Acceso (Talkual)</span>
        </div>
        <div className="flex items-center justify-between bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-md">
          <code className="text-sm font-mono truncate mr-4">{apiKey}</code>
          <button onClick={() => copyToClipboard(apiKey)} className="p-2 hover:bg-white/20 rounded-lg transition">
            <Copy size={18} />
          </button>
        </div>
        <p className="mt-4 text-[10px] text-blue-200 leading-relaxed">
          Comparte esta clave únicamente con el equipo técnico de Talkual. Esta clave permite crear y modificar envíos en tu nombre.
        </p>
      </div>

      {/* Interactive Console */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-purple-500" />
            <h3 className="font-bold text-sm">Consola de Pruebas</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={() => loadTemplate('create')} className="text-[10px] bg-white border px-2 py-1 rounded font-bold hover:bg-gray-50">Cargar Crear</button>
            <button onClick={() => loadTemplate('update')} className="text-[10px] bg-white border px-2 py-1 rounded font-bold hover:bg-gray-50">Cargar Editar</button>
            <button onClick={() => loadTemplate('label')} className="text-[10px] bg-white border px-2 py-1 rounded font-bold hover:bg-gray-50">Cargar Etiqueta</button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <select 
              value={selectedMethod} 
              onChange={e => setSelectedMethod(e.target.value)}
              className="bg-gray-50 border rounded-xl px-3 py-2 font-mono text-sm font-bold"
            >
              <option>POST</option>
              <option>PUT</option>
              <option>GET</option>
            </select>
            <input 
              type="text" 
              value={endpointInput}
              onChange={e => setEndpointInput(e.target.value)}
              className="flex-1 bg-gray-50 border rounded-xl px-3 py-2 font-mono text-sm"
              placeholder="/api/public/..."
            />
          </div>

          <div className="relative">
            <div className="absolute top-2 right-2 text-[10px] font-bold text-gray-400">JSON BODY</div>
            <textarea 
              value={requestBody}
              onChange={e => setRequestBody(e.target.value)}
              className="w-full h-32 bg-gray-900 text-blue-300 font-mono text-xs p-4 rounded-xl resize-none outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button 
            onClick={handleSendRequest}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Play size={18} /> ENVIAR PETICIÓN
          </button>

          {response && (
            <div className={`rounded-xl border p-4 animate-in slide-in-from-top-2 fade-in ${
              response.status < 300 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {response.status < 300 ? <CheckCircle size={16} className="text-green-600"/> : <AlertTriangle size={16} className="text-red-600"/>}
                <span className={`text-xs font-bold ${response.status < 300 ? 'text-green-700' : 'text-red-700'}`}>Status: {response.status}</span>
              </div>
              <pre className="text-[10px] overflow-x-auto whitespace-pre-wrap font-mono text-gray-700">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </section>

      {/* Static Documentation */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden opacity-60">
        <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
          <Code size={18} className="text-gray-400" />
          <h3 className="font-bold text-sm">Documentación Referencia</h3>
        </div>
        
        <div className="p-4 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">POST</span>
              <code className="text-xs font-bold text-gray-700">/api/public/shipments</code>
            </div>
            <p className="text-xs text-gray-500">Crea un nuevo envío en el sistema de Hidalgo.</p>
          </div>
          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded">PUT</span>
              <code className="text-xs font-bold text-gray-700">/api/public/shipments/{`{id}`}</code>
            </div>
            <p className="text-xs text-gray-500">Actualiza datos del envío (notas, franja horaria).</p>
          </div>
          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">POST</span>
              <code className="text-xs font-bold text-gray-700">/api/public/shipments/{`{id}`}/labels</code>
            </div>
            <p className="text-xs text-gray-500">Adjunta URL de etiqueta PDF/ZPL al envío.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiConfig;
