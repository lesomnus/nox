import flutterShader from "./ink-sparkle.frag?raw";
import {
  inkSparkleFrame,
  type InkSparkleCenterMotion,
} from "./ink-sparkle-model";

// Keep the upstream shader verbatim. Only adapt Flutter's runtime bindings to
// WebGL2, including top-left logical fragment coordinates and uniform aliases.
export const inkSparkleFragmentShader = flutterShader
  .replace("#version 320 es", "#version 300 es")
  .replace(
    "#include <flutter/runtime_effect.glsl>",
    `
uniform float u_device_pixel_ratio;
uniform float u_viewport_height;
vec2 FlutterFragCoord() {
  return vec2(gl_FragCoord.x, u_viewport_height - gl_FragCoord.y) / u_device_pixel_ratio;
}`,
  )
  .replace(/layout\(location = \d+\) /g, "")
  .replace(/float (u_\w+) = (u_composite_1\.\w);/g, "#define $1 $2");

const vertexShader = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

export function createInkSparkleRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) throw new Error("InkSparkle requires WebGL2.");
  const shaders: WebGLShader[] = [];
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  const dispose = () => {
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    shaders.forEach((shader) => gl.deleteShader(shader));
  };
  try {
    function compile(type: number, source: string) {
      const shader = gl!.createShader(type);
      if (!shader) throw new Error("Unable to allocate InkSparkle shader.");
      shaders.push(shader);
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS))
        throw new Error(
          gl!.getShaderInfoLog(shader) ||
            "InkSparkle shader compilation failed.",
        );
      return shader;
    }
    const vertex = compile(gl.VERTEX_SHADER, vertexShader);
    const fragment = compile(gl.FRAGMENT_SHADER, inkSparkleFragmentShader);
    program = gl.createProgram();
    if (!program) throw new Error("Unable to allocate InkSparkle program.");
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(
        gl.getProgramInfoLog(program) || "InkSparkle program linking failed.",
      );
    buffer = gl.createBuffer();
    if (!buffer) throw new Error("Unable to allocate InkSparkle geometry.");
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const names = [
      "u_color",
      "u_composite_1",
      "u_center",
      "u_max_radius",
      "u_resolution_scale",
      "u_noise_scale",
      "u_noise_phase",
      "u_circle1",
      "u_circle2",
      "u_circle3",
      "u_rotation1",
      "u_rotation2",
      "u_rotation3",
      "u_device_pixel_ratio",
      "u_viewport_height",
    ];
    const uniform = Object.fromEntries(
      names.map((name) => [name, gl.getUniformLocation(program!, name)]),
    );
    return {
      draw(
        progress: number,
        seed: number,
        width: number,
        height: number,
        ratio: number,
        origin: readonly [number, number],
        color: readonly [number, number, number, number],
        centerMotion: InkSparkleCenterMotion = "to-center",
      ) {
        const rasterWidth = Math.max(1, Math.round(width * ratio));
        const rasterHeight = Math.max(1, Math.round(height * ratio));
        if (canvas.width !== rasterWidth || canvas.height !== rasterHeight) {
          canvas.width = rasterWidth;
          canvas.height = rasterHeight;
        }
        const frame = inkSparkleFrame(
          progress,
          width,
          height,
          origin,
          seed,
          centerMotion,
        );
        gl.useProgram(program);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform4f(uniform.u_color, ...color);
        gl.uniform4f(
          uniform.u_composite_1,
          frame.alpha,
          frame.sparkleAlpha,
          1,
          frame.radiusScale,
        );
        gl.uniform2f(uniform.u_center, ...frame.center);
        gl.uniform1f(uniform.u_max_radius, frame.maxRadius);
        gl.uniform2f(uniform.u_resolution_scale, ...frame.resolutionScale);
        gl.uniform2f(uniform.u_noise_scale, ...frame.noiseScale);
        gl.uniform1f(uniform.u_noise_phase, frame.noisePhase);
        gl.uniform2f(uniform.u_circle1, ...frame.circle1);
        gl.uniform2f(uniform.u_circle2, ...frame.circle2);
        gl.uniform2f(uniform.u_circle3, ...frame.circle3);
        gl.uniform2f(uniform.u_rotation1, ...frame.rotation1);
        gl.uniform2f(uniform.u_rotation2, ...frame.rotation2);
        gl.uniform2f(uniform.u_rotation3, ...frame.rotation3);
        gl.uniform1f(uniform.u_device_pixel_ratio, ratio);
        gl.uniform1f(uniform.u_viewport_height, canvas.height);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
