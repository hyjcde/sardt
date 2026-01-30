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
  VerticalOrigin,
  PolylineDashMaterialProperty,
  CallbackProperty
} from 'cesium';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { CylinderGraphics, EllipseGraphics, Entity, ImageryLayer, LabelGraphics, PointGraphics, PolylineGraphics, useCesium, Viewer } from 'resium';

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
      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.fog.enabled = true;
      viewer.scene.fog.density = 0.0002;

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
}

const CesiumMap = ({ currentData, fullHistory }: CesiumMapProps) => {
  const [mounted, setMounted] = useState(false);
  const [terrainProvider, setTerrainProvider] = useState<any>(undefined);
  const [satelliteImagery, setSatelliteImagery] = useState<any>(undefined);

  const COL = { LAT_R: 1, LON_R: 2, ALT_R: 3, LAT_B: 4, LON_B: 5, ALT_B: 6, SNR: 9 };

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      (window as any).CESIUM_BASE_URL = '/cesium';
      createWorldTerrainAsync({ requestVertexNormals: true }).then(setTerrainProvider);
      createWorldImageryAsync().then(setSatelliteImagery).catch(err => {
        console.error("Cesium World Imagery failed to load, using fallback", err);
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

  if (!mounted) return null;

  const uavPos = Cartesian3.fromDegrees(currentData[COL.LON_R], currentData[COL.LAT_R], currentData[COL.ALT_R]);
  const targetPos = Cartesian3.fromDegrees(currentData[COL.LON_B], currentData[COL.LAT_B], currentData[COL.ALT_B]);
  const trailPositions = fullHistory.map(d => Cartesian3.fromDegrees(d[COL.LON_R], d[COL.LAT_R], d[COL.ALT_R]));

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-zinc-950">
      <Viewer 
        full timeline={false} animation={false} baseLayerPicker={false} fullscreenButton={false}
        geocoder={false} homeButton={false} infoBox={false} selectionIndicator={false}
        scene3DOnly={true} skyAtmosphere={true} contextOptions={CONTEXT_OPTIONS}
        style={{ width: '100vw', height: '100vh' }}
      >
        <SceneInitializer terrainProvider={terrainProvider} center={{ lon: currentData[COL.LON_R], lat: currentData[COL.LAT_R] }} />
        <ImageryLayer imageryProvider={satelliteImagery || fallbackImagery} />

        <Entity>
          <PolylineGraphics 
            positions={trailPositions} 
            width={2} 
            material={new PolylineDashMaterialProperty({ color: Color.CYAN.withAlpha(0.4), dashLength: 16 })} 
          />
        </Entity>

        <Entity>
          <PolylineGraphics 
            positions={[uavPos, targetPos]} 
            width={4} 
            material={new PolylineGlowMaterialProperty({ glowPower: 0.4, color: linkColor })} 
          />
        </Entity>

        <Entity position={targetPos}>
          <PointGraphics pixelSize={10} color={Color.RED} outlineColor={Color.WHITE} outlineWidth={2} disableDepthTestDistance={Number.POSITIVE_INFINITY} />
          <LabelGraphics 
            text={`BASE STATION\nSNR: ${currentData[COL.SNR].toFixed(1)}dB`} 
            font="900 10px Orbitron, monospace" fillColor={Color.WHITE} 
            outlineColor={Color.BLACK} outlineWidth={3} pixelOffset={new Cartesian3(0, -20, 0)} 
            verticalOrigin={VerticalOrigin.BOTTOM} disableDepthTestDistance={Number.POSITIVE_INFINITY} 
          />
        </Entity>

        <Entity position={uavPos}>
          <PointGraphics pixelSize={12} color={Color.CYAN} outlineColor={Color.WHITE} outlineWidth={2} disableDepthTestDistance={Number.POSITIVE_INFINITY} />
          <LabelGraphics 
            text={`UAV-01\nALT: ${currentData[COL.ALT_R].toFixed(1)}m`} 
            font="bold 11px monospace" fillColor={Color.CYAN} outlineColor={Color.BLACK} outlineWidth={3}
            verticalOrigin={VerticalOrigin.BOTTOM} pixelOffset={new Cartesian3(0, -25, 0)} 
            disableDepthTestDistance={Number.POSITIVE_INFINITY} 
          />
          <CylinderGraphics 
            length={currentData[COL.ALT_R]} 
            topRadius={0.5} bottomRadius={currentData[COL.ALT_R] * 0.2} 
            material={Color.CYAN.withAlpha(0.1)} 
          />
        </Entity>

        <Entity>
          <PolylineGraphics 
            positions={[uavPos, Cartesian3.fromDegrees(currentData[COL.LON_R], currentData[COL.LAT_R], 0)]} 
            width={1} material={Color.WHITE.withAlpha(0.3)} 
          />
        </Entity>
      </Viewer>
    </div>
  );
};

export default CesiumMap;
