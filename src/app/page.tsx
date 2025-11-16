'use client';

import { Canvas } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import { MeshTransmissionMaterial } from '@react-three/drei';
import { generatePalette, type PaletteType } from '../colorUtils';

// Color preset configurations
type PresetConfig = {
  name: string;
  paletteType: PaletteType;
  seedOffset: number;
  previewColors: string[];
};

const COLOR_PRESETS: PresetConfig[] = [
  { name: 'Rainbow', paletteType: 'triadic', seedOffset: 100, previewColors: ['#ff006e', '#8338ec', '#0b5bff', '#06ffa5', '#ffbe0b', '#fb5607'] },
  { name: 'Purple Pink', paletteType: 'analogous', seedOffset: 200, previewColors: ['#8338ec', '#ff006e', '#fb5607'] },
  { name: 'Blue Green', paletteType: 'complementary', seedOffset: 300, previewColors: ['#0b5bff', '#06ffa5'] },
  { name: 'Orange Red', paletteType: 'analogous', seedOffset: 400, previewColors: ['#fb5607', '#ff006e'] },
  { name: 'Black', paletteType: 'monochromatic', seedOffset: 500, previewColors: ['#000000', '#1a1a1a', '#333333'] },
  { name: 'White', paletteType: 'monochromatic', seedOffset: 600, previewColors: ['#ffffff', '#f0f0f0', '#e0e0e0'] },
  { name: 'B&W Gradient', paletteType: 'complementary', seedOffset: 700, previewColors: ['#000000', '#ffffff'] },
  { name: 'Green Yellow', paletteType: 'analogous', seedOffset: 800, previewColors: ['#06ffa5', '#ffbe0b'] },
  { name: 'Orange Brown', paletteType: 'monochromatic', seedOffset: 900, previewColors: ['#fb5607', '#8b4513', '#654321'] },
  { name: 'Blue Gradient', paletteType: 'monochromatic', seedOffset: 1000, previewColors: ['#3a86ff', '#0b5bff', '#001f7f'] },
];

// Seeded random function for stable random values
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Base colors to generate triadic palettes from
const BASE_COLORS = [
  "#0b5bff", // Blue
  "#ff006e", // Pink
  "#06ffa5", // Green
  "#ffbe0b", // Yellow
  "#8338ec", // Purple
  "#fb5607", // Orange
  "#3a86ff", // Bright blue
  "#06d6a0", // Teal
];

function RandomShapes({ colorSeed, shapeSeed, paletteType }: { colorSeed: number; shapeSeed: number; paletteType: PaletteType }) {
  const { shapes, selectedPalette } = useMemo(
    () => {
      // Select a base color based on colorSeed (separate from shape positions)
      const paletteSeed = seededRandom(colorSeed * 0.1);
      const baseColor = BASE_COLORS[Math.floor(paletteSeed * BASE_COLORS.length)];
      
      // Generate palette from the base color based on selected type
      const selectedPalette = generatePalette(baseColor, paletteType);
      
      const shapes = Array.from({ length: 5 }, (_, i) => {
        const seed = (i * 123.456) + shapeSeed;
        const r1 = seededRandom(seed);
        const r2 = seededRandom(seed + 1);
        const r3 = seededRandom(seed + 2);
        const r4 = seededRandom(seed + 3);
        const r5 = seededRandom(seed + 4);
        const r6 = seededRandom(seed + 5);
        
        return {
          key: i,
          // spread across the frame
          position: [
            (r1 - 0.5) * 6, // x
            (r2 - 0.5) * 3.5, // y
            -0.2 - i * 0.01, // z, all behind glass
          ] as [number, number, number],
          // big soft blobs - larger scale for fewer shapes
          scale: [
            3.0 + r3 * 4.0,
            3.0 + r4 * 4.0,
            1,
          ] as [number, number, number],
          rotation: r5 * Math.PI,
          color: selectedPalette[Math.floor(r6 * selectedPalette.length)],
        };
      });
      
      return { shapes, selectedPalette };
    },
    [colorSeed, shapeSeed, paletteType]
  );

  return (
    <>
      {/* Full-screen background pane to prevent black areas */}
      <mesh
        position={[0, 0, -0.3]}
        scale={[20, 20, 1]}
        renderOrder={-1}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={selectedPalette[0]} />
      </mesh>
      {shapes.map((s) => (
        <mesh
          key={s.key}
          position={s.position}
          scale={s.scale}
          rotation={[0, 0, s.rotation]}
          renderOrder={0}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color={s.color} />
        </mesh>
      ))}
    </>
  );
}

function GlassPane() {
  return (
    <mesh position={[0, 0, 0]} scale={[9, 5, 1]} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
      <MeshTransmissionMaterial
        resolution={128}        
        samples={20}            
        thickness={0.06}        // give it some volume so shapes blend more
        roughness={50}          // max blur → soft gradient look
        transmission={0.9}
        ior={2}
        chromaticAberration={0.04}
        anisotropy={0.1}
        distortion={0.0}
        distortionScale={0.5}
        temporalDistortion={0}
      />
    </mesh>
  );
}

export default function Home() {
  const [colorSeed, setColorSeed] = useState(0);
  const [shapeSeed, setShapeSeed] = useState(0);
  const [paletteType, setPaletteType] = useState<PaletteType>('triadic');

  const handleRefresh = () => {
    // Only change shape positions, keep colors the same
    setShapeSeed(() => Math.random() * 10000);
  };

  const handlePresetClick = (preset: PresetConfig) => {
    setPaletteType(preset.paletteType);
    setColorSeed(preset.seedOffset);
    // Also refresh shapes when changing preset
    setShapeSeed(() => Math.random() * 10000);
  };


  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      margin: 0, 
      padding: 0, 
      position: 'relative',
      backgroundColor: '#1a1a1a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '40px'
    }}>
      {/* Window Container */}
      <div style={{
        width: '80%',
        maxWidth: '1200px',
        aspectRatio: '16/9',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        position: 'relative',
        backgroundColor: '#000',
        border: '1px solid rgba(255, 255, 255, 1)',
      }}>
        <Canvas 
          style={{ width: '100%', height: '100%' }}
          camera={{ position: [0, 0, 5], fov: 45 }}
          orthographic={false}
        >
          <RandomShapes colorSeed={colorSeed} shapeSeed={shapeSeed} paletteType={paletteType} />
          <GlassPane />
        </Canvas>
      </div>

      {/* Toolbars Container - Side by Side */}
      <div style={{
        width: '90%',
        maxWidth: '1400px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
      }}>
        {/* Toolbar 1: Color Presets */}
        <div style={{
          flex: '1',
          height: '70px',
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          gap: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
        }}>
          {COLOR_PRESETS.map((preset, index) => (
            <button
              key={index}
              onClick={() => handlePresetClick(preset)}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                padding: '2px',
                background: preset.previewColors.length > 1
                  ? `linear-gradient(135deg, ${preset.previewColors.join(', ')})`
                  : preset.previewColors[0],
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
              title={preset.name}
            />
          ))}
        </div>

        {/* Toolbar 2: Palette Type & Refresh */}
        <div style={{
          flex: '0 0 auto',
          height: '70px',
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          gap: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
        }}>
          <select
            value={paletteType}
            onChange={(e) => setPaletteType(e.target.value as PaletteType)}
            style={{
              padding: '10px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              color: '#fff',
              transition: 'all 0.2s',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <option value="complementary">Complementary (2)</option>
            <option value="split">Split (3)</option>
            <option value="monochromatic">Monochromatic (3)</option>
            <option value="analogous">Analogous (3)</option>
            <option value="triadic">Triadic (3)</option>
            <option value="square">Square (4)</option>
          </select>
          <button
            onClick={handleRefresh}
            style={{
              padding: '10px 20px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              color: '#fff',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span>↻</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
