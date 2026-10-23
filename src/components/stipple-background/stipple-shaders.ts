import { MAX_STIPPLE_METABALLS } from "./stipple-model";

export const vertexShaderSource = `#version 300 es
layout(location = 0) in vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const fragmentShaderSource = `#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2 uResolution;
uniform float uTime;
uniform float uFlow;
uniform float uGrainPx;
uniform float uScatterPx;
uniform float uMerge;
uniform int uColorBlend;
uniform float uColorBlendWidth;
uniform int uPattern;
uniform int uCount;
uniform int uColorCount;
uniform vec4 uBlobs[${MAX_STIPPLE_METABALLS}];
uniform vec4 uShapes[${MAX_STIPPLE_METABALLS}];
uniform float uEnvelopes[${MAX_STIPPLE_METABALLS}];

uniform vec3 uBackground;
uniform vec3 uColors[${MAX_STIPPLE_METABALLS}];

float hash12(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float smoothMin(float a, float b, float k) {
  if (k <= 0.0) return min(a, b);
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

float metaballSDF(vec2 p, vec4 blob, vec4 shape, float id, float t) {
  vec2 q = p - blob.xy;
  float c = cos(shape.z), s = sin(shape.z);
  q = mat2(c, -s, s, c) * q;
  q /= shape.xy;
  float a = atan(q.y, q.x);

  float wobble =
      0.028 * sin(a * 3.0 + t * 0.45 + id * 1.83)
    + 0.012 * sin(a * 5.0 - t * 0.31 + id * 2.41);

  float r = blob.z * (1.0 + wobble * shape.w);
  return (length(q) - r) * min(shape.x, shape.y);
}


float bayer2(ivec2 p) {
  int x = p.x & 1;
  int y = p.y & 1;
  int idx = x + y * 2;

  if (idx == 0) return 0.0 / 4.0;
  if (idx == 1) return 2.0 / 4.0;
  if (idx == 2) return 3.0 / 4.0;
  return 1.0 / 4.0;
}

float bayer4(ivec2 p) {
  ivec2 q = ivec2(p.x & 3, p.y & 3);
  int x = q.x;
  int y = q.y;

  int m[16];
  m[0] = 0;  m[1] = 8;  m[2] = 2;  m[3] = 10;
  m[4] = 12; m[5] = 4;  m[6] = 14; m[7] = 6;
  m[8] = 3;  m[9] = 11; m[10] = 1; m[11] = 9;
  m[12] = 15; m[13] = 7; m[14] = 13; m[15] = 5;

  return float(m[x + y * 4]) / 16.0;
}

float bayer8(ivec2 p) {
  ivec2 a = ivec2(p.x & 3, p.y & 3);
  ivec2 b = ivec2((p.x >> 2) & 1, (p.y >> 2) & 1);
  float lo = bayer4(a);
  float hi = bayer2(b);
  return clamp((lo * 4.0 + hi) / 5.0, 0.0, 1.0);
}

float checkerPattern(ivec2 p) {
  int v = (p.x + p.y) & 1;
  float base = float(v);
  float fine = bayer2(ivec2((p.x >> 1) & 1, (p.y >> 1) & 1));
  return clamp(base * 0.7 + fine * 0.3, 0.0, 1.0);
}

float diamondPattern(ivec2 p) {
  int x = p.x & 7;
  int y = p.y & 7;
  int dx = abs(x - 3);
  int dy = abs(y - 3);
  float ring = float(dx + dy) / 8.0;
  float ord = bayer4(ivec2(x & 3, y & 3));
  return clamp(ring * 0.82 + ord * 0.18, 0.0, 1.0);
}

float hexPattern(ivec2 p) {
  int y = p.y;
  int x = p.x + (((y & 1) == 0) ? 0 : 1);
  int mx = ((x % 4) + 4) % 4;
  int my = ((y % 4) + 4) % 4;

  float base;
  if ((mx == 1 || mx == 2) && (my == 0 || my == 3)) {
    base = 0.18;
  } else if ((mx == 0 || mx == 3) && (my == 1 || my == 2)) {
    base = 0.42;
  } else {
    base = 0.76;
  }

  float ord = bayer2(ivec2(mx & 1, my & 1));
  return clamp(base * 0.75 + ord * 0.25, 0.0, 1.0);
}

float fractalPattern(ivec2 p) {
  ivec2 q = p;
  float acc = 0.0;
  float w = 0.5;

  for (int i = 0; i < 4; i++) {
    int x = abs(q.x) % 3;
    int y = abs(q.y) % 3;
    float v = (x == 1 && y == 1) ? 1.0 : 0.0;
    acc += v * w;
    q /= 3;
    w *= 0.5;
  }

  float ord = bayer4(ivec2(p.x & 3, p.y & 3));
  return clamp(acc * 0.75 + ord * 0.25, 0.0, 1.0);
}

float structuredPattern(ivec2 p, int mode) {
  if (mode == 0) return bayer8(p);
  if (mode == 1) return checkerPattern(p);
  if (mode == 2) return diamondPattern(p);
  if (mode == 3) return hexPattern(p);
  return fractalPattern(p);
}
vec2 diamondCell(vec2 px, float cellSize) {
  mat2 rot = mat2(
    0.70710678, -0.70710678,
    0.70710678,  0.70710678
  );
  vec2 q = rot * px;
  return floor(q / cellSize);
}

vec2 diamondCellCenter(vec2 cell, float cellSize) {
  mat2 invRot = mat2(
    0.70710678,  0.70710678,
   -0.70710678,  0.70710678
  );
  vec2 q = (cell + 0.5) * cellSize;
  return invRot * q;
}

vec2 squareCell(vec2 px, float cellSize) {
  return floor(px / cellSize);
}

vec2 squareCellCenter(vec2 cell, float cellSize) {
  return (cell + 0.5) * cellSize;
}

vec2 hexCell(vec2 px, float cellSize) {
  float rowH = cellSize * 0.8660254;
  float row = floor(px.y / rowH);
  float offset = mod(row, 2.0) * 0.5 * cellSize;
  float col = floor((px.x - offset) / cellSize);
  return vec2(col, row);
}

vec2 hexCellCenter(vec2 cell, float cellSize) {
  float rowH = cellSize * 0.8660254;
  float offset = mod(cell.y, 2.0) * 0.5 * cellSize;
  return vec2((cell.x + 0.5) * cellSize + offset, (cell.y + 0.5) * rowH);
}

float circleDot(vec2 fragPx, vec2 centerPx, float rPx) {
  float d = length(fragPx - centerPx);
  return 1.0 - step(rPx, d);
}

void main() {
  vec2 fragPx = gl_FragCoord.xy;
  // One color decision per cell keeps every dot solid in dither mode.
  float cellSize = max(3.0, uGrainPx * 6.0);
  vec2 cell;
  vec2 center;
  if (uPattern == 2) {
    cell = diamondCell(fragPx, cellSize);
    center = diamondCellCenter(cell, cellSize);
  } else if (uPattern == 3) {
    cell = hexCell(fragPx, cellSize);
    center = hexCellCenter(cell, cellSize);
  } else {
    cell = squareCell(fragPx, cellSize);
    center = squareCellCenter(cell, cellSize);
  }
  float h = hash12(cell);
  vec2 jitter = vec2(fract(h * 19.31), fract(h * 41.77)) - 0.5;
  center += jitter * (cellSize * 0.12);
  vec2 p = (center - 0.5 * uResolution) / uResolution.y;
  p += uFlow * 0.0055 * vec2(
    sin(p.y * 5.0 + uTime * 0.23),
    cos(p.x * 4.4 - uTime * 0.19)
  );
  float scatter = sqrt(max(1.0, uScatterPx)) * 9.0 / uResolution.y;
  float densityCoreBand = 16.0 / uResolution.y;
  float fields[${MAX_STIPPLE_METABALLS}];
  for (int i = 0; i < ${MAX_STIPPLE_METABALLS}; i++) fields[i] = 1e6;

  for (int i = 0; i < ${MAX_STIPPLE_METABALLS}; i++) {
    if (i >= uCount) break;
    vec4 b = uBlobs[i];
    if (uEnvelopes[i] <= 0.0 || b.z <= 0.0) continue;
    float d = metaballSDF(p, b, uShapes[i], float(i), uTime);
    d += (1.0 - uEnvelopes[i]) * (scatter + densityCoreBand);
    int group = int(b.w);
    fields[group] = smoothMin(fields[group], d, uMerge);
  }

  float d = fields[0];
  int colorIndex = 0;
  for (int i = 1; i < ${MAX_STIPPLE_METABALLS}; i++) {
    if (i >= uColorCount) break;
    if (fields[i] < d) {
      d = fields[i];
      colorIndex = i;
    }
  }

  vec3 color = uColors[colorIndex];
  if (uColorBlend != 0 && uColorBlendWidth > 0.0) {
    float weights[${MAX_STIPPLE_METABALLS}];
    float total = 0.0;
    vec3 mixed = vec3(0.0);
    for (int i = 0; i < ${MAX_STIPPLE_METABALLS}; i++) {
      if (i >= uColorCount) break;
      float support = 1.0 - smoothstep(-densityCoreBand, scatter, fields[i]);
      float weight = exp(-max(0.0, fields[i] - d) / uColorBlendWidth) * support;
      weights[i] = weight;
      total += weight;
      mixed += uColors[i] * weight;
    }
    if (total > 0.0) {
      if (uColorBlend == 1) color = mixed / total;
      else {
        float choice = hash12(cell + vec2(71.37, 19.19)) * total;
        float cumulative = 0.0;
        for (int i = 0; i < ${MAX_STIPPLE_METABALLS}; i++) {
          if (i >= uColorCount) break;
          cumulative += weights[i];
          if (choice < cumulative) {
            color = uColors[i];
            break;
          }
        }
      }
    }
  }
  float density = 1.0 - smoothstep(
    -densityCoreBand,
     scatter,
     d
  );
  density = pow(density, 1.35);

  ivec2 icell = ivec2(cell);

  float pat = structuredPattern(icell, uPattern);
  float threshold = clamp(pat * 0.82 + h * 0.18, 0.0, 1.0);
  float dotRadius = cellSize * 0.23;

  float occupied = density > 0.0 ? step(threshold, density) : 0.0;
  float dot = circleDot(fragPx, center, dotRadius);
  float fill = occupied * dot;

  fragColor = vec4(mix(uBackground, color, fill), 1.0);
}
`;
