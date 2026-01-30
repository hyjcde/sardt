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
  Info,
  Gauge,
  Wifi,
  History,
  Target
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ReferenceLine, XAxis, YAxis, Tooltip, ResponsiveContainer, Scatter, ScatterChart, ZAxis } from 'recharts';
import realData from '@/data/realData.json';

const CesiumMap = dynamic(() => import('@/components/CesiumMap'), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center text-emerald-500 font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Establishing Satellite Uplink...</div>
});

export default function Home(props: any) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isMaximized, setIsMaximized] = useState(false);
  const [dataIndex, setDataIndex] = useState(0);
  
  const COL = {
    EPOCH: 0, LAT_R: 1, LON_R: 2, ALT_R: 3,
    LAT_B: 4, LON_B: 5, ALT_B: 6, DIST: 7,
    RSSI: 8, SNR: 9, MCS: 10, PHR: 11, SIG: 12
  };

  const currentData = useMemo(() => realData[dataIndex] || realData[0], [dataIndex]);
  
  // 获取最近 50 个点作为历史
  const history = useMemo(() => {
    const start = Math.max(0, dataIndex - 50);
    return realData.slice(start, dataIndex + 1).map((d: any) => ({
      time: d[COL.EPOCH].toString(),
      rssi: d[COL.RSSI],
      snr: d[COL.SNR],
      dist: d[COL.DIST],
      sig: d[COL.SIG],
      mcs: d[COL.MCS]
    }));
  }, [dataIndex]);

  // 获取所有已播放的历史点用于 Cesium 轨迹
  const fullHistory = useMemo(() => realData.slice(0, dataIndex + 1), [dataIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDataIndex(prev => (prev + 1) % realData.length);
    }, 300); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (dataIndex % 10 === 0) {
      const now = new Date();
      const events = [
        `LINK: RSSI ${currentData[COL.RSSI].toFixed(1)} dBm | SNR ${currentData[COL.SNR].toFixed(1)} dB`,
        `NAV: Distance to base station ${currentData[COL.DIST].toFixed(2)}m`,
        `DATA: MCS Level ${currentData[COL.MCS]} | PHR ${currentData[COL.PHR]}`,
        `UAV: Altitude ${currentData[COL.ALT_R].toFixed(1)}m AGL`,
        `SYS: Signal Indicator at ${currentData[COL.SIG]}%`
      ];
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      setLogs(prev => [`[${now.toLocaleTimeString()}] ${randomEvent}`, ...prev].slice(0, 12));
    }
  }, [dataIndex, currentData]);

  return (
    <main className="relative w-screen h-screen text-zinc-200 font-mono overflow-hidden">
      <CesiumMap currentData={currentData} fullHistory={fullHistory} />

      {/* 主界面布局 */}
      <div className="absolute inset-0 pointer-events-none p-3 flex flex-col gap-3">
        
        {/* 顶部状态栏 - 增加更多实时指标 */}
        <header className="flex justify-between items-center pointer-events-auto shrink-0">
          <div className="flex gap-2">
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-lg flex items-center gap-3 shadow-2xl">
              <div className="w-10 h-10 rounded-full border border-emerald-500/30 flex items-center justify-center bg-emerald-500/10 relative">
                <Shield className="text-emerald-400 w-5 h-5 z-10" />
                <div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-ping" />
              </div>
              <div>
                <h1 className="text-xs font-black text-white tracking-[0.3em] uppercase">SAR-DT MISSION</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                  <span className="text-[8px] text-emerald-400 font-bold uppercase">UAV-01 Uplink Active</span>
                </div>
              </div>
            </div>

            <div className="flex gap-1 bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-1 rounded-lg">
              {[
                { label: 'RSSI', val: `${currentData[COL.RSSI].toFixed(1)}`, unit: 'dBm', color: 'text-amber-400' },
                { label: 'SNR', val: `${currentData[COL.SNR].toFixed(1)}`, unit: 'dB', color: 'text-emerald-400' },
                { label: 'DIST', val: `${currentData[COL.DIST].toFixed(1)}`, unit: 'm', color: 'text-cyan-400' },
                { label: 'MCS', val: `${currentData[COL.MCS]}`, unit: 'LVL', color: 'text-blue-400' }
              ].map((m, i) => (
                <div key={i} className="px-4 py-1.5 bg-white/5 rounded flex flex-col items-center min-w-[80px]">
                  <p className="text-[7px] text-zinc-500 font-bold uppercase">{m.label}</p>
                  <p className={`${m.color} font-black text-[11px]`}>{m.val}<span className="text-[7px] ml-0.5 opacity-60">{m.unit}</span></p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-lg flex items-center gap-4 shadow-xl">
            <div className="text-right">
              <p className="text-[8px] text-zinc-500 uppercase font-bold">Signal Quality</p>
              <p className="text-sm font-black text-white">{currentData[COL.SIG]}%</p>
            </div>
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden relative border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 transition-all duration-300" 
                style={{ width: `${currentData[COL.SIG]}%` }} 
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
            </div>
          </div>
        </header>

        {/* 中间主体区域 */}
        <div className="flex-1 flex gap-3 min-h-0">
          
          {/* 左侧面板 - 深度分析 */}
          <aside className="w-[360px] flex flex-col gap-2 pointer-events-auto shrink-0">
            
            {/* 信号链路深度分析 */}
            <section className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-lg p-3 flex-1 flex flex-col shadow-xl">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2 text-amber-400 font-black uppercase text-[11px]">
                  <Wifi className="w-4 h-4" /> Link Performance
                </div>
                <div className="text-[9px] font-bold text-zinc-500 bg-white/5 px-2 py-0.5 rounded">T+{currentData[COL.EPOCH]}s</div>
              </div>
              
              {/* 实时波形图 - RSSI vs SNR */}
              <div className="flex-1 min-h-0 flex flex-col gap-3">
                <div className="flex-1 bg-black/30 rounded-lg p-3 border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/40" />
                  <p className="text-[8px] text-zinc-400 uppercase font-bold mb-2 flex items-center justify-between">
                    <span>RSSI Realtime Trend</span>
                    <span className="text-amber-400">{currentData[COL.RSSI].toFixed(1)} dBm</span>
                  </p>
                  <div className="h-[100px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history}>
                        <YAxis domain={['auto', 'auto']} hide />
                        <Line type="stepAfter" dataKey="rssi" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                        <ReferenceLine y={-40} stroke="#ffffff10" strokeDasharray="3 3" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex-1 bg-black/30 rounded-lg p-3 border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/40" />
                  <p className="text-[8px] text-zinc-400 uppercase font-bold mb-2 flex items-center justify-between">
                    <span>SNR Quality Analysis</span>
                    <span className="text-emerald-400">{currentData[COL.SNR].toFixed(1)} dB</span>
                  </p>
                  <div className="h-[100px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history}>
                        <defs>
                          <linearGradient id="snrGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <YAxis domain={['auto', 'auto']} hide />
                        <Area type="monotone" dataKey="snr" stroke="#10b981" fill="url(#snrGrad)" strokeWidth={2} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 散点图：RSSI 与 距离的关系 */}
                <div className="h-[120px] bg-black/30 rounded-lg p-3 border border-white/5">
                  <p className="text-[8px] text-zinc-400 uppercase font-bold mb-2 flex items-center gap-1">
                    <Target className="w-3 h-3 text-cyan-400" /> RSSI vs Distance Correlation
                  </p>
                  <div className="h-full w-full">
                    <ResponsiveContainer width="100%" height="80%">
                      <ScatterChart margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                        <XAxis type="number" dataKey="dist" name="distance" unit="m" hide />
                        <YAxis type="number" dataKey="rssi" name="rssi" unit="dBm" hide />
                        <ZAxis type="number" dataKey="sig" range={[20, 100]} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{background: '#18181b', border: 'none', fontSize: 8}} />
                        <Scatter name="Signal" data={history} fill="#22d3ee" isAnimationActive={false} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>

            {/* 空间坐标与姿态 */}
            <section className="bg-zinc-800/70 backdrop-blur-xl border border-white/10 rounded-lg p-3 shadow-xl">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10 text-cyan-400 font-black uppercase text-[11px]">
                <Globe className="w-4 h-4" /> Spatial Telemetry
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="bg-zinc-900/60 p-2.5 rounded border border-white/5 relative">
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    <p className="text-[7px] text-zinc-500 uppercase mb-1 font-black">UAV Receiver</p>
                    <div className="text-[10px] font-mono space-y-0.5">
                      <div className="flex justify-between"><span className="text-zinc-500">LAT</span><span className="text-white">{currentData[COL.LAT_R].toFixed(7)}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">LON</span><span className="text-white">{currentData[COL.LON_R].toFixed(7)}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">ALT</span><span className="text-cyan-400 font-black">{currentData[COL.ALT_R].toFixed(1)}m</span></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="bg-zinc-900/60 p-2.5 rounded border border-white/5 relative">
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
                    <p className="text-[7px] text-zinc-500 uppercase mb-1 font-black">Base Station</p>
                    <div className="text-[10px] font-mono space-y-0.5">
                      <div className="flex justify-between"><span className="text-zinc-500">LAT</span><span className="text-white">{currentData[COL.LAT_B].toFixed(7)}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">LON</span><span className="text-white">{currentData[COL.LON_B].toFixed(7)}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">ALT</span><span className="text-red-400 font-black">{currentData[COL.ALT_B].toFixed(1)}m</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </aside>

          {/* 中间地图区域 */}
          <div className="flex-1 relative" />

          {/* 右侧面板 - 任务与视觉 */}
          <div className="w-[380px] flex flex-col gap-2 pointer-events-auto shrink-0">
            
            <aside className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-lg flex items-center gap-1 self-end shadow-2xl">
              {[Crosshair, Eye, Layers, Globe, Wind, MapIcon, Satellite, Network, Settings].map((Icon, i) => (
                <button key={i} className="w-9 h-9 rounded flex items-center justify-center hover:bg-white/10 transition-all group">
                  <Icon className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                </button>
              ))}
            </aside>

            {/* 信号分布直方图 */}
            <section className="bg-zinc-800/70 backdrop-blur-xl border border-white/10 rounded-lg p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10 text-amber-400 font-black uppercase text-[11px]">
                <BarChart3 className="w-4 h-4" /> RSSI Distribution (Last 50)
              </div>
              <div className="h-[120px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[-100, 0]} tick={{fontSize: 8, fill: '#71717a'}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{background: '#18181b', border: 'none', fontSize: 10}} cursor={{fill: '#ffffff05'}} />
                    <Bar dataKey="rssi" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                      {history.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.rssi > -40 ? '#10b981' : entry.rssi > -60 ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* AI视觉与目标锁定 */}
            <section className="flex-1 bg-zinc-800/70 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2.5 text-red-500">
                  <BrainCircuit className="w-5 h-5 animate-pulse" />
                  <span className="text-[12px] font-black text-white uppercase tracking-wider">AI Tactical Analysis</span>
                </div>
                <button onClick={() => setIsMaximized(true)} className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 px-3 py-1 rounded border border-red-500/20 transition-all">
                  <span className="text-[9px] font-black text-red-400 uppercase">Maximize</span>
                  <Maximize2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
              
              <div className="relative flex-1 min-h-[200px] bg-black group">
                <Image src="/searched_target.png" alt="AI Feed" fill className="object-cover opacity-90 group-hover:opacity-100 transition-opacity" priority />
                
                {/* 动态扫描效果 */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500/30 blur-sm animate-[scan_4s_linear_infinite] pointer-events-none" />
                
                <div className="absolute top-4 left-4 flex flex-col gap-1">
                  <div className="bg-black/60 backdrop-blur px-2 py-1 rounded border border-white/10 text-[9px] text-emerald-400 font-black flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    AUTO-TRACKING: ON
                  </div>
                  <div className="bg-black/60 backdrop-blur px-2 py-1 rounded border border-white/10 text-[9px] text-white font-black">
                    FOV: 84.2° | ZOOM: 2.4x
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 text-right">
                  <div className="text-[24px] font-black text-white/20 select-none">01-TRK</div>
                </div>
              </div>

              <div className="p-3 bg-zinc-900/90 border-t border-white/10 shrink-0">
                <div className="flex flex-wrap gap-2">
                  <div className="flex-1 min-w-[100px] bg-emerald-500/10 border border-emerald-500/30 rounded p-2 flex flex-col items-center">
                    <span className="text-[7px] text-emerald-500/60 font-black uppercase">Target Status</span>
                    <span className="text-[10px] text-emerald-400 font-black">LOCKED & STABLE</span>
                  </div>
                  <div className="flex-1 min-w-[100px] bg-blue-500/10 border border-blue-500/30 rounded p-2 flex flex-col items-center">
                    <span className="text-[7px] text-blue-500/60 font-black uppercase">Relative Dist</span>
                    <span className="text-[10px] text-blue-400 font-black">{currentData[COL.DIST].toFixed(2)}m</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* 底部任务日志 */}
        <footer className="flex gap-3 pointer-events-auto shrink-0 h-[110px]">
          <div className="flex-1 bg-zinc-800/70 backdrop-blur-xl border border-white/10 rounded-lg p-3 flex flex-col overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/40" />
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10 font-black text-emerald-400 uppercase text-[11px]">
              <div className="flex items-center gap-2"><Terminal className="w-4 h-4" /> Mission Command Log</div>
              <div className="flex items-center gap-3 text-[9px] text-zinc-500">
                <span>UPLINK: 99.8%</span>
                <span>LATENCY: 12ms</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-[10px] leading-relaxed scrollbar-hide space-y-1 text-zinc-300 uppercase">
              {logs.map((log, i) => (
                <div key={i} className={`flex gap-3 items-start transition-all duration-500 ${i === 0 ? "text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border-l-2 border-emerald-500" : "opacity-50 hover:opacity-100"}`}>
                  <span className="text-zinc-600 font-bold w-10">[{1024 + i}]</span>
                  <span className="flex-1">{log}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="w-56 bg-gradient-to-b from-emerald-600/30 to-emerald-600/10 hover:from-emerald-600/40 hover:to-emerald-600/20 backdrop-blur-xl border border-emerald-500/40 rounded-lg flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-2xl group">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/50 flex items-center justify-center bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Navigation className="w-6 h-6 rotate-45 text-emerald-400" />
            </div>
            <span className="tracking-[0.3em] text-emerald-400 font-black text-[11px] uppercase">Initiate Rescue</span>
          </button>
        </footer>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes scan {
          from { top: 0; }
          to { top: 100%; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </main>
  );
}
