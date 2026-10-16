import { useEffect, useRef, useState } from "react";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  GridHelper,
  Group,
  Mesh,
  MeshStandardMaterial,
  Box3,
  Vector3,
  PCFSoftShadowMap,
  SRGBColorSpace,
  DoubleSide,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

function disposeHierarchy(obj: any) {
  if (!obj) return;
  obj.traverse((child: any) => {
    if (child.isMesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m: any) => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        } else {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      }
    }
  });
}
import {
  RotateCw,
  RotateCcw,
  Box,
  Layers,
  HelpCircle,
  AlertTriangle,
  Loader2,
  Palette,
  Grid3X3,
  Maximize2,
} from "lucide-react";
import { resolveAssetUrl } from "../utils/assetUrl";
import {
  MAX_DIMENSION_MM,
  roundMillimeters,
  parseModelGeometryWithWorker,
} from "../utils/modelDimensions";
import type { Filament } from "../types";
import { useI18n } from "../i18n/I18nContext";

export interface Interactive3DViewerProps {
  fileUrl?: string;
  file?: File;
  fileName?: string;
  colorName?: string;
  materialName?: string;
  scaleFactor?: number;
  filaments?: Filament[];
  onDimensionsDetected?: (dims: { x: number; y: number; z: number }) => void;
  className?: string;
  count?: number;
  compact?: boolean;
  onExpand?: () => void;
  showHelp?: boolean;
}

export function getFilamentHexColor(colorName?: string): number {
  if (!colorName) return 0x2563eb;
  const clean = colorName.trim().toLowerCase();

  if (/^#?[0-9a-f]{6}$/i.test(clean)) {
    return parseInt(clean.replace("#", ""), 16);
  }

  const map: Record<string, number> = {
    black: 0x18181b,
    white: 0xf4f4f5,
    grey: 0x71717a,
    gray: 0x71717a,
    red: 0xef4444,
    crimson: 0xdc2626,
    blue: 0x2563eb,
    navy: 0x1e3a8a,
    green: 0x10b981,
    emerald: 0x059669,
    yellow: 0xfbbf24,
    amber: 0xf59e0b,
    orange: 0xf97316,
    purple: 0x8b5cf6,
    violet: 0x7c3aed,
    pink: 0xec4899,
    rose: 0xf43f5e,
    cyan: 0x06b6d4,
    gold: 0xd97706,
    silver: 0xa1a1aa,
    bronze: 0x92400e,
    copper: 0xb45309,
    brown: 0x78350f,
    clear: 0xe2e8f0,
    transparent: 0xe2e8f0,
    translucent: 0xe2e8f0,
    custom: 0x6366f1,
  };

  for (const [key, hex] of Object.entries(map)) {
    if (clean.includes(key)) return hex;
  }

  return 0x2563eb;
}

export default function Interactive3DViewer({
  fileUrl,
  file,
  fileName,
  colorName = "Black",
  materialName: _materialName = "PLA",
  scaleFactor = 1.0,
  filaments,
  onDimensionsDetected,
  className = "",
  count = 1,
  compact = false,
  onExpand,
  showHelp = false,
}: Interactive3DViewerProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [showTooltips, setShowTooltips] = useState(false);
  const [bgColor, setBgColor] = useState("#0f172a");
  const [showGrid, setShowGrid] = useState(false);

  const [baseDimensions, setBaseDimensions] = useState<{
    x: number;
    y: number;
    z: number;
  } | null>(null);
  const [modelVersion, setModelVersion] = useState(0);

  // References to Three.js instances for dynamic updates
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const meshGroupRef = useRef<any>(null);
  const materialRef = useRef<any>(null);
  const originalModelRef = useRef<any>(null);
  const gridHelperRef = useRef<any>(null);
  const fitParamsRef = useRef<{ center: any; maxDim: number } | null>(
    null,
  );
  const requestRenderRef = useRef<() => void>(() => {});

  // Derive hex color from filament data or color name
  const effectiveHex = (() => {
    if (filaments && filaments.length > 0) {
      const match = filaments.find(
        (f) =>
          f.color?.toLowerCase() === colorName.toLowerCase() ||
          f.name?.toLowerCase().includes(colorName.toLowerCase()),
      );
      if (match?.color) {
        return getFilamentHexColor(match.color);
      }
    }
    return getFilamentHexColor(colorName);
  })();

  // 1. Initialize Scene & Three.js Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animationFrameId: number;
    let disposed = false;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 320;

    let isVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry?.isIntersecting ?? false;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const isMobile =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 || "ontouchstart" in window);

    const renderer = new WebGLRenderer({
      canvas,
      antialias: !isMobile,
      alpha: true,
      powerPreference: "default",
    });
    renderer.debug.checkShaderErrors = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.outputColorSpace = SRGBColorSpace;

    const scene = new Scene();
    sceneRef.current = scene;

    const camera = new PerspectiveCamera(40, width / height, 0.1, 2000);
    camera.position.set(0, 80, 160);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.6;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't flip below build plate
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight1 = new DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(60, 120, 80);
    if (!isMobile) {
      dirLight1.castShadow = true;
      dirLight1.shadow.mapSize.width = 512;
      dirLight1.shadow.mapSize.height = 512;
    }
    scene.add(dirLight1);

    const dirLight2 = new DirectionalLight(0x90b0e0, 0.5);
    dirLight2.position.set(-60, 60, -60);
    scene.add(dirLight2);

    const hemiLight = new HemisphereLight(0xffffff, 0x334155, 0.4);
    scene.add(hemiLight);

    // Build Plate Circular/Grid Plane (Generic 256mm reference)
    const gridHelper = new GridHelper(256, 32, 0x10b981, 0xe2e8f0);
    gridHelper.position.y = 0;
    gridHelper.visible = showGrid;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // Mesh group container
    const meshGroup = new Group();
    scene.add(meshGroup);
    meshGroupRef.current = meshGroup;

    // Shared physical material
    const mat = new MeshStandardMaterial({
      color: effectiveHex,
      roughness: 0.38,
      metalness: 0.08,
      wireframe: wireframe,
      side: DoubleSide,
    });
    materialRef.current = mat;

    let renderRequested = false;
    const requestRender = () => {
      if (!renderRequested && !disposed) {
        renderRequested = true;
        animationFrameId = requestAnimationFrame(render);
      }
    };
    requestRenderRef.current = requestRender;

    const render = () => {
      renderRequested = false;
      if (disposed) return;
      if (!isVisible || document.visibilityState === "hidden") {
        return;
      }
      const moved = controls.update();
      renderer.render(scene, camera);

      // Keep rendering if camera is still in motion (damping inertia or continuous auto-rotate)
      if (moved || controls.autoRotate) {
        requestRender();
      }
    };

    controls.addEventListener("change", requestRender);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          const w = entry.contentRect.width;
          const h = entry.contentRect.height;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          requestRender();
        }
      }
    });
    resizeObserver.observe(container);

    requestRender();

    return () => {
      disposed = true;
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.removeEventListener("change", requestRender);
      controls.dispose();
      disposeHierarchy(meshGroup);
      if (originalModelRef.current) {
        disposeHierarchy(originalModelRef.current);
        originalModelRef.current = null;
      }
      if (gridHelperRef.current?.geometry) {
        gridHelperRef.current.geometry.dispose();
      }
      renderer.dispose();
      mat.dispose();
    };
  }, []);

  // 2. Update controls autoRotate on state change
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      if (autoRotate) {
        requestRenderRef.current();
      }
    }
  }, [autoRotate]);

  // 3. Live Color Update: Link material color to selected filament color in real-time
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.color.setHex(effectiveHex);
      requestRenderRef.current();
    }
  }, [effectiveHex]);

  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
      requestRenderRef.current();
    }
  }, [showGrid]);

  // 4. Update wireframe on toggle
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.wireframe = wireframe;
      requestRenderRef.current();
    }
  }, [wireframe]);

  // 5. Load and Parse 3D Model (.stl, .3mf, .obj)
  useEffect(() => {
    let canceled = false;
    setLoading(true);
    setError(null);

    async function loadModel() {
      try {
        let buffer: ArrayBuffer;

        if (file) {
          buffer = await file.arrayBuffer();
        } else if (fileUrl) {
          const resolved = resolveAssetUrl(fileUrl);
          const res = await fetch(resolved);
          if (!res.ok) throw new Error(`Could not load model: ${res.statusText}`);
          buffer = await res.arrayBuffer();
        } else {
          setLoading(false);
          return;
        }

        if (canceled) return;

        // Detect format via magic bytes or file extensions
        let format: "stl" | "glb" | "3mf" | "obj" = "stl";
        if (buffer && buffer.byteLength >= 4) {
          const view = new DataView(buffer);
          const magic = view.getUint32(0, false);
          if (magic === 0x676c5446) {
            format = "glb"; // "glTF"
          } else if (magic === 0x504b0304) {
            format = "3mf"; // ZIP archive
          }
        }

        if (format === "stl") {
          const urlStr = (fileUrl || "").toLowerCase().split("?")[0];
          const nameStr = (fileName || file?.name || "").toLowerCase().split("?")[0];
          if (urlStr.endsWith(".glb") || urlStr.endsWith(".gltf") || nameStr.endsWith(".glb") || nameStr.endsWith(".gltf")) {
            format = "glb";
          } else if (urlStr.endsWith(".3mf") || nameStr.endsWith(".3mf")) {
            format = "3mf";
          } else if (urlStr.endsWith(".obj") || nameStr.endsWith(".obj")) {
            format = "obj";
          } else if (urlStr.endsWith(".stl") || nameStr.endsWith(".stl")) {
            format = "stl";
          }
        }

        let geometry: any = null;
        let group: any = null;

        if (format === "glb") {
          const { GLTFLoader } = await import(
            "three/examples/jsm/loaders/GLTFLoader.js"
          );
          const loader = new GLTFLoader();
          const gltf = await loader.parseAsync(buffer, "");
          group = gltf.scene;
        } else if (format === "3mf") {
          const { ThreeMFLoader } = await import(
            "three/examples/jsm/loaders/3MFLoader.js"
          );
          const loader = new ThreeMFLoader();
          group = loader.parse(buffer);
        } else if (format === "obj") {
          const { OBJLoader } = await import(
            "three/examples/jsm/loaders/OBJLoader.js"
          );
          const loader = new OBJLoader();
          const text = new TextDecoder().decode(buffer);
          group = loader.parse(text);
        } else {
          const workerResult = await parseModelGeometryWithWorker(
            buffer,
            fileName || file?.name || "model.stl",
          );

          if (workerResult?.positions) {
            const { BufferGeometry, BufferAttribute } = await import("three");
            geometry = new BufferGeometry();
            geometry.setAttribute(
              "position",
              new BufferAttribute(new Float32Array(workerResult.positions), 3),
            );
            if (workerResult.normals) {
              geometry.setAttribute(
                "normal",
                new BufferAttribute(new Float32Array(workerResult.normals), 3),
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
        }

        if (canceled) return;

        const meshGroup = meshGroupRef.current;
        if (!meshGroup || !materialRef.current) return;

        // Clear previous meshes with full recursive hierarchy cleanup
        while (meshGroup.children.length > 0) {
          const child = meshGroup.children[0] as any;
          meshGroup.remove(child);
          disposeHierarchy(child);
        }
        if (originalModelRef.current) {
          disposeHierarchy(originalModelRef.current);
          originalModelRef.current = null;
        }

        let computedBox: any;
        let baseObject: any;

        if (geometry) {
          geometry.computeVertexNormals();
          geometry.center();
          geometry.computeBoundingBox();

          const mesh = new Mesh(geometry, materialRef.current);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          baseObject = mesh;
        } else if (group) {
          group.traverse((child: any) => {
            if (child.isMesh) {
              const geom = child.geometry;
              if (geom) {
                geom.computeVertexNormals();
              }
              const hasVertexColors = !!(
                geom?.attributes?.color ||
                geom?.attributes?.COLOR_0 ||
                child.material?.vertexColors
              );
              if (hasVertexColors) {
                child.material = new MeshStandardMaterial({
                  color: 0xffffff,
                  vertexColors: true,
                  roughness: 0.38,
                  metalness: 0.08,
                  wireframe: wireframe,
                  side: DoubleSide,
                });
              } else if (child.material?.map) {
                child.material.wireframe = wireframe;
                child.material.side = DoubleSide;
              } else {
                child.material = materialRef.current;
              }
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Center group precisely around geometric origin
          const box = new Box3().setFromObject(group);
          const center = new Vector3();
          box.getCenter(center);
          group.position.sub(center);

          baseObject = group;
        } else {
          throw new Error("Unsupported 3D geometry format");
        }
        
        originalModelRef.current = baseObject;
        
        // Compute base box
        computedBox = new Box3().setFromObject(baseObject);

        // Calculate original bounding box dimensions in mm
        const sizeVec = new Vector3();
        computedBox.getSize(sizeVec);
        const bx = roundMillimeters(Math.abs(sizeVec.x));
        const by = roundMillimeters(Math.abs(sizeVec.y));
        const bz = roundMillimeters(Math.abs(sizeVec.z));

        const dims = { x: bx, y: by, z: bz };
        setBaseDimensions(dims);
        onDimensionsDetected?.(dims);

        // Store fit params
        const maxDim = Math.max(bx, by, bz) || 50;
        fitParamsRef.current = {
          center: new Vector3(0, (by * scaleFactor) / 2, 0),
          maxDim,
        };
        
        // We trigger the render effect via modelVersion and baseDimensions
        resetCameraView(maxDim * scaleFactor);
        setModelVersion((v) => v + 1);
        setLoading(false);
      } catch (err: any) {
        if (!canceled) {
          console.error("Failed to render 3D model:", err);
          setError(err.message || "Failed to render 3D preview.");
          setLoading(false);
        }
      }
    }

    loadModel();

    return () => {
      canceled = true;
    };
  }, [file, fileUrl, fileName]);


  // 5.5 Render instances based on count
  useEffect(() => {
    const meshGroup = meshGroupRef.current;
    if (!meshGroup || !originalModelRef.current) return;

    // Clear previous
    while (meshGroup.children.length > 0) {
      meshGroup.remove(meshGroup.children[0]);
    }

    const baseObj = originalModelRef.current;
    const computedBox = new Box3().setFromObject(baseObj);
    
    // To sit perfectly on the grid (y = 0), we offset by -minY
    const boxMinY = computedBox.min.y;

    const sizeVec = new Vector3();
    computedBox.getSize(sizeVec);
    const spacingX = sizeVec.x * 1.2 || 10;
    const spacingZ = sizeVec.z * 1.2 || 10;

    const safeCount = Math.max(1, Math.min(25, count || 1));
    const cols = Math.ceil(Math.sqrt(safeCount));
    const rows = Math.ceil(safeCount / cols);

    for (let i = 0; i < safeCount; i++) {
      const clone = baseObj.clone();
      
      const r = Math.floor(i / cols);
      const c = i % cols;
      
      const offsetX = (c - (cols - 1) / 2) * spacingX;
      const offsetZ = (r - (rows - 1) / 2) * spacingZ;
      
      clone.position.x += offsetX;
      clone.position.z += offsetZ;
      clone.position.y += -boxMinY; // Sit on plate
      
      meshGroup.add(clone);
    }
    

    // reset meshGroup position y just in case
    meshGroup.position.y = 0;
    
    // Auto-fit camera to new instances
    const groupBox = new Box3().setFromObject(meshGroup);
    const groupSize = new Vector3();
    groupBox.getSize(groupSize);
    const maxGroupDim = Math.max(groupSize.x, groupSize.y, groupSize.z) || 50;
    
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (camera && controls) {
      const center = new Vector3();
      groupBox.getCenter(center);
      const dist = Math.max(40, maxGroupDim * 1.5);
      controls.target.copy(center);
      camera.position.set(center.x + dist * 0.7, center.y + dist * 0.75, center.z + dist * 0.95);
      camera.lookAt(center);
      controls.update();
    }
    requestRenderRef.current();
  }, [count, baseDimensions, scaleFactor, modelVersion]);

  // 6. Visual Scaling of the mesh group when scaleFactor changes
  useEffect(() => {
    const meshGroup = meshGroupRef.current;
    if (meshGroup && baseDimensions) {
      const s = Math.max(0.05, scaleFactor);
      meshGroup.scale.set(s, s, s);
      requestRenderRef.current();
    }
  }, [scaleFactor, baseDimensions]);

  const resetCameraView = (effectiveDim?: number) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const dim = effectiveDim || fitParamsRef.current?.maxDim || 60;
    const dist = Math.max(40, dim * 2.2);
    const targetY = fitParamsRef.current?.center?.y ?? (dim * 0.2);

    controls.target.set(0, targetY, 0);
    camera.position.set(dist * 0.7, targetY + dist * 0.75, dist * 0.95);
    camera.lookAt(controls.target);
    controls.update();
    requestRenderRef.current();
  };

  // Scaled dimensions in mm
  const scaledX = baseDimensions ? roundMillimeters(baseDimensions.x * scaleFactor) : undefined;
  const scaledY = baseDimensions ? roundMillimeters(baseDimensions.y * scaleFactor) : undefined;
  const scaledZ = baseDimensions ? roundMillimeters(baseDimensions.z * scaleFactor) : undefined;

  const fitsBuildVolume =
    scaledX && scaledY && scaledZ
      ? scaledX <= MAX_DIMENSION_MM &&
        scaledY <= MAX_DIMENSION_MM &&
        scaledZ <= MAX_DIMENSION_MM
      : true;

  return (
    <div
      className={`relative flex flex-col rounded-2xl ${
        compact ? "border border-slate-800" : "border border-gray-200/90"
      } bg-slate-950 text-white overflow-hidden shadow-sm ${className}`}
    >
      {/* 3D Canvas Viewport */}
      <div
        ref={containerRef}
        className={`relative w-full ${
          compact ? "h-56 min-h-[220px]" : "flex-1 min-h-[320px] sm:min-h-[360px]"
        } cursor-grab active:cursor-grabbing select-none`}
        style={{ backgroundColor: bgColor }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-emerald-400" size={32} />
            <p className="text-sm font-semibold text-slate-200">
              {t("quote.detectingDimensions")}
            </p>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center">
            <AlertTriangle className="text-amber-400 mb-2" size={28} />
            <p className="text-sm text-slate-200 max-w-sm">{error}</p>
          </div>
        )}

        {/* Floating Top Controls */}
        <div className="absolute top-2.5 right-2.5 flex items-center justify-end pointer-events-none gap-2">
          {/* Quick Interactive Canvas Actions */}
          <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-md">
            <button
              type="button"
              onClick={() => setAutoRotate((prev) => !prev)}
              className={`p-1.5 rounded-lg transition-colors ${
                autoRotate
                  ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              }`}
              title={t("viewer3d.toggleRotation")}
            >
              <RotateCw size={14} />
            </button>
            <button
              type="button"
              onClick={() => setWireframe((prev) => !prev)}
              className={`p-1.5 rounded-lg transition-colors ${
                wireframe
                  ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              }`}
              title={t("viewer3d.toggleWireframe")}
            >
              <Box size={14} />
            </button>
            {!compact && (
              <>
                <button
                  type="button"
                  onClick={() => setShowGrid((prev) => !prev)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    showGrid
                      ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                      : "text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
                  title={t("viewer3d.toggleGrid")}
                >
                  <Grid3X3 size={15} />
                </button>
                <div className="flex items-center ml-1">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-5 h-5 p-0 border-0 rounded cursor-pointer bg-transparent"
                    title={t("viewer3d.changeBgColor")}
                  />
                </div>
              </>
            )}
            <button
              type="button"
              onClick={() => resetCameraView()}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title={t("viewer3d.resetCamera")}
            >
              <RotateCcw size={14} />
            </button>
            {!compact && showHelp && (
              <button
                type="button"
                onClick={() => setShowTooltips((prev) => !prev)}
                className={`p-1.5 rounded-lg transition-colors ${
                  showTooltips
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-slate-400 hover:text-white hover:bg-white/10"
                }`}
                title={t("viewer3d.printGuidelines")}
              >
                <HelpCircle size={15} />
              </button>
            )}
            {onExpand && (
              <button
                type="button"
                onClick={onExpand}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-emerald-500/30 hover:text-emerald-300 rounded-lg transition-colors"
                title={t("viewer3d.expandDialog")}
              >
                <Maximize2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {compact ? (
        <div className="bg-slate-900/90 border-t border-slate-800 px-3 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium text-[11px] truncate">
            <Box size={13} className="text-emerald-400 shrink-0" />
            {baseDimensions ? (
              <span>
                {scaledX} × {scaledY} × {scaledZ} mm
              </span>
            ) : (
              <span className="text-slate-400">{t("quote.detectingDimensions")}</span>
            )}
          </div>
          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 shrink-0 transition-colors ml-2"
            >
              <Maximize2 size={11} />
              {t("viewer3d.inspect")}
            </button>
          )}
        </div>
      ) : (
        /* Dimension Check & Physical Specs Bar (Below Canvas) */
        <div className="bg-slate-900 border-t border-slate-800 p-3.5 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Exact Bounding Box Dimensions in mm */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-800 rounded-lg text-emerald-400 border border-slate-700">
                <Box size={16} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {t("viewer3d.boundingBox")}
                </p>
                {baseDimensions ? (
                  <p className="text-sm font-extrabold text-white tracking-tight">
                    {scaledX} × {scaledY} × {scaledZ} mm
                    {scaleFactor !== 1.0 && (
                      <span className="ml-1.5 text-xs font-normal text-slate-400">
                        (Base: {baseDimensions.x} × {baseDimensions.y} ×{" "}
                        {baseDimensions.z} mm @ {scaleFactor.toFixed(2)}x)
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">{t("quote.detectingDimensions")}</p>
                )}
              </div>
            </div>

            {/* Build Volume Compliance Badge */}
            {baseDimensions && !fitsBuildVolume && (
              <div className="flex items-center">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  <AlertTriangle size={13} />
                  {t("viewer3d.exceedsBuildVolume")}
                </span>
              </div>
            )}
          </div>

          {/* UX Instructions & Tooltips Box */}
          {showHelp && showTooltips && (
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <Layers size={13} />
                  <span>{t("viewer3d.layerHeightTitle")}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {t("viewer3d.layerHeightDesc")}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Box size={13} />
                  <span>{t("viewer3d.infillDensityTitle")}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {t("viewer3d.infillDensityDesc")}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-sky-400">
                  <Palette size={13} />
                  <span>{t("viewer3d.colorMaterialTitle")}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {t("viewer3d.colorMaterialDesc")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

