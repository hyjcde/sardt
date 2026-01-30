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
  Target,
  AlertTriangle,
  Compass,
  Thermometer,
  CloudRain
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

// 装饰性角标组件
const CornerDecor = ({ className = "" }: { className?: string }) => (
  <div className={`absolute w-2 h-2 border-zinc-500/30 ${className}`} />
);

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
    <main className="relative w-screen h-screen text-zinc-200 font-mono overflow-hidden selection:bg-emerald-500/30">
      <CesiumMap currentData={currentData} fullHistory={fullHistory} />

      {/* 背景 HUD 装饰 */}
      <div className="absolute inset-0 pointer-events-none border-[20px] border-white/[0.02] box-content m-4" />
      <div className="absolute top-1/2 left-0 w-full h-px bg-white/[0.03]" />
      <div className="absolute top-0 left-1/2 w-px h-full bg-white/[0.03]" />

      {/* 全屏放大弹窗 */}
      {isMaximized && (
        <div className="fixed inset-0 z-50 bg-zinc-950/98 backdrop-blur-3xl p-8 flex flex-col pointer-events-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <BrainCircuit className="w-8 h-8 text-red-500 animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-[0.2em] uppercase">UAV-01 Tactical High-Res Feed</h2>
                <p className="text-xs text-zinc-500 mt-1 uppercase font-bold tracking-widest">Target Acquisition Mode: ACTIVE</p>
              </div>
            </div>
            <button 
              onClick={() => setIsMaximized(false)} 
              className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500 transition-all group"
            >
              <X className="w-6 h-6 text-white group-hover:scale-110" />
            </button>
          </div>
          <div className="flex-1 relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(239,68,68,0.15)]">
            <Image src="/searched_target.png" alt="UAV Feed Full" fill className="object-contain" priority />
            
            {/* 放大版 AI 标注 */}
            <div className="absolute top-1/4 left-1/3 w-64 h-64 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
              <div className="absolute -top-10 left-0 bg-red-600 text-white px-4 py-1.5 font-black text-sm uppercase tracking-widest flex items-center gap-3">
                <Users className="w-5 h-5" /> 3 HUMANS DETECTED
              </div>
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-red-400" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-red-400" />
            </div>
          </div>
        </div>
      )}

      {/* 主界面布局 */}
      <div className="absolute inset-0 pointer-events-none p-4 flex flex-col gap-4">
        
        {/* 顶部状态栏 */}
        <header className="flex justify-between items-start pointer-events-auto shrink-0">
          <div className="flex gap-3">
            <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/10 px-5 py-3 rounded-xl flex items-center gap-4 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              <div className="w-11 h-11 rounded-full border border-emerald-500/30 flex items-center justify-center bg-emerald-500/10 relative">
                <Shield className="text-emerald-400 w-5 h-5 z-10" />
                <div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-ping" />
              </div>
              <div>
                <h1 className="text-sm font-black text-white tracking-[0.4em] uppercase">SAR-DT COMMAND</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                  <span className="text-[9px] text-emerald-400 font-black tracking-widest uppercase">UAV-01 Uplink Stable</span>
                </div>
              </div>
            </div>

            <div className="flex gap-1.5 bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-1.5 rounded-xl shadow-xl">
              {[
                { label: 'RSSI', val: `${currentData[COL.RSSI].toFixed(1)}`, unit: 'dBm', color: 'text-amber-400', icon: Radio },
                { label: 'SNR', val: `${currentData[COL.SNR].toFixed(1)}`, unit: 'dB', color: 'text-emerald-400', icon: Activity },
                { label: 'DIST', val: `${currentData[COL.DIST].toFixed(1)}`, unit: 'm', color: 'text-cyan-400', icon: Navigation },
                { label: 'MCS', val: `${currentData[COL.MCS]}`, unit: 'LVL', color: 'text-blue-400', icon: Cpu }
              ].map((m, i) => (
                <div key={i} className="px-4 py-2 bg-white/5 rounded-lg flex flex-col items-center min-w-[90px] border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1">
                    <m.icon className={`w-3 h-3 ${m.color} opacity-70`} />
                    <p className="text-[8px] text-zinc-500 font-black uppercase tracking-tighter">{m.label}</p>
                  </div>
                  <p className={`${m.color} font-black text-xs`}>{m.val}<span className="text-[8px] ml-0.5 opacity-50">{m.unit}</span></p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-xl flex items-center gap-5 shadow-2xl relative">
            <div className="text-right">
              <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Signal Integrity</p>
              <p className="text-base font-black text-white tracking-widest">{currentData[COL.SIG]}%</p>
            </div>
            <div className="w-40 h-2.5 bg-white/5 rounded-full overflow-hidden relative border border-white/10 p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 transition-all duration-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                style={{ width: `${currentData[COL.SIG]}%` }} 
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] animate-[shimmer_3s_infinite]" />
            </div>
          </div>
        </header>

        {/* 中间主体区域 */}
        <div className="flex-1 flex gap-4 min-h-0">
          
          {/* 左侧面板 - 深度分析 */}
          <aside className="w-[380px] flex flex-col gap-3 pointer-events-auto shrink-0">
            
            {/* 信号链路深度分析 */}
            <section className="bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex-1 flex flex-col shadow-2xl relative overflow-hidden">
              <CornerDecor className="top-0 left-0 border-t border-l" />
              <CornerDecor className="top-0 right-0 border-t border-r" />
              <CornerDecor className="bottom-0 left-0 border-b border-l" />
              <CornerDecor className="bottom-0 right-0 border-b border-r" />
              
              <div className="flex justify-between items-center mb-4 pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2.5 text-amber-400 font-black uppercase text-xs tracking-wider">
                  <Wifi className="w-4 h-4" /> Link Performance Analysis
                </div>
                <div className="text-[10px] font-black text-zinc-500 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">T+{currentData[COL.EPOCH]}s</div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-zinc-800/40 p-3 rounded-xl border border-white/5 group hover:border-blue-500/30 transition-all">
                  <p className="text-[8px] text-zinc-500 uppercase mb-1 font-black">MCS Modulation</p>
                  <div className="flex items-end gap-2">
                    <p className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">{currentData[COL.MCS]}</p>
                    <p className="text-[10px] text-zinc-500 mb-1 font-bold tracking-widest">LEVEL</p>
                  </div>
                </div>
                <div className="bg-zinc-800/40 p-3 rounded-xl border border-white/5 group hover:border-emerald-500/30 transition-all">
                  <p className="text-[8px] text-zinc-500 uppercase mb-1 font-black">PHR Header</p>
                  <div className="flex items-end gap-2">
                    <p className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">{currentData[COL.PHR]}</p>
                    <p className="text-[10px] text-zinc-500 mb-1 font-bold tracking-widest">VAL</p>
                  </div>
                </div>
              </div>

              {/* 实时波形图 */}
              <div className="flex-1 min-h-0 flex flex-col gap-4">
                <div className="flex-1 bg-black/40 rounded-xl p-4 border border-white/5 relative group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/20 group-hover:bg-amber-500/50 transition-all" />
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[9px] text-zinc-400 uppercase font-black tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-500" /> RSSI Timeline
                    </p>
                    <span className="text-xs font-black text-amber-400">{currentData[COL.RSSI].toFixed(1)} dBm</span>
                  </div>
                  <div className="h-full w-full">
                    <ResponsiveContainer width="100%" height="85%">
                      <LineChart data={history}>
                        <YAxis domain={['auto', 'auto']} hide />
                        <Line type="monotone" dataKey="rssi" stroke="#f59e0b" strokeWidth={3} dot={false} isAnimationActive={false} />
                        <ReferenceLine y={-40} stroke="#ffffff10" strokeDasharray="4 4" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex-1 bg-black/40 rounded-xl p-4 border border-white/5 relative group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20 group-hover:bg-emerald-500/50 transition-all" />
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[9px] text-zinc-400 uppercase font-black tracking-widest flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-emerald-500" /> SNR Quality
                    </p>
                    <span className="text-xs font-black text-emerald-400">{currentData[COL.SNR].toFixed(1)} dB</span>
                  </div>
                  <div className="h-full w-full">
                    <ResponsiveContainer width="100%" height="85%">
                      <AreaChart data={history}>
                        <defs>
                          <linearGradient id="snrGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <YAxis domain={['auto', 'auto']} hide />
                        <Area type="monotone" dataKey="snr" stroke="#10b981" fill="url(#snrGrad)" strokeWidth={3} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>

            {/* 姿态与环境 */}
            <section className="bg-zinc-800/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-white/10 text-cyan-400 font-black uppercase text-xs tracking-wider">
                <Compass className="w-4 h-4" /> Environment & Spatial
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="bg-zinc-950/60 p-3 rounded-xl border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-1"><Thermometer className="w-3 h-3 text-orange-400 opacity-50" /></div>
                    <p className="text-[8px] text-zinc-500 uppercase mb-2 font-black tracking-tighter">Core Temp</p>
                    <p className="text-lg font-black text-white">42.8<span className="text-[10px] ml-1 opacity-50">°C</span></p>
                  </div>
                  <div className="bg-zinc-950/60 p-3 rounded-xl border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-1"><CloudRain className="w-3 h-3 text-blue-400 opacity-50" /></div>
                    <p className="text-[8px] text-zinc-500 uppercase mb-2 font-black tracking-tighter">Humidity</p>
                    <p className="text-lg font-black text-white">12<span className="text-[10px] ml-1 opacity-50">%</span></p>
                  </div>
                </div>
                <div className="bg-zinc-950/60 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                  <p className="text-[8px] text-zinc-500 uppercase font-black tracking-tighter mb-2">UAV Position</p>
                  <div className="space-y-1.5 text-[10px] font-mono">
                    <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-zinc-500">LAT</span><span className="text-white font-bold">{currentData[COL.LAT_R].toFixed(6)}</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-zinc-500">LON</span><span className="text-white font-bold">{currentData[COL.LON_R].toFixed(6)}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">ALT</span><span className="text-cyan-400 font-black">{currentData[COL.ALT_R].toFixed(1)}m</span></div>
                  </div>
                </div>
              </div>
            </section>
          </aside>

          {/* 中间地图区域 */}
          <div className="flex-1 relative" />

          {/* 右侧面板 - 任务与视觉 */}
          <div className="w-[400px] flex flex-col gap-3 pointer-events-auto shrink-0">
            
            <aside className="bg-zinc-900/80 backdrop-blur-2xl border border-white/10 p-1.5 rounded-xl flex items-center gap-1.5 self-end shadow-2xl">
              {[Crosshair, Eye, Layers, Globe, Wind, MapIcon, Satellite, Network, Settings].map((Icon, i) => (
                <button key={i} className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all group relative overflow-hidden">
                  <Icon className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/0 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </aside>

            {/* 信号分布直方图 */}
            <section className="bg-zinc-800/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl relative">
              <CornerDecor className="top-0 left-0 border-t border-l" />
              <div className="flex items-center gap-2.5 mb-4 pb-2.5 border-b border-white/10 text-amber-400 font-black uppercase text-xs tracking-wider">
                <BarChart3 className="w-4 h-4" /> Signal Density Distribution
              </div>
              <div className="h-[130px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[-100, 0]} tick={{fontSize: 9, fill: '#71717a', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 10}} cursor={{fill: '#ffffff05'}} />
                    <Bar dataKey="rssi" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                      {history.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.rssi > -40 ? '#10b981' : entry.rssi > -60 ? '#f59e0b' : '#ef4444'} opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* AI视觉与目标锁定 */}
            <section className="flex-1 bg-zinc-800/70 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl border-t-2 border-t-red-500/30">
              <div className="flex items-center justify-between px-5 py-3.5 bg-white/5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3 text-red-500">
                  <BrainCircuit className="w-5 h-5 animate-pulse" />
                  <span className="text-sm font-black text-white uppercase tracking-widest">AI Tactical Analysis</span>
                </div>
                <button onClick={() => setIsMaximized(true)} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 px-4 py-1.5 rounded-lg border border-red-500/20 transition-all shadow-lg group">
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Enlarge</span>
                  <Maximize2 className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                </button>
              </div>
              
              <div className="relative flex-1 min-h-[220px] bg-black group overflow-hidden">
                <Image src="/searched_target.png" alt="AI Feed" fill className="object-cover opacity-90 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105" priority />
                
                {/* 动态扫描与 HUD 效果 */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-30 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500/40 blur-md animate-[scan_5s_linear_infinite] pointer-events-none" />
                
                {/* 恢复红框标注 */}
                <div className="absolute top-1/4 left-1/3 w-32 h-32 border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse">
                  <div className="absolute -top-7 left-0 bg-red-600 text-white px-2 py-0.5 font-black text-[9px] uppercase tracking-widest shadow-xl flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> 3 HUMANS DETECTED
                  </div>
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-red-400" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-red-400" />
                </div>

                <div className="absolute top-5 left-5 flex flex-col gap-2">
                  <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] text-emerald-400 font-black flex items-center gap-2 shadow-xl">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    TRACKING: ACTIVE
                  </div>
                  <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] text-white font-black shadow-xl">
                    FOV: 84.2° | ZOOM: 2.4x | FPS: 60
                  </div>
                </div>

                <div className="absolute bottom-5 right-5 text-right opacity-30 group-hover:opacity-60 transition-opacity">
                  <div className="text-3xl font-black text-white select-none tracking-tighter italic">UAV-01-TRK</div>
                </div>
              </div>

              <div className="p-4 bg-zinc-900 border-t border-white/10 shrink-0">
                <div className="flex gap-3">
                  <div className="flex-1 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex flex-col items-center group hover:bg-emerald-500/10 transition-all">
                    <span className="text-[8px] text-emerald-500/60 font-black uppercase tracking-widest mb-1">Target Status</span>
                    <span className="text-xs text-emerald-400 font-black flex items-center gap-2">
                      <Target className="w-3.5 h-3.5" /> LOCKED
                    </span>
                  </div>
                  <div className="flex-1 bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 flex flex-col items-center group hover:bg-blue-500/10 transition-all">
                    <span className="text-[8px] text-blue-500/60 font-black uppercase tracking-widest mb-1">Slant Range</span>
                    <span className="text-xs text-blue-400 font-black font-mono">{currentData[COL.DIST].toFixed(2)}m</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* 底部任务日志 */}
        <footer className="flex gap-4 pointer-events-auto shrink-0 h-[120px]">
          <div className="flex-1 bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex flex-col overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-500 to-emerald-500/10" />
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/10 font-black text-emerald-400 uppercase text-xs tracking-[0.2em]">
              <div className="flex items-center gap-2.5"><Terminal className="w-4.5 h-4.5" /> Mission Control Log</div>
              <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-bold">
                <span className="flex items-center gap-1.5"><Network className="w-3 h-3" /> UPLINK: 99.8%</span>
                <span className="flex-1 w-px h-3 bg-white/10" />
                <span className="flex items-center gap-1.5"><Activity className="w-3 h-3" /> LATENCY: 12ms</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed scrollbar-hide space-y-2 text-zinc-300 uppercase">
              {logs.map((log, i) => (
                <div key={i} className={`flex gap-4 items-start transition-all duration-500 ${i === 0 ? "text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border-l-4 border-emerald-500 shadow-lg" : "opacity-40 hover:opacity-100"}`}>
                  <span className="text-zinc-600 font-black w-12">[{1024 + i}]</span>
                  <span className="flex-1 tracking-tight">{log}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="w-64 bg-gradient-to-br from-emerald-600/40 to-emerald-900/20 hover:from-emerald-500/50 hover:to-emerald-800/30 backdrop-blur-2xl border border-emerald-500/40 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl group relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.2),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-14 h-14 rounded-full border-2 border-emerald-500/50 flex items-center justify-center bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] relative z-10">
              <Navigation className="w-7 h-7 rotate-45 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="tracking-[0.4em] text-emerald-400 font-black text-xs uppercase relative z-10">Initiate Rescue</span>
          </button>
        </footer>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </main>
  );
}
