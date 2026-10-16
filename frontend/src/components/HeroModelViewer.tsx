import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useI18n } from "../i18n/I18nContext";
import { resolveAssetUrl } from "../utils/assetUrl";
import { parseModelGeometryWithWorker } from "../utils/modelDimensions";

type HeroModelViewerProps = {
  src: string;
  className?: string;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
};

const HERO_MODEL_COLORS = [
  0x23a6d5, 0x5fd0ff, 0xccf2ff, 0x4f86ff, 0xb388ff, 0xf0b3ff, 0xff8a65,
  0xffccb3, 0xffb74d, 0xff6f91, 0xffb3d9, 0xf5f5f5,
];

function pickRandomColor(): number {
  const idx = Math.floor(Math.random() * HERO_MODEL_COLORS.length);
  return HERO_MODEL_COLORS[idx] ?? 0x4f86ff;
}

function getExt(path: string): string {
  if (!path) return "";
  const cleanPath = path.split("?")[0]?.split("#")[0] ?? path;
  const lastSegment = cleanPath.split("/").pop() ?? cleanPath;
  const parts = lastSegment.split(".");
  if (parts.length <= 1) return "";
  return (parts[parts.length - 1] ?? "").toLowerCase();
}

// Module-level geometry cache: keeps parsed STL geometries in memory so switching slides is instant
const geometryCache = new Map<string, any>();

function fitObject(object: any, camera: any, controls: any): void {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  object.position.sub(center);

  const fittedBox = new THREE.Box3().setFromObject(object);
  const size = fittedBox.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const fovInRadians = THREE.MathUtils.degToRad(camera.fov);
  const cameraDistance = (maxDim * 0.5) / Math.tan(fovInRadians * 0.5);

  camera.near = Math.max(0.01, cameraDistance / 200);
  camera.far = Math.max(1000, cameraDistance * 30);
  camera.updateProjectionMatrix();

  controls.target.set(0, 0, 0);
  camera.position.set(0, maxDim * 0.18, cameraDistance * 1.35);
  camera.lookAt(controls.target);
  controls.update();
}

export default function HeroModelViewer({
  src,
  className,
  onInteractionStart,
  onInteractionEnd,
}: HeroModelViewerProps) {
  const { t } = useI18n();
  const ext = useMemo(() => getExt(src), [src]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelColor = useMemo(() => pickRandomColor(), [src]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  const onInteractionStartRef = useRef(onInteractionStart);
  onInteractionStartRef.current = onInteractionStart;
  const onInteractionEndRef = useRef(onInteractionEnd);
  onInteractionEndRef.current = onInteractionEnd;

  // Persistent Three.js scene references across slide transitions
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const modelGroupRef = useRef<any>(null);
  const fillLightRef = useRef<any>(null);

  // 1. One-time Setup: Initialize WebGLRenderer, Camera, Lights, OrbitControls, Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isVisible = true;
    let isScrolling = false;
    let scrollTimeout: number | null = null;

    const width = canvas.clientWidth || 560;
    const height = canvas.clientHeight || 360;

    // Viewport intersection observer to completely halt rendering when offscreen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry?.isIntersecting ?? false;
      },
      { threshold: 0.05 },
    );
    observer.observe(canvas);

    // Initialize WebGLRenderer with shader check disabled to eliminate synchronous GPU IPC pauses
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    // Critical fix: disable synchronous shader program linking info log queries that stall main thread
    renderer.debug.checkShaderErrors = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(0, 16, 34);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.1;
    controls.enablePan = false;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    const handleStart = () => onInteractionStartRef.current?.();
    const handleEnd = () => onInteractionEndRef.current?.();
    controls.addEventListener("start", handleStart);
    controls.addEventListener("end", handleEnd);

    // Scroll listener: pause WebGL render passes during page scroll to give 100% frame time to compositor
    const handleWindowScroll = () => {
      isScrolling = true;
      if (scrollTimeout !== null) {
        window.clearTimeout(scrollTimeout);
      }
      scrollTimeout = window.setTimeout(() => {
        isScrolling = false;
        scrollTimeout = null;
      }, 140);
    };
    window.addEventListener("scroll", handleWindowScroll, { passive: true });

    // Scene Lighting
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.7);
    keyLight.position.set(18, 24, 14);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(modelColor, 1.05);
    fillLight.position.set(-18, 12, -10);
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    scene.add(new THREE.AmbientLight(0xffffff, 0.18));

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Inactivity timeout: auto-pause rotation after 15s of idle time to save battery
    let idleTimeout: number | null = null;
    const resetIdleTimer = () => {
      controls.autoRotate = true;
      if (idleTimeout !== null) window.clearTimeout(idleTimeout);
      idleTimeout = window.setTimeout(() => {
        controls.autoRotate = false;
      }, 15000);
    };
    resetIdleTimer();

    canvas.addEventListener("pointerdown", resetIdleTimer, { passive: true });
    canvas.addEventListener("pointermove", resetIdleTimer, { passive: true });

    // Render loop: throttled to ~30fps, halts during scroll or when hidden/offscreen
    let frameId = 0;
    let lastRenderTime = 0;
    const animate = (now: number) => {
      frameId = window.requestAnimationFrame(animate);
      if (!isVisible || isScrolling || document.visibilityState === "hidden") {
        return;
      }
      // Cap at ~30fps to reduce CPU/GPU draw passes by 50%
      if (now - lastRenderTime < 33) {
        return;
      }
      lastRenderTime = now;
      controls.update();
      renderer.render(scene, camera);
    };
    frameId = window.requestAnimationFrame(animate);

    // ResizeObserver on canvas for responsive layout adjustments
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        const nextWidth = cr.width || width;
        const nextHeight = cr.height || height;
        if (nextWidth > 0 && nextHeight > 0) {
          camera.aspect = nextWidth / nextHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(nextWidth, nextHeight, false);
        }
      }
    });
    resizeObserver.observe(canvas);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", handleWindowScroll);
      if (scrollTimeout !== null) window.clearTimeout(scrollTimeout);
      if (idleTimeout !== null) window.clearTimeout(idleTimeout);
      canvas.removeEventListener("pointerdown", resetIdleTimer);
      canvas.removeEventListener("pointermove", resetIdleTimer);
      window.cancelAnimationFrame(frameId);
      controls.removeEventListener("start", handleStart);
      controls.removeEventListener("end", handleEnd);
      controls.dispose();
      renderer.dispose();

      // Clean up meshes in modelGroup
      modelGroup.traverse((obj: any) => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) {
            obj.geometry.dispose();
          }
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m: any) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });

      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      modelGroupRef.current = null;
      fillLightRef.current = null;
    };
  }, []);

  // 2. Model Swap Effect: Only replaces geometry & material without tearing down WebGL context
  useEffect(() => {
    const isSupported = ext === "stl" || ext === "" || ext === "model3d";
    if (!isSupported) {
      setStatus("error");
      return;
    }

    const modelGroup = modelGroupRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!modelGroup || !camera || !controls) {
      return;
    }

    let active = true;

    // Update fill light color for new slide palette
    if (fillLightRef.current) {
      fillLightRef.current.color.setHex(modelColor);
    }

    // Helper to display a loaded BufferGeometry
    const applyGeometry = (geometry: any) => {
      if (!active || !modelGroupRef.current) return;

      // Clean previous meshes and their materials
      while (modelGroup.children.length > 0) {
        const child = modelGroup.children[0];
        modelGroup.remove(child);
        if (child instanceof THREE.Mesh) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m: any) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }

      const radius = geometry.boundingSphere?.radius ?? 1;
      const material = new THREE.MeshStandardMaterial({
        color: modelColor,
        emissive: modelColor,
        emissiveIntensity: 0.22,
        metalness: 0.04,
        roughness: 0.62,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      const normalizedScale = 8 / (radius || 1);
      mesh.scale.setScalar(normalizedScale);

      modelGroup.add(mesh);
      fitObject(modelGroup, camera, controls);
      setStatus("ready");
    };

    // Check memory cache first
    const cached = geometryCache.get(src);
    if (cached) {
      applyGeometry(cached);
      return;
    }

    setStatus("loading");
    void (async () => {
      try {
        const resolved = resolveAssetUrl(src);
        const res = await fetch(resolved);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();
        if (!active) return;

        let geometry: any = null;
        const workerResult = await parseModelGeometryWithWorker(buffer, src);
        if (workerResult?.positions) {
          geometry = new THREE.BufferGeometry();
          geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(new Float32Array(workerResult.positions), 3),
          );
          if (workerResult.normals) {
            geometry.setAttribute(
              "normal",
              new THREE.BufferAttribute(new Float32Array(workerResult.normals), 3),
            );
          } else {
            geometry.computeVertexNormals();
          }
        } else {
          const { STLLoader } = await import(
            "three/examples/jsm/loaders/STLLoader.js"
          );
          const loader = new STLLoader();
          geometry = loader.parse(buffer);
        }

        if (!active) {
          geometry.dispose();
          return;
        }

        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        const radius = geometry.boundingSphere?.radius ?? 0;
        if (!Number.isFinite(radius) || radius <= 0) {
          setStatus("error");
          geometry.dispose();
          return;
        }

        geometry.center();
        if (!geometry.attributes.normal) {
          geometry.computeVertexNormals();
        }

        // Cache for subsequent slide cycles
        geometryCache.set(src, geometry);
        applyGeometry(geometry);
      } catch (err) {
        if (!active) return;
        console.warn(`Failed to load hero 3D model ${src}:`, err);
        setStatus("error");
      }
    })();

    return () => {
      active = false;
    };
  }, [src, ext, modelColor]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={
          className ||
          "absolute z-30 left-1/2 -translate-x-1/2 bottom-[6%] w-[98%] h-[86%]"
        }
      />
      {status === "loading" ? (
        <p className="absolute z-40 left-1/2 -translate-x-1/2 bottom-8 text-xs text-white/75 text-center px-4">
          {t("hero.loadingModel")}
        </p>
      ) : null}
      {status === "error" ? (
        <p className="absolute z-40 left-1/2 -translate-x-1/2 bottom-8 text-xs text-white/75 text-center px-4">
          {t("hero.modelLoadError")}
        </p>
      ) : null}
    </>
  );
}
