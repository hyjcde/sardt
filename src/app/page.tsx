'use client';

import {
  Activity,
  Battery,
  BrainCircuit,
  Cpu,
  Crosshair,
  Eye,
  Globe,
  Layers,
  Map as MapIcon, Maximize2,
  Navigation,
  Network,
  Radio,
  Satellite,
  Settings,
  Shield,
  Signal,
  Terminal,
  Users,
  Wind,
  X,
  Zap,
  BarChart3,
  TrendingUp,
  Info
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ReferenceLine, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import realData from '@/data/realData.json';

const CesiumMap = dynamic(() => import('@/components/CesiumMap'), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center text-emerald-500 font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Establishing Satellite Uplink...</div>
});

export default function Home(props: any) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isMaximized, setIsMaximized] = useState(false);
  const [dataIndex, setDataIndex] = useState(0);
  
  // 数据列索引定义
  const COL = {
    EPOCH: 0, LAT_R: 1, LON_R: 2, ALT_R: 3,
    LAT_B: 4, LON_B: 5, ALT_B: 6, DIST: 7,
    RSSI: 8, SNR: 9, MCS: 10, PHR: 11, SIG: 12
  };

  const currentData = useMemo(() => realData[dataIndex] || realData[0], [dataIndex]);
  
  // 历史数据用于图表
  const history = useMemo(() => {
    const start = Math.max(0, dataIndex - 20);
    return realData.slice(start, dataIndex + 1).map((d: any) => ({
      time: d[COL.EPOCH].toString(),
      rssi: d[COL.RSSI],
      snr: d[COL.SNR],
      dist: d[COL.DIST],
      sig: d[COL.SIG]
    }));
  }, [dataIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDataIndex(prev => (prev + 1) % realData.length);
    }, 500); // 500ms 更新一次，模拟实时

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (dataIndex % 5 === 0) {
      const now = new Date();
      const events = [
        `SIG: RSSI ${currentData[COL.RSSI].toFixed(1)} dBm stable`,
        `SYS: Distance to target ${currentData[COL.DIST].toFixed(2)}m`,
        `AI: Signal Indicator ${currentData[COL.SIG]}%`,
        `UAV: MCS level ${currentData[COL.MCS]} active`,
        `LINK: SNR ${currentData[COL.SNR].toFixed(1)} dB verified`
      ];
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      setLogs(prev => [`[${now.toLocaleTimeString()}] ${randomEvent}`, ...prev].slice(0, 10));
    }
  }, [dataIndex, currentData]);

  return (
    <main className="relative w-screen h-screen text-zinc-200 font-mono overflow-hidden">
      <CesiumMap currentData={currentData} />

      {/* 全屏放大弹窗 */}
      {isMaximized && (
        <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-2xl p-6 flex flex-col pointer-events-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <BrainCircuit className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-black text-white tracking-widest uppercase">UAV-01 Tactical Feed</h2>
            </div>
            <button onClick={() => setIsMaximized(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-500 transition-all">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10">
            <Image src="/searched_target.png" alt="UAV Feed Full" fill className="object-contain" priority />
          </div>
        </div>
      )}

      {/* 主界面布局 */}
      <div className="absolute inset-0 pointer-events-none p-3 flex flex-col gap-3">
        
        {/* 顶部状态栏 */}
        <header className="flex justify-between items-center pointer-events-auto shrink-0">
          <div className="flex gap-2">
            <div className="bg-zinc-800/60 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-lg flex items-center gap-3 shadow-xl">
              <div className="w-9 h-9 rounded-full border border-emerald-500/30 flex items-center justify-center bg-emerald-500/10 relative">
                <Shield className="text-emerald-400 w-4 h-4 z-10" />
                <div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-ping" />
              </div>
              <div>
                <h1 className="text-xs font-black text-white tracking-[0.25em] uppercase">SAR-DT REALTIME</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                  <span className="text-[8px] text-emerald-400 font-bold uppercase">Live Data Stream</span>
                </div>
              </div>
            </div>

            <div className="flex gap-1 bg-zinc-800/40 backdrop-blur-xl border border-white/5 p-1 rounded-lg">
              {[
                { label: 'RSSI', val: `${currentData[COL.RSSI].toFixed(1)}dBm`, color: 'text-amber-400' },
                { label: 'SNR', val: `${currentData[COL.SNR].toFixed(1)}dB`, color: 'text-emerald-400' },
                { label: 'DIST', val: `${currentData[COL.DIST].toFixed(1)}m`, color: 'text-cyan-400' }
              ].map((m, i) => (
                <div key={i} className="px-3 py-1.5 bg-white/5 rounded flex flex-col items-center min-w-[70px]">
                  <p className="text-[7px] text-zinc-500 font-bold uppercase">{m.label}</p>
                  <p className={`${m.color} font-black text-[10px]`}>{m.val}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-800/60 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-lg flex items-center gap-3">
            <div className="text-right">
              <p className="text-[8px] text-zinc-500 uppercase font-bold">Signal Quality</p>
              <p className="text-sm font-black text-white">{currentData[COL.SIG]}%</p>
            </div>
            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500" style={{ width: `${currentData[COL.SIG]}%` }} />
            </div>
          </div>
        </header>

        {/* 中间主体区域 */}
        <div className="flex-1 flex gap-3 min-h-0">
          
          {/* 左侧面板 */}
          <aside className="w-[340px] flex flex-col gap-2 pointer-events-auto shrink-0">
            
            {/* 实时信号指标 */}
            <section className="bg-zinc-900/70 backdrop-blur-xl border border-white/10 rounded-lg p-3 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-white/5">
                <div className="flex items-center gap-1.5 text-amber-400 font-black uppercase text-[10px]">
                  <Radio className="w-3.5 h-3.5" /> Link Telemetry
                </div>
                <div className="text-[8px] font-bold text-zinc-500">EPOCH: {currentData[COL.EPOCH]}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-zinc-800/40 p-2 rounded border border-white/5">
                  <p className="text-[7px] text-zinc-500 uppercase mb-1">MCS Level</p>
                  <p className="text-lg font-black text-white">{currentData[COL.MCS]}</p>
                </div>
                <div className="bg-zinc-800/40 p-2 rounded border border-white/5">
                  <p className="text-[7px] text-zinc-500 uppercase mb-1">PHR Value</p>
                  <p className="text-lg font-black text-white">{currentData[COL.PHR]}</p>
                </div>
              </div>

              {/* RSSI 趋势图 */}
              <div className="flex-1 min-h-0 flex flex-col gap-2">
                <div className="flex-1 bg-black/20 rounded p-2 border border-white/5">
                  <p className="text-[8px] text-zinc-500 uppercase font-bold mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> RSSI Timeline (dBm)
                  </p>
                  <div className="h-full w-full">
                    <LineChart width={300} height={100} data={history} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <XAxis dataKey="time" hide />
                      <YAxis domain={['auto', 'auto']} tick={{fontSize: 8, fill: '#52525b'}} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{background: '#18181b', border: 'none', fontSize: 10}} />
                      <Line type="monotone" dataKey="rssi" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </div>
                </div>

                <div className="flex-1 bg-black/20 rounded p-2 border border-white/5">
                  <p className="text-[8px] text-zinc-500 uppercase font-bold mb-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> SNR Timeline (dB)
                  </p>
                  <div className="h-full w-full">
                    <AreaChart width={300} height={100} data={history} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <XAxis dataKey="time" hide />
                      <YAxis domain={['auto', 'auto']} tick={{fontSize: 8, fill: '#52525b'}} axisLine={false} tickLine={false} />
                      <Area type="monotone" dataKey="snr" stroke="#10b981" fill="#10b98120" strokeWidth={2} isAnimationActive={false} />
                    </AreaChart>
                  </div>
                </div>
              </div>
            </section>

            {/* 位置数据 */}
            <section className="bg-zinc-800/60 backdrop-blur-xl border border-white/10 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-white/5 text-cyan-400 font-black uppercase text-[10px]">
                <Navigation className="w-3.5 h-3.5" /> Spatial Coordinates
              </div>
              <div className="space-y-2">
                <div className="bg-zinc-900/40 p-2 rounded border border-white/5">
                  <p className="text-[7px] text-zinc-500 uppercase mb-1">UAV (Receiver)</p>
                  <div className="grid grid-cols-3 gap-1 text-[9px]">
                    <div><span className="text-zinc-500">LAT:</span> <span className="text-white font-bold">{currentData[COL.LAT_R].toFixed(6)}</span></div>
                    <div><span className="text-zinc-500">LON:</span> <span className="text-white font-bold">{currentData[COL.LON_R].toFixed(6)}</span></div>
                    <div><span className="text-zinc-500">ALT:</span> <span className="text-white font-bold">{currentData[COL.ALT_R].toFixed(1)}m</span></div>
                  </div>
                </div>
                <div className="bg-zinc-900/40 p-2 rounded border border-white/5">
                  <p className="text-[7px] text-zinc-500 uppercase mb-1">Base (Target)</p>
                  <div className="grid grid-cols-3 gap-1 text-[9px]">
                    <div><span className="text-zinc-500">LAT:</span> <span className="text-white font-bold">{currentData[COL.LAT_B].toFixed(6)}</span></div>
                    <div><span className="text-zinc-500">LON:</span> <span className="text-white font-bold">{currentData[COL.LON_B].toFixed(6)}</span></div>
                    <div><span className="text-zinc-500">ALT:</span> <span className="text-white font-bold">{currentData[COL.ALT_B].toFixed(1)}m</span></div>
                  </div>
                </div>
              </div>
            </section>
          </aside>

          {/* 中间地图区域 */}
          <div className="flex-1 relative" />

          {/* 右侧面板 */}
          <div className="w-[360px] flex flex-col gap-2 pointer-events-auto shrink-0">
            
            <aside className="bg-zinc-900/70 backdrop-blur-xl border border-white/10 p-1 rounded-lg flex items-center gap-0.5 self-end">
              {[Crosshair, Eye, Layers, Globe, Wind, MapIcon, Satellite, Network, Settings].map((Icon, i) => (
                <button key={i} className="w-8 h-8 rounded flex items-center justify-center hover:bg-white/10 transition-all">
                  <Icon className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              ))}
            </aside>

            {/* 信号强度分布 */}
            <section className="bg-zinc-800/60 backdrop-blur-xl border border-white/10 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-white/5 text-amber-400 font-black uppercase text-[10px]">
                <BarChart3 className="w-3.5 h-3.5" /> Signal Distribution
              </div>
              <div className="h-[100px] w-full">
                <BarChart width={320} height={100} data={history.slice(-10)} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[-100, 0]} tick={{fontSize: 7, fill: '#52525b'}} axisLine={false} tickLine={false} />
                  <Bar dataKey="rssi" fill="#f59e0b" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </div>
            </section>

            {/* AI视觉识别 */}
            <section className="flex-1 bg-zinc-800/60 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2 text-red-500">
                  <BrainCircuit className="w-4 h-4 animate-pulse" />
                  <span className="text-[11px] font-black text-white uppercase">AI Optical Analysis</span>
                </div>
                <button onClick={() => setIsMaximized(true)} className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded border border-red-500/20 transition-all">
                  <span className="text-[8px] font-black text-red-400 uppercase">Enlarge</span>
                  <Maximize2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
              
              <div className="relative flex-1 min-h-[180px] bg-black">
                <Image src="/searched_target.png" alt="AI Feed" fill className="object-cover opacity-80" priority />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_2px] opacity-40" />
                <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded border border-white/10 text-[8px] text-emerald-400">
                  AUTO-TRACKING ACTIVE
                </div>
              </div>

              <div className="p-2.5 bg-zinc-900/80 border-t border-white/10 shrink-0">
                <div className="flex flex-wrap gap-1.5">
                  <div className="text-[8px] border px-2 py-1 rounded font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    TARGET LOCKED
                  </div>
                  <div className="text-[8px] border px-2 py-1 rounded font-bold bg-blue-500/10 text-blue-400 border-blue-500/30">
                    DIST: {currentData[COL.DIST].toFixed(1)}m
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* 底部控制栏 */}
        <footer className="flex gap-3 pointer-events-auto shrink-0 h-[100px]">
          <div className="flex-1 bg-zinc-800/60 backdrop-blur-xl border border-white/10 rounded-lg p-2.5 flex flex-col overflow-hidden relative">
            <div className="absolute top-0 left-0 w-0.5 h-full bg-emerald-500/40" />
            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-white/10 font-black text-emerald-400 uppercase text-[10px]">
              <div className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> Mission Log</div>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-[9px] leading-relaxed scrollbar-hide space-y-1 text-zinc-300 uppercase">
              {logs.map((log, i) => (
                <div key={i} className={`flex gap-2 items-start ${i === 0 ? "text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded" : "opacity-60"}`}>
                  <span className="text-zinc-600 font-bold w-8">[{1024 + i}]</span>
                  <span className="flex-1">{log}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="w-48 bg-emerald-600/20 hover:bg-emerald-600/30 backdrop-blur-xl border border-emerald-500/40 rounded-lg flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-lg group">
            <div className="w-10 h-10 rounded-full border-2 border-emerald-500/50 flex items-center justify-center bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-all">
              <Navigation className="w-5 h-5 rotate-45 text-emerald-400" />
            </div>
            <span className="tracking-[0.2em] text-emerald-400 font-black text-[10px] uppercase">Initiate Rescue</span>
          </button>
        </footer>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}
