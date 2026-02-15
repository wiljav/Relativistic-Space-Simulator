
import React, { useState, useEffect, useRef } from 'react';
import { ShipState } from '../types';
import { CameraMode, UNIVERSAL_CONSTANTS } from '../constants';
import { 
  Zap, Crosshair, Eye, MessageSquare, 
  Activity, ShieldAlert, BarChart3, Atom,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RefreshCw,
  Terminal, ScrollText, Cpu, Layout
} from 'lucide-react';
import { getRelativisticInsight } from '../services/geminiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ScienceDebugger } from './ScienceDebugger';
import { calculatePlanckResolution } from '../services/physicsEngine';

interface UIOverlayProps {
  shipState: ShipState;
  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;
  controlsAPI?: {
    zoom: (delta: number) => void;
    rotate: (azimuth: number, polar: number) => void;
    reset: () => void;
  };
  simulatedVelocity: number;
  setSimulatedVelocity: (v: number) => void;
  onResetUniverse: () => void;
  photonActive: boolean;
  setPhotonActive: (active: boolean) => void;
  collisionDensity: number;
  onNavIntent: (intent: { x: number; y: number; z: number; boost: boolean } | null) => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ 
  shipState, 
  cameraMode, 
  setCameraMode,
  controlsAPI,
  simulatedVelocity,
  setSimulatedVelocity,
  onResetUniverse,
  photonActive,
  setPhotonActive,
  collisionDensity,
  onNavIntent
}) => {
  const [insightHistory, setInsightHistory] = useState<string[]>(["[SYSTEM] Quantum Navigator Online. Relativistic mesh engaged."]);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showDebugger, setShowDebugger] = useState(false);
  const [showLog, setShowLog] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const beta = simulatedVelocity;
    const planckRes = calculatePlanckResolution(simulatedVelocity * UNIVERSAL_CONSTANTS.CONSTANT_C);
    const gamma = 1 / Math.sqrt(Math.max(0.0001, 1 - beta * beta));
    const totalEnergy = (UNIVERSAL_CONSTANTS.SHIP_MASS * UNIVERSAL_CONSTANTS.CONSTANT_C**2) * gamma;
    const kineticEnergy = totalEnergy - (UNIVERSAL_CONSTANTS.SHIP_MASS * UNIVERSAL_CONSTANTS.CONSTANT_C**2);
    
    const newData = { time: Date.now(), planck: planckRes, energy: kineticEnergy, velocity: (beta * 100).toFixed(1) + '%' };
    setChartData(prev => [...prev.slice(-15), newData]);
  }, [simulatedVelocity]);

  const requestInsight = async () => {
    setLoadingInsight(true);
    const insight = await getRelativisticInsight(shipState.velocity);
    if (insight) setInsightHistory(prev => [...prev, `[NAV-AI] ${insight}`].slice(-30));
    setLoadingInsight(false);
  };

  const startNav = (axis: 'x'|'y'|'z', dir: number) => {
    if (cameraMode === CameraMode.GOD && controlsAPI) {
        // Continuous rotation in God mode can be tricky without a loop, 
        // but for now we apply one strong step.
        if (axis === 'x') controlsAPI.rotate(dir * 0.2, 0);
        if (axis === 'y') controlsAPI.rotate(0, -dir * 0.2);
    } else {
        const intent = { x: 0, y: 0, z: 0, boost: false };
        if (axis === 'x') intent.x = dir;
        if (axis === 'y') intent.y = dir;
        if (axis === 'z') intent.z = dir;
        onNavIntent(intent);
    }
  };

  const stopNav = () => onNavIntent(null);

  return (
    <div className="fixed inset-0 pointer-events-none p-6 flex flex-col justify-between z-[100]">
      <div className="flex justify-between items-start w-full">
        <div className="flex flex-col gap-4 pointer-events-auto w-80">
          <div className="bg-black/95 backdrop-blur-3xl border border-white/20 p-2 rounded-2xl flex shadow-2xl">
            <button onClick={() => setShowLog(!showLog)} className={`flex-1 py-3 rounded-xl transition-all ${showLog ? 'bg-amber-500/30 text-amber-300 border border-amber-400/50' : 'text-white/40'}`}>
              <Layout size={18} className="inline mr-2" /> <span className="text-[10px] font-black uppercase">Log</span>
            </button>
            <button onClick={() => setShowDebugger(!showDebugger)} className={`flex-1 py-3 rounded-xl transition-all ${showDebugger ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50' : 'text-white/40'}`}>
              <BarChart3 size={18} className="inline mr-2" /> <span className="text-[10px] font-black uppercase">Lab</span>
            </button>
          </div>

          <div className="bg-black/90 backdrop-blur-2xl border border-white/20 p-5 rounded-2xl shadow-2xl">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-4 border-b border-white/10 pb-2">Telemetry</h2>
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="bg-white/5 p-3 rounded-xl"><p className="text-[8px] text-white/30 mb-1">VEL</p><p className="text-xl text-cyan-400 leading-none">{shipState.velocity.toFixed(1)}</p></div>
              <div className="bg-white/5 p-3 rounded-xl"><p className="text-[8px] text-white/30 mb-1">Lp</p><p className="text-xl text-amber-400 leading-none">{calculatePlanckResolution(shipState.velocity).toFixed(3)}</p></div>
            </div>
          </div>

          {showLog && (
            <div className="bg-black/95 backdrop-blur-3xl border border-white/10 p-5 rounded-2xl shadow-2xl flex flex-col max-h-[250px] overflow-y-auto">
               <h3 className="text-[9px] font-black uppercase text-amber-400 mb-3 border-b border-amber-500/20 pb-2">Chronicle Buffer</h3>
               <div className="space-y-3">
                  {insightHistory.map((msg, i) => (
                    <div key={i} className="text-[11px] text-white/80 font-mono border-l-2 border-amber-500/30 pl-3">{msg}</div>
                  ))}
                  <div ref={logEndRef} />
               </div>
            </div>
          )}
        </div>

        <div className="absolute left-[360px] top-6 pointer-events-auto">
           <ScienceDebugger shipState={shipState} isVisible={showDebugger} collisionDensity={collisionDensity} />
        </div>

        <div className="flex flex-col gap-3 pointer-events-auto">
          <button onClick={() => setCameraMode(CameraMode.SHIP)} className={`p-4 rounded-2xl border transition-all ${cameraMode === CameraMode.SHIP ? 'bg-cyan-500 text-white' : 'bg-black/80 text-white/40'}`}><Crosshair size={26}/></button>
          <button onClick={() => setCameraMode(CameraMode.GOD)} className={`p-4 rounded-2xl border transition-all ${cameraMode === CameraMode.GOD ? 'bg-amber-500 text-white' : 'bg-black/80 text-white/40'}`}><Eye size={26}/></button>
          <button onClick={() => setPhotonActive(!photonActive)} className={`p-4 rounded-2xl border transition-all ${photonActive ? 'bg-indigo-500 text-white' : 'bg-black/80 text-white/40'}`}><Atom size={26}/></button>
          <button onClick={onResetUniverse} className="p-4 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 hover:bg-red-600 hover:text-white transition-all"><ShieldAlert size={26}/></button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="max-w-2xl mx-auto w-full pointer-events-auto bg-black/95 backdrop-blur-3xl p-6 rounded-3xl border border-white/10 shadow-2xl text-center">
           <div className="text-[10px] text-white/40 uppercase font-black tracking-[0.3em] mb-4">Relativistic Throttle</div>
           <input type="range" min="0" max="0.999" step="0.001" value={simulatedVelocity} onChange={(e) => setSimulatedVelocity(parseFloat(e.target.value))} className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400" />
           <div className="mt-2 font-mono text-cyan-400 text-xs">{(simulatedVelocity * 100).toFixed(2)}% c</div>
        </div>

        <div className="flex justify-between items-end w-full">
           <div className="bg-black/90 p-5 rounded-2xl text-[10px] text-white/30 font-mono pointer-events-auto shadow-2xl">
              <p className="mb-2 border-b border-white/5 pb-1 uppercase font-black">Controls</p>
              <p>W/S - Drive | A/D - Yaw | SPACE - Up | SHIFT - Warp</p>
           </div>

           <div className="flex-1 max-w-xl mx-8 bg-black/95 border border-white/10 rounded-2xl p-6 shadow-2xl pointer-events-auto">
              <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                <span className="text-[11px] font-black text-amber-400 uppercase">AI Navigator</span>
                <button onClick={requestInsight} className="text-[10px] px-6 py-1.5 rounded-full bg-amber-500 text-black font-black hover:bg-white transition-all uppercase">Request Insight</button>
              </div>
              <p className="text-sm italic text-amber-50 font-serif leading-relaxed h-12 overflow-hidden">
                {insightHistory[insightHistory.length - 1].replace('[NAV-AI] ', '')}
              </p>
           </div>

           <div className="bg-black/95 p-3 rounded-2xl grid grid-cols-3 gap-2 pointer-events-auto shadow-2xl">
              <button onPointerDown={() => startNav('z', 1)} onPointerUp={stopNav} onPointerLeave={stopNav} className="p-3 bg-white/5 rounded-xl text-cyan-400"><Zap size={20}/></button>
              <button onPointerDown={() => startNav('y', 1)} onPointerUp={stopNav} onPointerLeave={stopNav} className="p-3 bg-white/5 rounded-xl text-white/40"><ChevronUp size={20}/></button>
              <button onPointerDown={() => onNavIntent({x:0, y:0, z:0, boost:true})} onPointerUp={stopNav} onPointerLeave={stopNav} className="p-3 bg-white/5 rounded-xl text-indigo-400"><Cpu size={20}/></button>
              <button onPointerDown={() => startNav('x', 1)} onPointerUp={stopNav} onPointerLeave={stopNav} className="p-3 bg-white/5 rounded-xl text-white/40"><ChevronLeft size={20}/></button>
              <button onClick={() => controlsAPI?.reset()} className="p-3 bg-white/5 rounded-xl text-amber-500"><RefreshCw size={18}/></button>
              <button onPointerDown={() => startNav('x', -1)} onPointerUp={stopNav} onPointerLeave={stopNav} className="p-3 bg-white/5 rounded-xl text-white/40"><ChevronRight size={20}/></button>
              <button onPointerDown={() => startNav('z', -1)} onPointerUp={stopNav} onPointerLeave={stopNav} className="p-3 bg-white/5 rounded-xl text-red-400"><ShieldAlert size={20}/></button>
              <button onPointerDown={() => startNav('y', -1)} onPointerUp={stopNav} onPointerLeave={stopNav} className="p-3 bg-white/5 rounded-xl text-white/40"><ChevronDown size={20}/></button>
              <button className="p-3 opacity-10"><Crosshair size={20}/></button>
           </div>
        </div>
      </div>
    </div>
  );
};
