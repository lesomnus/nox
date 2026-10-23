import { rasterSize, type ResolvedStippleSettings } from "./stipple-model";
import { fragmentShaderSource, vertexShaderSource } from "./stipple-shaders";
import { createCustomStippleFrame, type StippleFrame } from "./stipple-frame";
import { clusterMotion } from "./stipple-motions";

function createGpu(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
  });
  if (!gl)
    throw new Error(
      "StippleBackground requires WebGL2. Showing the static background.",
    );
  const shaders: WebGLShader[] = [];
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let vao: WebGLVertexArrayObject | null = null;
  const dispose = () => {
    if (vao) gl.deleteVertexArray(vao);
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    for (const shader of shaders) gl.deleteShader(shader);
  };
  try {
    function compile(type: number, source: string) {
      const shader = gl!.createShader(type);
      if (!shader) throw new Error("Unable to allocate a background shader.");
      shaders.push(shader);
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS))
        throw new Error(
          gl!.getShaderInfoLog(shader) ||
            "Unable to compile a background shader.",
        );
      return shader;
    }
    const vertex = compile(gl.VERTEX_SHADER, vertexShaderSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentShaderSource);
    program = gl.createProgram();
    if (!program) throw new Error("Unable to allocate a background program.");
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(
        gl.getProgramInfoLog(program) ||
          "Unable to link the background program.",
      );
    buffer = gl.createBuffer();
    vao = gl.createVertexArray();
    if (!buffer || !vao)
      throw new Error("Unable to allocate background geometry.");
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const uniforms = Object.fromEntries(
      [
        "uResolution",
        "uTime",
        "uFlow",
        "uGrainPx",
        "uScatterPx",
        "uMerge",
        "uColorBlend",
        "uColorBlendWidth",
        "uPattern",
        "uCount",
        "uColorCount",
        "uBlobs[0]",
        "uShapes[0]",
        "uColors[0]",
        "uEnvelopes[0]",
        "uBackground",
      ].map((name) => [name, gl.getUniformLocation(program!, name)]),
    );
    return {
      maxDimension: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number,
      draw(
        settings: ResolvedStippleSettings,
        time: number,
        scale: number,
        frame: StippleFrame,
      ) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(program);
        gl.bindVertexArray(vao);
        gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
        gl.uniform1f(uniforms.uTime, time);
        gl.uniform1f(
          uniforms.uFlow,
          !settings.motion || settings.motion === clusterMotion ? 1 : 0,
        );
        gl.uniform1f(uniforms.uGrainPx, settings.grainPx * scale);
        gl.uniform1f(uniforms.uScatterPx, settings.scatterPx * scale);
        gl.uniform1f(uniforms.uMerge, settings.merge);
        gl.uniform1i(uniforms.uColorBlend, settings.colorBlend);
        gl.uniform1f(uniforms.uColorBlendWidth, settings.colorBlendWidth);
        gl.uniform1i(uniforms.uPattern, settings.pattern);
        gl.uniform1i(uniforms.uCount, frame.count);
        gl.uniform1i(uniforms.uColorCount, frame.colorCount);
        gl.uniform4fv(uniforms["uBlobs[0]"], frame.blobs);
        gl.uniform4fv(uniforms["uShapes[0]"], frame.shapes);
        gl.uniform3fv(uniforms["uColors[0]"], frame.colors);
        gl.uniform1fv(uniforms["uEnvelopes[0]"], frame.envelopes);
        gl.uniform3fv(uniforms.uBackground, settings.background);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}

export function createStippleRenderer(
  canvas: HTMLCanvasElement,
  initialSettings: ResolvedStippleSettings,
  status: (value: "webgl2" | "fallback") => void,
  reportError: (error: Error) => void,
) {
  let settings = initialSettings;
  const customFrame = createCustomStippleFrame();
  const context = { width: 0, height: 0, aspect: 1, seed: settings.seed };
  let motionFailed = false;
  let gpu: ReturnType<typeof createGpu> | undefined;
  let disposed = false;
  let frame = 0;
  let previous: number | undefined;
  let time = 0;
  let width = 0,
    height = 0,
    scale = 1;
  let intersecting = true;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  const visible = () =>
    !document.hidden && intersecting && width > 0 && height > 0;
  const animating = () =>
    !disposed &&
    !!gpu &&
    !motionFailed &&
    visible() &&
    !settings.paused &&
    settings.speed > 0 &&
    !reduced.matches;
  function paint() {
    if (disposed || !gpu || !visible()) return;
    try {
      context.width = width;
      context.height = height;
      context.aspect = width / height;
      context.seed = settings.seed;
      const frame = customFrame.sample(
        (settings.motion ?? clusterMotion)(time, context),
        context.aspect,
        settings.palette,
      );
      gpu.draw(settings, time, scale, frame);
      if (motionFailed) {
        motionFailed = false;
        status("webgl2");
      }
    } catch (error) {
      if (!motionFailed) {
        motionFailed = true;
        status("fallback");
        reportError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }
  function render(now: number) {
    frame = 0;
    if (!animating()) return;
    if (previous === undefined) previous = now;
    const elapsed = now - previous;
    if (elapsed >= 1000 / settings.maxFps) {
      time +=
        Math.min(Math.max(250, 1000 / settings.maxFps), elapsed) *
        0.001 *
        settings.speed;
      previous = now;
      paint();
    }
    if (animating()) frame = requestAnimationFrame(render);
  }
  function reconcile() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = undefined;
    if (disposed) return;
    paint();
    if (animating()) frame = requestAnimationFrame(render);
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    if (gpu) {
      const size = rasterSize(
        width,
        height,
        window.devicePixelRatio || 1,
        settings.maxWidth,
        gpu.maxDimension,
      );
      scale = size.scale;
      if (canvas.width !== size.width) canvas.width = size.width;
      if (canvas.height !== size.height) canvas.height = size.height;
    }
    reconcile();
  }
  function initialize() {
    if (disposed) return;
    try {
      gpu = createGpu(canvas);
      resize();
      if (!motionFailed) status("webgl2");
    } catch (error) {
      gpu?.dispose();
      gpu = undefined;
      status("fallback");
      reportError(error instanceof Error ? error : new Error(String(error)));
    }
  }
  function lost(event: Event) {
    event.preventDefault();
    cancelAnimationFrame(frame);
    frame = 0;
    previous = undefined;
    gpu?.dispose();
    gpu = undefined;
    status("fallback");
    reportError(
      new Error(
        "StippleBackground lost its WebGL context. Showing the static background until it is restored.",
      ),
    );
  }
  canvas.addEventListener("webglcontextlost", lost);
  canvas.addEventListener("webglcontextrestored", initialize);
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  const intersection = new IntersectionObserver(([entry]) => {
    intersecting = entry.isIntersecting;
    reconcile();
  });
  intersection.observe(canvas);
  reduced.addEventListener("change", reconcile);
  document.addEventListener("visibilitychange", reconcile);
  window.addEventListener("resize", resize);
  initialize();
  return {
    update(next: ResolvedStippleSettings) {
      if (disposed || next === settings) return;
      if (next.seed !== settings.seed) {
        time = 0;
      }
      settings = next;
      resize();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      gpu?.dispose();
      gpu = undefined;
      observer.disconnect();
      intersection.disconnect();
      reduced.removeEventListener("change", reconcile);
      document.removeEventListener("visibilitychange", reconcile);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", initialize);
    },
  };
}
