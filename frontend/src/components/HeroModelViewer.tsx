import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { useI18n } from "../i18n/I18nContext";

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

export default function HeroModelViewer({
  src,
  className,
  onInteractionStart,
  onInteractionEnd,
}: HeroModelViewerProps) {
  const { language } = useI18n();
  const isNl = language === "nl";
  const ext = useMemo(() => getExt(src), [src]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelColor = useMemo(() => pickRandomColor(), [src]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const onInteractionStartRef = useRef(onInteractionStart);
  onInteractionStartRef.current = onInteractionStart;
  const onInteractionEndRef = useRef(onInteractionEnd);
  onInteractionEndRef.current = onInteractionEnd;

  useEffect(() => {
    setStatus("loading");
  }, [src]);

  useEffect(() => {
    const isSupported = ext === "stl" || ext === "" || ext === "model3d";
    if (!isSupported || !canvasRef.current) {
      setStatus("error");
      return;
    }

    let mounted = true;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth || 560;
    const height = canvas.clientHeight || 360;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(0, 16, 34);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.1;
    controls.enablePan = false;
    controls.target.set(0, 0, 0);
    controls.update();

    const handleStart = () => onInteractionStartRef.current?.();
    const handleEnd = () => onInteractionEndRef.current?.();
    controls.addEventListener("start", handleStart);
    controls.addEventListener("end", handleEnd);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.7);
    keyLight.position.set(18, 24, 14);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(modelColor, 1.05);
    fillLight.position.set(-18, 12, -10);
    scene.add(fillLight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.18));

    function fitObject(object: any): void {
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

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    if (ext === "stl" || ext === "" || ext === "model3d") {
      const loader = new STLLoader();
      loader.load(
        src,
        (geometry: any) => {
          if (!mounted) return;

          geometry.computeBoundingBox();
          geometry.computeBoundingSphere();
          const radius = geometry.boundingSphere?.radius ?? 0;
          if (!Number.isFinite(radius) || radius <= 0) {
            setStatus("error");
            return;
          }

          geometry.center();
          geometry.computeVertexNormals();

          const material = new THREE.MeshStandardMaterial({
            color: modelColor,
            emissive: modelColor,
            emissiveIntensity: 0.22,
            metalness: 0.04,
            roughness: 0.62,
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.rotation.x = -Math.PI / 2;
          const normalizedScale = 8 / radius;
          mesh.scale.setScalar(normalizedScale);

          modelGroup.add(mesh);
          fitObject(modelGroup);
          setStatus("ready");
        },
        undefined,
        () => {
          if (!mounted) return;
          setStatus("error");
        },
      );
    }

    let frameId = 0;
    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nextWidth = canvas.clientWidth || width;
      const nextHeight = canvas.clientHeight || height;
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight, false);
    };
    window.addEventListener("resize", onResize);

    return () => {
      mounted = false;
      window.removeEventListener("resize", onResize);
      window.cancelAnimationFrame(frameId);
      controls.removeEventListener("start", handleStart);
      controls.removeEventListener("end", handleEnd);
      controls.dispose();
      renderer.dispose();
      scene.traverse((obj: any) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m: any) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    };
  }, [ext, modelColor, src]);

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
          {isNl ? "3D-model laden..." : "Loading 3D model..."}
        </p>
      ) : null}
      {status === "error" ? (
        <p className="absolute z-40 left-1/2 -translate-x-1/2 bottom-8 text-xs text-white/75 text-center px-4">
          {isNl
            ? "Dit 3D-bestand kon niet worden geladen. Probeer een ander bestand."
            : "This STL could not be previewed. Try another STL file."}
        </p>
      ) : null}
    </>
  );
}
