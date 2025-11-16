'use client';

import { Canvas } from '@react-three/fiber';
import { useMemo, useState, useEffect } from 'react';
import { MeshTransmissionMaterial } from '@react-three/drei';
import { generatePalette, type PaletteType, getContrastColor } from '../colorUtils';
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
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // Generate palette for display
  const palette = useMemo(() => {
    return generatePalette(baseColor, paletteType);
  }, [baseColor, paletteType]);

  const handleRefresh = () => {
    // Only change shape positions, keep colors the same
    setShapeSeed(() => Math.random() * 10000);
  };

  // Auto-dismiss notification after 2 seconds
  useEffect(() => {
    if (copiedColor) {
      const timer = setTimeout(() => {
        setCopiedColor(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedColor]);


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
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            {palette.map((color, index) => {
              const contrastColor = getContrastColor(color);
              const textColor = contrastColor === 'black' ? '#000' : '#fff';
              const isFirst = index === 0;
              const isLast = index === palette.length - 1;
              
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    borderRadius: isFirst 
                      ? '8px 0 0 8px' 
                      : isLast 
                        ? '0 8px 8px 0' 
                        : '0',
                    backgroundColor: color,
                    borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                    borderLeft: isFirst ? '1px solid rgba(0, 0, 0, 0.1)' : 'none',
                    borderRight: isLast ? '1px solid rgba(0, 0, 0, 0.1)' : 'none',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    flex: '1',
                    minWidth: '0',
                    minHeight: '80px',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => {
                    setBaseColor(color);
                  }}
                  title={`Click to set as base color: ${color.toUpperCase()}`}
                >
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await navigator.clipboard.writeText(color.toUpperCase());
                        setCopiedColor(color);
                      } catch (err) {
                        console.error('Failed to copy:', err);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${textColor}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      fontWeight: '500',
                      letterSpacing: '0.5px',
                      color: textColor,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = contrastColor === 'black' 
                        ? 'rgba(0, 0, 0, 0.1)' 
                        : 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span>{color.toUpperCase()}</span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="14" 
                      height="14" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z" />
                      <path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Copy Notification Toast */}
      {copiedColor && (
        <div
          style={{
            position: 'fixed',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: 1000,
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ color: '#4ade80' }}
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span>Copied <strong>{copiedColor.toUpperCase()}</strong> to clipboard</span>
        </div>
      )}
    </div>
  );
}
