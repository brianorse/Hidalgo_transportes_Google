
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Copy, ShieldCheck, Globe, Code, Download, ChevronDown, ChevronRight, Server, ExternalLink, Mail, Check, Activity, FileText, Terminal } from 'lucide-react';
import { isSupabaseConfigured, getApiUrl, getApiKey } from '../supabaseClient';
import { STATUS_CONFIG } from '../constants';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

interface ApiConfigProps {
  onBack: () => void;
  onSimulateApi?: (method: string, endpoint: string, body: any) => { status: number; data: any };
}

const ApiConfig: React.FC<ApiConfigProps> = ({ onBack }) => {
  // PROD CONSTANTS (Dynamically loaded)
  const API_URL = getApiUrl();
  const API_KEY = getApiKey();

  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>('GET_SHIPMENTS');
  const [activeTab, setActiveTab] = useState<'docs' | 'console'>('docs');

  const swaggerSpec = useMemo(() => ({
    openapi: "3.0.0",
    info: {
      title: "Hidalgo Transportes API",
      description: "API de integración logística. Soporta inyección de pedidos (POST) y consulta de estado/etiquetas (GET).",
      version: "1.1.0"
    },
    servers: [
      { url: API_URL, description: "Servidor de Producción" }
    ],
    components: {
      securitySchemes: {
        apikey: { type: "apiKey", name: "apikey", in: "header" },
        bearerAuth: { type: "http", scheme: "bearer" }
      }
    },
    security: [{ apikey: [] }, { bearerAuth: [] }],
    paths: {
      "/shipments": {
        get: {
          tags: ["Shipments"],
          summary: "Consultar estado y etiqueta (Tracking)",
          description: "Recupera la información de un envío usando la referencia externa. Devuelve estado, URL de etiqueta y POD.",
          parameters: [
            {
              name: "referencia_externa",
              in: "query",
              description: "Filtrar por ID de Talkual. Usar formato: eq.VALOR (ej: eq.TK-12345)",
              required: true,
              schema: { type: "string", example: "eq.TK-12345" }
            },
            {
              name: "select",
              in: "query",
              description: "Campos a retornar. Usar '*' para todo.",
              schema: { type: "string", example: "*" }
            }
          ],
          responses: {
            "200": {
              description: "Array de objetos encontrados",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        referencia_externa: { type: "string" },
                        estado: { type: "string", enum: ["PENDIENTE", "ASIGNADO", "EN_RUTA", "ENTREGADO", "INCIDENCIA", "DEVUELTO"] },
                        etiqueta_url: { type: "string", format: "uri", description: "URL al PDF de la etiqueta" },
                        pod: { 
                          type: "object",
                          properties: {
                            firma_data: { type: "string" },
                            foto_data: { type: "string" },
                            nombre_receptor: { type: "string" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ["Shipments"],
          summary: "Crear un nuevo envío",
          description: "Inserta un nuevo pedido en la base de datos de logística.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    referencia_externa: { type: "string", example: "TK-99283", description: "ID único del pedido en Talkual" },
                    source: { type: "string", example: "talkual", description: "Origen del pedido" },
                    cliente_nombre: { type: "string", example: "Adrià Fruit", description: "Nombre del cliente final" },
                    cliente_telefono: { type: "string", example: "600123456" },
                    cliente_email: { type: "string", example: "adria@example.com" },
                    destino_calle: { type: "string", example: "C/ Mayor 1", description: "Calle y número" },
                    destino_poblacion: { type: "string", example: "Lleida" },
                    destino_provincia: { type: "string", example: "Lleida" },
                    destino_codigo_postal: { type: "string", example: "25001" },
                    destino_pais: { type: "string", example: "España" },
                    total_bultos: { type: "integer", example: 2 },
                    total_peso: { type: "number", example: 15.5 },
                    total_volumen: { type: "number", example: 0.15 },
                    fecha_entrega_estimada: { type: "string", format: "date", example: "2026-03-15" },
                    franja_horaria: { type: "string", example: "09:00 - 14:00" },
                    notas: { type: "string", example: "Llamar antes de entregar" },
                    packages: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          peso: { type: "number", example: 15.5 },
                          volumen: { type: "number", example: 0.15 },
                          descripcion: { type: "string", example: "Caja Talkual" }
                        }
                      }
                    }
                  },
                  required: ["referencia_externa", "cliente_nombre", "destino_calle", "destino_poblacion", "destino_codigo_postal"]
                }
              }
            }
          },
          responses: {
            "201": { 
              description: "Envío creado exitosamente"
            }
          }
        }
      }
    }
  }), [API_URL]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado al portapapeles');
  };

  const downloadSwagger = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(swaggerSpec, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "hidalgo_api_v1.1.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white rounded-full border shadow-sm"><ArrowLeft size={20}/></button>
          <div>
            <h2 className="text-xl font-bold">Integración Talkual</h2>
            <p className="text-xs text-gray-500">Documentación Técnica v1.1</p>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
            onClick={downloadSwagger}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition"
            >
            <Download size={16} /> JSON SWAGGER
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('docs')}
          className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'docs' ? 'border-brand-cyan text-brand-cyan' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          DOCUMENTACIÓN
        </button>
        <button 
          onClick={() => setActiveTab('console')}
          className={`px-6 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'console' ? 'border-brand-cyan text-brand-cyan' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Terminal size={16} /> CONSOLA INTERACTIVA
        </button>
      </div>

      {activeTab === 'docs' ? (
        <>
          {/* Auth Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="text-brand-cyan" size={20} />
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">Credenciales de Producción</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Base URL</label>
                <div className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/10">
                  <code className="text-xs font-mono text-brand-cyan">{API_URL}</code>
                  <button onClick={() => copyToClipboard(API_URL)} className="p-1.5 hover:bg-white/10 rounded-lg transition"><Copy size={14}/></button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">API Key (Anon Public)</label>
                <div className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/10">
                  <code className="text-xs font-mono truncate mr-4 text-orange-300">{API_KEY}</code>
                  <button onClick={() => copyToClipboard(API_KEY)} className="p-1.5 hover:bg-white/10 rounded-lg transition"><Copy size={14}/></button>
                </div>
              </div>
            </div>
          </div>

          {/* Endpoints Documentation */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Globe size={18} className="text-brand-dark" />
              Endpoints Disponibles
            </h3>

            {/* GET SHIPMENTS (TRACKING) */}
            <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
              <button 
                onClick={() => setExpandedEndpoint(expandedEndpoint === 'GET_SHIPMENTS' ? null : 'GET_SHIPMENTS')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-200">GET</span>
                  <code className="text-sm font-bold text-gray-700">/shipments</code>
                  <span className="text-xs text-gray-500">- Tracking y Etiquetas</span>
                </div>
                {expandedEndpoint === 'GET_SHIPMENTS' ? <ChevronDown size={16} className="text-gray-400"/> : <ChevronRight size={16} className="text-gray-400"/>}
              </button>
              
              {expandedEndpoint === 'GET_SHIPMENTS' && (
                <div className="p-4 border-t border-gray-100 animate-in slide-in-from-top-2">
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                      Utiliza este endpoint para consultar el estado, descargar la etiqueta o ver el comprobante de entrega (POD).
                      Filtrar siempre por <code>referencia_externa</code>.
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Query Params</h4>
                      <div className="bg-slate-900 rounded-xl p-3 overflow-x-auto space-y-2">
                        <div className="flex justify-between text-[10px] font-mono border-b border-white/10 pb-1">
                          <span className="text-orange-300">referencia_externa</span>
                          <span className="text-white">eq.TK-12345</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-orange-300">select</span>
                          <span className="text-white">*</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Respuesta Ejemplo</h4>
                      <div className="bg-slate-900 rounded-xl p-3 overflow-x-auto">
                        <pre className="text-[10px] font-mono text-green-300">
    {`[
      {
        "referencia_externa": "TK-12345",
        "estado": "EN_RUTA",
        "etiqueta_url": "https://...",
        "pod": null
      }
    ]`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* POST SHIPMENTS */}
            <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
              <button 
                onClick={() => setExpandedEndpoint(expandedEndpoint === 'POST_SHIPMENTS' ? null : 'POST_SHIPMENTS')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">POST</span>
                  <code className="text-sm font-bold text-gray-700">/shipments</code>
                  <span className="text-xs text-gray-500">- Crear nuevo envío</span>
                </div>
                {expandedEndpoint === 'POST_SHIPMENTS' ? <ChevronDown size={16} className="text-gray-400"/> : <ChevronRight size={16} className="text-gray-400"/>}
              </button>
              
              {expandedEndpoint === 'POST_SHIPMENTS' && (
                <div className="p-4 border-t border-gray-100 animate-in slide-in-from-top-2">
                  <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                      Endpoint para inyectar pedidos. Retorna 201 Created.
                  </p>
                  <div className="bg-slate-900 rounded-xl p-3 overflow-x-auto">
                        <pre className="text-[10px] font-mono text-blue-300">
    {`{
      "referencia_externa": "TK-12345",
      "source": "talkual",
      "cliente_nombre": "Adrià Fruit",
      "cliente_email": "adria@example.com",
      "cliente_telefono": "600123456",
      "destino_calle": "C/ Mayor 1",
      "destino_poblacion": "Lleida",
      "destino_provincia": "Lleida",
      "destino_codigo_postal": "25001",
      "total_bultos": 2,
      "total_peso": 15.5,
      "fecha_entrega_estimada": "2026-03-15",
      "packages": [
        { "peso": 5, "volumen": 0.05, "descripcion": "Caja Fruta" }
      ]
    }`}
                        </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Definitions */}
          <div className="mt-8 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
              <Activity size={18} className="text-brand-orange" />
              Diccionario de Estados
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.keys(STATUS_CONFIG).map((status) => (
                <div key={status} className="flex items-center gap-2 p-2 border border-slate-100 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${status === 'ENTREGADO' ? 'bg-green-500' : status === 'INCIDENCIA' ? 'bg-red-500' : 'bg-slate-300'}`}></div>
                    <span className="text-xs font-mono font-bold text-slate-600">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={18} className="text-brand-cyan" />
              <span className="text-sm font-bold text-slate-700">Swagger UI Console</span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Prueba los endpoints en tiempo real</div>
          </div>
          <div className="swagger-container">
            <SwaggerUI 
              spec={swaggerSpec} 
              docExpansion="list"
              defaultModelsExpandDepth={-1}
              persistAuthorization={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiConfig;
