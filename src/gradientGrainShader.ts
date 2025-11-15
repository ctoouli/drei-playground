export const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  varying vec2 vUv;

  uniform float uNoiseIntensity;
  uniform float uNoiseScale;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uHighlight;

  // simple hash-based noise
  float random(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  void main() {
    vec2 uv = vUv;

    // --- base blue gradient (vertical-ish) ---
    vec3 col = mix(uColor1, uColor2, uv.y);

    // --- soft highlight on the left ---
    float r = distance(uv, vec2(0.12, 0.45));   // center of the bright spot
    float highlightMask = smoothstep(0.7, 0.05, r);
    col = mix(col, uHighlight, highlightMask * 0.9);

    // --- subtle vignette at the corners ---
    float d = distance(uv, vec2(0.5, 0.5));
    float vignette = smoothstep(0.9, 0.45, d);
    col *= mix(0.9, 1.05, vignette); // darken edges very slightly

    // --- grain / high ISO noise (static) ---
    float n = random(uv * uNoiseScale);
    float grain = (n - 0.5) * 2.0 * uNoiseIntensity; // centered around 0
    col += vec3(grain);

    col = clamp(col, 0.0, 1.0);
    gl_FragColor = vec4(col, 1.0);
  }
`;

