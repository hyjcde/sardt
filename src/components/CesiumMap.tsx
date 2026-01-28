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
const MOUNTAIN_CENTER = { lon: 114.0050, lat: 22.2750 };
const TARGET = { lon: 114.0060, lat: 22.2760, alt: 300 };

const SIGNAL_POINTS = [
  { lon: 114.0085, lat: 22.2790 },
  { lon: 114.0075, lat: 22.2780 },
  { lon: 114.0065, lat: 22.2770 },
  { lon: 114.0060, lat: 22.2760 },
];

const UAVS = [
  { id: 'UAV-01', color: Color.CYAN, pos: { lon: 114.0020, lat: 22.2800, alt: 180 }, path: [[114.0000, 22.2820], [114.0020, 22.2800]] },
  { id: 'UAV-02', color: Color.LIME, pos: { lon: 114.0045, lat: 22.2780, alt: 200 }, path: [[114.0030, 22.2810], [114.0045, 22.2780]] },
  { id: 'UAV-03', color: Color.ORANGE, pos: { lon: 114.0065, lat: 22.2765, alt: 220 }, path: [[114.0090, 22.2740], [114.0080, 22.2755], [114.0065, 22.2765]] },
];

const SceneInitializer = ({ terrainProvider }: { terrainProvider: any }) => {
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
        destination: Cartesian3.fromDegrees(MOUNTAIN_CENTER.lon, MOUNTAIN_CENTER.lat - 0.015, 1200),
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

const CesiumMap = () => {
  const [mounted, setMounted] = useState(false);
  const [terrainProvider, setTerrainProvider] = useState<any>(undefined);
  const [satelliteImagery, setSatelliteImagery] = useState<any>(undefined);

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

  // 使用固定的圆形半径，避免 semiMajorAxis/semiMinorAxis 不一致问题
  const RIPPLE_RADIUS = 35;
  const SCAN_RADIUS = 50;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black">
      <Viewer 
        full timeline={false} animation={false} baseLayerPicker={false} fullscreenButton={false}
        vrButton={false} geocoder={false} homeButton={false} infoBox={false}
        sceneModePicker={false} selectionIndicator={false} navigationHelpButton={false}
        scene3DOnly={true} terrainProvider={terrainProvider} skyAtmosphere={false}
        contextOptions={CONTEXT_OPTIONS} style={{ width: '100vw', height: '100vh' }}
      >
        <SceneInitializer terrainProvider={terrainProvider} />
        <ImageryLayer imageryProvider={satelliteImagery || fallbackImagery} />

        {/* 1. 任务覆盖范围 */}
        <Entity position={Cartesian3.fromDegrees(MOUNTAIN_CENTER.lon, MOUNTAIN_CENTER.lat, 0)}>
          <EllipseGraphics 
            semiMajorAxis={1200} semiMinorAxis={1200} 
            material={Color.LIME.withAlpha(0.03)} 
            height={0}
            heightReference={HeightReference.RELATIVE_TO_GROUND} 
          />
        </Entity>

        {/* 2. 信号追踪点 - 使用静态半径 */}
        {SIGNAL_POINTS.map((pt, i) => (
          <React.Fragment key={`sig-grp-${i}`}>
            <Entity position={Cartesian3.fromDegrees(pt.lon, pt.lat, 0)}>
              <PointGraphics pixelSize={10} color={Color.RED} outlineColor={Color.WHITE} outlineWidth={2} heightReference={HeightReference.RELATIVE_TO_GROUND} disableDepthTestDistance={Number.POSITIVE_INFINITY} />
              <EllipseGraphics 
                semiMajorAxis={RIPPLE_RADIUS + i * 5} 
                semiMinorAxis={RIPPLE_RADIUS + i * 5} 
                material={Color.RED.withAlpha(0.12)} 
                height={0}
                heightReference={HeightReference.RELATIVE_TO_GROUND} 
              />
            </Entity>
          </React.Fragment>
        ))}

        {/* 3. 目标点 */}
        <Entity position={Cartesian3.fromDegrees(TARGET.lon, TARGET.lat, TARGET.alt)}>
          <PointGraphics pixelSize={16} color={Color.GOLD} outlineColor={Color.WHITE} outlineWidth={3} disableDepthTestDistance={Number.POSITIVE_INFINITY} />
          <LabelGraphics 
            text="LOCK-ON: TARGET" font="900 12px Orbitron, monospace" fillColor={Color.GOLD} 
            outlineColor={Color.BLACK} outlineWidth={4} pixelOffset={new Cartesian3(0, -25, 0)} 
            verticalOrigin={VerticalOrigin.BOTTOM} disableDepthTestDistance={Number.POSITIVE_INFINITY} 
          />
        </Entity>

        {/* 4. 无人机编队 */}
        {UAVS.map((uav) => (
          <React.Fragment key={uav.id}>
            {/* 无人机位置 */}
            <Entity position={Cartesian3.fromDegrees(uav.pos.lon, uav.pos.lat, uav.pos.alt)}>
              <PointGraphics pixelSize={14} color={uav.color} outlineColor={Color.WHITE} outlineWidth={2} disableDepthTestDistance={Number.POSITIVE_INFINITY} />
              <PointGraphics pixelSize={28} color={uav.color.withAlpha(0.2)} disableDepthTestDistance={Number.POSITIVE_INFINITY} />
              <LabelGraphics 
                text={`${uav.id}\n${uav.pos.alt}m`} 
                font="bold 11px monospace" fillColor={uav.color} outlineColor={Color.BLACK} outlineWidth={3}
                verticalOrigin={VerticalOrigin.BOTTOM} pixelOffset={new Cartesian3(0, -22, 0)} 
                disableDepthTestDistance={Number.POSITIVE_INFINITY} 
              />
            </Entity>

            {/* 3D 扫描光束 */}
            <Entity position={Cartesian3.fromDegrees(uav.pos.lon, uav.pos.lat, uav.pos.alt / 2)}>
              <CylinderGraphics 
                length={uav.pos.alt} 
                topRadius={1} bottomRadius={uav.pos.alt * 0.25} 
                material={uav.color.withAlpha(0.08)} 
              />
            </Entity>

            {/* 地面扫描区域 - 使用静态半径 */}
            <Entity position={Cartesian3.fromDegrees(uav.pos.lon, uav.pos.lat, 0)}>
              <EllipseGraphics 
                semiMajorAxis={SCAN_RADIUS} semiMinorAxis={SCAN_RADIUS} 
                material={uav.color.withAlpha(0.08)} 
                height={0}
                heightReference={HeightReference.RELATIVE_TO_GROUND} 
              />
            </Entity>

            {/* 发光流光航线 */}
            <Entity>
              <PolylineGraphics 
                positions={Cartesian3.fromDegreesArrayHeights([
                  ...uav.path.flatMap(p => [p[0], p[1], uav.pos.alt]),
                  uav.pos.lon, uav.pos.lat, uav.pos.alt
                ])} 
                width={4} 
                material={new PolylineGlowMaterialProperty({ glowPower: 0.25, color: uav.color })} 
              />
            </Entity>
          </React.Fragment>
        ))}
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
