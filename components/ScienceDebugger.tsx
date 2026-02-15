
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { UNIVERSAL_CONSTANTS } from '../constants';
import { ShipState } from '../types';
import { Activity, Zap, Ruler, ShieldAlert, Radio } from 'lucide-react';
import { calculatePlanckResolution } from '../services/physicsEngine';

interface ScienceDebuggerProps {
  shipState: ShipState;
  isVisible: boolean;
  collisionDensity?: number;
}

export const ScienceDebugger: React.FC<ScienceDebuggerProps> = ({ shipState, isVisible, collisionDensity = 0 }) => {
  const energyData = useMemo(() => {
    const data = [];
    const steps = 50;
    const c = UNIVERSAL_CONSTANTS.CONSTANT_C;
    const m = UNIVERSAL_CONSTANTS.SHIP_MASS;
    for (let i = 0; i < steps; i++) {
      const v = (i / steps) * (c * 0.999);
      const beta = v / c;
      const gamma = 1 / Math.sqrt(1 - beta * beta);
      const energy = (m * c * c) * gamma;
      data.push({
        velocity: v,
        energy: energy,
        label: (beta * 100).toFixed(0) + '%'
      });
    }
    return data;
  }, []);

  const gravityData = useMemo(() => {
    const data = [];
    const steps = 80;
    const maxR = 20;
    for (let i = 0; i < steps; i++) {
      const r = (i / steps) * maxR;
      const force = (UNIVERSAL_CONSTANTS.G * UNIVERSAL_CONSTANTS.GRAVITY_STRENGTH * UNIVERSAL_CONSTANTS.SHIP_MASS) / Math.max(r * r, 1.0);
      data.push({
        distance: r,
        pull: force,
        isClipped: r < 1.0
      });
    }
    return data;
  }, []);

  const [densityHistory, setDensityHistory] = React.useState<any[]>([]);
  React.useEffect(() => {
    if (isVisible && collisionDensity !== undefined) {
      setDensityHistory(prev => [...prev.slice(-20), { val: collisionDensity, time: Date.now() }]);
    }
  }, [collisionDensity, isVisible]);

  if (!isVisible) return null;

  const currentDist = Math.sqrt(
    shipState.position[0]**2 + 
    shipState.position[1]**2 + 
    shipState.position[2]**2
  );

  const beta = shipState.velocity / UNIVERSAL_CONSTANTS.CONSTANT_C;
  const gamma = 1 / Math.sqrt(Math.max(0.0001, 1 - beta * beta));
  const planckRes = calculatePlanckResolution(shipState.velocity);
  const isHardwareLimited = planckRes <= 1.0;

  return (
    <div className="w-80 bg-black/90 backdrop-blur-3xl border border-white/20 rounded-2xl p-6 flex flex-col gap-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-cyan-400" />
          <h2 className="text-xs font-black uppercase tracking-widest text-white">Quantum Laboratory</h2>
        </div>
        <div className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[9px] text-cyan-400 font-bold uppercase">Realtime</div>
      </div>

      {isHardwareLimited && (
        <div className="bg-red-500/20 border border-red-500/40 p-3 rounded-xl flex items-center gap-3 animate-pulse">
           <ShieldAlert size={20} className="text-red-400 shrink-0" />
           <div>
             <p className="text-[10px] font-black uppercase text-red-400 tracking-tighter leading-none mb-1">Manifold Hard Cap</p>
             <p className="text-[8px] text-red-400/80 leading-none font-bold italic text-balance">Space-time resolution cannot drop below 1.00 Lp.</p>
           </div>
        </div>
      )}

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Radio size={14} className="text-cyan-400" />
          <h3 className="text-[10px] font-bold uppercase text-white/60 tracking-wider">Metric Density</h3>
        </div>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={densityHistory}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <YAxis hide domain={[0, 1.2]} />
              <Line type="stepAfter" dataKey="val" stroke="#22d3ee" strokeWidth={2} dot={false} isAnimationActive={false} />
              <ReferenceLine y={1.0} stroke="#f87171" strokeDasharray="3 3" label={{ value: 'CAP', position: 'insideTopRight', fill: '#f87171', fontSize: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-amber-400" />
          <h3 className="text-[10px] font-bold uppercase text-white/60 tracking-wider">Kinetic Energy Surge</h3>
        </div>
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={energyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="velocity" hide />
              <YAxis hide domain={['auto', 'auto']} />
              <Line type="monotone" dataKey="energy" stroke="#fbbf24" strokeWidth={2} dot={false} isAnimationActive={false} />
              <ReferenceLine x={shipState.velocity} stroke="#fff" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Activity size={14} className="text-red-400" />
          <h3 className="text-[10px] font-bold uppercase text-white/60 tracking-wider">Gravity Potential</h3>
        </div>
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={gravityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="distance" hide />
              <YAxis hide domain={[0, 'auto']} />
              <Line 
                type="monotone" 
                dataKey="pull" 
                stroke={currentDist < 1.0 ? "#22d3ee" : "#f87171"} 
                strokeWidth={2} 
                dot={false} 
                isAnimationActive={false}
              />
              <ReferenceLine x={currentDist} stroke="#fff" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Ruler size={14} className="text-cyan-400" />
            <span className="text-[10px] font-bold uppercase text-white/40 tracking-wider">Metric Resolution</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-mono font-black ${isHardwareLimited ? 'text-red-400' : 'text-cyan-400'}`}>{planckRes.toFixed(6)}</span>
            <span className="text-[10px] text-white/30 italic uppercase">Lp</span>
          </div>
      </div>
    </div>
  );
};
