
import React from 'react';
import { WebhookLog } from '../types';
import { ArrowLeft, Terminal, ShieldCheck, ShieldAlert } from 'lucide-react';

interface LogsViewProps {
  logs: WebhookLog[];
  onBack: () => void;
}

const LogsView: React.FC<LogsViewProps> = ({ logs, onBack }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 bg-white rounded-full border shadow-sm"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-bold">Logs de Integración</h2>
      </div>

      <div className="space-y-3">
        {logs.map(log => (
          <div key={log.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-3 border-b flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                {log.status < 300 ? <ShieldCheck className="text-green-500" size={16}/> : <ShieldAlert className="text-red-500" size={16}/>}
                <span className="text-xs font-bold uppercase text-gray-500">{log.proveedor} API</span>
              </div>
              <span className="text-[10px] text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <code className="text-xs bg-gray-100 px-2 py-1 rounded text-blue-700 font-mono">POST {log.endpoint}</code>
                <span className={`text-xs font-bold ${log.status < 300 ? 'text-green-600' : 'text-red-600'}`}>HTTP {log.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Terminal size={10}/> Request</span>
                  <pre className="text-[10px] bg-gray-900 text-green-400 p-2 rounded-lg overflow-x-auto h-20">{log.request_body}</pre>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Terminal size={10}/> Response</span>
                  <pre className="text-[10px] bg-gray-900 text-blue-300 p-2 rounded-lg overflow-x-auto h-20">{log.response_body}</pre>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogsView;
