'use client';

import {
  Activity,
  Battery,
  BrainCircuit,
  Clock,
  Cpu,
  Crosshair,
  Eye,
  Globe,
  Grid3X3,
  HeartPulse,
  Layers,
  Map as MapIcon, MapPin, Maximize2,
  Mountain,
  Navigation,
  Network,
  Plane,
  Radio,
  Ruler,
  Satellite,
  Search,
  Settings,
  Shield,
  Signal,
  Terminal,
  Users,
  Wind,
  X,
  Zap,
  BarChart3,
  ClipboardList,
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
  
  // 工具栏状态
  const [showTrail, setShowTrail] = useState(true);        // 显示飞行轨迹
  const [showCone, setShowCone] = useState(true);          // 显示扫描光锥
  const [showLabels, setShowLabels] = useState(true);      // 显示标签
  const [showSignalLink, setShowSignalLink] = useState(true); // 显示信号连接线
  const [showWeatherOverlay, setShowWeatherOverlay] = useState(false); // 天气叠加层
  const [isPaused, setIsPaused] = useState(false);         // 暂停数据更新
  const [showStats, setShowStats] = useState(true);        // 显示统计面板
  const [showConfig, setShowConfig] = useState(false);     // 显示配置面板
  const [flyToTarget, setFlyToTarget] = useState<{ lon: number, lat: number, alt: number } | null>(null); // 飞行目标
  // 地图模式与图层
  const [mapMode, setMapMode] = useState<'2d' | '3d'>('3d');           // 2D 平面 / 2.5D 地形
  const [baseLayer, setBaseLayer] = useState<'satellite' | 'street' | 'topo' | 'google'>('satellite'); // 底图
  const [showRoads, setShowRoads] = useState(true);
  const [showBuildings, setShowBuildings] = useState(true);
  const [missionMode, setMissionMode] = useState<'plan' | 'search' | 'rescue'>('search');
  const [showSearchGrid, setShowSearchGrid] = useState(true);
  const GRID_DIVISIONS = 4;
  
  const COL = {
    EPOCH: 0, LAT_R: 1, LON_R: 2, ALT_R: 3,
    LAT_B: 4, LON_B: 5, ALT_B: 6, DIST: 7,
    RSSI: 8, SNR: 9, MCS: 10, PHR: 11, SIG: 12
  };

  const currentData = useMemo(() => realData[dataIndex] || realData[0], [dataIndex]);
  const prevData = useMemo(() => dataIndex > 0 ? realData[dataIndex - 1] : undefined, [dataIndex]);
  const mapSourceLabel = useMemo(() => {
    if (baseLayer === 'google') return 'Google Hybrid (Sat + Labels)';
    if (baseLayer === 'satellite') return 'LandsD Imagery + HK Labels';
    if (baseLayer === 'street') return 'LandsD Basemap Service';
    return 'Topo Analysis Layer';
  }, [baseLayer]);
  const localSceneScore = useMemo(() => {
    let score = 55;
    if (mapMode === '3d') score += 15;
    if (baseLayer === 'satellite' || baseLayer === 'google') score += 10;
    if (baseLayer === 'google') score += 5;
    if (showRoads) score += 8;
    if (showBuildings && mapMode === '3d') score += 12;
    return Math.min(score, 100);
  }, [mapMode, baseLayer, showRoads, showBuildings]);
  const buildingStatus = useMemo(() => {
    if (mapMode === '2d') return '2D mode hides 3D buildings';
    return showBuildings ? 'Hong Kong 3D tiles enabled' : '3D buildings disabled';
  }, [mapMode, showBuildings]);
  
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

  // 飞行统计
  const flightStats = useMemo(() => {
    const elapsed = currentData[COL.EPOCH];
    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);
    const missionTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    let totalDist = 0;
    for (let i = 1; i <= dataIndex && i < realData.length; i++) {
      const p = realData[i - 1];
      const c = realData[i];
      const dLat = (c[COL.LAT_R] - p[COL.LAT_R]) * 111320;
      const dLon = (c[COL.LON_R] - p[COL.LON_R]) * 111320 * Math.cos(c[COL.LAT_R] * Math.PI / 180);
      const dAlt = c[COL.ALT_R] - p[COL.ALT_R];
      totalDist += Math.sqrt(dLat * dLat + dLon * dLon + dAlt * dAlt);
    }

    const altitudes = fullHistory.map((d: any) => d[COL.ALT_R]);
    const maxAlt = altitudes.length > 0 ? Math.max(...altitudes) : 0;
    const avgSpeed = elapsed > 0 ? totalDist / elapsed : 0;

    return { missionTime, totalDist, maxAlt, avgSpeed };
  }, [dataIndex, currentData, fullHistory]);

  const missionPhase = useMemo(() => {
    const progress = dataIndex / Math.max(realData.length - 1, 1);
    if (currentData[COL.DIST] < 18 && currentData[COL.SIG] > 88) return 'Target Verify';
    if (progress < 0.2) return 'Ingress';
    if (progress < 0.75) return 'Search Sweep';
    return 'Recovery Prep';
  }, [currentData, dataIndex]);

  const linkRisk = useMemo(() => {
    if (currentData[COL.SNR] > 15 && currentData[COL.RSSI] > -42) return 'Low';
    if (currentData[COL.SNR] > 10 && currentData[COL.RSSI] > -50) return 'Guarded';
    return 'High';
  }, [currentData]);

  const signalTrend = useMemo(() => {
    if (history.length < 6) return 'stable' as const;
    const recent = history.slice(-5);
    const older = history.slice(-10, -5);
    if (older.length === 0) return 'stable' as const;
    const recentAvg = recent.reduce((a, h) => a + h.snr, 0) / recent.length;
    const olderAvg = older.reduce((a, h) => a + h.snr, 0) / older.length;
    const delta = recentAvg - olderAvg;
    if (delta > 1.5) return 'improving' as const;
    if (delta < -1.5) return 'degrading' as const;
    return 'stable' as const;
  }, [history]);

  const uplinkStatus = useMemo(() => {
    if (currentData[COL.SNR] > 15 && currentData[COL.SIG] > 85) return 'Nominal';
    if (currentData[COL.SNR] > 10 && currentData[COL.SIG] > 60) return 'Marginal';
    return 'Critical';
  }, [currentData]);

  const recommendedAction = useMemo(() => {
    if (linkRisk === 'High' && signalTrend === 'degrading') return 'Link degrading rapidly — RTB or climb to safe altitude immediately.';
    if (linkRisk === 'High') return 'Climb slightly or tighten orbit to restore uplink margin.';
    if (missionPhase === 'Target Verify' && linkRisk === 'Low') return 'Hold hover, maintain optical lock, and cue ground rescue team.';
    if (missionPhase === 'Target Verify') return 'Target proximity — reduce speed, verify visual contact before committing.';
    if (currentData[COL.DIST] > 35 && signalTrend === 'improving') return 'Signal recovering at range — continue sweep, monitor for sustained lock.';
    if (currentData[COL.DIST] > 35) return 'Track forward and prepare close visual confirmation pass.';
    if (signalTrend === 'degrading' && linkRisk === 'Guarded') return 'Signal weakening — consider reducing range or increasing altitude.';
    return 'Maintain sweep corridor. Signal and link nominal.';
  }, [linkRisk, currentData, missionPhase, signalTrend]);

  const missionCoverage = useMemo(
    () => Math.round((dataIndex / Math.max(realData.length - 1, 1)) * 100),
    [dataIndex]
  );

  const sweepHeading = useMemo(() => {
    if (!prevData) return '000';
    const dLon = currentData[COL.LON_R] - prevData[COL.LON_R];
    const dLat = currentData[COL.LAT_R] - prevData[COL.LAT_R];
    const headingDeg = (Math.atan2(dLon, dLat) * 180 / Math.PI + 360) % 360;
    return headingDeg.toFixed(0).padStart(3, '0');
  }, [currentData, prevData]);

  const searchArea = useMemo(() => {
    const lats = realData.map((d: any) => d[COL.LAT_R]);
    const lons = realData.map((d: any) => d[COL.LON_R]);
    return {
      minLat: Math.min(...lats) - 0.0012,
      maxLat: Math.max(...lats) + 0.0012,
      minLon: Math.min(...lons) - 0.0012,
      maxLon: Math.max(...lons) + 0.0012
    };
  }, []);

  const lkpPosition = useMemo(() => {
    const baseLat = realData[0][COL.LAT_B];
    const baseLon = realData[0][COL.LON_B];
    return { lon: baseLon + 0.0003, lat: baseLat - 0.0002 };
  }, []);

  const coveredCells = useMemo(() => {
    const cells = new Set<string>();
    const { minLat, maxLat, minLon, maxLon } = searchArea;
    const cellH = (maxLat - minLat) / GRID_DIVISIONS;
    const cellW = (maxLon - minLon) / GRID_DIVISIONS;
    for (let i = 0; i <= dataIndex && i < realData.length; i++) {
      const d = realData[i];
      const row = Math.min(GRID_DIVISIONS - 1, Math.max(0, Math.floor((d[COL.LAT_R] - minLat) / cellH)));
      const col = Math.min(GRID_DIVISIONS - 1, Math.max(0, Math.floor((d[COL.LON_R] - minLon) / cellW)));
      cells.add(`${row}-${col}`);
    }
    return cells;
  }, [dataIndex, searchArea]);

  const searchAreaKm2 = useMemo(() => {
    const { minLat, maxLat, minLon, maxLon } = searchArea;
    const latDist = (maxLat - minLat) * 111.32;
    const lonDist = (maxLon - minLon) * 111.32 * Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
    return latDist * lonDist;
  }, [searchArea]);

  const gridCoverage = useMemo(() => {
    const total = GRID_DIVISIONS * GRID_DIVISIONS;
    return { searched: coveredCells.size, total, pct: Math.round(coveredCells.size / total * 100) };
  }, [coveredCells]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setDataIndex(prev => (prev + 1) % realData.length);
    }, 500);
    return () => clearInterval(interval);
  }, [isPaused]);

  // 飞到目标后清除 flyToTarget 状态，防止重复触发
  useEffect(() => {
    if (flyToTarget) {
      const timer = setTimeout(() => setFlyToTarget(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [flyToTarget]);

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

  const applyMaxPrecisionPreset = () => {
    setMapMode('3d');
    setBaseLayer('satellite');
    setShowRoads(true);
    setShowBuildings(true);
    setShowLabels(true);
  };

  return (
    <main className="relative w-screen h-screen text-zinc-200 font-mono overflow-hidden">
      <CesiumMap 
        currentData={currentData} 
        prevData={prevData}
        fullHistory={fullHistory}
        showTrail={showTrail}
        showCone={showCone}
        showLabels={showLabels}
        showSignalLink={showSignalLink}
        flyToTarget={flyToTarget}
        mapMode={mapMode}
        baseLayer={baseLayer}
        showRoads={showRoads}
        showBuildings={showBuildings}
        searchArea={searchArea}
        lkpPosition={lkpPosition}
        showSearchGrid={showSearchGrid}
        gridDivisions={GRID_DIVISIONS}
        coveredCells={coveredCells}
      />

      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-1/2 left-4 w-1 h-32 bg-white/5 -translate-y-1/2" />
        <div className="absolute top-1/2 right-4 w-1 h-32 bg-white/5 -translate-y-1/2" />
      </div>

      {/* 天气叠加层 */}
      {showWeatherOverlay && (
        <div className="absolute inset-0 pointer-events-none z-5">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-cyan-500/10" />
          <div className="absolute top-20 left-1/4 text-[10px] text-cyan-400/70 font-mono">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur px-3 py-2 rounded-lg border border-cyan-500/20">
              <Wind className="w-4 h-4" />
              <div>
                <div className="text-cyan-300">Wind: 12 kt NE</div>
                <div className="text-zinc-400">Visibility: 8 km</div>
                <div className="text-zinc-400">Temp: 24°C | Humidity: 65%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 暂停状态指示器 */}
      {isPaused && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-xl px-8 py-4 rounded-2xl border border-amber-500/30 flex items-center gap-4">
            <div className="w-4 h-8 bg-amber-500 rounded-sm" />
            <div className="w-4 h-8 bg-amber-500 rounded-sm" />
            <span className="text-amber-400 font-black text-xl uppercase tracking-widest ml-2">Paused</span>
          </div>
        </div>
      )}

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
              <div className={`w-11 h-11 rounded-full border flex items-center justify-center relative ${uplinkStatus === 'Nominal' ? 'border-emerald-500/30 bg-emerald-500/10' : uplinkStatus === 'Marginal' ? 'border-amber-500/30 bg-amber-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                <Shield className={`w-5 h-5 z-10 ${uplinkStatus === 'Nominal' ? 'text-emerald-400' : uplinkStatus === 'Marginal' ? 'text-amber-400' : 'text-red-400'}`} />
                <div className={`absolute inset-0 border rounded-full animate-ping ${uplinkStatus === 'Nominal' ? 'border-emerald-500/20' : uplinkStatus === 'Marginal' ? 'border-amber-500/20' : 'border-red-500/20'}`} />
              </div>
              <div>
                <h1 className="text-sm font-black text-white tracking-[0.4em] uppercase leading-none">SAR-DT COMMAND</h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${uplinkStatus === 'Nominal' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : uplinkStatus === 'Marginal' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                  <span className={`text-[9px] font-black tracking-widest uppercase ${uplinkStatus === 'Nominal' ? 'text-emerald-400' : uplinkStatus === 'Marginal' ? 'text-amber-400' : 'text-red-400'}`}>UAV-01 Uplink {uplinkStatus}</span>
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

          <div className="flex gap-2">
            {/* Mission Phase Tabs */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-1.5 rounded-xl flex gap-1 shadow-2xl">
              {([
                { mode: 'plan' as const, label: 'Plan', icon: ClipboardList, color: 'text-blue-400', ring: 'ring-blue-500/50', bg: 'bg-blue-500/20' },
                { mode: 'search' as const, label: 'Search', icon: Search, color: 'text-amber-400', ring: 'ring-amber-500/50', bg: 'bg-amber-500/20' },
                { mode: 'rescue' as const, label: 'Rescue', icon: HeartPulse, color: 'text-red-400', ring: 'ring-red-500/50', bg: 'bg-red-500/20' }
              ]).map(tab => (
                <button key={tab.mode} onClick={() => setMissionMode(tab.mode)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${missionMode === tab.mode ? `${tab.bg} ${tab.color} ring-1 ${tab.ring}` : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}`}>
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-xl flex items-center gap-3 shadow-2xl">
              <Clock className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Mission Time</p>
                <p className="text-lg font-black text-white tracking-[0.2em] leading-none mt-0.5 font-mono">{flightStats.missionTime}</p>
              </div>
            </div>

            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-xl flex items-center gap-4 shadow-2xl relative">
              <div className="text-right">
                <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Signal</p>
                <p className="text-base font-black text-white tracking-widest leading-none mt-0.5">{currentData[COL.SIG]}%</p>
              </div>
              <div className="w-32 h-2.5 bg-white/5 rounded-full overflow-hidden relative border border-white/10 p-0.5">
                <div 
                  className="h-full rounded-full bg-linear-to-r from-red-500 via-amber-400 to-emerald-500 transition-all duration-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                  style={{ width: `${currentData[COL.SIG]}%` }} 
                />
              </div>
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

            {/* 飞行统计 */}
            <section className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl relative group hover:bg-zinc-900/70 transition-all">
              <CornerDecor className="top-0 right-0 border-t border-r" />
              <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-white/10 text-purple-400 font-black uppercase text-[10px] tracking-wider">
                <Plane className="w-4 h-4" /> Flight Statistics
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-white/5 text-center">
                  <Ruler className="w-3 h-3 text-purple-400 mx-auto mb-1" />
                  <p className="text-[7px] text-zinc-500 uppercase font-black">Distance</p>
                  <p className="text-sm font-black text-white font-mono">{flightStats.totalDist < 1000 ? `${flightStats.totalDist.toFixed(0)}m` : `${(flightStats.totalDist / 1000).toFixed(2)}km`}</p>
                </div>
                <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-white/5 text-center">
                  <Mountain className="w-3 h-3 text-cyan-400 mx-auto mb-1" />
                  <p className="text-[7px] text-zinc-500 uppercase font-black">Max Alt</p>
                  <p className="text-sm font-black text-white font-mono">{flightStats.maxAlt.toFixed(0)}m</p>
                </div>
                <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-white/5 text-center">
                  <Zap className="w-3 h-3 text-amber-400 mx-auto mb-1" />
                  <p className="text-[7px] text-zinc-500 uppercase font-black">Avg Spd</p>
                  <p className="text-sm font-black text-white font-mono">{flightStats.avgSpeed.toFixed(1)}<span className="text-[7px] text-zinc-500">m/s</span></p>
                </div>
                <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-white/5 text-center">
                  <Clock className="w-3 h-3 text-emerald-400 mx-auto mb-1" />
                  <p className="text-[7px] text-zinc-500 uppercase font-black">Epoch</p>
                  <p className="text-sm font-black text-white font-mono">{dataIndex + 1}<span className="text-[7px] text-zinc-500">/{realData.length}</span></p>
                </div>
              </div>

              {/* 高度剖面迷你图 */}
              <div className="bg-black/30 rounded-xl p-2 border border-white/5">
                <p className="text-[7px] text-zinc-500 uppercase font-black tracking-widest mb-1 flex items-center gap-1.5">
                  <Mountain className="w-3 h-3 text-cyan-500" /> Altitude Profile
                </p>
                <div className="h-[50px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 2, right: 2, left: -15, bottom: 2 }}>
                      <defs>
                        <linearGradient id="altGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02}/>
                        </linearGradient>
                      </defs>
                      <YAxis domain={['auto', 'auto']} tick={{ fill: '#666', fontSize: 7 }} tickLine={false} axisLine={false} width={25} tickCount={3} />
                      <Area type="monotone" dataKey="dist" stroke="#06b6d4" strokeWidth={1.5} fill="url(#altGrad)" isAnimationActive={false} name="Distance" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* 环境与位置 */}
            <section className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl relative group hover:bg-zinc-900/70 transition-all">
              <CornerDecor className="bottom-0 left-0 border-b border-l" />
              <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-white/10 text-cyan-400 font-black uppercase text-[10px] tracking-wider">
                <Compass className="w-4 h-4" /> Spatial Telemetry
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950/40 p-3 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all">
                  <p className="text-[8px] text-zinc-500 uppercase mb-2 font-black tracking-tighter flex items-center gap-1.5"><Plane className="w-3 h-3 text-cyan-500" />UAV Receiver</p>
                  <div className="space-y-1.5 text-[9px] font-mono">
                    <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-zinc-500">LAT</span><span className="text-white">{currentData[COL.LAT_R].toFixed(6)}</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-zinc-500">LON</span><span className="text-white">{currentData[COL.LON_R].toFixed(6)}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">ALT</span><span className="text-cyan-400 font-black">{currentData[COL.ALT_R].toFixed(1)}m</span></div>
                  </div>
                </div>
                <div className="bg-zinc-950/40 p-3 rounded-xl border border-white/5 hover:border-red-500/30 transition-all">
                  <p className="text-[8px] text-zinc-500 uppercase mb-2 font-black tracking-tighter flex items-center gap-1.5"><Radio className="w-3 h-3 text-red-500" />Base Station</p>
                  <div className="space-y-1.5 text-[9px] font-mono">
                    <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-zinc-500">LAT</span><span className="text-white">{currentData[COL.LAT_B].toFixed(6)}</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-zinc-500">LON</span><span className="text-white">{currentData[COL.LON_B].toFixed(6)}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">ALT</span><span className="text-red-400 font-black">{currentData[COL.ALT_B].toFixed(1)}m</span></div>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[8px]">
                <span className="text-zinc-500 uppercase font-black">Slant Range</span>
                <span className="text-white font-black font-mono">{currentData[COL.DIST].toFixed(2)} m</span>
              </div>
            </section>
          </aside>

          <div className="flex-1 relative" />

          {/* 右侧面板 */}
          <div className="w-[420px] flex flex-col gap-3 pointer-events-auto shrink-0 overflow-y-auto scrollbar-hide">

            {/* ========== PLAN MODE ========== */}
            {missionMode === 'plan' && (
              <>
                <section className="bg-zinc-900/60 backdrop-blur-xl border border-blue-500/20 rounded-xl p-3 shadow-2xl">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                    <MapPin className="w-4 h-4 text-orange-400" />
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">Target Report</span>
                    <span className="ml-auto text-[8px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">ACTIVE</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                        <p className="text-[7px] text-zinc-500 uppercase font-black">Target Type</p>
                        <p className="mt-1 text-[11px] font-black text-white">Missing Person</p>
                      </div>
                      <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                        <p className="text-[7px] text-zinc-500 uppercase font-black">Priority</p>
                        <p className="mt-1 text-[11px] font-black text-red-400">URGENT</p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-[7px] text-zinc-500 uppercase font-black">Last Known Position</p>
                      <p className="mt-1 text-[10px] font-mono text-white">{lkpPosition.lat.toFixed(6)}°N, {lkpPosition.lon.toFixed(6)}°E</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2 text-center">
                        <p className="text-[7px] text-zinc-500 uppercase font-black">Last Contact</p>
                        <p className="mt-1 text-[10px] font-black text-amber-400">14 min</p>
                      </div>
                      <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2 text-center">
                        <p className="text-[7px] text-zinc-500 uppercase font-black">Terrain</p>
                        <p className="mt-1 text-[10px] font-black text-white">Mountain</p>
                      </div>
                      <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2 text-center">
                        <p className="text-[7px] text-zinc-500 uppercase font-black">Weather</p>
                        <p className="mt-1 text-[10px] font-black text-cyan-400">Clear</p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-orange-500/5 border border-orange-500/20 px-3 py-2">
                      <p className="text-[8px] text-zinc-400">Hiker reported lost on mountain trail near signal tower area. Last phone signal detected at the marked LKP coordinate.</p>
                    </div>
                  </div>
                </section>

                <section className="bg-zinc-900/60 backdrop-blur-xl border border-blue-500/20 rounded-xl p-3 shadow-2xl">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                    <Grid3X3 className="w-4 h-4 text-yellow-400" />
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">Search Area</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2 text-center">
                      <p className="text-[7px] text-zinc-500 uppercase font-black">Shape</p>
                      <p className="mt-1 text-[11px] font-black text-white">Rectangle</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2 text-center">
                      <p className="text-[7px] text-zinc-500 uppercase font-black">Area</p>
                      <p className="mt-1 text-[11px] font-black text-cyan-400">{searchAreaKm2.toFixed(3)} km²</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2 text-center">
                      <p className="text-[7px] text-zinc-500 uppercase font-black">Grid</p>
                      <p className="mt-1 text-[11px] font-black text-yellow-400">{GRID_DIVISIONS}×{GRID_DIVISIONS}</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[8px] text-zinc-500 uppercase font-black">Grid Coverage</p>
                      <p className="text-[10px] font-black text-emerald-400">{gridCoverage.searched}/{gridCoverage.total} sectors ({gridCoverage.pct}%)</p>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500/60 rounded-full transition-all duration-300" style={{ width: `${gridCoverage.pct}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-zinc-500 uppercase font-black">Show Grid on Map</span>
                    <button onClick={() => setShowSearchGrid(!showSearchGrid)} className={`w-9 h-5 rounded-full transition-all ${showSearchGrid ? 'bg-yellow-500/50' : 'bg-zinc-700'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${showSearchGrid ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </section>

                <section className="bg-zinc-900/60 backdrop-blur-xl border border-blue-500/20 rounded-xl p-3 shadow-2xl">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                    <Plane className="w-4 h-4 text-cyan-400" />
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">Team Assignment</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <div>
                          <p className="text-[10px] font-black text-white">UAV-01 (DJI M3T)</p>
                          <p className="text-[8px] text-zinc-500">Aerial Search — Sweep Pattern</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/15 px-2 py-1 rounded">ACTIVE</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 bg-zinc-600 rounded-full" />
                        <div>
                          <p className="text-[10px] font-black text-zinc-400">Ground Team Alpha</p>
                          <p className="text-[8px] text-zinc-600">Trail Search — Foot Patrol</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-black text-zinc-500 bg-white/5 px-2 py-1 rounded">STANDBY</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 bg-zinc-600 rounded-full" />
                        <div>
                          <p className="text-[10px] font-black text-zinc-400">Helicopter Bravo</p>
                          <p className="text-[8px] text-zinc-600">Aerial Visual — Wide Area</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-black text-zinc-500 bg-white/5 px-2 py-1 rounded">STANDBY</span>
                    </div>
                  </div>
                  <button onClick={() => setMissionMode('search')} className="mt-3 w-full py-2.5 rounded-lg bg-amber-500/15 text-amber-400 text-[10px] font-black uppercase tracking-wider ring-1 ring-amber-500/30 hover:bg-amber-500/25 transition-all">
                    Start Search Execution →
                  </button>
                </section>
              </>
            )}

            {/* ========== RESCUE MODE ========== */}
            {missionMode === 'rescue' && (
              <>
                <section className="bg-zinc-900/60 backdrop-blur-xl border border-red-500/30 rounded-xl p-3 shadow-2xl">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-red-500/20">
                    <HeartPulse className="w-4 h-4 text-red-400 animate-pulse" />
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">Rescue Operations</span>
                    <span className="ml-auto text-[8px] font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 animate-pulse">ACTIVE</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 text-center">
                      <p className="text-[7px] text-zinc-500 uppercase font-black">Target</p>
                      <p className="mt-1 text-[13px] font-black text-emerald-400">LOCATED</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-center">
                      <p className="text-[7px] text-zinc-500 uppercase font-black">ETA Rescue</p>
                      <p className="mt-1 text-[13px] font-black text-cyan-400">~{Math.max(2, 12 - Math.floor(dataIndex * 0.03))} min</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-red-500/5 border border-red-500/20 px-3 py-2.5 mb-3">
                    <p className="text-[8px] font-black uppercase text-zinc-300 mb-1">Priority Dispatch</p>
                    <p className="text-[9px] text-zinc-400">Ground Team Alpha deploying to target coordinates. Helicopter Bravo on 5-min standby for medical evacuation.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-zinc-500 uppercase font-black">UAV-01 Overhead</span>
                      <span className="text-emerald-400 font-black">Maintaining Visual</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-zinc-500 uppercase font-black">Ground Team</span>
                      <span className="text-amber-400 font-black">En Route</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-zinc-500 uppercase font-black">Helo Bravo</span>
                      <span className="text-zinc-400 font-black">Standby</span>
                    </div>
                  </div>
                </section>

                <section className="bg-zinc-900/60 backdrop-blur-xl border border-red-500/30 rounded-xl p-3 shadow-2xl">
                  <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-white/10">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">Target Confirmation</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2 text-center">
                      <p className="text-[7px] text-zinc-500 uppercase font-black">Detected</p>
                      <p className="mt-1 text-[13px] font-black text-white">3</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2 text-center">
                      <p className="text-[7px] text-zinc-500 uppercase font-black">Confidence</p>
                      <p className="mt-1 text-[13px] font-black text-emerald-400">94%</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2 text-center">
                      <p className="text-[7px] text-zinc-500 uppercase font-black">Distance</p>
                      <p className="mt-1 text-[13px] font-black text-cyan-400">{currentData[COL.DIST].toFixed(0)}m</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-[7px] text-zinc-500 uppercase font-black">Grid Sector</p>
                      <p className="mt-1 text-[10px] font-black text-yellow-400">B-3</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-[7px] text-zinc-500 uppercase font-black">Coordinates</p>
                      <p className="mt-1 text-[10px] font-mono font-black text-white">{currentData[COL.LAT_R].toFixed(4)}°N</p>
                    </div>
                  </div>
                </section>

                <button onClick={() => setMissionMode('search')} className="w-full py-2.5 rounded-xl bg-white/5 text-zinc-400 text-[10px] font-black uppercase tracking-wider ring-1 ring-white/10 hover:bg-white/10 transition-all">
                  ← Back to Search View
                </button>
              </>
            )}

            {/* ========== SEARCH MODE (existing panels) ========== */}
            {missionMode === 'search' && <>
            <section className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                <Target className="w-4 h-4 text-red-400" />
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">Mission Guidance</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2">
                  <p className="text-[7px] text-zinc-500 uppercase font-black">Phase</p>
                  <p className="mt-1 text-[11px] font-black text-white">{missionPhase}</p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2">
                  <p className="text-[7px] text-zinc-500 uppercase font-black">Link Risk</p>
                  <p className={`mt-1 text-[11px] font-black ${linkRisk === 'Low' ? 'text-emerald-400' : linkRisk === 'Guarded' ? 'text-amber-400' : 'text-red-400'}`}>{linkRisk}</p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2">
                  <p className="text-[7px] text-zinc-500 uppercase font-black">Coverage</p>
                  <p className="mt-1 text-[11px] font-black text-cyan-400">{missionCoverage}%</p>
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${linkRisk === 'High' ? 'text-red-400' : linkRisk === 'Guarded' ? 'text-amber-400' : 'text-emerald-400'}`} />
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-wider text-zinc-300">Recommended Action</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-zinc-400">{recommendedAction}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-[8px] uppercase">
                <div className="rounded-lg bg-black/25 px-2.5 py-2 text-center">
                  <p className="text-zinc-500 font-black">Sweep HDG</p>
                  <p className="mt-1 font-black text-white">{sweepHeading}°</p>
                </div>
                <div className="rounded-lg bg-black/25 px-2.5 py-2 text-center">
                  <p className="text-zinc-500 font-black">Signal</p>
                  <p className={`mt-1 font-black ${currentData[COL.SIG] > 85 ? 'text-emerald-400' : currentData[COL.SIG] > 70 ? 'text-amber-400' : 'text-red-400'}`}>{currentData[COL.SIG]}%</p>
                </div>
                <div className="rounded-lg bg-black/25 px-2.5 py-2 text-center">
                  <p className="text-zinc-500 font-black">Trend</p>
                  <p className={`mt-1 font-black ${signalTrend === 'improving' ? 'text-emerald-400' : signalTrend === 'degrading' ? 'text-red-400' : 'text-zinc-300'}`}>
                    {signalTrend === 'improving' ? '↑ Up' : signalTrend === 'degrading' ? '↓ Down' : '— Flat'}
                  </p>
                </div>
                <div className="rounded-lg bg-black/25 px-2.5 py-2 text-center">
                  <p className="text-zinc-500 font-black">Orbit</p>
                  <p className="mt-1 font-black text-white">{currentData[COL.DIST].toFixed(0)} m</p>
                </div>
              </div>
            </section>
            
            {/* 工具栏 */}
            <aside className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-2 rounded-xl flex flex-wrap items-center justify-center gap-1 shadow-2xl">
              {[
                { icon: Crosshair, label: 'Track Target', color: 'text-red-400', active: false, onClick: () => setFlyToTarget({ lon: currentData[COL.LON_R], lat: currentData[COL.LAT_R], alt: currentData[COL.ALT_R] }) },
                { icon: Eye, label: 'Show Labels', color: 'text-blue-400', active: showLabels, onClick: () => setShowLabels(!showLabels) },
                { icon: Layers, label: 'Flight Trail', color: 'text-purple-400', active: showTrail, onClick: () => setShowTrail(!showTrail) },
                { icon: Globe, label: 'Signal Link', color: 'text-emerald-400', active: showSignalLink, onClick: () => setShowSignalLink(!showSignalLink) },
                { icon: isPaused ? Radio : MapIcon, label: isPaused ? 'Resume' : 'Pause', color: 'text-amber-400', active: isPaused, onClick: () => setIsPaused(!isPaused) },
                { icon: Satellite, label: 'Stats Panel', color: 'text-pink-400', active: showStats, onClick: () => setShowStats(!showStats) },
                { icon: Grid3X3, label: 'Search Grid', color: 'text-yellow-400', active: showSearchGrid, onClick: () => setShowSearchGrid(!showSearchGrid) },
                { icon: Network, label: 'Reset View', color: 'text-indigo-400', active: false, onClick: () => { setDataIndex(0); setLogs([]); } },
                { icon: Settings, label: 'Config', color: 'text-zinc-300', active: showConfig, onClick: () => setShowConfig(!showConfig) }
              ].map((item, i) => (
                <button 
                  key={i} 
                  onClick={item.onClick}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all group ${item.active ? 'bg-white/15 ring-1 ring-white/20' : 'hover:bg-white/10'}`} 
                  title={item.label}
                >
                  <item.icon className={`w-4 h-4 transition-colors ${item.active ? item.color : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                </button>
              ))}
            </aside>

            {/* 地图模式与图层 */}
            <section className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl">
              <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-white/10">
                <MapIcon className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">Map & Layers</span>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2">
                    <p className="text-[7px] text-zinc-500 uppercase font-black">Scene</p>
                    <p className="text-[11px] font-black text-white mt-1">{mapMode === '3d' ? '2.5D Terrain' : '2D Flat'}</p>
                  </div>
                  <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2">
                    <p className="text-[7px] text-zinc-500 uppercase font-black">Source</p>
                    <p className="text-[11px] font-black text-emerald-400 mt-1">{baseLayer === 'satellite' ? 'HK Sat' : baseLayer === 'google' ? 'Google' : baseLayer === 'street' ? 'HK Nav' : 'Terrain'}</p>
                  </div>
                  <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2">
                    <p className="text-[7px] text-zinc-500 uppercase font-black">Detail</p>
                    <p className="text-[11px] font-black text-cyan-400 mt-1">{localSceneScore}%</p>
                  </div>
                </div>
                <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/10 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[8px] text-cyan-300 uppercase font-black tracking-wider">Rescue Precision Preset</p>
                      <p className="text-[9px] text-zinc-400 mt-1">Keep current AOI, switch to the highest-detail Hong Kong stack.</p>
                    </div>
                    <button
                      onClick={applyMaxPrecisionPreset}
                      className="shrink-0 rounded-lg bg-cyan-500/15 px-3 py-2 text-[9px] font-black uppercase text-cyan-300 ring-1 ring-cyan-500/30 transition-all hover:bg-cyan-500/25"
                    >
                      Max Precision
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-[8px] text-zinc-500 uppercase mb-1.5 font-black">Mode</p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setMapMode('2d')}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${mapMode === '2d' ? 'bg-amber-500/30 text-amber-400 ring-1 ring-amber-500/50' : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300'}`}
                    >
                      2D
                    </button>
                    <button
                      onClick={() => setMapMode('3d')}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${mapMode === '3d' ? 'bg-amber-500/30 text-amber-400 ring-1 ring-amber-500/50' : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300'}`}
                    >
                      2.5D Terrain
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-[8px] text-zinc-500 uppercase mb-1.5 font-black">Base Layer</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['satellite', 'google', 'street', 'topo'] as const).map((layer) => {
                      const labels: Record<string, string> = { satellite: 'HK Sat', google: 'Google', street: 'HK Nav', topo: 'Terrain' };
                      const titles: Record<string, string> = { satellite: 'Hong Kong LandsD imagery', google: 'Google Hybrid satellite + rich labels', street: 'Hong Kong official navigation basemap', topo: 'Terrain analysis map' };
                      return (
                        <button
                          key={layer}
                          onClick={() => setBaseLayer(layer)}
                          className={`py-2 rounded-lg text-[9px] font-black uppercase transition-all ${baseLayer === layer ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40' : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300'}`}
                          title={titles[layer]}
                        >
                          {labels[layer]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[8px] text-zinc-500 uppercase font-black">Roads & Labels</span>
                  <button
                    onClick={() => setShowRoads(!showRoads)}
                    className={`w-9 h-5 rounded-full transition-all ${showRoads ? 'bg-emerald-500/50' : 'bg-zinc-700'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${showRoads ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[8px] text-zinc-500 uppercase font-black">3D Buildings</span>
                  <button
                    onClick={() => setShowBuildings(!showBuildings)}
                    className={`w-9 h-5 rounded-full transition-all ${showBuildings ? 'bg-cyan-500/50' : 'bg-zinc-700'} ${mapMode === '2d' ? 'opacity-50' : ''}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${showBuildings ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-[9px] leading-relaxed">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-500 uppercase font-black text-[8px]">Active Source</span>
                    <span className="text-emerald-400 font-black">{mapSourceLabel}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-zinc-500 uppercase font-black text-[8px]">Buildings</span>
                    <span className={`${mapMode === '2d' ? 'text-amber-400' : showBuildings ? 'text-cyan-400' : 'text-zinc-400'} font-black`}>
                      {buildingStatus}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/5 text-zinc-400">
                    Best setups: <span className="text-white font-black">HK Sat</span> for local precision, <span className="text-white font-black">Google</span> for global labels. Pair with <span className="text-white font-black">3D Buildings</span> + <span className="text-white font-black">2.5D Terrain</span>.
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/5 text-zinc-400">
                    View logic: <span className="font-black text-cyan-300">Auto density by zoom</span> keeps strategic views clean and restores detailed scan geometry when close in.
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl">
              <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-white/10">
                <Info className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">Map Legend</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <p className="text-[7px] uppercase font-black text-zinc-500">Aircraft</p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] font-black text-white">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
                    DJI M3T Active
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <p className="text-[7px] uppercase font-black text-zinc-500">Link Path</p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] font-black text-white">
                    <span className={`h-2.5 w-2.5 rounded-full ${linkRisk === 'Low' ? 'bg-emerald-400' : linkRisk === 'Guarded' ? 'bg-amber-400' : 'bg-red-400'}`} />
                    Quality-coded
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <p className="text-[7px] uppercase font-black text-zinc-500">Scan Geometry</p>
                  <div className="mt-1 text-[10px] font-black text-white">{showCone ? 'Near-view cone + ground mark' : 'Operator hidden'}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <p className="text-[7px] uppercase font-black text-zinc-500">Scene Stack</p>
                  <div className="mt-1 text-[10px] font-black text-white">{mapMode === '3d' ? 'Terrain + Buildings' : '2D flat mission map'}</div>
                </div>
              </div>
            </section>

            {/* 配置面板 */}
            {showConfig && (
              <section className="bg-zinc-900/70 backdrop-blur-xl border border-amber-500/30 rounded-xl p-4 shadow-2xl">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                  <span className="text-[10px] font-black text-amber-400 uppercase">Display Config</span>
                  <button onClick={() => setShowConfig(false)} className="text-zinc-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 text-[10px]">
                  {[
                    { label: 'Flight Trail', checked: showTrail, onChange: () => setShowTrail(!showTrail) },
                    { label: 'Scan Cone', checked: showCone, onChange: () => setShowCone(!showCone) },
                    { label: 'Labels', checked: showLabels, onChange: () => setShowLabels(!showLabels) },
                    { label: 'Signal Link', checked: showSignalLink, onChange: () => setShowSignalLink(!showSignalLink) },
                    { label: 'Stats Panel', checked: showStats, onChange: () => setShowStats(!showStats) },
                    { label: 'Weather Overlay', checked: showWeatherOverlay, onChange: () => setShowWeatherOverlay(!showWeatherOverlay) },
                    { label: 'Roads & Labels', checked: showRoads, onChange: () => setShowRoads(!showRoads) },
                    { label: '3D Buildings', checked: showBuildings, onChange: () => setShowBuildings(!showBuildings) }
                  ].map((item, i) => (
                    <label key={i} className="flex items-center justify-between cursor-pointer group">
                      <span className="text-zinc-400 group-hover:text-white transition-colors">{item.label}</span>
                      <div 
                        onClick={item.onChange}
                        className={`w-8 h-4 rounded-full transition-all ${item.checked ? 'bg-emerald-500' : 'bg-zinc-700'} relative`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${item.checked ? 'left-4' : 'left-0.5'}`} />
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-white/10 flex justify-between text-[9px] text-zinc-500">
                  <span>Data Index: {dataIndex}/{realData.length}</span>
                  <span className={isPaused ? 'text-amber-400' : 'text-emerald-400'}>{isPaused ? 'PAUSED' : 'LIVE'}</span>
                </div>
              </section>
            )}

            {/* 连接状态快速统计 */}
            {showStats && (
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
            )}

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
            </>}
          </div>
        </div>

        {/* 底部任务日志 */}
        <footer className="flex gap-3 pointer-events-auto shrink-0 h-[110px]">
          <div className="flex-1 bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col overflow-hidden relative shadow-2xl group hover:bg-zinc-900/80 transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-emerald-500/10" />
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10 font-black text-emerald-400 uppercase text-[10px] tracking-widest">
              <div className="flex items-center gap-2.5"><Terminal className="w-4 h-4" /> Mission Log</div>
              <div className="flex items-center gap-3 text-[8px] text-zinc-500 font-bold uppercase">
                <span>T+{flightStats.missionTime}</span>
                <span className="w-px h-3 bg-white/10" />
                <span className={isPaused ? 'text-amber-400' : 'text-emerald-400'}>{isPaused ? 'HOLD' : 'LIVE'}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-[10px] leading-relaxed scrollbar-hide space-y-1 text-zinc-300 uppercase">
              {logs.map((log, i) => (
                <div key={i} className={`flex gap-3 items-start transition-all duration-500 ${i === 0 ? "text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border-l-2 border-emerald-500" : "opacity-40 hover:opacity-100"}`}>
                  <span className="text-zinc-600 font-black w-10">[{1024 + i}]</span>
                  <span className="flex-1 tracking-tight">{log}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 任务状态摘要 */}
          <div className="w-52 bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex flex-col justify-between shadow-2xl">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <p className="text-[7px] text-zinc-500 uppercase font-black">Covered</p>
                <p className="text-xs font-black text-purple-400 font-mono">{flightStats.totalDist < 1000 ? `${flightStats.totalDist.toFixed(0)}m` : `${(flightStats.totalDist / 1000).toFixed(2)}km`}</p>
              </div>
              <div className="text-center">
                <p className="text-[7px] text-zinc-500 uppercase font-black">Speed</p>
                <p className="text-xs font-black text-cyan-400 font-mono">{flightStats.avgSpeed.toFixed(1)} m/s</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-[8px] pt-2 border-t border-white/5 mt-2">
              <span className="text-zinc-500 font-black uppercase">Battery</span>
              <div className="flex items-center gap-1.5">
                <Battery className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-black">{Math.max(20, 98 - Math.floor(dataIndex * 0.15))}%</span>
              </div>
            </div>
          </div>

          <button onClick={() => setMissionMode('rescue')} className="w-48 bg-gradient-to-br from-emerald-600/40 to-emerald-900/20 hover:from-emerald-500/50 hover:to-emerald-800/30 backdrop-blur-xl border border-emerald-500/40 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-2xl group relative overflow-hidden">
            <div className="w-11 h-11 rounded-full border-2 border-emerald-500/50 flex items-center justify-center bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] relative z-10">
              <Navigation className="w-5 h-5 rotate-45 text-emerald-400" />
            </div>
            <span className="tracking-[0.2em] text-emerald-400 font-black text-[9px] uppercase relative z-10">Initiate Rescue</span>
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
