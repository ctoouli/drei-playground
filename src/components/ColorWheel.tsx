'use client';

import { useRef, useEffect, useState, useCallback, startTransition } from 'react';
import { hexToHSL, HSLToHex } from '../colorUtils';

interface ColorWheelProps {
  value: string; // hex color
  onChange: (color: string) => void;
}

// Constants moved outside component to avoid dependency issues
const WHEEL_SIZE = 200;
const WHEEL_CENTER = WHEEL_SIZE / 2;
const WHEEL_RADIUS = WHEEL_SIZE / 2 - 10;
const INNER_RADIUS = WHEEL_RADIUS * 0.6; // Inner circle for saturation/lightness
const SLIDER_WIDTH = 200;
const SLIDER_HEIGHT = 20;

export default function ColorWheel({ value, onChange }: ColorWheelProps) {
  const wheelCanvasRef = useRef<HTMLCanvasElement>(null);
  const sliderCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingWheel, setIsDraggingWheel] = useState(false);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [hsl, setHsl] = useState(() => hexToHSL(value));
  const hslRef = useRef(hsl);
  const prevValueRef = useRef(value);

  // Update HSL when value prop changes externally
  useEffect(() => {
    // Only update if the value actually changed to avoid cascading renders
    if (prevValueRef.current !== value) {
      const newHsl = hexToHSL(value);
      // Use startTransition to make state update non-blocking
      startTransition(() => {
        setHsl(newHsl);
      });
      hslRef.current = newHsl;
      prevValueRef.current = value;
    }
  }, [value]);

  // Keep ref in sync with state
  useEffect(() => {
    hslRef.current = hsl;
  }, [hsl]);

  // Convert HSL to RGB (helper function)
  function hslToRgb(h: number, s: number, l: number) {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return { r, g, b };
  }

  // Draw color wheel
  const drawWheel = useCallback(() => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);

    const imageData = ctx.createImageData(WHEEL_SIZE, WHEEL_SIZE);
    const data = imageData.data;

    for (let y = 0; y < WHEEL_SIZE; y++) {
      for (let x = 0; x < WHEEL_SIZE; x++) {
        const dx = x - WHEEL_CENTER;
        const dy = y - WHEEL_CENTER;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        const normalizedAngle = ((angle % 360) + 360) % 360;

        const index = (y * WHEEL_SIZE + x) * 4;

        if (distance <= WHEEL_RADIUS && distance >= INNER_RADIUS) {
          // Outer ring: full saturation colors (hue wheel)
          const hue = normalizedAngle;
          const saturation = 100;
          const lightness = 50;
          const rgb = hslToRgb(hue, saturation, lightness);
          data[index] = rgb.r;
          data[index + 1] = rgb.g;
          data[index + 2] = rgb.b;
          data[index + 3] = 255;
        } else if (distance < INNER_RADIUS) {
          // Inner area: saturation and lightness variation
          const hue = normalizedAngle;
          const maxDist = INNER_RADIUS;
          const saturation = (distance / maxDist) * 100;
          const lightness = hsl.l; // Use current lightness
          const rgb = hslToRgb(hue, saturation, lightness);
          data[index] = rgb.r;
          data[index + 1] = rgb.g;
          data[index + 2] = rgb.b;
          data[index + 3] = 255;
        } else {
          // Outside wheel: transparent
          data[index + 3] = 0;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Draw selection indicator
    const currentHue = hsl.h;
    const currentSat = hsl.s;
    const angle = ((currentHue - 90) * Math.PI) / 180;
    
    let indicatorX: number, indicatorY: number;
    if (currentSat < 60) {
      // In inner area
      const distance = (currentSat / 100) * INNER_RADIUS;
      indicatorX = WHEEL_CENTER + Math.cos(angle) * distance;
      indicatorY = WHEEL_CENTER + Math.sin(angle) * distance;
    } else {
      // On outer ring
      const ringRadius = (WHEEL_RADIUS + INNER_RADIUS) / 2;
      indicatorX = WHEEL_CENTER + Math.cos(angle) * ringRadius;
      indicatorY = WHEEL_CENTER + Math.sin(angle) * ringRadius;
    }

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [hsl.h, hsl.s, hsl.l]);

  // Draw brightness slider
  const drawSlider = useCallback(() => {
    const canvas = sliderCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, SLIDER_WIDTH, 0);
    const { h, s } = hsl;
    
    // Create gradient from black to full color to white
    for (let i = 0; i <= 100; i += 10) {
      const lightness = i;
      const rgb = hslToRgb(h, s, lightness);
      const pos = i / 100;
      gradient.addColorStop(pos, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SLIDER_WIDTH, SLIDER_HEIGHT);

    // Draw slider indicator
    const indicatorX = (hsl.l / 100) * SLIDER_WIDTH;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(indicatorX, 0);
    ctx.lineTo(indicatorX, SLIDER_HEIGHT);
    ctx.stroke();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [hsl]);

  useEffect(() => {
    drawWheel();
    drawSlider();
  }, [drawWheel, drawSlider]);

  // Get color from wheel position
  const getColorFromWheel = useCallback((x: number, y: number) => {
    const rect = wheelCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dx = x - rect.left - WHEEL_CENTER;
    const dy = y - rect.top - WHEEL_CENTER;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    const hue = ((angle % 360) + 360) % 360;

    let saturation: number;
    if (distance <= WHEEL_RADIUS && distance >= INNER_RADIUS) {
      // Outer ring: full saturation
      saturation = 100;
    } else if (distance < INNER_RADIUS) {
      // Inner area: variable saturation
      saturation = (distance / INNER_RADIUS) * 100;
    } else {
      return; // Outside wheel
    }

    const newHsl = { h: hue, s: saturation, l: hslRef.current.l };
    setHsl(newHsl);
    onChange(HSLToHex(newHsl.h, newHsl.s, newHsl.l));
  }, [onChange]);

  // Get lightness from slider position
  const getLightnessFromSlider = useCallback((x: number) => {
    const rect = sliderCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relativeX = x - rect.left;
    const lightness = Math.max(0, Math.min(100, (relativeX / SLIDER_WIDTH) * 100));
    
    const newHsl = { ...hslRef.current, l: lightness };
    setHsl(newHsl);
    onChange(HSLToHex(newHsl.h, newHsl.s, newHsl.l));
  }, [onChange]);

  // Mouse event handlers
  const handleWheelMouseDown = (e: React.MouseEvent) => {
    setIsDraggingWheel(true);
    getColorFromWheel(e.clientX, e.clientY);
  };

  const handleSliderMouseDown = (e: React.MouseEvent) => {
    setIsDraggingSlider(true);
    getLightnessFromSlider(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingWheel) {
        getColorFromWheel(e.clientX, e.clientY);
      } else if (isDraggingSlider) {
        getLightnessFromSlider(e.clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingWheel(false);
      setIsDraggingSlider(false);
    };

    if (isDraggingWheel || isDraggingSlider) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingWheel, isDraggingSlider, getColorFromWheel, getLightnessFromSlider]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '12px',
        padding: '4px',
      }}
    >
      {/* Color Wheel */}
      <div style={{ position: 'relative' }}>
        <canvas
          ref={wheelCanvasRef}
          width={WHEEL_SIZE}
          height={WHEEL_SIZE}
          style={{
            cursor: 'crosshair',
            borderRadius: '50%',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'transform 0.1s ease-out',
          }}
          onMouseDown={handleWheelMouseDown}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        />
      </div>

      {/* Right side: Slider and Color Display */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        {/* Brightness Slider */}
        <div style={{ position: 'relative' }}>
          <canvas
            ref={sliderCanvasRef}
            width={SLIDER_WIDTH}
            height={SLIDER_HEIGHT}
            style={{
              cursor: 'pointer',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'transform 0.1s ease-out',
            }}
            onMouseDown={handleSliderMouseDown}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scaleY(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scaleY(1)';
            }}
          />
        </div>

        {/* Color Display */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: value,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              color: '#fff',
              fontSize: '13px',
              fontFamily: 'monospace',
              fontWeight: '500',
              letterSpacing: '0.5px',
            }}
          >
            {value.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

