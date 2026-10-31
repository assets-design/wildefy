"use client";

import { useEffect, useRef } from "react";
import styles from "./experiences-journey.module.css";

/**
 * Port of wildfy NatGeoCloudTransitionEngine — FBM / smoke dissolve
 * (same grammar as WildernessJourneyEngine reveal into the next stage).
 *
 * progress 0 = full cloud texture covering
 * progress 1 = dissolved — section underneath fully visible
 */
const TEXTURE_SRC = "/images/clouds-mist.png";

type Props = {
  /** 0–1 dissolve (0 = covered, 1 = clear). */
  progress: number;
  className?: string;
};

export function NatGeoCloudDissolve({ progress, className }: Props) {
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
    let texture: WebGLTexture | null = null;
    let textureReady = false;
    let imageWidth = 1920;
    let imageHeight = 1080;
    let time = 0;
    let raf = 0;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn("[NatGeoCloudDissolve]", gl.getShaderInfoLog(shader));
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

    // Exact wildfy NatGeo FBM dissolve fragment
    const fsSource = `
      precision highp float;
      uniform sampler2D u_image;
      uniform float u_progress;
      uniform float u_opacity;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_imageResolution;
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
        vec2 imgUv = vec2(uv.x, 1.0 - uv.y);
        float screenAspect = u_resolution.x / max(u_resolution.y, 1.0);
        float imgAspect = u_imageResolution.x / max(u_imageResolution.y, 1.0);
        if (screenAspect > imgAspect) {
          float s = imgAspect / screenAspect;
          imgUv.y = (imgUv.y - 0.5) * s + 0.5;
        } else {
          float s = screenAspect / imgAspect;
          imgUv.x = (imgUv.x - 0.5) * s + 0.5;
        }

        vec4 texPixel = texture2D(u_image, imgUv);
        // Soft lift toward sky plate mid-tone (bg-3) — holes show the image under
        vec3 skyLift = vec3(0.78, 0.86, 0.88);
        texPixel.rgb = mix(skyLift, texPixel.rgb, 0.72);
        texPixel.rgb = max(texPixel.rgb, skyLift * 0.92);

        vec2 vCenter = (uv - 0.5) * 2.0;
        float vignette = 1.0 - dot(vCenter, vCenter) * 0.22;
        texPixel.rgb *= clamp(vignette, 0.0, 1.0);

        float longest = 0.70710678;
        float dis = -distance(uv, vec2(0.5)) + u_progress * (1.0 + longest);
        vec3 p = vec3(uv * 5.0 + vec2(10.0), 100.0 + u_time * 0.03);
        float blot = fbm(p) + dis;
        blot = smoothstep(0.48, 0.72, blot);

        float edge = 1.0 - smoothstep(0.90, 1.0, blot);

        float bottomMistGrad = smoothstep(0.35, 0.95, 1.0 - uv.y);
        float mistNoise = fbm(vec3(uv.x * 4.0 + u_time * 0.04, (1.0 - uv.y) * 3.5, 30.0));
        float bottomMistAlpha = smoothstep(0.45, 0.85, bottomMistGrad + mistNoise * 0.35);
        vec3 mistColor = vec3(0.85, 0.80, 0.74);

        float alpha = clamp(1.0 - blot, 0.0, 1.0) * u_opacity;
        vec3 finalRgb = mix(texPixel.rgb, texPixel.rgb * 0.45, edge * 0.4);
        finalRgb = mix(finalRgb, mistColor, bottomMistAlpha * 0.7 * smoothstep(0.0, 0.4, u_progress));

        gl_FragColor = vec4(finalRgb, alpha);
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
      console.warn("[NatGeoCloudDissolve] link", gl.getProgramInfoLog(program));
      return;
    }

    const uniforms = {
      image: gl.getUniformLocation(program, "u_image"),
      progress: gl.getUniformLocation(program, "u_progress"),
      opacity: gl.getUniformLocation(program, "u_opacity"),
      time: gl.getUniformLocation(program, "u_time"),
      resolution: gl.getUniformLocation(program, "u_resolution"),
      imageResolution: gl.getUniformLocation(program, "u_imageResolution"),
    };
    const positionLocation = gl.getAttribLocation(program, "a_position");

    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([250, 252, 255, 255]),
    );

    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (cancelled || !texture) return;
      imageWidth = image.naturalWidth || 1920;
      imageHeight = image.naturalHeight || 1080;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      textureReady = true;
    };
    image.src = TEXTURE_SRC;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const render = () => {
      if (cancelled || !program || !texture) return;
      const p = Math.min(1, Math.max(0, progressRef.current));

      // Keep canvas mapped (never display:none) — wildfy re-entrancy rule.
      // Still run the RAF loop when fully dissolved so reverse scroll can
      // re-show the veil without waiting for a remount.
      if (p >= 0.995) {
        canvas.style.visibility = "hidden";
        canvas.style.opacity = "0";
        return;
      }
      if (canvas.style.visibility === "hidden" || canvas.style.opacity === "0") {
        canvas.style.visibility = "visible";
        canvas.style.opacity = "1";
      }

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

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uniforms.image, 0);
      gl.uniform1f(uniforms.progress, p);
      gl.uniform1f(uniforms.opacity, 1);
      gl.uniform1f(uniforms.time, time);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.imageResolution, imageWidth, imageHeight);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      void textureReady;
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
      if (texture) gl.deleteTexture(texture);
      /* Free the GPU context slot so later canvases (Earth) can create */
      try {
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? styles.natGeoCloudCanvas}
      aria-hidden="true"
    />
  );
}
