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
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import {
  RotateCw,
  RotateCcw,
  Box,
  Layers,
  HelpCircle,
  CheckCircle2,
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
} from "../utils/modelDimensions";
import type { Filament } from "../types";

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
  materialName = "PLA",
  scaleFactor = 1.0,
  filaments,
  onDimensionsDetected,
  className = "",
  count = 1,
  compact = false,
  onExpand,
}: Interactive3DViewerProps) {
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

    const renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.shadowMap.enabled = true;
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
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
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
    });
    materialRef.current = mat;

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          const w = entry.contentRect.width;
          const h = entry.contentRect.height;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        }
      }
    });
    resizeObserver.observe(container);

    const animate = () => {
      if (disposed) return;
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      mat.dispose();
    };
  }, []);

  // 2. Update controls autoRotate on state change
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // 3. Live Color Update: Link material color to selected filament color in real-time
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.color.setHex(effectiveHex);
    }
  }, [effectiveHex]);

  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  // 4. Update wireframe on toggle
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.wireframe = wireframe;
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
        const targetName = fileName || file?.name || fileUrl || "model.stl";
        const ext = targetName.toLowerCase().split("?")[0];

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

        let geometry: any = null;
        let group: any = null;

        if (ext.endsWith(".stl")) {
          const loader = new STLLoader();
          geometry = loader.parse(buffer);
        } else if (ext.endsWith(".3mf")) {
          const loader = new ThreeMFLoader();
          group = loader.parse(buffer);
        } else if (ext.endsWith(".obj")) {
          const loader = new OBJLoader();
          const text = new TextDecoder().decode(buffer);
          group = loader.parse(text);
        } else {
          // Default try STL
          const loader = new STLLoader();
          geometry = loader.parse(buffer);
        }

        if (canceled) return;

        const meshGroup = meshGroupRef.current;
        if (!meshGroup || !materialRef.current) return;

        // Clear previous meshes
        while (meshGroup.children.length > 0) {
          const child = meshGroup.children[0] as any;
          meshGroup.remove(child);
          if (child.geometry) child.geometry.dispose();
        }

        let computedBox: any;

        let baseObject: any;

        if (geometry) {
          geometry.computeVertexNormals();
          // To render in center of view: use center() but also calculate proper bounding box
          geometry.center();
          geometry.computeBoundingBox();

          const mesh = new Mesh(geometry, materialRef.current);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          baseObject = mesh;
        } else if (group) {
          group.traverse((child: any) => {
            if (child.isMesh) {
              child.material = materialRef.current;
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          // Center group
          const box = new Box3().setFromObject(group);
          const center = new Vector3();
          box.getCenter(center);
          group.position.x += (group.position.x - center.x);
          group.position.y += (group.position.y - center.y);
          group.position.z += (group.position.z - center.z);
          
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
        
        // We do not add to meshGroup here; we will trigger the render effect
        // But we need to call resetCameraView once.
        resetCameraView(maxDim * scaleFactor);
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

    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);

    for (let i = 0; i < count; i++) {
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
      const dist = Math.max(40, maxGroupDim * 1.5); // use 1.5 for multiple objects to fit nicely
      controls.target.set(0, (maxGroupDim * 0.4), 0);
      camera.position.set(dist * 0.8, dist * 0.8, dist * 1.1);
      camera.lookAt(controls.target);
      controls.update();
    }
    
  }, [count, baseDimensions, scaleFactor]);


  // 6. Visual Scaling of the mesh group when scaleFactor changes
  useEffect(() => {
    const meshGroup = meshGroupRef.current;
    if (meshGroup && baseDimensions) {
      const s = Math.max(0.05, scaleFactor);
      meshGroup.scale.set(s, s, s);
    }
  }, [scaleFactor, baseDimensions]);

  const resetCameraView = (effectiveDim?: number) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const dim = effectiveDim || fitParamsRef.current?.maxDim || 60;
    const dist = Math.max(40, dim * 2.2);

    controls.target.set(0, (dim * 0.4), 0);
    camera.position.set(dist * 0.8, dist * 0.8, dist * 1.1);
    camera.lookAt(controls.target);
    controls.update();
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
      className={`relative flex flex-col rounded-2xl border border-gray-200/90 bg-slate-950 text-white overflow-hidden shadow-sm ${className}`}
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
              Loading 3D mesh & dimensions...
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
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none gap-2">
          {/* Material & Color Live Badge */}
          <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 text-xs shadow-md">
            <span
              className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-inner shrink-0"
              style={{
                backgroundColor: `#${effectiveHex.toString(16).padStart(6, "0")}`,
              }}
            />
            <span className="font-bold text-white truncate max-w-[100px] text-xs">
              {colorName}
            </span>
            {!compact && (
              <span className="text-slate-400 font-medium">({materialName})</span>
            )}
          </div>

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
              title="Toggle Auto-Rotation"
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
              title="Toggle Wireframe Mesh"
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
                  title="Toggle Ground Grid"
                >
                  <Grid3X3 size={15} />
                </button>
                <div className="flex items-center ml-1">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-5 h-5 p-0 border-0 rounded cursor-pointer bg-transparent"
                    title="Change Background Color"
                  />
                </div>
              </>
            )}
            <button
              type="button"
              onClick={() => resetCameraView()}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Reset Camera View"
            >
              <RotateCcw size={14} />
            </button>
            {!compact && (
              <button
                type="button"
                onClick={() => setShowTooltips((prev) => !prev)}
                className={`p-1.5 rounded-lg transition-colors ${
                  showTooltips
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-slate-400 hover:text-white hover:bg-white/10"
                }`}
                title="Print Guidelines & Tooltips"
              >
                <HelpCircle size={15} />
              </button>
            )}
            {onExpand && (
              <button
                type="button"
                onClick={onExpand}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-emerald-500/30 hover:text-emerald-300 rounded-lg transition-colors"
                title="Expand 3D Dialog"
              >
                <Maximize2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Interaction Hint (Bottom Left) */}
        <div className="absolute bottom-2 left-2.5 pointer-events-none">
          <p className="text-[9px] text-slate-400/80 tracking-wide font-medium bg-slate-950/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
            {compact ? "Drag to rotate • Scroll to zoom" : "Drag to rotate • Scroll to zoom • Right-click to pan"}
          </p>
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
              <span className="text-slate-400">Detecting dimensions...</span>
            )}
          </div>
          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 shrink-0 transition-colors ml-2"
            >
              <Maximize2 size={11} />
              Inspect
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
                  Bounding Box Dimensions
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
                  <p className="text-xs text-slate-400">Detecting dimensions...</p>
                )}
              </div>
            </div>

            {/* Build Volume Compliance Badge */}
            {baseDimensions && (
              <div className="flex items-center">
                {fitsBuildVolume ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 size={13} />
                    Fits build plate (max 256 mm)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    <AlertTriangle size={13} />
                    Exceeds build volume (&gt;256 mm)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* UX Instructions & Tooltips Box */}
          {showTooltips && (
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <Layers size={13} />
                  <span>Layer Height</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Standard <strong>0.20mm</strong> offers the ideal balance of speed and finish. Use <strong>0.12mm</strong> for fine detail/miniatures, or <strong>0.28mm</strong> for fast prototypes.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Box size={13} />
                  <span>Infill Density</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <strong>15%–20%</strong> is optimal for display and decorative pieces. Use <strong>40%+</strong> for mechanical brackets and load-bearing tools.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-sky-400">
                  <Palette size={13} />
                  <span>Color & Material</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Previewed live above on your 3D geometry. Colors directly correspond to in-stock spools in our material inventory.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

