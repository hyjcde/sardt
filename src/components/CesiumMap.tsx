'use client';

import {
  Cartesian3,
  Cartesian2,
  Math as CesiumMath,
  Color,
  ArcGisMapServerImageryProvider,
  Cesium3DTileset,
  createWorldTerrainAsync,
  HeadingPitchRoll,
  HorizontalOrigin,
  Ion,
  JulianDate,
  OpenStreetMapImageryProvider,
  PolylineGlowMaterialProperty,
  Transforms,
  VerticalOrigin,
  PolylineDashMaterialProperty,
  NearFarScalar,
  SceneMode,
  UrlTemplateImageryProvider,
  EllipsoidTerrainProvider,
  PolygonHierarchy
} from 'cesium';
import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { BillboardGraphics, CylinderGraphics, Entity, ImageryLayer, LabelGraphics, ModelGraphics, PolygonGraphics, PolylineGraphics, useCesium, Viewer } from 'resium';

// CC-BY-4.0 attribution:
// "DJI Mavic 3" by llirikslon
// https://sketchfab.com/3d-models/dji-mavic-3-c5a5abae1dea468ab73b1bdc7d616fa6
const DRONE_MODEL_URI = '/models/dji_mavic_3.glb';

const BASE_ICON = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <filter id="g" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="1.8" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="tower" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e2e8f0"/>
      <stop offset="100%" stop-color="#94a3b8"/>
    </linearGradient>
    <linearGradient id="base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <ellipse cx="32" cy="58" rx="14" ry="3" fill="#000" opacity="0.25"/>
  <rect x="28" y="24" width="8" height="34" rx="1.5" fill="url(#tower)" stroke="#cbd5e1" stroke-width="0.8"/>
  <rect x="30" y="28" width="4" height="4" rx="0.5" fill="#334155"/>
  <rect x="30" y="34" width="4" height="4" rx="0.5" fill="#334155"/>
  <rect x="30" y="40" width="4" height="4" rx="0.5" fill="#334155"/>
  <line x1="22" y1="52" x2="28" y2="38" stroke="url(#tower)" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="42" y1="52" x2="36" y2="38" stroke="url(#tower)" stroke-width="2.5" stroke-linecap="round"/>
  <rect x="24" y="54" width="16" height="4" rx="2" fill="url(#base)"/>
  <rect x="29" y="18" width="6" height="8" rx="1" fill="#e11d48" stroke="#fff" stroke-width="1"/>
  <line x1="32" y1="8" x2="32" y2="18" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round"/>
  <circle cx="32" cy="7" r="2.5" fill="#f43f5e" filter="url(#g)"/>
  <path d="M22 16 Q27 8 32 7" fill="none" stroke="#f43f5e" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/>
  <path d="M18 20 Q25 9 32 7" fill="none" stroke="#f43f5e" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  <path d="M14 24 Q23 10 32 7" fill="none" stroke="#f43f5e" stroke-width="1.2" stroke-linecap="round" opacity="0.3"/>
  <path d="M42 16 Q37 8 32 7" fill="none" stroke="#f43f5e" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/>
  <path d="M46 20 Q39 9 32 7" fill="none" stroke="#f43f5e" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  <path d="M50 24 Q41 10 32 7" fill="none" stroke="#f43f5e" stroke-width="1.2" stroke-linecap="round" opacity="0.3"/>
</svg>
`)}`;

const LKP_ICON = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <filter id="lkp" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <ellipse cx="32" cy="60" rx="9" ry="3" fill="#000" opacity="0.25"/>
  <line x1="32" y1="56" x2="32" y2="36" stroke="#ea580c" stroke-width="3" stroke-linecap="round"/>
  <circle cx="32" cy="20" r="17" fill="#ea580c" filter="url(#lkp)"/>
  <circle cx="32" cy="20" r="14" fill="#1a1a1a" stroke="#fb923c" stroke-width="1.5"/>
  <text x="32" y="25" text-anchor="middle" font-size="13" font-weight="900" fill="#fb923c" font-family="monospace">SOS</text>
  <circle cx="32" cy="20" r="20" fill="none" stroke="#fb923c" stroke-width="1" opacity="0.4"/>
  <circle cx="32" cy="20" r="24" fill="none" stroke="#fb923c" stroke-width="0.8" opacity="0.2"/>
</svg>
`)}`;

Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjMzQyNjJlOS0xMGZlLTQ2NzctYjdhYi0zZjM4NDkyMWM0ZjEiLCJpZCI6MTIwNTA5LCJpYXQiOjE2NzI5OTE1ODd9.xcQ46k8Ng1tBILRSptcG2h4l4vxHU_vdZePrfsOBqJA'; 

const CONTEXT_OPTIONS = { webgl: { preserveDrawingBuffer: true } };
const HK_3D_TILESET_URL = 'https://data.map.gov.hk/api/3d-data/3dtiles/f2/tileset.json?key=3967f8f365694e0798af3e7678509421';

// 用于存储 viewer 实例的全局引用
let globalViewerRef: any = null;

const ViewStateMonitor = ({ onHeightChange }: { onHeightChange: (height: number) => void }) => {
  const { viewer } = useCesium();

  useEffect(() => {
    if (!viewer) return;

    let frameId = 0;
    const updateHeight = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        onHeightChange(Math.max(0, viewer.camera.positionCartographic?.height ?? 0));
      });
    };

    updateHeight();
    viewer.camera.changed.addEventListener(updateHeight);

    return () => {
      viewer.camera.changed.removeEventListener(updateHeight);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [viewer, onHeightChange]);

  return null;
};

const HongKongBuildingsLayer = ({ enabled }: { enabled: boolean }) => {
  const { viewer } = useCesium();
  const tilesetRef = useRef<Cesium3DTileset | null>(null);

  useEffect(() => {
    let cancelled = false;

    const setupBuildings = async () => {
      if (!viewer) return;

      if (!enabled) {
        if (tilesetRef.current) {
          tilesetRef.current.show = false;
          viewer.scene.requestRender();
        }
        return;
      }

      if (!tilesetRef.current) {
        try {
          const tileset = await Cesium3DTileset.fromUrl(HK_3D_TILESET_URL, {
            maximumScreenSpaceError: 1,
          });

          if (cancelled || !viewer) return;

          tileset.show = true;
          tileset.maximumScreenSpaceError = 1;
          viewer.scene.primitives.add(tileset);
          tilesetRef.current = tileset;
          viewer.scene.requestRender();
        } catch (err) {
          console.warn('Hong Kong 3D tiles failed to load:', err);
        }
      } else {
        tilesetRef.current.show = true;
        viewer.scene.requestRender();
      }
    };

    setupBuildings();

    return () => {
      cancelled = true;
    };
  }, [viewer, enabled]);

  useEffect(() => {
    return () => {
      if (viewer && tilesetRef.current) {
        viewer.scene.primitives.remove(tilesetRef.current);
        tilesetRef.current = null;
      }
    };
  }, [viewer]);

  return null;
};

const SceneInitializer = ({ 
  terrainProvider, 
  center, 
  flyToTarget, 
  mapMode 
}: { 
  terrainProvider: any; 
  center: { lon: number; lat: number }; 
  flyToTarget?: { lon: number; lat: number; alt: number } | null;
  mapMode?: '2d' | '3d';
}) => {
  const { viewer } = useCesium();
  
  useEffect(() => {
    if (viewer) {
      globalViewerRef = viewer;
    }
  }, [viewer]);
  
  useEffect(() => {
    if (viewer) {
      const now = new Date();
      viewer.clock.currentTime = JulianDate.fromDate(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0));
      viewer.clock.shouldAnimate = true;
      viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 2);
      viewer.scene.globe.enableLighting = mapMode === '3d';
      viewer.scene.globe.depthTestAgainstTerrain = mapMode === '3d';
      viewer.scene.globe.maximumScreenSpaceError = 1;
      viewer.scene.light.intensity = 3.5;
      
      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.show = mapMode === '3d';
      }
      if (viewer.scene.fog) {
        viewer.scene.fog.enabled = mapMode === '3d';
        viewer.scene.fog.density = 0.0002;
      }

      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(center.lon, center.lat - 0.003, 500),
        orientation: { heading: CesiumMath.toRadians(0), pitch: CesiumMath.toRadians(mapMode === '2d' ? -90 : -30), roll: 0 },
        duration: 2,
      });
    }
  }, [viewer]);
  
  // 2D / 2.5D 模式与地形
  useEffect(() => {
    if (!viewer) return;
    viewer.scene.mode = mapMode === '2d' ? SceneMode.SCENE2D : SceneMode.SCENE3D;
  }, [viewer, mapMode]);
  
  useEffect(() => {
    if (!viewer) return;
    viewer.terrainProvider = mapMode === '3d' && terrainProvider ? terrainProvider : new EllipsoidTerrainProvider();
  }, [viewer, terrainProvider, mapMode]);
  
  useEffect(() => {
    if (viewer && flyToTarget) {
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(flyToTarget.lon, flyToTarget.lat - 0.002, flyToTarget.alt + 200),
        orientation: { 
          heading: CesiumMath.toRadians(0), 
          pitch: CesiumMath.toRadians(-45), 
          roll: 0 
        },
        duration: 1.5,
      });
    }
  }, [viewer, flyToTarget]);
  
  return null;
};

interface CesiumMapProps {
  currentData: any[];
  prevData?: any[];
  fullHistory: any[][];
  showTrail?: boolean;
  showCone?: boolean;
  showLabels?: boolean;
  showSignalLink?: boolean;
  flyToTarget?: { lon: number, lat: number, alt: number } | null;
  mapMode?: '2d' | '3d';
  baseLayer?: 'satellite' | 'street' | 'topo' | 'google';
  showRoads?: boolean;
  showBuildings?: boolean;
  searchArea?: { minLat: number; maxLat: number; minLon: number; maxLon: number } | null;
  lkpPosition?: { lon: number; lat: number } | null;
  showSearchGrid?: boolean;
  gridDivisions?: number;
  coveredCells?: Set<string>;
}

const CesiumMap = ({ 
  currentData, 
  prevData,
  fullHistory,
  showTrail = true,
  showCone = true,
  showLabels = true,
  showSignalLink = true,
  flyToTarget = null,
  mapMode = '3d',
  baseLayer = 'satellite',
  showRoads = true,
  showBuildings = true,
  searchArea = null,
  lkpPosition = null,
  showSearchGrid = false,
  gridDivisions = 4,
  coveredCells
}: CesiumMapProps) => {
  const [mounted, setMounted] = useState(false);
  const [terrainProvider, setTerrainProvider] = useState<any>(undefined);
  const [hkBasemapImagery, setHkBasemapImagery] = useState<any>(undefined);
  const [cameraHeight, setCameraHeight] = useState(1400);

  const COL = { LAT_R: 1, LON_R: 2, ALT_R: 3, LAT_B: 4, LON_B: 5, ALT_B: 6, SNR: 9 };

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      (window as any).CESIUM_BASE_URL = '/cesium';
      createWorldTerrainAsync({ requestVertexNormals: true }).then(setTerrainProvider).catch(err => {
        console.warn("Terrain loading failed:", err);
      });
      ArcGisMapServerImageryProvider.fromUrl(
        'https://api.hkmapservice.gov.hk/ags/map/basemap/WGS84?key=0c90cdcd13904a66b6c60130f34c9ffa'
      ).then(setHkBasemapImagery).catch(err => {
        console.warn("Hong Kong basemap failed to load, using imagery fallback", err);
      });
    }
  }, []);

  const hkImagery = useMemo(() => new UrlTemplateImageryProvider({
    url: 'https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/imagery/WGS84/{z}/{x}/{y}.png',
    credit: '© Map from Lands Department'
  }), []);
  const hkLabelImagery = useMemo(() => new UrlTemplateImageryProvider({
    url: 'https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/label/hk/en/WGS84/{z}/{x}/{y}.png',
    credit: '© Map from Lands Department'
  }), []);
  const osmImagery = useMemo(() => new OpenStreetMapImageryProvider({ url: 'https://a.tile.openstreetmap.org/' }), []);
  const topoImagery = useMemo(() => new UrlTemplateImageryProvider({
    url: 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
    credit: 'Map data: © OpenStreetMap, SRTM | Map style: © OpenTopoMap'
  }), []);
  const googleHybridImagery = useMemo(() => new UrlTemplateImageryProvider({
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    credit: '© Google'
  }), []);
  
  const baseImagery = useMemo(() => {
    if (baseLayer === 'google') return googleHybridImagery;
    if (baseLayer === 'street') return hkBasemapImagery || hkImagery;
    if (baseLayer === 'topo') return topoImagery;
    return hkImagery;
  }, [baseLayer, hkBasemapImagery, hkImagery, osmImagery, topoImagery, googleHybridImagery]);
  
  const roadsOverlayImagery = useMemo(() => {
    if (!showRoads) return null;
    if (baseLayer === 'satellite') return hkLabelImagery;
    return null;
  }, [showRoads, baseLayer, hkLabelImagery]);

  const linkColor = useMemo(() => {
    const snr = currentData[COL.SNR];
    if (snr > 15) return Color.LIME.withAlpha(0.7);
    if (snr > 10) return Color.YELLOW.withAlpha(0.7);
    return Color.RED.withAlpha(0.7);
  }, [currentData[COL.SNR]]);

  const signalAccentColor = useMemo(() => {
    const snr = currentData[COL.SNR];
    if (snr > 15) return Color.LIME;
    if (snr > 10) return Color.GOLD;
    return Color.RED;
  }, [currentData[COL.SNR]]);

  const sceneDetail = useMemo(() => {
    if (mapMode === '2d') return cameraHeight > 1800 ? 'strategic' : 'operational';
    if (cameraHeight > 2200) return 'strategic';
    if (cameraHeight > 900) return 'operational';
    return 'inspection';
  }, [cameraHeight, mapMode]);

  const autoShowLabels = showLabels && sceneDetail !== 'strategic';
  const autoShowCone = showCone && sceneDetail === 'inspection';
  const autoShowTrail = showTrail && sceneDetail !== 'inspection';
  const autoShowGroundProjection = sceneDetail !== 'strategic';
  const autoShowSignalLink = showSignalLink && (sceneDetail !== 'inspection' || currentData[COL.SNR] <= 10);

  const trailWidth = sceneDetail === 'strategic' ? 3 : sceneDetail === 'operational' ? 5 : 6;
  const linkWidth = sceneDetail === 'strategic' ? 6 : 8;
  const setCameraHeightStable = useCallback((height: number) => {
    setCameraHeight(prev => (Math.abs(prev - height) > 20 ? height : prev));
  }, []);

  // 使用 useMemo 稳定位置计算，减少重新渲染
  const uavPos = useMemo(() => 
    Cartesian3.fromDegrees(currentData[COL.LON_R], currentData[COL.LAT_R], currentData[COL.ALT_R]),
    [currentData[COL.LON_R], currentData[COL.LAT_R], currentData[COL.ALT_R]]
  );
  
  const targetPos = useMemo(() => 
    Cartesian3.fromDegrees(currentData[COL.LON_B], currentData[COL.LAT_B], currentData[COL.ALT_B]),
    [currentData[COL.LON_B], currentData[COL.LAT_B], currentData[COL.ALT_B]]
  );
  
  // 光锥中心位置 - 设置在 UAV 和地面的中点，使光锥从地面延伸到 UAV
  const conePos = useMemo(() => 
    Cartesian3.fromDegrees(currentData[COL.LON_R], currentData[COL.LAT_R], currentData[COL.ALT_R] / 2),
    [currentData[COL.LON_R], currentData[COL.LAT_R], currentData[COL.ALT_R]]
  );

  // 根据前后帧位置计算无人机航向
  const uavOrientation = useMemo(() => {
    let heading = 0;
    let pitch = 0;
    let roll = 0;
    if (prevData) {
      const dLon = currentData[COL.LON_R] - prevData[COL.LON_R];
      const dLat = currentData[COL.LAT_R] - prevData[COL.LAT_R];
      if (Math.abs(dLon) > 1e-9 || Math.abs(dLat) > 1e-9) {
        const cosLat = Math.cos(currentData[COL.LAT_R] * Math.PI / 180);
        heading = Math.atan2(dLon * cosLat, dLat);
        roll = CesiumMath.clamp((-dLon * cosLat * 111320) / 120, -0.16, 0.16);
      }
      pitch = CesiumMath.clamp((currentData[COL.ALT_R] - prevData[COL.ALT_R]) / 55, -0.14, 0.14);
    }
    const hpr = new HeadingPitchRoll(heading, pitch, roll);
    return Transforms.headingPitchRollQuaternion(uavPos, hpr);
  }, [uavPos, prevData, currentData]);
  
  const trailPositions = useMemo(() => 
    fullHistory.map(d => Cartesian3.fromDegrees(d[COL.LON_R], d[COL.LAT_R], d[COL.ALT_R])),
    [fullHistory]
  );

  const gridLines = useMemo(() => {
    if (!searchArea || !showSearchGrid) return [];
    const { minLat, maxLat, minLon, maxLon } = searchArea;
    const lines: Cartesian3[][] = [];
    for (let i = 0; i <= gridDivisions; i++) {
      const lat = minLat + (maxLat - minLat) * i / gridDivisions;
      lines.push([Cartesian3.fromDegrees(minLon, lat, 0.5), Cartesian3.fromDegrees(maxLon, lat, 0.5)]);
    }
    for (let j = 0; j <= gridDivisions; j++) {
      const lon = minLon + (maxLon - minLon) * j / gridDivisions;
      lines.push([Cartesian3.fromDegrees(lon, minLat, 0.5), Cartesian3.fromDegrees(lon, maxLat, 0.5)]);
    }
    return lines;
  }, [searchArea, showSearchGrid, gridDivisions]);

  const coveredPolygons = useMemo(() => {
    if (!searchArea || !coveredCells || coveredCells.size === 0) return [];
    const { minLat, maxLat, minLon, maxLon } = searchArea;
    const cellH = (maxLat - minLat) / gridDivisions;
    const cellW = (maxLon - minLon) / gridDivisions;
    const polys: { key: string; positions: Cartesian3[] }[] = [];
    coveredCells.forEach(key => {
      const [r, c] = key.split('-').map(Number);
      const lat0 = minLat + r * cellH;
      const lon0 = minLon + c * cellW;
      polys.push({
        key,
        positions: Cartesian3.fromDegreesArray([lon0, lat0, lon0 + cellW, lat0, lon0 + cellW, lat0 + cellH, lon0, lat0 + cellH])
      });
    });
    return polys;
  }, [searchArea, coveredCells, gridDivisions]);

  const searchBoundary = useMemo(() => {
    if (!searchArea || !showSearchGrid) return null;
    const { minLat, maxLat, minLon, maxLon } = searchArea;
    return Cartesian3.fromDegreesArray([minLon, minLat, maxLon, minLat, maxLon, maxLat, minLon, maxLat, minLon, minLat]);
  }, [searchArea, showSearchGrid]);

  const gridLabels = useMemo(() => {
    if (!searchArea || !showSearchGrid) return [];
    const { minLat, maxLat, minLon, maxLon } = searchArea;
    const cellH = (maxLat - minLat) / gridDivisions;
    const cellW = (maxLon - minLon) / gridDivisions;
    const labels: { key: string; text: string; pos: Cartesian3 }[] = [];
    const rows = 'ABCDEFGH';
    for (let r = 0; r < gridDivisions; r++) {
      for (let c = 0; c < gridDivisions; c++) {
        const centerLat = minLat + (r + 0.5) * cellH;
        const centerLon = minLon + (c + 0.5) * cellW;
        labels.push({
          key: `${r}-${c}`,
          text: `${rows[gridDivisions - 1 - r]}${c + 1}`,
          pos: Cartesian3.fromDegrees(centerLon, centerLat, 1)
        });
      }
    }
    return labels;
  }, [searchArea, showSearchGrid, gridDivisions]);

  const lkpPos = useMemo(() => lkpPosition ? Cartesian3.fromDegrees(lkpPosition.lon, lkpPosition.lat, 5) : null, [lkpPosition]);

  if (!mounted) return null;

  return (
    <>
      <Viewer 
        full
        timeline={false} animation={false} baseLayerPicker={false} fullscreenButton={false}
        geocoder={false} homeButton={false} infoBox={false} selectionIndicator={false}
        navigationHelpButton={false} navigationInstructionsInitiallyVisible={false}
        sceneModePicker={false} projectionPicker={false}
        scene3DOnly={false} contextOptions={CONTEXT_OPTIONS}
      >
        <ViewStateMonitor onHeightChange={setCameraHeightStable} />
        <SceneInitializer terrainProvider={terrainProvider} center={{ lon: currentData[COL.LON_R], lat: currentData[COL.LAT_R] }} flyToTarget={flyToTarget} mapMode={mapMode} />
        <ImageryLayer imageryProvider={baseImagery} />
        {roadsOverlayImagery && <ImageryLayer imageryProvider={roadsOverlayImagery} alpha={0.75} brightness={1.1} />}
        <HongKongBuildingsLayer enabled={mapMode === '3d' && showBuildings} />

        {searchBoundary && (
          <Entity key="search-boundary">
            <PolylineGraphics positions={searchBoundary} width={4} material={Color.YELLOW.withAlpha(0.9)} />
          </Entity>
        )}
        {gridLines.map((line, i) => (
          <Entity key={`grid-${i}`}>
            <PolylineGraphics positions={line} width={2} material={new PolylineDashMaterialProperty({ color: Color.YELLOW.withAlpha(0.45), dashLength: 10 })} />
          </Entity>
        ))}
        {coveredPolygons.map(cell => (
          <Entity key={`cov-${cell.key}`}>
            <PolygonGraphics hierarchy={new PolygonHierarchy(cell.positions)} material={Color.LIME.withAlpha(0.15)} outline={false} height={0.3} />
          </Entity>
        ))}
        {gridLabels.map(lbl => (
          <Entity key={`glbl-${lbl.key}`} position={lbl.pos}>
            <LabelGraphics
              text={lbl.text}
              font="bold 18px monospace"
              fillColor={coveredCells?.has(lbl.key) ? Color.LIME : Color.WHITE}
              outlineColor={Color.BLACK}
              outlineWidth={4}
              style={1}
              horizontalOrigin={HorizontalOrigin.CENTER}
              verticalOrigin={VerticalOrigin.CENTER}
              disableDepthTestDistance={Number.POSITIVE_INFINITY}
              scaleByDistance={new NearFarScalar(100, 1.2, 4000, 0.6)}
            />
          </Entity>
        ))}
        {lkpPos && (
          <Entity key="lkp-marker" position={lkpPos}>
            <BillboardGraphics image={LKP_ICON} width={52} height={52} verticalOrigin={VerticalOrigin.BOTTOM} disableDepthTestDistance={Number.POSITIVE_INFINITY} scaleByDistance={new NearFarScalar(100, 1.3, 3000, 0.7)} />
            {autoShowLabels && (
              <LabelGraphics text="LAST KNOWN POS" font="bold 14px sans-serif" fillColor={Color.ORANGE} outlineColor={Color.BLACK} outlineWidth={3} pixelOffset={new Cartesian2(0, 12)} verticalOrigin={VerticalOrigin.TOP} horizontalOrigin={HorizontalOrigin.CENTER} disableDepthTestDistance={Number.POSITIVE_INFINITY} scaleByDistance={new NearFarScalar(100, 1.2, 3000, 0.8)} />
            )}
          </Entity>
        )}

        {/* UAV 飞行轨迹 */}
        {autoShowTrail && (
          <Entity key="uav-trail">
            <PolylineGraphics 
              positions={trailPositions} 
              width={trailWidth} 
              material={new PolylineDashMaterialProperty({ color: signalAccentColor.withAlpha(0.65), dashLength: 16 })} 
            />
          </Entity>
        )}

        {/* UAV 与基站之间的信号连接线 */}
        {autoShowSignalLink && (
          <Entity key="signal-link">
            <PolylineGraphics 
              positions={[uavPos, targetPos]} 
              width={linkWidth} 
              material={new PolylineGlowMaterialProperty({ glowPower: 0.6, color: linkColor })} 
            />
          </Entity>
        )}

        {/* 基站标记 - 使用 Billboard 图标 */}
        <Entity key="base-station" position={targetPos}>
          <BillboardGraphics 
            image={BASE_ICON}
            width={56}
            height={56}
            verticalOrigin={VerticalOrigin.BOTTOM}
            disableDepthTestDistance={Number.POSITIVE_INFINITY}
            scaleByDistance={new NearFarScalar(100, 1.3, 3000, 0.7)}
          />
          {autoShowLabels && (
            <LabelGraphics 
              text={`GND STATION`} 
              font="bold 16px sans-serif" fillColor={Color.WHITE} 
              outlineColor={Color.BLACK} outlineWidth={4} 
              pixelOffset={new Cartesian2(0, 12)} 
              verticalOrigin={VerticalOrigin.TOP}
              horizontalOrigin={HorizontalOrigin.CENTER}
              disableDepthTestDistance={Number.POSITIVE_INFINITY}
              scaleByDistance={new NearFarScalar(100, 1.2, 3000, 0.8)}
            />
          )}
        </Entity>

        {/* UAV 标记 - 3D 无人机模型 */}
        <Entity key="uav-marker" position={uavPos} orientation={uavOrientation as any}>
          <ModelGraphics 
            uri={DRONE_MODEL_URI}
            scale={0.38}
            minimumPixelSize={36}
            maximumScale={64}
            silhouetteColor={Color.WHITE}
            silhouetteSize={1.5}
          />
          {autoShowLabels && (
            <LabelGraphics 
              text={`UAV-01 | ${currentData[COL.ALT_R].toFixed(0)}m AGL`} 
              font="bold 16px sans-serif" fillColor={Color.WHITE} outlineColor={Color.BLACK} outlineWidth={4}
              verticalOrigin={VerticalOrigin.BOTTOM} pixelOffset={new Cartesian2(0, -42)} 
              horizontalOrigin={HorizontalOrigin.CENTER}
              disableDepthTestDistance={Number.POSITIVE_INFINITY}
              scaleByDistance={new NearFarScalar(100, 1.2, 3000, 0.8)}
            />
          )}
        </Entity>
        
        {/* 扫描光锥 - 从 UAV 向下投射的光束 */}
        {autoShowCone && (
          <Entity key="scan-cone" position={conePos}>
            <CylinderGraphics 
              length={currentData[COL.ALT_R]} 
              topRadius={2} 
              bottomRadius={currentData[COL.ALT_R] * 0.18} 
              material={signalAccentColor.withAlpha(0.18)} 
            />
          </Entity>
        )}

        {/* UAV 地面投影线 - 虚线样式 */}
        {autoShowGroundProjection && <Entity key="ground-projection">
          <PolylineGraphics 
            positions={[uavPos, Cartesian3.fromDegrees(currentData[COL.LON_R], currentData[COL.LAT_R], 0)]} 
            width={2} 
            material={new PolylineDashMaterialProperty({ color: Color.WHITE.withAlpha(0.4), dashLength: 8 })} 
          />
        </Entity>}
        
        {/* 地面投影十字标记 */}
        {autoShowGroundProjection && <Entity key="ground-cross-ns">
          <PolylineGraphics 
            positions={[
              Cartesian3.fromDegrees(currentData[COL.LON_R], currentData[COL.LAT_R] - 0.00003, 0.2),
              Cartesian3.fromDegrees(currentData[COL.LON_R], currentData[COL.LAT_R] + 0.00003, 0.2)
            ]} 
            width={2} material={signalAccentColor.withAlpha(0.6)} 
          />
        </Entity>}
        {autoShowGroundProjection && <Entity key="ground-cross-ew">
          <PolylineGraphics 
            positions={[
              Cartesian3.fromDegrees(currentData[COL.LON_R] - 0.00003, currentData[COL.LAT_R], 0.2),
              Cartesian3.fromDegrees(currentData[COL.LON_R] + 0.00003, currentData[COL.LAT_R], 0.2)
            ]} 
            width={2} material={signalAccentColor.withAlpha(0.6)} 
          />
        </Entity>}
      </Viewer>

      <div className="pointer-events-none fixed top-20 left-1/2 z-15 -translate-x-1/2 rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-200 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <span className="font-black text-cyan-300">View: {sceneDetail}</span>
          <span className="text-zinc-400">Camera {cameraHeight.toFixed(0)}m</span>
          <span className={currentData[COL.SNR] > 15 ? 'text-emerald-400' : currentData[COL.SNR] > 10 ? 'text-amber-400' : 'text-red-400'}>
            Auto Density {sceneDetail === 'strategic' ? 'Low' : sceneDetail === 'operational' ? 'Balanced' : 'High'}
          </span>
        </div>
      </div>

      <style jsx global>{`
        .cesium-viewer {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 0 !important;
        }
        .cesium-viewer-cesiumWidgetContainer,
        .cesium-widget,
        .cesium-widget canvas {
          width: 100% !important;
          height: 100% !important;
        }
        .cesium-viewer-bottom,
        .cesium-navigation-help,
        .cesium-widget-credits,
        .cesium-credit-logoContainer,
        .cesium-credit-textContainer,
        .cesium-viewer .cesium-viewer-bottom,
        [class*="cesium-credit"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }
      `}</style>
    </>
  );
};

export default memo(CesiumMap);
