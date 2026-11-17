import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';

/**
 * ============================================================================
 * LIGHT COVE - WebGL Animated Perspective Light Lanes Background
 * ============================================================================
 * Hundreds of thin light lanes pour straight down a dark back wall, bend through
 * a smooth rounded cove fillet, and surge out across a glossy reflective floor
 * toward the viewer in dynamic perspective. Densely concentrated down the center
 * corridor with pure black lateral flanks.
 */

export interface LightCoveProps {
  /** Array of hex colors for lane palette (defaults to cyan, blue, amber gold, and white) */
  colors?: string[];
  /** Lane density multiplier (0.5 to 2.0, default: 1.0; scales between ~250 and 650 lanes) */
  density?: number;
  /** Global speed multiplier for traveling pulses (0.2 to 3.0, default: 1.0) */
  speed?: number;
  /** Overall brightness / glow intensity (0.1 to 2.5, default: 1.0) */
  intensity?: number;
  /** Radius of the quarter-circle cove fillet joining wall to floor (default: 1.35) */
  coveRadius?: number;
  /** Whether animation loop is paused (default: false) */
  paused?: boolean;
  /** Additional CSS class names for the wrapper container */
  className?: string;
  /** Optional inline styles for the wrapper container */
  style?: React.CSSProperties;
  /** Optional children to render on top of the background */
  children?: React.ReactNode;
}

export interface LightCoveRef {
  pause: () => void;
  resume: () => void;
  destroy: () => void;
  renderAt: (t: number) => void;
}

/** Seeded PRNG (Mulberry32) for deterministic, reproducible randomness */
function createMulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convert hex color string to normalized RGB [0..1] */
function hexToRgb(hex: string): [number, number, number] {
  let c = hex.trim().replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return [0.0, 0.85, 1.0];
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ];
}

/** Default cinematic palette matching the reference Light Cove design */
const DEFAULT_PALETTE_HEX = [
  '#0d84ff', // Electric blue
  '#00d4ff', // Vivid neon cyan
  '#48cae4', // Ice cyan
  '#0038e6', // Deep cobalt blue
  '#f59e0b', // Warm amber gold
  '#fbbf24', // Radiant sunlight gold
  '#ea580c', // Sunset copper
  '#f8fafc', // Pure brilliant white highlight
];

// Matrix helper functions
function mat4Perspective(
  out: Float32Array,
  fovyRad: number,
  aspect: number,
  near: number,
  far: number
) {
  const f = 1.0 / Math.tan(fovyRad / 2);
  const nf = 1 / (near - far);
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
  return out;
}

function mat4LookAt(
  out: Float32Array,
  eye: [number, number, number],
  center: [number, number, number],
  up: [number, number, number]
) {
  let z0 = eye[0] - center[0];
  let z1 = eye[1] - center[1];
  let z2 = eye[2] - center[2];
  let len = 1 / Math.hypot(z0, z1, z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;

  let x0 = up[1] * z2 - up[2] * z1;
  let x1 = up[2] * z0 - up[0] * z2;
  let x2 = up[0] * z1 - up[1] * z0;
  len = Math.hypot(x0, x1, x2);
  if (!len) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  let y0 = z1 * x2 - z2 * x1;
  let y1 = z2 * x0 - z0 * x2;
  let y2 = z0 * x1 - z1 * x0;

  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eye[0] + x1 * eye[1] + x2 * eye[2]);
  out[13] = -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]);
  out[14] = -(z0 * eye[0] + z1 * eye[1] + z2 * eye[2]);
  out[15] = 1;
  return out;
}

function mat4Multiply(out: Float32Array, a: Float32Array, b: Float32Array) {
  for (let i = 0; i < 4; i++) {
    const b0 = b[i * 4];
    const b1 = b[i * 4 + 1];
    const b2 = b[i * 4 + 2];
    const b3 = b[i * 4 + 3];
    out[i * 4] = b0 * a[0] + b1 * a[4] + b2 * a[8] + b3 * a[12];
    out[i * 4 + 1] = b0 * a[1] + b1 * a[5] + b2 * a[9] + b3 * a[13];
    out[i * 4 + 2] = b0 * a[2] + b1 * a[6] + b2 * a[10] + b3 * a[14];
    out[i * 4 + 3] = b0 * a[3] + b1 * a[7] + b2 * a[11] + b3 * a[15];
  }
  return out;
}

// ----------------------------------------------------------------------------
// GLSL Shaders
// ----------------------------------------------------------------------------

const LANE_VS = `
precision highp float;

// Base ribbon vertex attributes
attribute float a_s;          // 1D path parameter along curve [0 .. S_total]
attribute float a_side;       // -1.0 (left edge) to +1.0 (right edge)

// Per-instance lane attributes
attribute float a_laneX;      // X offset in world space
attribute float a_laneWidth;  // Lane thickness
attribute vec3  a_color;      // Base RGB
attribute float a_speed;      // Pulse speed
attribute float a_phase;      // Pulse initial phase
attribute float a_pulseLen;   // Pulse wavelength along path
attribute float a_brightness; // Base glow

uniform mat4 u_viewProj;
uniform float u_coveRadius;
uniform float u_wallLength;
uniform float u_isReflection; // 1.0 if rendering floor mirror reflection

varying vec3  v_color;
varying float v_side;
varying float v_s;
varying float v_speed;
varying float v_phase;
varying float v_pulseLen;
varying float v_brightness;
varying float v_isReflection;
varying vec3  v_worldPos;

void main() {
  float R = u_coveRadius;
  float Lw = u_wallLength;
  float sCove = 1.5707963 * R; // (pi/2) * R

  vec3 pos = vec3(0.0);

  // Evaluate 1D profile geometry
  if (a_s < Lw) {
    // 1. Vertical wall segment
    pos.y = (Lw + R) - a_s;
    pos.z = 0.0;
  } else if (a_s < Lw + sCove) {
    // 2. Quarter-circle cove fillet
    float deltaS = a_s - Lw;
    float phi = deltaS / R; // angle [0 .. pi/2]
    pos.y = R - R * sin(phi);
    pos.z = R - R * cos(phi);
  } else {
    // 3. Horizontal floor segment running toward camera
    float deltaS = a_s - (Lw + sCove);
    pos.y = 0.0;
    pos.z = R + deltaS;
  }

  // Extrude ribbon across lane X and thickness
  pos.x = a_laneX + a_side * (a_laneWidth * 0.5);

  // If rendering floor reflection, invert Y across ground plane (Y = 0)
  if (u_isReflection > 0.5) {
    pos.y = -pos.y;
  }

  v_worldPos = pos;
  v_color = a_color;
  v_side = a_side;
  v_s = a_s;
  v_speed = a_speed;
  v_phase = a_phase;
  v_pulseLen = a_pulseLen;
  v_brightness = a_brightness;
  v_isReflection = u_isReflection;

  gl_Position = u_viewProj * vec4(pos, 1.0);
}
`;

const LANE_FS = `
precision highp float;

uniform float u_time;
uniform float u_speedMult;
uniform float u_intensity;
uniform float u_halfWidth;
uniform float u_wallTop;

varying vec3  v_color;
varying float v_side;
varying float v_s;
varying float v_speed;
varying float v_phase;
varying float v_pulseLen;
varying float v_brightness;
varying float v_isReflection;
varying vec3  v_worldPos;

void main() {
  // Pure function traveling pulse along path parameter s and time t
  float pulseU = fract((v_s / v_pulseLen) - v_speed * u_time * u_speedMult + v_phase);
  // Organic pulse bell curve with bright leading edge
  float pulse = exp(-32.0 * (pulseU - 0.3) * (pulseU - 0.3)) * 2.4;

  // Crisp hairline core + luminous bloom falloff profile
  float core = exp(-v_side * v_side * 48.0) * 1.5;
  float halo = exp(-v_side * v_side * 6.0) * 0.6;
  float wide = exp(-v_side * v_side * 1.2) * 0.18;
  float profile = core + halo + wide;

  // Base ambient glow + pulse activity
  float activity = (v_brightness * 0.35 + pulse * 1.2) * profile;

  // Lateral center concentration: fade smoothly to deep black at left/right edges
  float latNorm = abs(v_worldPos.x) / u_halfWidth;
  float lateralFade = smoothstep(1.0, 0.2, latNorm);
  lateralFade = pow(lateralFade, 1.5);

  // Top of back wall fades softly into pure black
  float topFade = smoothstep(u_wallTop, u_wallTop - 2.0, abs(v_worldPos.y));

  // Floor front fade: smoothly dissolve before reaching camera near plane
  float frontFade = 1.0;
  if (v_worldPos.z > 4.5) {
    frontFade = smoothstep(8.4, 4.5, v_worldPos.z);
  }

  // Floor reflection attenuation (glossy mirror with depth fade)
  float reflFade = 1.0;
  if (v_isReflection > 0.5) {
    reflFade = 0.28 * smoothstep(9.0, 0.5, v_worldPos.z) * smoothstep(-4.5, -0.05, v_worldPos.y);
  }

  // Combined alpha
  float alpha = activity * lateralFade * topFade * frontFade * reflFade * u_intensity;

  // Maintain rich saturation with a glistening white core highlight
  vec3 coreColor = mix(v_color, vec3(1.0, 1.0, 1.0), core * 0.4);
  vec3 rgb = coreColor * alpha;

  gl_FragColor = vec4(rgb, alpha);
}
`;

export const LightCove = forwardRef<LightCoveRef, LightCoveProps>(
  (
    {
      colors = DEFAULT_PALETTE_HEX,
      density = 1.0,
      speed = 1.0,
      intensity = 1.0,
      coveRadius = 1.35,
      paused = false,
      className = '',
      style,
      children,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Animation & Context state
    const isRunningRef = useRef(false);
    const animIdRef = useRef<number | null>(null);
    const clockOffsetRef = useRef(0);
    const lastTimeRef = useRef<number | null>(null);
    const isPausedRef = useRef(paused);
    isPausedRef.current = paused;

    // WebGL Resources Ref for leak-free lifecycle
    const glResourcesRef = useRef<{
      gl: WebGLRenderingContext | WebGL2RenderingContext | null;
      extInstanced: any;
      isWebGL2: boolean;
      vao: any;
      program: WebGLProgram | null;
      baseVbo: WebGLBuffer | null;
      instanceVbo: WebGLBuffer | null;
      vertCount: number;
      laneCount: number;
      width: number;
      height: number;
      dpr: number;
      locations: {
        uViewProj: WebGLUniformLocation | null;
        uCoveRadius: WebGLUniformLocation | null;
        uWallLength: WebGLUniformLocation | null;
        uTime: WebGLUniformLocation | null;
        uSpeedMult: WebGLUniformLocation | null;
        uIntensity: WebGLUniformLocation | null;
        uHalfWidth: WebGLUniformLocation | null;
        uWallTop: WebGLUniformLocation | null;
        uIsReflection: WebGLUniformLocation | null;
      } | null;
    } | null>(null);

    // Initialize Shaders, Buffers, and Instanced VAO
    const initGL = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return false;

      // Try WebGL2 first, then fall back to WebGL1 with instancing
      let gl: WebGLRenderingContext | WebGL2RenderingContext | null =
        canvas.getContext('webgl2', {
          alpha: false,
          antialias: true,
          depth: false,
          stencil: false,
          powerPreference: 'high-performance',
        });

      let isWebGL2 = true;
      let extInstanced: any = null;

      if (!gl) {
        isWebGL2 = false;
        gl = (canvas.getContext('webgl', {
          alpha: false,
          antialias: true,
          depth: false,
          stencil: false,
          powerPreference: 'high-performance',
        }) ||
          canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

        if (gl) {
          extInstanced = gl.getExtension('ANGLE_instanced_arrays');
          if (!extInstanced) {
            console.warn('LightCove: ANGLE_instanced_arrays not supported.');
            return false;
          }
        }
      }

      if (!gl) return false;

      function createShader(type: number, src: string) {
        if (!gl) return null;
        const s = gl.createShader(type);
        if (!s) return null;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.error(gl.getShaderInfoLog(s));
          gl.deleteShader(s);
          return null;
        }
        return s;
      }

      function createProgram(vsSrc: string, fsSrc: string) {
        if (!gl) return null;
        const vs = createShader(gl.VERTEX_SHADER, vsSrc);
        const fs = createShader(gl.FRAGMENT_SHADER, fsSrc);
        if (!vs || !fs) return null;
        const p = gl.createProgram();
        if (!p) return null;
        gl.attachShader(p, vs);
        gl.attachShader(p, fs);
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
          console.error(gl.getProgramInfoLog(p));
          gl.deleteProgram(p);
          return null;
        }
        return p;
      }

      const program = createProgram(LANE_VS, LANE_FS);
      if (!program) return false;

      // 1. Build Base Ribbon Geometry along 1D profile
      const Lw = 4.4; // Wall length
      const R = coveRadius;
      const sCove = (Math.PI / 2) * R;
      const sFloor = 7.5; // Floor length toward camera
      const S_TOTAL = Lw + sCove + sFloor;

      const M = 72; // High-fidelity segment divisions along curve
      const ribbonVertices: number[] = [];

      for (let i = 0; i <= M; i++) {
        const s = (i / M) * S_TOTAL;
        // Left vertex: side = -1.0
        ribbonVertices.push(s, -1.0);
        // Right vertex: side = +1.0
        ribbonVertices.push(s, 1.0);
      }

      const baseVbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, baseVbo);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(ribbonVertices),
        gl.STATIC_DRAW
      );

      // 2. Build Instance Data (Lane X, width, color, pulse attributes)
      const baseCount = Math.round(440 * Math.max(0.4, Math.min(2.0, density)));
      const laneCount = Math.max(200, Math.min(700, baseCount));

      const instanceData: number[] = [];
      const rng = createMulberry32(481902);
      const colorList = colors.length > 0 ? colors : DEFAULT_PALETTE_HEX;
      const parsedColors = colorList.map(hexToRgb);

      const halfWidth = 4.0; // Concentrated central corridor so side edges are completely dark

      for (let i = 0; i < laneCount; i++) {
        // Stratified central distribution with power curve shaping
        const u = (i + 0.5) / laneCount;
        const signedU = (u - 0.5) * 2.0;
        const sign = signedU >= 0 ? 1 : -1;
        const x =
          sign * Math.pow(Math.abs(signedU), 1.35) * halfWidth +
          (rng() - 0.5) * 0.04;

        // Fine hairline lane width
        const width = 0.012 + rng() * 0.016;

        // Interleaved color pick
        const cIdx = Math.floor(rng() * parsedColors.length);
        const col = parsedColors[cIdx];

        // Pulse speed: 0.75 to 2.4
        const pulseSpeed = 0.75 + rng() * 1.65;
        // Pulse phase [0 .. 1]
        const phase = rng();
        // Pulse wavelength along path (2.8 to 6.2 units)
        const pulseLen = 2.8 + rng() * 3.4;
        // Base glow so lane is always faintly visible
        const baseBrightness = 0.07 + rng() * 0.13;

        instanceData.push(
          x,
          width,
          col[0],
          col[1],
          col[2],
          pulseSpeed,
          phase,
          pulseLen,
          baseBrightness
        );
      }

      const instanceVbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, instanceVbo);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(instanceData),
        gl.STATIC_DRAW
      );

      // 3. Setup Vertex Array Object (VAO) to encapsulate all attribute pointers & divisors
      let vao: any = null;
      if (isWebGL2) {
        vao = (gl as WebGL2RenderingContext).createVertexArray();
        (gl as WebGL2RenderingContext).bindVertexArray(vao);
      }

      const aS = gl.getAttribLocation(program, 'a_s');
      const aSide = gl.getAttribLocation(program, 'a_side');
      gl.bindBuffer(gl.ARRAY_BUFFER, baseVbo);
      gl.enableVertexAttribArray(aS);
      gl.vertexAttribPointer(aS, 1, gl.FLOAT, false, 8, 0);
      gl.enableVertexAttribArray(aSide);
      gl.vertexAttribPointer(aSide, 1, gl.FLOAT, false, 8, 4);

      const aLaneX = gl.getAttribLocation(program, 'a_laneX');
      const aLaneWidth = gl.getAttribLocation(program, 'a_laneWidth');
      const aColor = gl.getAttribLocation(program, 'a_color');
      const aSpeed = gl.getAttribLocation(program, 'a_speed');
      const aPhase = gl.getAttribLocation(program, 'a_phase');
      const aPulseLen = gl.getAttribLocation(program, 'a_pulseLen');
      const aBrightness = gl.getAttribLocation(program, 'a_brightness');

      gl.bindBuffer(gl.ARRAY_BUFFER, instanceVbo);
      const stride = 9 * 4;

      const setDivisor = (loc: number, divisor: number) => {
        if (isWebGL2) {
          (gl as WebGL2RenderingContext).vertexAttribDivisor(loc, divisor);
        } else if (extInstanced) {
          extInstanced.vertexAttribDivisorANGLE(loc, divisor);
        }
      };

      const locs = [aLaneX, aLaneWidth, aColor, aSpeed, aPhase, aPulseLen, aBrightness];
      const offsets = [0, 4, 8, 20, 24, 28, 32];
      const sizes = [1, 1, 3, 1, 1, 1, 1];

      for (let i = 0; i < locs.length; i++) {
        const loc = locs[i];
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, sizes[i], gl.FLOAT, false, stride, offsets[i]);
        setDivisor(loc, 1);
      }

      if (isWebGL2) {
        (gl as WebGL2RenderingContext).bindVertexArray(null);
      }

      const locations = {
        uViewProj: gl.getUniformLocation(program, 'u_viewProj'),
        uCoveRadius: gl.getUniformLocation(program, 'u_coveRadius'),
        uWallLength: gl.getUniformLocation(program, 'u_wallLength'),
        uTime: gl.getUniformLocation(program, 'u_time'),
        uSpeedMult: gl.getUniformLocation(program, 'u_speedMult'),
        uIntensity: gl.getUniformLocation(program, 'u_intensity'),
        uHalfWidth: gl.getUniformLocation(program, 'u_halfWidth'),
        uWallTop: gl.getUniformLocation(program, 'u_wallTop'),
        uIsReflection: gl.getUniformLocation(program, 'u_isReflection'),
      };

      glResourcesRef.current = {
        gl,
        extInstanced,
        isWebGL2,
        vao,
        program,
        baseVbo,
        instanceVbo,
        vertCount: (M + 1) * 2,
        laneCount,
        width: 0,
        height: 0,
        dpr: 1,
        locations,
      };

      return true;
    }, [colors, density, coveRadius]);

    // Resize Handling
    const updateSize = useCallback(() => {
      const res = glResourcesRef.current;
      const canvas = canvasRef.current;
      if (!res || !canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
      const w = Math.round(Math.max(rect.width, 100) * dpr);
      const h = Math.round(Math.max(rect.height, 100) * dpr);

      if (canvas.width === w && canvas.height === h) return;

      canvas.width = w;
      canvas.height = h;
      res.width = w;
      res.height = h;
      res.dpr = dpr;
    }, []);

    // Stateless Render at Timestamp t
    const renderPureState = useCallback(
      (timeSec: number) => {
        const res = glResourcesRef.current;
        if (!res || !res.gl || !res.program || !res.locations) return;
        const gl = res.gl;
        const { isWebGL2, extInstanced, vao, program, locations } = res;

        const w = res.width;
        const h = res.height;
        if (w <= 0 || h <= 0) return;

        // Perspective Camera Setup
        const aspect = w / h;
        const fovy = (45 * Math.PI) / 180;
        // Slow subtle sinusoidal sway
        const camX = Math.sin(timeSec * 0.2) * 0.08;
        const camY = 2.05 + Math.cos(timeSec * 0.16) * 0.04;
        const camZ = 7.8;

        const proj = new Float32Array(16);
        mat4Perspective(proj, fovy, aspect, 0.1, 50.0);

        const view = new Float32Array(16);
        mat4LookAt(view, [camX, camY, camZ], [0, 0.55, 0.8], [0, 1, 0]);

        const viewProj = new Float32Array(16);
        mat4Multiply(viewProj, proj, view);

        gl.viewport(0, 0, w, h);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enable(gl.BLEND);
        // Additive blending for rich optical glow
        gl.blendFunc(gl.ONE, gl.ONE);

        gl.useProgram(program);

        const Lw = 4.4;
        const R = coveRadius;
        const halfWidth = 4.0;

        gl.uniformMatrix4fv(locations.uViewProj, false, viewProj);
        gl.uniform1f(locations.uCoveRadius, R);
        gl.uniform1f(locations.uWallLength, Lw);
        gl.uniform1f(locations.uTime, timeSec);
        gl.uniform1f(locations.uSpeedMult, speed);
        gl.uniform1f(locations.uIntensity, intensity);
        gl.uniform1f(locations.uHalfWidth, halfWidth);
        gl.uniform1f(locations.uWallTop, Lw + R);

        if (isWebGL2 && vao) {
          (gl as WebGL2RenderingContext).bindVertexArray(vao);
        }

        const drawInstanced = (
          mode: number,
          first: number,
          count: number,
          primcount: number
        ) => {
          if (isWebGL2) {
            (gl as WebGL2RenderingContext).drawArraysInstanced(
              mode,
              first,
              count,
              primcount
            );
          } else if (extInstanced) {
            extInstanced.drawArraysInstancedANGLE(mode, first, count, primcount);
          }
        };

        // 1. Draw floor mirror reflection
        gl.uniform1f(locations.uIsReflection, 1.0);
        drawInstanced(gl.TRIANGLE_STRIP, 0, res.vertCount, res.laneCount);

        // 2. Draw direct forward lanes
        gl.uniform1f(locations.uIsReflection, 0.0);
        drawInstanced(gl.TRIANGLE_STRIP, 0, res.vertCount, res.laneCount);

        if (isWebGL2 && vao) {
          (gl as WebGL2RenderingContext).bindVertexArray(null);
        }
      },
      [speed, intensity, coveRadius]
    );

    // Master Animation Loop
    const startLoop = useCallback(() => {
      if (animIdRef.current !== null) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
      }

      isRunningRef.current = true;
      lastTimeRef.current = performance.now();

      const loop = (now: number) => {
        if (!isRunningRef.current) return;

        if (isPausedRef.current) {
          animIdRef.current = requestAnimationFrame(loop);
          return;
        }

        if (lastTimeRef.current === null) lastTimeRef.current = now;
        const delta = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        const safeDelta = Math.min(delta, 0.1);
        clockOffsetRef.current += safeDelta;

        renderPureState(clockOffsetRef.current);
        animIdRef.current = requestAnimationFrame(loop);
      };

      animIdRef.current = requestAnimationFrame(loop);
    }, [renderPureState]);

    const stopLoop = useCallback(() => {
      isRunningRef.current = false;
      if (animIdRef.current !== null) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
      }
    }, []);

    // Imperative Ref API
    useImperativeHandle(
      ref,
      () => ({
        pause: () => {
          isPausedRef.current = true;
        },
        resume: () => {
          isPausedRef.current = false;
          lastTimeRef.current = performance.now();
        },
        destroy: () => {
          stopLoop();
        },
        renderAt: (t: number) => {
          clockOffsetRef.current = t;
          renderPureState(t);
        },
      }),
      [stopLoop, renderPureState]
    );

    // Lifecycle
    useEffect(() => {
      const ok = initGL();
      if (!ok) return;

      updateSize();

      // Check prefers-reduced-motion: if enabled, render one static frame
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mql && mql.matches) {
        renderPureState(1.5);
        return;
      }

      const container = containerRef.current;
      const canvas = canvasRef.current;

      // Handle ResizeObserver
      let resizeObserver: ResizeObserver | null = null;
      if (container && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          updateSize();
          if (isPausedRef.current) {
            renderPureState(clockOffsetRef.current);
          }
        });
        resizeObserver.observe(container);
      }

      // Handle IntersectionObserver (pause when scrolled off screen)
      let intersectionObserver: IntersectionObserver | null = null;
      if (container && typeof IntersectionObserver !== 'undefined') {
        intersectionObserver = new IntersectionObserver((entries) => {
          const entry = entries[0];
          if (!entry) return;
          if (entry.isIntersecting) {
            lastTimeRef.current = performance.now();
            if (!isRunningRef.current && !isPausedRef.current) {
              startLoop();
            }
          } else {
            stopLoop();
          }
        });
        intersectionObserver.observe(container);
      }

      // Handle Tab Visibility (clean pause/resume without time jump)
      const handleVisibilityChange = () => {
        if (document.hidden) {
          stopLoop();
        } else {
          lastTimeRef.current = performance.now();
          if (!isPausedRef.current) {
            startLoop();
          }
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Handle WebGL Context Loss / Restore
      const handleContextLost = (e: Event) => {
        e.preventDefault();
        stopLoop();
      };
      const handleContextRestored = () => {
        initGL();
        updateSize();
        if (!isPausedRef.current) {
          startLoop();
        }
      };

      if (canvas) {
        canvas.addEventListener('webglcontextlost', handleContextLost, false);
        canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
      }

      // Start autonomous loop
      if (!paused) {
        startLoop();
      }

      // Cleanup
      return () => {
        stopLoop();
        if (resizeObserver) resizeObserver.disconnect();
        if (intersectionObserver) intersectionObserver.disconnect();
        document.removeEventListener('visibilitychange', handleVisibilityChange);

        if (canvas) {
          canvas.removeEventListener('webglcontextlost', handleContextLost);
          canvas.removeEventListener('webglcontextrestored', handleContextRestored);
        }

        const res = glResourcesRef.current;
        if (res && res.gl) {
          const gl = res.gl;
          if (res.baseVbo) gl.deleteBuffer(res.baseVbo);
          if (res.instanceVbo) gl.deleteBuffer(res.instanceVbo);
          if (res.isWebGL2 && res.vao) {
            (gl as WebGL2RenderingContext).deleteVertexArray(res.vao);
          }
          if (res.program) gl.deleteProgram(res.program);
        }
        glResourcesRef.current = null;
      };
    }, [initGL, updateSize, startLoop, stopLoop, paused, renderPureState]);

    return (
      <div
        ref={containerRef}
        className={`relative w-full h-full overflow-hidden bg-black select-none pointer-events-none ${className}`}
        style={style}
      >
        {/* WebGL Canvas */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none block z-0"
        />

        {/* Lateral Edge Darkening Masks (ensures left and right flanks are deep pure black) */}
        <div
          className="absolute inset-y-0 left-0 w-1/4 pointer-events-none z-[1]"
          style={{
            background:
              'linear-gradient(to right, #000000 0%, #000000 45%, rgba(0, 0, 0, 0.75) 75%, transparent 100%)',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-y-0 right-0 w-1/4 pointer-events-none z-[1]"
          style={{
            background:
              'linear-gradient(to left, #000000 0%, #000000 45%, rgba(0, 0, 0, 0.75) 75%, transparent 100%)',
          }}
          aria-hidden="true"
        />

        {/* Top edge gradient fading wall into darkness */}
        <div
          className="absolute inset-x-0 top-0 h-28 pointer-events-none z-[1]"
          style={{
            background:
              'linear-gradient(to bottom, #000000 0%, rgba(0, 0, 0, 0.8) 50%, transparent 100%)',
          }}
          aria-hidden="true"
        />

        {/* Content sitting cleanly on top */}
        {children && <div className="relative z-10 w-full h-full">{children}</div>}
      </div>
    );
  }
);

LightCove.displayName = 'LightCove';

export default LightCove;
