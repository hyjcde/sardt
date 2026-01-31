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
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ReferenceLine, XAxis, YAxis, Tooltip, ResponsiveContainer, Scatter, ScatterChart, ZAxis } from 'recharts';
import realData from '@/data/realData.json';

const CesiumMap = dynamic(() => import('@/components/CesiumMap'), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center text-emerald-500 font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Establishing Satellite Uplink...</div>
});

const CornerDecor = ({ className = "" }: { className?: string }) => (
  <div className={`absolute w-3 h-3 border-zinc-500/40 ${className}`} />
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
    }, 500); // 500ms 更新间隔，减少频闪
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

      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-1/2 left-4 w-1 h-32 bg-white/5 -translate-y-1/2" />
        <div className="absolute top-1/2 right-4 w-1 h-32 bg-white/5 -translate-y-1/2" />
      </div>

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
      <div className="absolute inset-0 pointer-events-none p-4 flex flex-col gap-4 z-20">
        
        {/* 顶部状态栏 */}
        <header className="flex justify-between items-start pointer-events-auto shrink-0">
          <div className="flex gap-3">
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-xl flex items-center gap-4 shadow-2xl relative overflow-hidden group hover:bg-zinc-900/80 transition-all">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              <div className="w-11 h-11 rounded-full border border-emerald-500/30 flex items-center justify-center bg-emerald-500/10 relative">
                <Shield className="text-emerald-400 w-5 h-5 z-10" />
                <div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-ping" />
              </div>
              <div>
                <h1 className="text-sm font-black text-white tracking-[0.4em] uppercase leading-none">SAR-DT COMMAND</h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                  <span className="text-[9px] text-emerald-400 font-black tracking-widest uppercase">UAV-01 Uplink Stable</span>
                </div>
              </div>
            </div>

            <div className="flex gap-1.5 bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-1.5 rounded-xl shadow-xl">
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

          <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-xl flex items-center gap-5 shadow-2xl relative">
            <div className="text-right">
              <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Signal Integrity</p>
              <p className="text-base font-black text-white tracking-widest leading-none mt-1">{currentData[COL.SIG]}%</p>
            </div>
            <div className="w-40 h-2.5 bg-white/5 rounded-full overflow-hidden relative border border-white/10 p-0.5">
              <div 
                className="h-full rounded-full bg-linear-to-r from-red-500 via-amber-400 to-emerald-500 transition-all duration-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                style={{ width: `${currentData[COL.SIG]}%` }} 
              />
            </div>
          </div>
        </header>

        {/* 中间主体区域 */}
        <div className="flex-1 flex gap-4 min-h-0">
          
          {/* 左侧面板 */}
          <aside className="w-[360px] flex flex-col gap-3 pointer-events-auto shrink-0 overflow-y-auto scrollbar-hide">
            
            {/* 链路分析 */}
            <section className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col shadow-2xl relative group hover:bg-zinc-900/70 transition-all">
              <CornerDecor className="top-0 left-0 border-t border-l" />
              <CornerDecor className="bottom-0 right-0 border-b border-r" />
              
              <div className="flex justify-between items-center mb-4 pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2.5 text-amber-400 font-black uppercase text-[10px] tracking-wider">
                  <Wifi className="w-4 h-4" /> Link Performance
                </div>
                <div className="text-[9px] font-black text-zinc-500 bg-white/5 px-2.5 py-1 rounded border border-white/5">T+{currentData[COL.EPOCH]}s</div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-zinc-800/40 p-3 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all">
                  <p className="text-[8px] text-zinc-500 uppercase mb-1 font-black tracking-tighter">MCS Modulation</p>
                  <p className="text-2xl font-black text-white leading-none">{currentData[COL.MCS]}</p>
                </div>
                <div className="bg-zinc-800/40 p-3 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all">
                  <p className="text-[8px] text-zinc-500 uppercase mb-1 font-black tracking-tighter">PHR Header</p>
                  <p className="text-2xl font-black text-white leading-none">{currentData[COL.PHR]}</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* RSSI Timeline - 专业图表 */}
                <div className="bg-black/30 rounded-xl p-3 border border-white/5 relative">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[8px] text-zinc-400 uppercase font-black tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-500" /> RSSI Timeline
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[7px] text-zinc-500">NOW:</span>
                      <span className="text-xs font-black text-amber-400">{currentData[COL.RSSI].toFixed(1)} dBm</span>
                    </div>
                  </div>
                  <div className="h-[100px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="rssiLineGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3}/>
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" strokeOpacity={0.5} />
                        <XAxis 
                          dataKey="time" 
                          axisLine={{ stroke: '#444' }}
                          tickLine={{ stroke: '#444' }}
                          tick={{ fill: '#888', fontSize: 8 }}
                          tickFormatter={(v) => `${v}s`}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          domain={[-60, -30]}
                          axisLine={{ stroke: '#444' }}
                          tickLine={{ stroke: '#444' }}
                          tick={{ fill: '#888', fontSize: 8 }}
                          tickFormatter={(v) => `${v}`}
                          width={30}
                          tickCount={4}
                          label={{ value: 'dBm', angle: -90, position: 'insideLeft', fill: '#666', fontSize: 8, dy: 15 }}
                        />
                        <ReferenceLine y={-40} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.5} />
                        <ReferenceLine y={-50} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.5} />
                        <Tooltip 
                          contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 10 }}
                          labelFormatter={(v) => `T+${v}s`}
                          formatter={(v) => [`${Number(v).toFixed(1)} dBm`, 'RSSI']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="rssi" 
                          stroke="url(#rssiLineGrad)" 
                          strokeWidth={2} 
                          dot={false} 
                          isAnimationActive={false}
                          activeDot={{ r: 4, fill: '#f59e0b', stroke: '#fff' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-between mt-1 text-[7px] text-zinc-600 uppercase">
                    <span>Range: {Math.min(...history.map(h => h.rssi)).toFixed(0)} ~ {Math.max(...history.map(h => h.rssi)).toFixed(0)} dBm</span>
                    <span>Samples: {history.length}</span>
                  </div>
                </div>

                {/* SNR Quality - 专业图表 */}
                <div className="bg-black/30 rounded-xl p-3 border border-white/5 relative">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[8px] text-zinc-400 uppercase font-black tracking-widest flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-emerald-500" /> SNR Quality
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[7px] text-zinc-500">NOW:</span>
                      <span className="text-xs font-black text-emerald-400">{currentData[COL.SNR].toFixed(1)} dB</span>
                    </div>
                  </div>
                  <div className="h-[100px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="snrGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" strokeOpacity={0.5} />
                        <XAxis 
                          dataKey="time" 
                          axisLine={{ stroke: '#444' }}
                          tickLine={{ stroke: '#444' }}
                          tick={{ fill: '#888', fontSize: 8 }}
                          tickFormatter={(v) => `${v}s`}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          domain={[0, 20]}
                          axisLine={{ stroke: '#444' }}
                          tickLine={{ stroke: '#444' }}
                          tick={{ fill: '#888', fontSize: 8 }}
                          tickFormatter={(v) => `${v}`}
                          width={30}
                          tickCount={5}
                          label={{ value: 'dB', angle: -90, position: 'insideLeft', fill: '#666', fontSize: 8, dy: 10 }}
                        />
                        <ReferenceLine y={15} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: 'Good', fill: '#10b981', fontSize: 7, position: 'right' }} />
                        <ReferenceLine y={10} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: 'Fair', fill: '#f59e0b', fontSize: 7, position: 'right' }} />
                        <Tooltip 
                          contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 10 }}
                          labelFormatter={(v) => `T+${v}s`}
                          formatter={(v) => [`${Number(v).toFixed(1)} dB`, 'SNR']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="snr" 
                          stroke="#10b981" 
                          fill="url(#snrGrad)" 
                          strokeWidth={2} 
                          isAnimationActive={false}
                          activeDot={{ r: 4, fill: '#10b981', stroke: '#fff' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-between mt-1 text-[7px] text-zinc-600 uppercase">
                    <span>Avg: {(history.reduce((a, h) => a + h.snr, 0) / history.length).toFixed(1)} dB</span>
                    <span>Quality: {currentData[COL.SNR] > 15 ? 'Excellent' : currentData[COL.SNR] > 10 ? 'Good' : 'Fair'}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 环境与位置 */}
            <section className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl relative group hover:bg-zinc-900/70 transition-all">
              <CornerDecor className="top-0 right-0 border-t border-r" />
              <CornerDecor className="bottom-0 left-0 border-b border-l" />
              <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-white/10 text-cyan-400 font-black uppercase text-[10px] tracking-wider">
                <Compass className="w-4 h-4" /> Spatial Telemetry
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950/40 p-3 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all">
                  <p className="text-[8px] text-zinc-500 uppercase mb-2 font-black tracking-tighter">UAV Receiver</p>
                  <div className="space-y-1.5 text-[9px] font-mono">
                    <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-zinc-500">LAT</span><span className="text-white">{currentData[COL.LAT_R].toFixed(6)}</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-zinc-500">LON</span><span className="text-white">{currentData[COL.LON_R].toFixed(6)}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">ALT</span><span className="text-cyan-400 font-black">{currentData[COL.ALT_R].toFixed(1)}m</span></div>
                  </div>
                </div>
                <div className="bg-zinc-950/40 p-3 rounded-xl border border-white/5 hover:border-red-500/30 transition-all">
                  <p className="text-[8px] text-zinc-500 uppercase mb-2 font-black tracking-tighter">Base Station</p>
                  <div className="space-y-1.5 text-[9px] font-mono">
                    <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-zinc-500">LAT</span><span className="text-white">{currentData[COL.LAT_B].toFixed(6)}</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-zinc-500">LON</span><span className="text-white">{currentData[COL.LON_B].toFixed(6)}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">ALT</span><span className="text-red-400 font-black">{currentData[COL.ALT_B].toFixed(1)}m</span></div>
                  </div>
                </div>
              </div>
            </section>
          </aside>

          <div className="flex-1 relative" />

          {/* 右侧面板 */}
          <div className="w-[420px] flex flex-col gap-3 pointer-events-auto shrink-0 overflow-y-auto scrollbar-hide">
            
            {/* 工具栏 */}
            <aside className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-2 rounded-xl flex flex-wrap items-center justify-center gap-1 shadow-2xl">
              {[
                { icon: Crosshair, label: 'Target', color: 'hover:text-red-400' },
                { icon: Eye, label: 'View', color: 'hover:text-blue-400' },
                { icon: Layers, label: 'Layers', color: 'hover:text-purple-400' },
                { icon: Globe, label: 'Globe', color: 'hover:text-emerald-400' },
                { icon: Wind, label: 'Weather', color: 'hover:text-cyan-400' },
                { icon: MapIcon, label: 'Map', color: 'hover:text-amber-400' },
                { icon: Satellite, label: 'Sat', color: 'hover:text-pink-400' },
                { icon: Network, label: 'Net', color: 'hover:text-indigo-400' },
                { icon: Settings, label: 'Config', color: 'hover:text-zinc-300' }
              ].map((item, i) => (
                <button key={i} className={`w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all group relative`} title={item.label}>
                  <item.icon className={`w-4 h-4 text-zinc-400 group-hover:text-white ${item.color} transition-colors`} />
                </button>
              ))}
            </aside>

            {/* 连接状态快速统计 */}
            <section className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Packets', value: Math.floor(dataIndex * 1.5), color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  { label: 'Errors', value: dataIndex % 10 === 0 ? 1 : 0, color: 'text-red-400', bg: 'bg-red-500/10' },
                  { label: 'Latency', value: `${12 + (dataIndex % 5)}ms`, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                  { label: 'Bitrate', value: `${(currentData[COL.MCS] * 1.2).toFixed(1)}`, color: 'text-purple-400', bg: 'bg-purple-500/10' }
                ].map((stat, i) => (
                  <div key={i} className={`${stat.bg} rounded-lg p-2 text-center border border-white/5`}>
                    <p className="text-[7px] text-zinc-500 uppercase font-black">{stat.label}</p>
                    <p className={`text-sm font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 信号强度仪表盘 */}
            <section className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl relative group hover:bg-zinc-900/70 transition-all">
              <CornerDecor className="top-0 left-0 border-t border-l" />
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2.5 text-amber-400 font-black uppercase text-[10px] tracking-wider">
                  <Gauge className="w-4 h-4" /> Signal Waveform
                </div>
                <div className="flex items-center gap-2 bg-zinc-800/50 px-2 py-1 rounded-lg border border-white/5">
                  <span className={`text-xs font-black ${currentData[COL.RSSI] > -40 ? 'text-emerald-400' : currentData[COL.RSSI] > -50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {currentData[COL.RSSI].toFixed(1)} dBm
                  </span>
                </div>
              </div>
              
              {/* 波形图 - 专业版 */}
              <div className="h-[90px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 5, right: 5, left: -5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="signalWaveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.5}/>
                        <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.25}/>
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 2" stroke="#333" strokeOpacity={0.3} />
                    <XAxis 
                      dataKey="time" 
                      axisLine={{ stroke: '#444' }}
                      tickLine={false}
                      tick={{ fill: '#666', fontSize: 7 }}
                      tickFormatter={(v) => `${v}s`}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      domain={[-60, -30]} 
                      axisLine={{ stroke: '#444' }}
                      tickLine={false}
                      tick={{ fill: '#666', fontSize: 7 }}
                      width={25}
                      tickCount={4}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="rssi" 
                      stroke="#10b981" 
                      strokeWidth={1.5}
                      fill="url(#signalWaveGrad)" 
                      isAnimationActive={false}
                    />
                    <ReferenceLine y={-40} stroke="#10b981" strokeDasharray="2 2" strokeOpacity={0.4} />
                    <ReferenceLine y={-50} stroke="#f59e0b" strokeDasharray="2 2" strokeOpacity={0.4} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* 信号强度指示条 */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-zinc-500 uppercase w-8">RSSI</span>
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.max(0, Math.min(100, (currentData[COL.RSSI] + 80) * 2))}%`,
                        background: `linear-gradient(90deg, #ef4444, #f59e0b, #10b981)`
                      }} 
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-zinc-500 uppercase w-8">SNR</span>
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, currentData[COL.SNR] * 5)}%` }} 
                    />
                  </div>
                </div>
              </div>
              
              {/* 统计数据 */}
              <div className="flex justify-between mt-3 pt-2 border-t border-white/5 text-[8px] text-zinc-500 uppercase font-black">
                <div className="text-center">
                  <div className="text-emerald-400 text-sm font-mono">{Math.max(...history.map(h => h.rssi)).toFixed(0)}</div>
                  <div>Peak</div>
                </div>
                <div className="text-center">
                  <div className="text-amber-400 text-sm font-mono">{(history.reduce((a, h) => a + h.rssi, 0) / history.length).toFixed(0)}</div>
                  <div>Avg</div>
                </div>
                <div className="text-center">
                  <div className="text-red-400 text-sm font-mono">{Math.min(...history.map(h => h.rssi)).toFixed(0)}</div>
                  <div>Min</div>
                </div>
                <div className="text-center">
                  <div className="text-cyan-400 text-sm font-mono">{(history[history.length - 1]?.snr || 0).toFixed(1)}</div>
                  <div>SNR</div>
                </div>
              </div>
            </section>

            {/* AI 战术分析 */}
            <section className="flex-1 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl border-t-2 border-t-red-500/30 group hover:bg-zinc-900/70 transition-all">
              <div className="flex items-center justify-between px-5 py-3 bg-white/5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3 text-red-500">
                  <BrainCircuit className="w-5 h-5 animate-pulse" />
                  <span className="text-[11px] font-black text-white uppercase tracking-widest">AI Tactical Analysis</span>
                </div>
                <button onClick={() => setIsMaximized(true)} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/20 transition-all shadow-lg">
                  <span className="text-[9px] font-black text-red-400 uppercase">Enlarge</span>
                  <Maximize2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
              
              <div className="relative flex-1 min-h-[220px] bg-black overflow-hidden">
                <Image src="/searched_target.png" alt="AI Feed" fill className="object-cover opacity-90 transition-all duration-700 group-hover:scale-105" priority />
                
                {/* 扫描线动画 */}
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500/40 blur-sm animate-[scan_4s_linear_infinite] pointer-events-none z-10" />
                
                {/* AI 标注框 - 确保 z-index 正确 */}
                <div className="absolute top-1/4 left-1/3 w-32 h-32 border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse z-20">
                  <div className="absolute -top-7 left-0 bg-red-600 text-white px-2 py-0.5 font-black text-[9px] uppercase tracking-widest shadow-xl flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> 3 HUMANS DETECTED
                  </div>
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-red-400" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-red-400" />
                </div>

                <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-20">
                  <div className="bg-black/70 backdrop-blur px-2.5 py-1 rounded-lg border border-white/10 text-[9px] text-emerald-400 font-black flex items-center gap-2 shadow-xl">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    TRACKING: ACTIVE
                  </div>
                  <div className="bg-black/70 backdrop-blur px-2.5 py-1 rounded-lg border border-white/10 text-[9px] text-white font-black shadow-xl">
                    FOV: 84.2° | ZOOM: 2.4x
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/90 border-t border-white/10 shrink-0">
                <div className="flex gap-3">
                  <div className="flex-1 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex flex-col items-center hover:bg-emerald-500/10 transition-all">
                    <span className="text-[8px] text-emerald-500/60 font-black uppercase mb-1">Target Status</span>
                    <span className="text-[10px] text-emerald-400 font-black flex items-center gap-2 uppercase">LOCKED</span>
                  </div>
                  <div className="flex-1 bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 flex flex-col items-center hover:bg-blue-500/10 transition-all">
                    <span className="text-[8px] text-blue-500/60 font-black uppercase mb-1">Slant Range</span>
                    <span className="text-[10px] text-blue-400 font-black font-mono">{currentData[COL.DIST].toFixed(2)}m</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* 底部任务日志 */}
        <footer className="flex gap-4 pointer-events-auto shrink-0 h-[110px]">
          <div className="flex-1 bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col overflow-hidden relative shadow-2xl group hover:bg-zinc-900/80 transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-emerald-500/10" />
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/10 font-black text-emerald-400 uppercase text-[10px] tracking-widest">
              <div className="flex items-center gap-2.5"><Terminal className="w-4 h-4" /> Mission Control Log</div>
              <div className="flex items-center gap-4 text-[9px] text-zinc-500 font-bold uppercase">
                <span>Uplink: 99.8%</span>
                <span className="w-px h-3 bg-white/10" />
                <span>Latency: 12ms</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-[10px] leading-relaxed scrollbar-hide space-y-1.5 text-zinc-300 uppercase">
              {logs.map((log, i) => (
                <div key={i} className={`flex gap-3 items-start transition-all duration-500 ${i === 0 ? "text-emerald-400 bg-emerald-500/10 px-2 py-1.5 rounded-lg border-l-2 border-emerald-500" : "opacity-40 hover:opacity-100"}`}>
                  <span className="text-zinc-600 font-black w-10">[{1024 + i}]</span>
                  <span className="flex-1 tracking-tight">{log}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="w-64 bg-gradient-to-br from-emerald-600/40 to-emerald-900/20 hover:from-emerald-500/50 hover:to-emerald-800/30 backdrop-blur-xl border border-emerald-500/40 rounded-2xl flex flex-col items-center justify-center gap-2.5 transition-all active:scale-95 shadow-2xl group relative overflow-hidden">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/50 flex items-center justify-center bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] relative z-10">
              <Navigation className="w-6 h-6 rotate-45 text-emerald-400" />
            </div>
            <span className="tracking-[0.3em] text-emerald-400 font-black text-[10px] uppercase relative z-10">Initiate Rescue</span>
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
