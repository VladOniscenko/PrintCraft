import { Box3, Vector3 } from "three";

export const MAX_DIMENSION_MM = 256;
export const MIN_SCALE = 0.1;
export const SCALE_STEP = 0.05;

export const MODEL_EXTENSIONS = new Set([".stl", ".obj", ".3mf", ".step", ".stp", ".glb", ".gltf"]);

export function getFileExtension(fileName?: string): string {
  if (!fileName) return "";
  const clean = fileName.split("?")[0].trim().toLowerCase();
  const lastDot = clean.lastIndexOf(".");
  return lastDot >= 0 ? clean.slice(lastDot) : "";
}

export function roundMillimeters(val: number): number {
  return Math.round(val * 10) / 10;
}

export function hasDimensionValue(val: number | null | undefined): val is number {
  return typeof val === "number" && !Number.isNaN(val) && val > 0;
}

export function getMaximumScaleForBase(
  baseX?: number,
  baseY?: number,
  baseZ?: number,
): number {
  if (!hasDimensionValue(baseX) || !hasDimensionValue(baseY) || !hasDimensionValue(baseZ)) {
    return 3.0;
  }
  const maxAxis = Math.max(baseX, baseY, baseZ);
  if (maxAxis <= 0) return 3.0;

  const rawMax = MAX_DIMENSION_MM / maxAxis;
  const stepped = Math.floor(rawMax / SCALE_STEP) * SCALE_STEP;
  return Math.max(MIN_SCALE, Math.min(stepped, 10.0));
}

export function clampScale(scale: number, maxScale: number): number {
  return Math.max(MIN_SCALE, Math.min(scale, maxScale));
}

export async function detectModelDimensionsDirect(
  buffer: ArrayBuffer,
  fileName: string,
): Promise<{ x: number; y: number; z: number } | null> {
  const ext = getFileExtension(fileName);
  if (!MODEL_EXTENSIONS.has(ext)) return null;

  try {
    if (ext === ".stl") {
      const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js");
      const loader = new STLLoader();
      const geometry = loader.parse(buffer);
      geometry.computeBoundingBox();
      const box = geometry.boundingBox;
      if (!box) return null;
      const size = new Vector3();
      box.getSize(size);
      const x = roundMillimeters(Math.abs(size.x));
      const y = roundMillimeters(Math.abs(size.y));
      const z = roundMillimeters(Math.abs(size.z));
      geometry.dispose();
      if (x <= 0 || y <= 0 || z <= 0) return null;
      return { x, y, z };
    }

    if (ext === ".3mf") {
      const { ThreeMFLoader } = await import("three/examples/jsm/loaders/3MFLoader.js");
      const loader = new ThreeMFLoader();
      const group = loader.parse(buffer);
      const box = new Box3().setFromObject(group);
      if (box.isEmpty()) return null;
      const size = new Vector3();
      box.getSize(size);
      const x = roundMillimeters(Math.abs(size.x));
      const y = roundMillimeters(Math.abs(size.y));
      const z = roundMillimeters(Math.abs(size.z));
      if (x <= 0 || y <= 0 || z <= 0) return null;
      return { x, y, z };
    }

    if (ext === ".obj") {
      const { OBJLoader } = await import("three/examples/jsm/loaders/OBJLoader.js");
      const loader = new OBJLoader();
      const text = new TextDecoder().decode(buffer);
      const group = loader.parse(text);
      const box = new Box3().setFromObject(group);
      if (box.isEmpty()) return null;
      const size = new Vector3();
      box.getSize(size);
      const x = roundMillimeters(Math.abs(size.x));
      const y = roundMillimeters(Math.abs(size.y));
      const z = roundMillimeters(Math.abs(size.z));
      if (x <= 0 || y <= 0 || z <= 0) return null;
      return { x, y, z };
    }

    if (ext === ".glb" || ext === ".gltf") {
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const loader = new GLTFLoader();
      const gltf = await loader.parseAsync(buffer, "");
      const box = new Box3().setFromObject(gltf.scene);
      if (box.isEmpty()) return null;
      const size = new Vector3();
      box.getSize(size);
      const x = roundMillimeters(Math.abs(size.x));
      const y = roundMillimeters(Math.abs(size.y));
      const z = roundMillimeters(Math.abs(size.z));
      if (x <= 0 || y <= 0 || z <= 0) return null;
      return { x, y, z };
    }

    return null;
  } catch (err) {
    console.warn("Could not detect model dimensions:", err);
    return null;
  }
}

let workerInstance: Worker | null = null;

export type WorkerParseResult = {
  dims: { x: number; y: number; z: number } | null;
  positions?: ArrayBuffer;
  normals?: ArrayBuffer;
};

const pendingWorkerRequests = new Map<
  string,
  {
    resolve: (result: WorkerParseResult | null) => void;
  }
>();

function getWorker(): Worker | null {
  if (typeof window === "undefined" || typeof Worker === "undefined") return null;
  if (!workerInstance) {
    try {
      workerInstance = new Worker(
        new URL("../workers/modelParser.worker.ts", import.meta.url),
        { type: "module" },
      );
      workerInstance.onmessage = (
        e: MessageEvent<{
          id: string;
          success: boolean;
          dims?: { x: number; y: number; z: number } | null;
          positions?: ArrayBuffer;
          normals?: ArrayBuffer;
        }>,
      ) => {
        const req = pendingWorkerRequests.get(e.data.id);
        if (req) {
          pendingWorkerRequests.delete(e.data.id);
          req.resolve(
            e.data.success
              ? {
                  dims: e.data.dims || null,
                  positions: e.data.positions,
                  normals: e.data.normals,
                }
              : null,
          );
        }
      };
      workerInstance.onerror = (err) => {
        console.warn("Model parser worker error, falling back to main thread:", err);
        workerInstance?.terminate();
        workerInstance = null;
      };
    } catch {
      workerInstance = null;
    }
  }
  return workerInstance;
}

export async function parseModelGeometryWithWorker(
  buffer: ArrayBuffer,
  fileName: string,
): Promise<WorkerParseResult | null> {
  const ext = getFileExtension(fileName);
  if (!MODEL_EXTENSIONS.has(ext)) return null;

  const worker = getWorker();
  if (worker) {
    try {
      return await new Promise<WorkerParseResult | null>((resolve) => {
        const id =
          Math.random().toString(36).slice(2) + Date.now().toString(36);
        pendingWorkerRequests.set(id, { resolve });

        const copy = buffer.slice(0);
        worker.postMessage(
          { id, buffer: copy, fileName, includeGeometry: true },
          [copy],
        );

        setTimeout(() => {
          if (pendingWorkerRequests.has(id)) {
            pendingWorkerRequests.delete(id);
            resolve(null);
          }
        }, 10000);
      });
    } catch {
      return null;
    }
  }
  return null;
}

export async function detectModelDimensionsFromBuffer(
  buffer: ArrayBuffer,
  fileName: string,
): Promise<{ x: number; y: number; z: number } | null> {
  const ext = getFileExtension(fileName);
  if (!MODEL_EXTENSIONS.has(ext)) return null;

  const worker = getWorker();
  if (worker) {
    try {
      const res = await new Promise<WorkerParseResult | null>(
        (resolve) => {
          const id =
            Math.random().toString(36).slice(2) + Date.now().toString(36);
          pendingWorkerRequests.set(id, { resolve });

          // Send a copy via transferable buffer so the caller's buffer isn't detached
          const copy = buffer.slice(0);
          worker.postMessage(
            { id, buffer: copy, fileName, includeGeometry: false },
            [copy],
          );

          // Safety timeout of 10s before fallback
          setTimeout(() => {
            if (pendingWorkerRequests.has(id)) {
              pendingWorkerRequests.delete(id);
              detectModelDimensionsDirect(buffer, fileName).then((dims) =>
                resolve(dims ? { dims } : null),
              );
            }
          }, 10000);
        },
      );
      return res?.dims || null;
    } catch {
      return detectModelDimensionsDirect(buffer, fileName);
    }
  }

  return detectModelDimensionsDirect(buffer, fileName);
}

export async function detectModelDimensions(file: File): Promise<{
  x: number;
  y: number;
  z: number;
} | null> {
  try {
    const buffer = await file.arrayBuffer();
    return await detectModelDimensionsFromBuffer(buffer, file.name);
  } catch {
    return null;
  }
}

