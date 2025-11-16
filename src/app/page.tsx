'use client';

import { Canvas } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import { MeshTransmissionMaterial } from '@react-three/drei';
import { generatePalette, type PaletteType } from '../colorUtils';
import ColorWheel from '../components/ColorWheel';

// Seeded random function for stable random values
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function RandomShapes({ baseColor, shapeSeed, paletteType }: { baseColor: string; shapeSeed: number; paletteType: PaletteType }) {
  const { shapes, selectedPalette } = useMemo(
    () => {
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
    [baseColor, shapeSeed, paletteType]
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
  const [baseColor, setBaseColor] = useState('#0b5bff');
  const [shapeSeed, setShapeSeed] = useState(0);
  const [paletteType, setPaletteType] = useState<PaletteType>('triadic');

  // Generate palette for display
  const palette = useMemo(() => {
    return generatePalette(baseColor, paletteType);
  }, [baseColor, paletteType]);

  const handleRefresh = () => {
    // Only change shape positions, keep colors the same
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
          <RandomShapes baseColor={baseColor} shapeSeed={shapeSeed} paletteType={paletteType} />
          <GlassPane />
        </Canvas>
      </div>

      {/* Two Column Layout */}
      <div style={{
        width: '90%',
        maxWidth: '1400px',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-start',
      }}>
        {/* Column 1: Color Picker */}
        <div style={{
          flex: '0 0 auto',
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
        }}>
          <ColorWheel value={baseColor} onChange={setBaseColor} />
        </div>

        {/* Column 2: Controls and Palette */}
        <div style={{
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {/* Row 1: Palette Type & Refresh */}
          <div style={{
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 20px',
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
              <span>Refresh Pattern</span>
            </button>
          </div>

          {/* Row 2: Palette Colors */}
          <div style={{
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 12px',
            gap: '6px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            {palette.map((color, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  flex: '1',
                  minWidth: '0',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => {
                  setBaseColor(color);
                }}
                title={`Click to set as base color: ${color.toUpperCase()}`}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '6px',
                    backgroundColor: color,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.2s',
                  }}
                />
                <span
                  style={{
                    color: '#fff',
                    fontSize: '9px',
                    fontFamily: 'monospace',
                    fontWeight: '500',
                    letterSpacing: '0.2px',
                    opacity: 0.85,
                    textAlign: 'center',
                  }}
                >
                  {color.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
