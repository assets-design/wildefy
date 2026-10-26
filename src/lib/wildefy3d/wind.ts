import * as THREE from "three";

export const windUniforms = {
  uTime: { value: 0 },
  uStrength: { value: 1 },
};

export const waterUniforms = {
  uTime: { value: 0 },
};

/**
 * Vertex wind. Pines and ferns use a per-vertex `aWind` mask so trunks stay
 * planted. The oak canopy has no skeleton, so its leaves sway by local height.
 */
export function applyFoliageWind(
  material: THREE.MeshStandardMaterial,
  amplitude: number,
  mode: "attribute" | "canopy",
) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniforms.uTime;
    shader.uniforms.uWindAmp = { value: amplitude };
    shader.uniforms.uStrength = windUniforms.uStrength;
    const mask = mode === "attribute" ? "aWind" : "smoothstep(2.8, 9.2, position.y)";
    shader.vertexShader = `
uniform float uTime;
uniform float uWindAmp;
uniform float uStrength;
${mode === "attribute" ? "attribute float aWind;" : ""}
${shader.vertexShader}`.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      #ifdef USE_INSTANCING
        float phase = instanceMatrix[3].x * 0.17 + instanceMatrix[3].z * 0.13;
      #else
        float phase = position.x * 0.2 + position.z * 0.17;
      #endif
      float gust = 0.72 + 0.28 * sin(uTime * 0.33 + phase);
      float sway = sin(uTime * 1.08 + phase) * gust;
      float flutter = sin(uTime * 2.15 + phase * 1.7 + position.y * 1.4) * 0.2;
      float mask = ${mask};
      transformed.x += (sway + flutter) * mask * uWindAmp * uStrength;
      transformed.z += sway * 0.62 * mask * uWindAmp * uStrength;`,
    );
  };
  material.customProgramCacheKey = () => `foliage-wind-${mode}-${amplitude}`;
}

export function createWaterMaterial(opacity = 0.9) {
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#1a7f86"),
    roughness: 0.16,
    metalness: 0.05,
    transparent: true,
    opacity,
    emissive: new THREE.Color("#08383c"),
    emissiveIntensity: 0.45,
    side: THREE.DoubleSide,
    depthWrite: opacity > 0.75,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = waterUniforms.uTime;
    shader.vertexShader = `
uniform float uTime;
varying vec2 vUvW;
${shader.vertexShader}`.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      vUvW = uv;
      float ripple = sin(uv.y * 18.0 + uTime * 2.1) * 0.05 + sin(uv.x * 12.0 - uTime * 1.3) * 0.02;
      transformed.y += ripple * (1.0 - pow(abs(uv.x - 0.5) * 2.0, 2.0));`,
    );
    shader.fragmentShader = `
uniform float uTime;
varying vec2 vUvW;
${shader.fragmentShader}`.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
      float foam = smoothstep(0.28, 0.5, abs(vUvW.x - 0.5));
      float streak = sin(vUvW.y * 42.0 - uTime * 3.4) * 0.5 + 0.5;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.55, 0.82, 0.78), foam * 0.45 + streak * 0.04);`,
    );
  };
  material.customProgramCacheKey = () => `wildefy-water-${opacity}`;
  return material;
}
