'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { 
  Shield, Battery, Signal, Crosshair, Layers, Navigation, 
  Terminal, Cpu, Globe, Radio, Wind,
  Eye, BrainCircuit, Satellite, Network, Settings, Map as MapIcon, Maximize2, X, Users, Activity, Zap
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, ReferenceLine } from 'recharts';

const CesiumMap = dynamic(() => import('@/components/CesiumMap'), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-slate-950 flex items-center justify-center text-emerald-500 font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Establishing Satellite Uplink...</div>
});

// 自定义发光柱形组件
const GlowBar = (props: any) => {
  const { x, y, width, height, fill, glowColor } = props;
  return (
    <g>
      <defs>
        <filter id={`glow-${fill}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id={`barGrad-${fill}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={1}/>
          <stop offset="100%" stopColor={fill} stopOpacity={0.4}/>
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={width} height={height} fill={`url(#barGrad-${fill})`} rx={3} filter={`url(#glow-${fill})`} />
      <rect x={x} y={y} width={width} height={2} fill={fill} opacity={0.8} rx={1} />
    </g>
  );
};

export default function Home(props: any) {
  const [logs, setLogs] = useState<string[]>([]);
  const [coverage, setCoverage] = useState(64.37);
  const [isMaximized, setIsMaximized] = useState(false);
  const [tick, setTick] = useState(0);
  const [signalHistory, setSignalHistory] = useState<{time: string; uav1: number; uav2: number; uav3: number}[]>([
    { time: '00', uav1: -42, uav2: -54, uav3: -66 },
    { time: '01', uav1: -38, uav2: -50, uav3: -62 },
    { time: '02', uav1: -44, uav2: -52, uav3: -68 },
    { time: '03', uav1: -40, uav2: -48, uav3: -64 },
  ]);
  const [coverageHistory, setCoverageHistory] = useState<{time: string; value: number}[]>([
    { time: '00', value: 62 }, { time: '01', value: 64 }, { time: '02', value: 65 }, { time: '03', value: 66 },
  ]);

  const signalDistribution = useMemo(() => [
    { freq: '405', strength: 45, fill: '#06b6d4' },
    { freq: '406', strength: 92, fill: '#f59e0b' },
    { freq: '407', strength: 38, fill: '#06b6d4' },
    { freq: '408', strength: 28, fill: '#06b6d4' },
  ], []);

  const uavBatteryData = useMemo(() => [
    { name: 'U1', battery: 92, fill: '#10b981' },
    { name: 'U2', battery: 87, fill: '#10b981' },
    { name: 'U3', battery: 78, fill: '#f59e0b' },
    { name: 'U4', battery: 100, fill: '#3b82f6' },
  ], []);

  const radarData = useMemo(() => [
    { subject: 'N', A: 85, fullMark: 100 }, { subject: 'NE', A: 72, fullMark: 100 }, 
    { subject: 'E', A: 68, fullMark: 100 }, { subject: 'SE', A: 55, fullMark: 100 },
    { subject: 'S', A: 48, fullMark: 100 }, { subject: 'SW', A: 62, fullMark: 100 }, 
    { subject: 'W', A: 78, fullMark: 100 }, { subject: 'NW', A: 82, fullMark: 100 },
  ], []);

  const systemHealth = useMemo(() => [
    { name: 'Online', value: 75, color: '#10b981' },
    { name: 'Warning', value: 15, color: '#f59e0b' },
    { name: 'Offline', value: 10, color: '#ef4444' },
  ], []);

  // 实时数据模拟
  const realtimeMetrics = useMemo(() => [
    { label: 'CPU', value: 34 + Math.sin(tick * 0.5) * 8, color: '#10b981' },
    { label: 'MEM', value: 67 + Math.cos(tick * 0.3) * 5, color: '#3b82f6' },
    { label: 'NET', value: 82 + Math.sin(tick * 0.7) * 10, color: '#f59e0b' },
  ], [tick]);

  useEffect(() => {
    if (props.params) props.params.catch(() => {});
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.getSeconds().toString().padStart(2, '0');
      
      setTick(t => t + 1);
      setCoverage(prev => Math.min(prev + 0.03, 100));
      
      setSignalHistory(prev => [...prev.slice(-7), {
        time: timeStr,
        uav1: -40 + Math.random() * 10,
        uav2: -52 + Math.random() * 8,
        uav3: -64 + Math.random() * 12
      }]);

      setCoverageHistory(prev => [...prev.slice(-7), {
        time: timeStr,
        value: Math.min(64 + prev.length * 0.3 + Math.random() * 2, 100)
      }]);

      const events = [
        "AI: Human form detected @ Node-7",
        "SYS: Triangulation error < 1.2m",
        "UAV-02: Wind gust adjustment",
        "SIG: 406MHz signal verified",
        "AI: Thermal analysis complete",
      ];
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      setLogs(prev => [`[${now.toLocaleTimeString()}] ${randomEvent}`, ...prev].slice(0, 8));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="relative w-screen h-screen text-slate-200 font-mono overflow-hidden">
      <CesiumMap />

      {/* 全局 SVG 定义 */}
      <svg width="0" height="0" className="absolute">
        <defs>
          {/* 发光滤镜 */}
          <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feFlood floodColor="#22d3ee" floodOpacity="0.6"/>
            <feComposite in2="blur" operator="in"/>
            <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feFlood floodColor="#f59e0b" floodOpacity="0.6"/>
            <feComposite in2="blur" operator="in"/>
            <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-emerald" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feFlood floodColor="#10b981" floodOpacity="0.6"/>
            <feComposite in2="blur" operator="in"/>
            <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {/* 渐变 */}
          <linearGradient id="grad-cyan" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.1"/>
          </linearGradient>
          <linearGradient id="grad-amber" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2"/>
          </linearGradient>
          <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.1"/>
          </linearGradient>
          <linearGradient id="line-grad-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
            <stop offset="50%" stopColor="#10b981" stopOpacity="1"/>
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.3"/>
          </linearGradient>
          <linearGradient id="line-grad-blue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="1"/>
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3"/>
          </linearGradient>
          <linearGradient id="line-grad-amber" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3"/>
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="1"/>
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
      </svg>

      {/* 全屏放大弹窗 */}
      {isMaximized && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl p-6 flex flex-col pointer-events-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <BrainCircuit className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-black text-white tracking-widest uppercase">UAV-03 High-Res Feed</h2>
            </div>
            <button onClick={() => setIsMaximized(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-500 transition-all">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10">
            <Image src="/searched_target.png" alt="UAV Feed Full" fill className="object-contain" priority />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border-2 border-red-500">
              <div className="absolute -top-8 left-0 bg-red-600 text-white px-3 py-1 font-black text-sm uppercase flex items-center gap-2">
                <Users className="w-4 h-4" /> 3 HUMANS DETECTED
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主界面布局 */}
      <div className="absolute inset-0 pointer-events-none p-3 flex flex-col gap-3">
        
        {/* 顶部状态栏 */}
        <header className="flex justify-between items-center pointer-events-auto shrink-0">
          <div className="flex gap-2">
            <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-lg flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <div className="w-9 h-9 rounded-full border border-emerald-500/30 flex items-center justify-center bg-emerald-500/10 relative">
                <Shield className="text-emerald-400 w-4 h-4 z-10" />
                <div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-ping" />
              </div>
              <div>
                <h1 className="text-xs font-black text-white tracking-[0.25em] uppercase">SAR-DT COMMAND</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                  <span className="text-[8px] text-emerald-400 font-bold uppercase">Server Online</span>
                </div>
              </div>
            </div>

            <div className="flex gap-1 bg-slate-950/60 backdrop-blur-xl border border-white/5 p-1 rounded-lg">
              {[
                { label: 'UPLINK', val: '42.8MB/s', color: 'text-blue-400', glow: 'shadow-[0_0_10px_rgba(59,130,246,0.3)]' },
                { label: 'LATENCY', val: '24ms', color: 'text-emerald-400', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]' },
                { label: 'SATS', val: '12', color: 'text-cyan-400', glow: 'shadow-[0_0_10px_rgba(34,211,238,0.3)]' }
              ].map((m, i) => (
                <div key={i} className={`px-3 py-1.5 bg-white/5 rounded flex flex-col items-center ${m.glow}`}>
                  <p className="text-[7px] text-slate-500 font-bold uppercase">{m.label}</p>
                  <p className={`${m.color} font-black text-[10px]`}>{m.val}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-lg flex items-center gap-3">
            <div className="text-right">
              <p className="text-[8px] text-slate-500 uppercase font-bold">Coverage</p>
              <p className="text-sm font-black text-white">{coverage.toFixed(1)}%</p>
            </div>
            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" style={{ width: `${coverage}%` }} />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>
        </header>

        {/* 中间主体区域 */}
        <div className="flex-1 flex gap-3 min-h-0">
          
          {/* 左侧面板 */}
          <aside className="w-[340px] flex flex-col gap-2 pointer-events-auto shrink-0">
            
            {/* 信号三角定位 */}
            <section className="bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-lg p-3 flex-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-white/5">
                <div className="flex items-center gap-1.5 text-amber-400 font-black uppercase text-[10px]">
                  <Radio className="w-3.5 h-3.5" /> Signal Triangulation
                </div>
                <div className="bg-amber-500/20 px-2 py-0.5 rounded text-[8px] font-black text-amber-400 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.3)]">LOCKED</div>
              </div>
              
              {/* UAV 信号强度 - 带动画效果 */}
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {['UAV-01', 'UAV-02', 'UAV-03'].map((uav, i) => (
                  <div key={uav} className="bg-gradient-to-b from-white/5 to-transparent p-2 rounded-lg border border-white/5 text-center relative overflow-hidden group hover:border-amber-500/30 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className="text-[8px] text-slate-400 font-bold relative z-10">{uav}</p>
                    <p className="text-xs font-black text-white relative z-10 my-0.5">-{40 + i * 12}<span className="text-[8px] text-slate-500">dBm</span></p>
                    <div className="mt-1 h-1.5 bg-black/40 rounded-full overflow-hidden relative">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${90 - i * 20}%`,
                          background: `linear-gradient(90deg, #f59e0b, ${i === 0 ? '#10b981' : i === 1 ? '#3b82f6' : '#ef4444'})`,
                          boxShadow: '0 0 10px rgba(245,158,11,0.5)'
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* 信号频率分布 - 发光柱状图 */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                  <p className="text-[8px] text-slate-500 uppercase font-bold mb-2 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> Freq Spectrum
                  </p>
                  <div className="h-[75px] w-full">
                    <BarChart width={140} height={75} data={signalDistribution} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGradCyan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        </linearGradient>
                        <linearGradient id="barGradAmber" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        </linearGradient>
                        <filter id="barGlow">
                          <feGaussianBlur stdDeviation="2" result="blur"/>
                          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                      </defs>
                      <XAxis dataKey="freq" tick={{ fill: '#64748b', fontSize: 7 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#475569', fontSize: 6 }} axisLine={false} tickLine={false} tickCount={3} />
                      <ReferenceLine y={50} stroke="#ffffff10" strokeDasharray="3 3" />
                      <Bar dataKey="strength" radius={[4, 4, 0, 0]} filter="url(#barGlow)">
                        {signalDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.strength > 80 ? 'url(#barGradAmber)' : 'url(#barGradCyan)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </div>
                </div>
                
                {/* 信号趋势 - 发光折线图 */}
                <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                  <p className="text-[8px] text-slate-500 uppercase font-bold mb-2 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-emerald-400" /> Signal Timeline
                  </p>
                  <div className="h-[75px] w-full">
                    <LineChart width={140} height={75} data={signalHistory} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                      <defs>
                        <filter id="lineGlow">
                          <feGaussianBlur stdDeviation="2" result="blur"/>
                          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                      </defs>
                      <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 6 }} axisLine={false} tickLine={false} />
                      <YAxis tick={false} axisLine={false} domain={[-80, -30]} />
                      <ReferenceLine y={-50} stroke="#ffffff08" strokeDasharray="2 2" />
                      <Line type="monotone" dataKey="uav1" stroke="url(#line-grad-emerald)" strokeWidth={2} dot={false} filter="url(#lineGlow)" />
                      <Line type="monotone" dataKey="uav2" stroke="url(#line-grad-blue)" strokeWidth={2} dot={false} filter="url(#lineGlow)" />
                      <Line type="monotone" dataKey="uav3" stroke="url(#line-grad-amber)" strokeWidth={2} dot={false} filter="url(#lineGlow)" />
                    </LineChart>
                  </div>
                  <div className="flex justify-center gap-3 mt-1">
                    {[{ c: 'emerald', l: 'U1' }, { c: 'blue', l: 'U2' }, { c: 'amber', l: 'U3' }].map(item => (
                      <span key={item.l} className={`text-[7px] text-${item.c}-400 flex items-center gap-1`}>
                        <span className={`w-1.5 h-1.5 rounded-full bg-${item.c}-500 shadow-[0_0_4px] shadow-${item.c}-500`} />{item.l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 目标坐标 */}
              <div className="bg-gradient-to-r from-cyan-500/10 via-black/40 to-cyan-500/10 p-2.5 rounded-lg border border-cyan-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.1),transparent_70%)]" />
                <p className="text-[8px] text-cyan-400/80 uppercase font-bold mb-1.5 text-center relative z-10 tracking-widest">Target Coordinates</p>
                <div className="flex justify-around text-center relative z-10">
                  <div>
                    <p className="text-[7px] text-slate-500 mb-0.5">LATITUDE</p>
                    <p className="text-cyan-400 font-black text-[12px] tracking-wide" style={{ textShadow: '0 0 10px rgba(34,211,238,0.5)' }}>22°16'33.6"N</p>
                  </div>
                  <div className="w-px bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent" />
                  <div>
                    <p className="text-[7px] text-slate-500 mb-0.5">LONGITUDE</p>
                    <p className="text-cyan-400 font-black text-[12px] tracking-wide" style={{ textShadow: '0 0 10px rgba(34,211,238,0.5)' }}>114°00'21.6"E</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 系统状态 */}
            <section className="bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-lg p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-white/5 text-emerald-400 font-black uppercase text-[10px]">
                <Activity className="w-3.5 h-3.5" /> System Analytics
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {/* 电量 - 水平发光条 */}
                <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                  <p className="text-[7px] text-slate-500 uppercase font-bold mb-1.5 flex items-center gap-1">
                    <Battery className="w-3 h-3 text-emerald-400" /> Power
                  </p>
                  <div className="space-y-1.5">
                    {uavBatteryData.map((uav, i) => (
                      <div key={uav.name} className="flex items-center gap-1.5">
                        <span className="text-[7px] text-slate-500 w-4">{uav.name}</span>
                        <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-700"
                            style={{ 
                              width: `${uav.battery}%`,
                              background: `linear-gradient(90deg, ${uav.fill}80, ${uav.fill})`,
                              boxShadow: `0 0 8px ${uav.fill}60`
                            }} 
                          />
                        </div>
                        <span className="text-[7px] text-slate-400 w-6 text-right">{uav.battery}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 系统健康 - 环形图 */}
                <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                  <p className="text-[7px] text-slate-500 uppercase font-bold mb-1 text-center">Health</p>
                  <div className="h-[52px] flex items-center justify-center relative">
                    <PieChart width={52} height={52}>
                      <defs>
                        <filter id="pieGlow">
                          <feGaussianBlur stdDeviation="2"/>
                          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                      </defs>
                      <Pie 
                        data={systemHealth} cx="50%" cy="50%" 
                        innerRadius={16} outerRadius={24} 
                        paddingAngle={4} dataKey="value"
                        stroke="none" filter="url(#pieGlow)"
                      >
                        {systemHealth.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                      </Pie>
                    </PieChart>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-black text-emerald-400">75%</span>
                    </div>
                  </div>
                  <div className="flex justify-center gap-2 mt-1">
                    {systemHealth.map((item, i) => (
                      <span key={i} className="text-[6px] flex items-center gap-0.5" style={{ color: item.color }}>
                        <span className="w-1 h-1 rounded-full" style={{ background: item.color, boxShadow: `0 0 4px ${item.color}` }} />{item.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 覆盖率趋势 - 面积图 */}
                <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                  <p className="text-[7px] text-slate-500 uppercase font-bold mb-1">Coverage</p>
                  <div className="h-[60px]">
                    <AreaChart width={90} height={60} data={coverageHistory} margin={{ top: 5, right: 2, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="coverageGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.6}/>
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <filter id="areaGlow">
                          <feGaussianBlur stdDeviation="2"/>
                          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                      </defs>
                      <YAxis tick={false} axisLine={false} domain={[60, 80]} />
                      <Area 
                        type="monotone" dataKey="value" 
                        stroke="#10b981" strokeWidth={2} 
                        fill="url(#coverageGrad)" 
                        filter="url(#areaGlow)"
                      />
                    </AreaChart>
                  </div>
                </div>
              </div>

              {/* 实时指标条 */}
              <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-3 gap-2">
                {realtimeMetrics.map((m, i) => (
                  <div key={m.label} className="text-center">
                    <div className="flex items-center justify-between text-[7px] mb-1">
                      <span className="text-slate-500">{m.label}</span>
                      <span style={{ color: m.color }}>{m.value.toFixed(0)}%</span>
                    </div>
                    <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${m.value}%`, 
                          background: m.color,
                          boxShadow: `0 0 6px ${m.color}80`
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* UAV 遥测 */}
            <section className="bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-lg p-3 flex-1 min-h-0 flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-white/5 text-cyan-400 font-black uppercase text-[10px]">
                <Cpu className="w-3.5 h-3.5" /> Asset Telemetry
              </div>
              <div className="space-y-1.5 overflow-y-auto flex-1 scrollbar-hide">
                {[
                  { id: '01', role: 'Scout', bat: 92, agl: 120, state: 'OK', c: '#10b981' },
                  { id: '02', role: 'Relay', bat: 87, agl: 145, state: 'OK', c: '#10b981' },
                  { id: '03', role: 'Lead', bat: 78, agl: 110, state: 'WARN', c: '#f59e0b' },
                  { id: '04', role: 'Backup', bat: 100, agl: 0, state: 'STBY', c: '#3b82f6' },
                ].map(uav => (
                  <div key={uav.id} className="bg-gradient-to-r from-white/5 to-transparent p-2 rounded-lg flex items-center justify-between gap-2 hover:from-white/10 transition-all border border-transparent hover:border-white/10 group">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-7 rounded-full" style={{ background: `linear-gradient(to bottom, ${uav.c}, ${uav.c}40)`, boxShadow: `0 0 8px ${uav.c}60` }} />
                      <div>
                        <span className="text-[10px] text-white font-bold">U-{uav.id}</span>
                        <span className="text-[8px] text-slate-500 ml-1">{uav.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[9px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Battery className="w-3 h-3" style={{ color: uav.c }} />{uav.bat}%
                      </span>
                      <span className="text-slate-400">{uav.agl}m</span>
                      <span 
                        className="px-1.5 py-0.5 rounded text-[8px] font-bold"
                        style={{ 
                          background: `${uav.c}20`, 
                          color: uav.c,
                          boxShadow: `0 0 8px ${uav.c}30`
                        }}
                      >{uav.state}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          {/* 中间地图区域 */}
          <div className="flex-1 relative" />

          {/* 右侧面板 */}
          <div className="w-[360px] flex flex-col gap-2 pointer-events-auto shrink-0">
            
            {/* 工具栏 */}
            <aside className="bg-slate-950/80 backdrop-blur-xl border border-white/10 p-1 rounded-lg flex items-center gap-0.5 self-end shadow-[0_0_20px_rgba(0,0,0,0.3)]">
              {[Crosshair, Eye, Layers, Globe, Wind, MapIcon, Satellite, Network, Settings].map((Icon, i) => (
                <button key={i} className="w-8 h-8 rounded flex items-center justify-center hover:bg-emerald-500/20 transition-all group relative">
                  <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                  <div className="absolute inset-0 rounded bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors" />
                </button>
              ))}
            </aside>

            {/* 搜索覆盖雷达 - 增强版 */}
            <section className="bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-lg p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-white/5 text-cyan-400 font-black uppercase text-[10px]">
                <Signal className="w-3.5 h-3.5" /> Sector Coverage
              </div>
              <div className="h-[110px] flex items-center justify-center relative">
                {/* 背景装饰 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border border-cyan-500/10" />
                  <div className="absolute w-14 h-14 rounded-full border border-cyan-500/10" />
                  <div className="absolute w-8 h-8 rounded-full border border-cyan-500/10" />
                </div>
                <RadarChart width={180} height={110} data={radarData}>
                  <defs>
                    <linearGradient id="radarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.6}/>
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.1}/>
                    </linearGradient>
                    <filter id="radarGlow">
                      <feGaussianBlur stdDeviation="3"/>
                      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>
                  <PolarGrid stroke="rgba(34,211,238,0.15)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8, fontWeight: 'bold' }} />
                  <Radar 
                    name="Coverage" dataKey="A" 
                    stroke="#22d3ee" strokeWidth={2}
                    fill="url(#radarGrad)" 
                    filter="url(#radarGlow)"
                  />
                </RadarChart>
              </div>
            </section>

            {/* AI视觉识别 */}
            <section className="flex-1 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden flex flex-col shadow-[0_0_30px_rgba(239,68,68,0.1)]">
              <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-red-500/10 to-transparent border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2 text-red-500">
                  <BrainCircuit className="w-4 h-4 animate-pulse" style={{ filter: 'drop-shadow(0 0 4px #ef4444)' }} />
                  <span className="text-[11px] font-black text-white uppercase">AI Optical Analysis</span>
                </div>
                <button onClick={() => setIsMaximized(true)} className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded border border-red-500/20 transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                  <span className="text-[8px] font-black text-red-400 uppercase">Enlarge</span>
                  <Maximize2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
              
              <div className="relative flex-1 min-h-[180px] bg-black">
                <Image src="/searched_target.png" alt="AI Feed" fill className="object-cover" priority />
                <div className="absolute top-1/4 left-1/3 w-28 h-28 border-2 border-red-500 animate-pulse" style={{ boxShadow: '0 0 20px rgba(239,68,68,0.4), inset 0 0 20px rgba(239,68,68,0.1)' }}>
                  <div className="absolute -top-5 left-0 bg-gradient-to-r from-red-600 to-red-500 text-white px-2 py-0.5 font-black text-[8px] uppercase flex items-center gap-1 shadow-lg">
                    <Users className="w-3 h-3" /> 3 HUMANS DETECTED
                  </div>
                  <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t-2 border-l-2 border-red-400" />
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t-2 border-r-2 border-red-400" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b-2 border-l-2 border-red-400" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b-2 border-r-2 border-red-400" />
                </div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_2px] opacity-40" />
                {/* 扫描线动画 */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-red-500/50 to-transparent animate-[scan_3s_linear_infinite]" />
                </div>
              </div>

              <div className="p-2.5 bg-gradient-to-t from-slate-950 to-slate-950/80 border-t border-white/10 shrink-0">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { tag: 'HUMAN', prob: '88%', c: '#ef4444' },
                    { tag: 'THERMAL', prob: '91%', c: '#f59e0b' },
                    { tag: 'LOCALIZED', prob: 'OK', c: '#10b981' }
                  ].map(item => (
                    <div 
                      key={item.tag} 
                      className="text-[8px] border px-2 py-1 rounded font-bold backdrop-blur"
                      style={{ 
                        background: `${item.c}15`,
                        color: item.c,
                        borderColor: `${item.c}40`,
                        boxShadow: `0 0 10px ${item.c}20`
                      }}
                    >
                      {item.tag} {item.prob}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* 底部控制栏 */}
        <footer className="flex gap-3 pointer-events-auto shrink-0 h-[100px]">
          <div className="flex-1 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-lg p-2.5 flex flex-col overflow-hidden relative shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-emerald-500 to-emerald-500/20" />
            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-white/10 font-black text-emerald-400 uppercase text-[10px]">
              <div className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> Command Log</div>
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_#10b981]" />
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-[9px] leading-relaxed scrollbar-hide space-y-1 text-slate-300 uppercase">
              {logs.map((log, i) => (
                <div key={i} className={`flex gap-2 items-start transition-all ${i === 0 ? "text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border-l-2 border-emerald-500" : "opacity-60 hover:opacity-100"}`}>
                  <span className="text-slate-600 font-bold w-8">[{1024 + i}]</span>
                  <span className="flex-1">{log}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="w-48 bg-gradient-to-b from-emerald-600/30 to-emerald-600/10 hover:from-emerald-600/40 hover:to-emerald-600/20 backdrop-blur-xl border border-emerald-500/40 rounded-lg flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.2)] group">
            <div className="w-10 h-10 rounded-full border-2 border-emerald-500/50 flex items-center justify-center bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Navigation className="w-5 h-5 rotate-45 text-emerald-400" style={{ filter: 'drop-shadow(0 0 4px #10b981)' }} />
            </div>
            <span className="tracking-[0.2em] text-emerald-400 font-black text-[10px] uppercase">Initiate Rescue</span>
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
      `}</style>
    </main>
  );
}
