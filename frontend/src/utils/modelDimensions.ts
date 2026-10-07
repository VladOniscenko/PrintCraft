import { Box3, Vector3 } from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

export const MAX_DIMENSION_MM = 256;
export const MIN_SCALE = 0.1;
export const SCALE_STEP = 0.05;

export const MODEL_EXTENSIONS = new Set([".stl", ".obj", ".3mf", ".step", ".stp"]);

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

export async function detectModelDimensionsFromBuffer(
  buffer: ArrayBuffer,
  fileName: string,
): Promise<{ x: number; y: number; z: number } | null> {
  const ext = getFileExtension(fileName);
  if (!MODEL_EXTENSIONS.has(ext)) return null;

  try {
    if (ext === ".stl") {
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
      if (x <= 0 || y <= 0 || z <= 0) return null;
      return { x, y, z };
    }

    if (ext === ".3mf") {
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

    return null;
  } catch (err) {
    console.warn("Could not detect model dimensions:", err);
    return null;
  }
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

