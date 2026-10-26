"use client";

import { useEffect, useRef } from "react";
import styles from "./experiences-journey.module.css";

/**
 * White-screen enter reveal for Experiences.
 * progress 0 = solid white covering the section
 * progress 1 = white dissolved — Experiences image/video fully visible
 *
 * Organic FBM / smoke edge (same NatGeo grammar as wildfy), but the veil
 * itself is white — not a mountain still.
 */
type Props = {
  /** 0–1 dissolve amount (already eased by parent). */
  progress: number;
};

export function ExperiencesCloudReveal({ progress }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext("webgl", { premultipliedAlpha: false, alpha: true }) ||
      canvas.getContext("experimental-webgl", {
        premultipliedAlpha: false,
        alpha: true,
      });
    if (!gl || !(gl instanceof WebGLRenderingContext)) return;

    let cancelled = false;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let time = 0;
    let raf = 0;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn("[ExperiencesCloudReveal]", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 vUv;
      void main() {
        vUv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // White veil that dissolves with organic FBM holes — reveals image below.
    const fsSource = `
      precision highp float;
      uniform float u_progress;
      uniform float u_time;
      varying vec2 vUv;

      const float F3 = 0.3333333;
      const float G3 = 0.1666667;

      vec3 random3(vec3 c) {
        float j = 4096.0 * sin(dot(c, vec3(17.0, 59.4, 15.0)));
        vec3 r;
        r.z = fract(512.0 * j);
        j *= 0.125;
        r.x = fract(512.0 * j);
        j *= 0.125;
        r.y = fract(512.0 * j);
        return r - 0.5;
      }

      float simplex3d(vec3 p) {
        vec3 s = floor(p + dot(p, vec3(F3)));
        vec3 x = p - s + dot(s, vec3(G3));
        vec3 e = step(vec3(0.0), x - x.yzx);
        vec3 i1 = e * (1.0 - e.zxy);
        vec3 i2 = 1.0 - e.zxy * (1.0 - e);
        vec3 x1 = x - i1 + G3;
        vec3 x2 = x - i2 + 2.0 * G3;
        vec3 x3 = x - 1.0 + 3.0 * G3;
        vec4 w, d;
        w.x = dot(x, x);
        w.y = dot(x1, x1);
        w.z = dot(x2, x2);
        w.w = dot(x3, x3);
        w = max(0.6 - w, 0.0);
        d.x = dot(random3(s), x);
        d.y = dot(random3(s + i1), x1);
        d.z = dot(random3(s + i2), x2);
        d.w = dot(random3(s + 1.0), x3);
        w *= w; w *= w; d *= w;
        return dot(d, vec4(52.0));
      }

      float fbm(vec3 p) {
        float f = 0.0;
        float frequency = 1.5;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
          f += simplex3d(p * frequency) * amplitude;
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        return clamp(f, -1.0, 1.0);
      }

      void main() {
        vec2 uv = vUv;

        // Radial + noise dissolve from center (white → transparent).
        float longest = 0.70710678;
        float dis = -distance(uv, vec2(0.5)) + u_progress * (1.0 + longest);
        vec3 p = vec3(uv * 5.0 + vec2(10.0), 100.0 + u_time * 0.03);
        float blot = fbm(p) + dis;
        blot = smoothstep(0.42, 0.78, blot);

        // Soft smoky edge on remaining white
        float edge = 1.0 - smoothstep(0.88, 1.0, blot);

        // Extra bottom mist bank while revealing
        float bottomMistGrad = smoothstep(0.28, 0.95, 1.0 - uv.y);
        float mistNoise = fbm(vec3(uv.x * 4.0 + u_time * 0.04, (1.0 - uv.y) * 3.5, 30.0));
        float bottomMist = smoothstep(0.4, 0.88, bottomMistGrad + mistNoise * 0.4);
        bottomMist *= (1.0 - u_progress) * 0.85;

        float alpha = clamp(1.0 - blot, 0.0, 1.0);
        alpha = max(alpha, bottomMist * (1.0 - blot * 0.65));

        // Pure white veil (slight warm edge in dissolving fringe)
        vec3 white = vec3(1.0, 1.0, 1.0);
        vec3 fringe = vec3(0.96, 0.97, 0.98);
        vec3 color = mix(white, fringe, edge * 0.35);

        gl_FragColor = vec4(color, alpha);
      }
    `;

    const vs = compile(gl.VERTEX_SHADER, vsSource);
    const fs = compile(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("[ExperiencesCloudReveal] link", gl.getProgramInfoLog(program));
      return;
    }

    const uniforms = {
      progress: gl.getUniformLocation(program, "u_progress"),
      time: gl.getUniformLocation(program, "u_time"),
    };
    const positionLocation = gl.getAttribLocation(program, "a_position");

    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const render = () => {
      if (cancelled || !program) return;
      const p = Math.min(1, Math.max(0, progressRef.current));
      if (p >= 0.995) {
        canvas.style.visibility = "hidden";
        canvas.style.opacity = "0";
        return;
      }
      canvas.style.visibility = "visible";
      canvas.style.opacity = "1";

      time += 0.016;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(uniforms.progress, p);
      gl.uniform1f(uniforms.time, time);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const tick = () => {
      if (cancelled) return;
      render();
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
      if (program) gl.deleteProgram(program);
      if (buffer) gl.deleteBuffer(buffer);
    };
  }, []);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const hidden = progress >= 0.995;

  return (
    <canvas
      ref={canvasRef}
      className={styles.cloudRevealCanvas}
      aria-hidden="true"
      style={{
        visibility: hidden ? "hidden" : "visible",
        opacity: hidden ? 0 : 1,
        pointerEvents: "none",
      }}
    />
  );
}

/** Ease raw 0–1 scrub into organic dissolve. */
export function easeCloudReveal(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - x, 3);
}
