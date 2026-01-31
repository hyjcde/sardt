'use client';

import {
  Cartesian3,
  Cartesian2,
  Math as CesiumMath,
  Color,
  createWorldImageryAsync,
  createWorldTerrainAsync,
  HeightReference,
  HorizontalOrigin,
  Ion,
  JulianDate,
  OpenStreetMapImageryProvider,
  PolylineGlowMaterialProperty,
  VerticalOrigin,
  PolylineDashMaterialProperty,
  NearFarScalar
} from 'cesium';
import React, { useEffect, useMemo, useState, memo } from 'react';
import { BillboardGraphics, CylinderGraphics, EllipseGraphics, Entity, ImageryLayer, LabelGraphics, PointGraphics, PolylineGraphics, useCesium, Viewer } from 'resium';

// UAV 图标 SVG - 无人机形状
const UAV_ICON = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <polygon points="24,4 28,20 44,24 28,28 24,44 20,28 4,24 20,20" fill="#00ffff" stroke="#ffffff" stroke-width="2" filter="url(#glow)"/>
  <circle cx="24" cy="24" r="4" fill="#ffffff"/>
</svg>
`)}`;

// 基站图标 SVG - 信号塔形状
const BASE_ICON = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <path d="M24 4 L32 44 L24 38 L16 44 Z" fill="#ff4444" stroke="#ffffff" stroke-width="2" filter="url(#glow)"/>
  <circle cx="24" cy="12" r="5" fill="#ffffff" stroke="#ff4444" stroke-width="2"/>
  <path d="M14 18 Q24 8 34 18" fill="none" stroke="#ff4444" stroke-width="2" opacity="0.6"/>
  <path d="M10 22 Q24 8 38 22" fill="none" stroke="#ff4444" stroke-width="2" opacity="0.4"/>
</svg>
`)}`;

Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjMzQyNjJlOS0xMGZlLTQ2NzctYjdhYi0zZjM4NDkyMWM0ZjEiLCJpZCI6MTIwNTA5LCJpYXQiOjE2NzI5OTE1ODd9.xcQ46k8Ng1tBILRSptcG2h4l4vxHU_vdZePrfsOBqJA'; 

const CONTEXT_OPTIONS = { webgl: { preserveDrawingBuffer: true } };

const SceneInitializer = ({ terrainProvider, center }: { terrainProvider: any, center: { lon: number, lat: number } }) => {
  const { viewer } = useCesium();
  useEffect(() => {
    if (viewer) {
      const now = new Date();
      viewer.clock.currentTime = JulianDate.fromDate(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0));
      viewer.clock.shouldAnimate = true;
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.depthTestAgainstTerrain = true;
      viewer.scene.light.intensity = 3.5;
      
      // 启用大气和雾效，防止背景全黑
      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.show = true;
      }
      if (viewer.scene.fog) {
        viewer.scene.fog.enabled = true;
        viewer.scene.fog.density = 0.0002;
      }

      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(center.lon, center.lat - 0.003, 500),
        orientation: { heading: CesiumMath.toRadians(0), pitch: CesiumMath.toRadians(-30), roll: 0 },
        duration: 2,
      });
    }
  }, [viewer]);
  useEffect(() => { if (viewer && terrainProvider) viewer.terrainProvider = terrainProvider; }, [viewer, terrainProvider]);
  return null;
};

interface CesiumMapProps {
  currentData: any[];
  fullHistory: any[][];
  showTrail?: boolean;
  showCone?: boolean;
  showLabels?: boolean;
  showSignalLink?: boolean;
}

const CesiumMap = ({ 
  currentData, 
  fullHistory,
  showTrail = true,
  showCone = true,
  showLabels = true,
  showSignalLink = true
}: CesiumMapProps) => {
  const [mounted, setMounted] = useState(false);
  const [terrainProvider, setTerrainProvider] = useState<any>(undefined);
  const [satelliteImagery, setSatelliteImagery] = useState<any>(undefined);

  const COL = { LAT_R: 1, LON_R: 2, ALT_R: 3, LAT_B: 4, LON_B: 5, ALT_B: 6, SNR: 9 };

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      (window as any).CESIUM_BASE_URL = '/cesium';
      createWorldTerrainAsync({ requestVertexNormals: true }).then(setTerrainProvider).catch(err => {
        console.warn("Terrain loading failed:", err);
      });
      createWorldImageryAsync().then(setSatelliteImagery).catch(err => {
        console.warn("Cesium World Imagery failed to load, using fallback", err);
      });
    }
  }, []);

  const fallbackImagery = useMemo(() => new OpenStreetMapImageryProvider({ url: 'https://a.tile.openstreetmap.org/' }), []);

  const linkColor = useMemo(() => {
    const snr = currentData[COL.SNR];
    if (snr > 15) return Color.LIME.withAlpha(0.7);
    if (snr > 10) return Color.YELLOW.withAlpha(0.7);
    return Color.RED.withAlpha(0.7);
  }, [currentData[COL.SNR]]);

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
  
  const trailPositions = useMemo(() => 
    fullHistory.map(d => Cartesian3.fromDegrees(d[COL.LON_R], d[COL.LAT_R], d[COL.ALT_R])),
    [fullHistory]
  );

  if (!mounted) return null;

  return (
    <>
      <Viewer 
        full
        timeline={false} animation={false} baseLayerPicker={false} fullscreenButton={false}
        geocoder={false} homeButton={false} infoBox={false} selectionIndicator={false}
        navigationHelpButton={false} navigationInstructionsInitiallyVisible={false}
        sceneModePicker={false} projectionPicker={false}
        scene3DOnly={true} contextOptions={CONTEXT_OPTIONS}
      >
        <SceneInitializer terrainProvider={terrainProvider} center={{ lon: currentData[COL.LON_R], lat: currentData[COL.LAT_R] }} />
        <ImageryLayer imageryProvider={satelliteImagery || fallbackImagery} />

        {/* UAV 飞行轨迹 */}
        {showTrail && (
          <Entity key="uav-trail">
            <PolylineGraphics 
              positions={trailPositions} 
              width={5} 
              material={new PolylineDashMaterialProperty({ color: Color.CYAN.withAlpha(0.6), dashLength: 16 })} 
            />
          </Entity>
        )}

        {/* UAV 与基站之间的信号连接线 */}
        {showSignalLink && (
          <Entity key="signal-link">
            <PolylineGraphics 
              positions={[uavPos, targetPos]} 
              width={8} 
              material={new PolylineGlowMaterialProperty({ glowPower: 0.6, color: linkColor })} 
            />
          </Entity>
        )}

        {/* 基站标记 - 使用 Billboard 图标 */}
        <Entity key="base-station" position={targetPos}>
          <BillboardGraphics 
            image={BASE_ICON}
            width={48}
            height={48}
            verticalOrigin={VerticalOrigin.BOTTOM}
            disableDepthTestDistance={Number.POSITIVE_INFINITY}
            scaleByDistance={new NearFarScalar(100, 1.3, 3000, 0.7)}
          />
          {showLabels && (
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

        {/* UAV 标记 - 使用 Billboard 图标 */}
        <Entity key="uav-marker" position={uavPos}>
          <BillboardGraphics 
            image={UAV_ICON}
            width={52}
            height={52}
            verticalOrigin={VerticalOrigin.CENTER}
            disableDepthTestDistance={Number.POSITIVE_INFINITY}
            scaleByDistance={new NearFarScalar(100, 1.3, 3000, 0.7)}
          />
          {showLabels && (
            <LabelGraphics 
              text={`UAV-01 | ${currentData[COL.ALT_R].toFixed(0)}m AGL`} 
              font="bold 16px sans-serif" fillColor={Color.CYAN} outlineColor={Color.BLACK} outlineWidth={4}
              verticalOrigin={VerticalOrigin.BOTTOM} pixelOffset={new Cartesian2(0, -32)} 
              horizontalOrigin={HorizontalOrigin.CENTER}
              disableDepthTestDistance={Number.POSITIVE_INFINITY}
              scaleByDistance={new NearFarScalar(100, 1.2, 3000, 0.8)}
            />
          )}
        </Entity>
        
        {/* 扫描光锥 - 从 UAV 向下投射的光束 */}
        {showCone && (
          <Entity key="scan-cone" position={conePos}>
            <CylinderGraphics 
              length={currentData[COL.ALT_R]} 
              topRadius={2} 
              bottomRadius={currentData[COL.ALT_R] * 0.2} 
              material={Color.CYAN.withAlpha(0.2)} 
            />
          </Entity>
        )}

        {/* UAV 地面投影线 - 虚线样式 */}
        <Entity key="ground-projection">
          <PolylineGraphics 
            positions={[uavPos, Cartesian3.fromDegrees(currentData[COL.LON_R], currentData[COL.LAT_R], 0)]} 
            width={2} 
            material={new PolylineDashMaterialProperty({ color: Color.WHITE.withAlpha(0.4), dashLength: 8 })} 
          />
        </Entity>
        
        {/* 地面投影十字标记 */}
        <Entity key="ground-cross-ns">
          <PolylineGraphics 
            positions={[
              Cartesian3.fromDegrees(currentData[COL.LON_R], currentData[COL.LAT_R] - 0.00003, 0.2),
              Cartesian3.fromDegrees(currentData[COL.LON_R], currentData[COL.LAT_R] + 0.00003, 0.2)
            ]} 
            width={2} material={Color.CYAN.withAlpha(0.6)} 
          />
        </Entity>
        <Entity key="ground-cross-ew">
          <PolylineGraphics 
            positions={[
              Cartesian3.fromDegrees(currentData[COL.LON_R] - 0.00003, currentData[COL.LAT_R], 0.2),
              Cartesian3.fromDegrees(currentData[COL.LON_R] + 0.00003, currentData[COL.LAT_R], 0.2)
            ]} 
            width={2} material={Color.CYAN.withAlpha(0.6)} 
          />
        </Entity>
      </Viewer>

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
