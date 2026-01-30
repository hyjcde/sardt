'use client';

import {
  Cartesian3,
  Math as CesiumMath,
  Color,
  createWorldImageryAsync,
  createWorldTerrainAsync,
  HeightReference,
  Ion,
  JulianDate,
  OpenStreetMapImageryProvider,
  PolylineGlowMaterialProperty,
  VerticalOrigin
} from 'cesium';
import React, { useEffect, useMemo, useState } from 'react';
import { CylinderGraphics, EllipseGraphics, Entity, ImageryLayer, LabelGraphics, PointGraphics, PolylineGraphics, useCesium, Viewer } from 'resium';

// 设置 Cesium Ion Token
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjMzQyNjJlOS0xMGZlLTQ2NzctYjdhYi0zZjM4NDkyMWM0ZjEiLCJpZCI6MTIwNTA5LCJpYXQiOjE2NzI5OTE1ODd9.xcQ46k8Ng1tBILRSptcG2h4l4vxHU_vdZePrfsOBqJA'; 

const CONTEXT_OPTIONS = { webgl: { preserveDrawingBuffer: true } };

const SceneInitializer = ({ terrainProvider, center }: { terrainProvider: any, center: { lon: number, lat: number } }) => {
  const { viewer } = useCesium();

  useEffect(() => {
    if (viewer) {
      const now = new Date();
      const noon = JulianDate.fromDate(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0));
      viewer.clock.currentTime = noon;
      viewer.clock.shouldAnimate = true;
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.depthTestAgainstTerrain = true;
      viewer.scene.light.intensity = 3.5;

      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(center.lon, center.lat - 0.005, 800),
        orientation: { heading: CesiumMath.toRadians(0), pitch: CesiumMath.toRadians(-35), roll: 0 },
        duration: 2,
      });
    }
  }, [viewer]);

  useEffect(() => {
    if (viewer && terrainProvider) {
      viewer.terrainProvider = terrainProvider;
    }
  }, [viewer, terrainProvider]);

  return null;
};

interface CesiumMapProps {
  currentData: any[];
}

const CesiumMap = ({ currentData }: CesiumMapProps) => {
  const [mounted, setMounted] = useState(false);
  const [terrainProvider, setTerrainProvider] = useState<any>(undefined);
  const [satelliteImagery, setSatelliteImagery] = useState<any>(undefined);

  // 数据列索引定义
  const COL = {
    LAT_R: 1, LON_R: 2, ALT_R: 3,
    LAT_B: 4, LON_B: 5, ALT_B: 6, DIST: 7
  };

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      (window as any).CESIUM_BASE_URL = '/cesium';
      createWorldTerrainAsync({ requestVertexNormals: true, requestWaterMask: true }).then(setTerrainProvider);
      createWorldImageryAsync().then(setSatelliteImagery);
    }
  }, []);

  const fallbackImagery = useMemo(() => new OpenStreetMapImageryProvider({ url: 'https://a.tile.openstreetmap.org/' }), []);

  if (!mounted) return null;

  const uavPos = Cartesian3.fromDegrees(currentData[COL.LON_R], currentData[COL.LAT_R], currentData[COL.ALT_R]);
  const targetPos = Cartesian3.fromDegrees(currentData[COL.LON_B], currentData[COL.LAT_B], currentData[COL.ALT_B]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black">
      <Viewer 
        full timeline={false} animation={false} baseLayerPicker={false} fullscreenButton={false}
        vrButton={false} geocoder={false} homeButton={false} infoBox={false}
        sceneModePicker={false} selectionIndicator={false} navigationHelpButton={false}
        scene3DOnly={true} terrainProvider={terrainProvider} skyAtmosphere={false}
        contextOptions={CONTEXT_OPTIONS} style={{ width: '100vw', height: '100vh' }}
      >
        <SceneInitializer terrainProvider={terrainProvider} center={{ lon: currentData[COL.LON_R], lat: currentData[COL.LAT_R] }} />
        <ImageryLayer imageryProvider={satelliteImagery || fallbackImagery} />

        {/* 1. 信号链路 - 动态连线 */}
        <Entity>
          <PolylineGraphics 
            positions={[uavPos, targetPos]} 
            width={3} 
            material={new PolylineGlowMaterialProperty({ glowPower: 0.3, color: Color.YELLOW.withAlpha(0.6) })} 
          />
        </Entity>

        {/* 2. 目标点 (Base) */}
        <Entity position={targetPos}>
          <PointGraphics pixelSize={12} color={Color.RED} outlineColor={Color.WHITE} outlineWidth={2} disableDepthTestDistance={Number.POSITIVE_INFINITY} />
          <LabelGraphics 
            text={`BASE TARGET\nALT: ${currentData[COL.ALT_B].toFixed(1)}m`} 
            font="900 12px monospace" fillColor={Color.RED} 
            outlineColor={Color.BLACK} outlineWidth={4} pixelOffset={new Cartesian3(0, -25, 0)} 
            verticalOrigin={VerticalOrigin.BOTTOM} disableDepthTestDistance={Number.POSITIVE_INFINITY} 
          />
          <EllipseGraphics 
            semiMajorAxis={30} semiMinorAxis={30} 
            material={Color.RED.withAlpha(0.2)} 
            height={0}
            heightReference={HeightReference.RELATIVE_TO_GROUND} 
          />
        </Entity>

        {/* 3. 无人机 (Receiver) */}
        <Entity position={uavPos}>
          <PointGraphics pixelSize={14} color={Color.CYAN} outlineColor={Color.WHITE} outlineWidth={2} disableDepthTestDistance={Number.POSITIVE_INFINITY} />
          <PointGraphics pixelSize={28} color={Color.CYAN.withAlpha(0.2)} disableDepthTestDistance={Number.POSITIVE_INFINITY} />
          <LabelGraphics 
            text={`UAV-01\nALT: ${currentData[COL.ALT_R].toFixed(1)}m`} 
            font="bold 11px monospace" fillColor={Color.CYAN} outlineColor={Color.BLACK} outlineWidth={3}
            verticalOrigin={VerticalOrigin.BOTTOM} pixelOffset={new Cartesian3(0, -22, 0)} 
            disableDepthTestDistance={Number.POSITIVE_INFINITY} 
          />
          
          {/* 3D 扫描光束 */}
          <CylinderGraphics 
            length={currentData[COL.ALT_R]} 
            topRadius={1} bottomRadius={currentData[COL.ALT_R] * 0.25} 
            material={Color.CYAN.withAlpha(0.1)} 
          />
        </Entity>

        {/* 地面投影 */}
        <Entity position={Cartesian3.fromDegrees(currentData[COL.LON_R], currentData[COL.LAT_R], 0)}>
          <EllipseGraphics 
            semiMajorAxis={40} semiMinorAxis={40} 
            material={Color.CYAN.withAlpha(0.1)} 
            height={0}
            heightReference={HeightReference.RELATIVE_TO_GROUND} 
          />
        </Entity>
      </Viewer>

      <style jsx global>{`
        .cesium-viewer, .cesium-viewer-cesiumWidgetContainer, .cesium-widget, .cesium-widget canvas {
          width: 100% !important; height: 100% !important; position: absolute !important; top: 0; left: 0;
        }
        .cesium-viewer-bottom { display: none !important; }
      `}</style>
    </div>
  );
};

export default CesiumMap;
