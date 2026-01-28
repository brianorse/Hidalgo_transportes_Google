
import React, { useState, useEffect } from 'react';
import { X, Camera, Keyboard } from 'lucide-react';

interface ScannerProps {
  onScan: (code: string) => void;
  onCancel: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onCancel }) => {
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simulamos inicialización de cámara
    const timer = setTimeout(() => setIsReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      <div className="p-6 flex items-center justify-between text-white relative z-10">
        <button onClick={onCancel} className="p-2 bg-white/10 rounded-full"><X size={24}/></button>
        <h2 className="font-bold">Escanear Etiqueta</h2>
        <div className="w-10"></div>
      </div>

      {!showManual ? (
        <div className="flex-1 relative flex items-center justify-center">
          {/* Overlay de cámara */}
          <div className="w-64 h-64 border-2 border-blue-500 rounded-3xl relative overflow-hidden bg-white/5 backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 animate-[scan_2s_infinite]"></div>
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center text-white/50">
                Iniciando cámara...
              </div>
            )}
          </div>
          <div className="absolute inset-0 border-[40px] border-black/60 pointer-events-none"></div>
          
          <div className="absolute bottom-32 left-0 right-0 text-center text-white px-8">
            <p className="text-sm opacity-70 mb-4">Apunta al código QR o de barras que Talkual adjuntó al envío.</p>
            {/* Mock trigger para pruebas en laptop */}
            <button 
              onClick={() => onScan('TK-99283')} 
              className="text-[10px] text-gray-500 underline"
            >
              [Simular Escaneo Exitoso]
            </button>
          </div>

          <div className="absolute bottom-12 left-0 right-0 px-6 flex justify-center gap-4">
            <button 
              onClick={() => setShowManual(true)}
              className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 transition"
            >
              <Keyboard size={20}/> Entrada Manual
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-t-3xl mt-20 p-8">
          <h3 className="text-xl font-bold mb-6 text-gray-800">Introducir Código Manual</h3>
          <div className="space-y-4">
            <input 
              type="text" 
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              className="w-full text-2xl font-mono tracking-widest p-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none"
              placeholder="Ej: TK-12345"
              autoFocus
            />
            <button 
              onClick={() => onScan(manualCode)}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg"
            >
              BUSCAR ENVÍO
            </button>
            <button 
              onClick={() => setShowManual(false)}
              className="w-full text-gray-400 font-bold py-2"
            >
              Volver a la cámara
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Scanner;
