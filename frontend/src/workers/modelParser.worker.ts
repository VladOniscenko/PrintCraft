import { Box3, Vector3 } from "three";

self.onmessage = async (
  e: MessageEvent<{
    id: string;
    buffer: ArrayBuffer;
    fileName: string;
    includeGeometry?: boolean;
  }>,
) => {
  const { id, buffer, fileName, includeGeometry } = e.data;
  try {
    const clean = fileName.split("?")[0].trim().toLowerCase();
    const lastDot = clean.lastIndexOf(".");
    const ext = lastDot >= 0 ? clean.slice(lastDot) : "";

    let dims: { x: number; y: number; z: number } | null = null;
    let positionsBuffer: ArrayBuffer | undefined;
    let normalsBuffer: ArrayBuffer | undefined;
    const transferables: Transferable[] = [];

    if (ext === ".stl") {
      const { STLLoader } = await import(
        "three/examples/jsm/loaders/STLLoader.js"
      );
      const loader = new STLLoader();
      const geometry = loader.parse(buffer);
      geometry.computeBoundingBox();
      const box = geometry.boundingBox;
      if (box) {
        const size = new Vector3();
        box.getSize(size);
        dims = {
          x: Math.round(Math.abs(size.x) * 10) / 10,
          y: Math.round(Math.abs(size.y) * 10) / 10,
          z: Math.round(Math.abs(size.z) * 10) / 10,
        };
      }

      if (includeGeometry) {
        if (!geometry.attributes.normal) {
          geometry.computeVertexNormals();
        }
        const posAttr = geometry.attributes.position;
        const normAttr = geometry.attributes.normal;
        if (posAttr?.array) {
          const posCopy =
            posAttr.array instanceof Float32Array
              ? (posAttr.array.buffer.slice(
                  posAttr.array.byteOffset,
                  posAttr.array.byteOffset + posAttr.array.byteLength,
                ) as ArrayBuffer)
              : new Float32Array(posAttr.array).buffer;
          positionsBuffer = posCopy;
          transferables.push(posCopy);
        }
        if (normAttr?.array) {
          const normCopy =
            normAttr.array instanceof Float32Array
              ? (normAttr.array.buffer.slice(
                  normAttr.array.byteOffset,
                  normAttr.array.byteOffset + normAttr.array.byteLength,
                ) as ArrayBuffer)
              : new Float32Array(normAttr.array).buffer;
          normalsBuffer = normCopy;
          transferables.push(normCopy);
        }
      }
      geometry.dispose();
    } else if (ext === ".3mf") {
      const { ThreeMFLoader } = await import(
        "three/examples/jsm/loaders/3MFLoader.js"
      );
      const loader = new ThreeMFLoader();
      const group = loader.parse(buffer);
      const box = new Box3().setFromObject(group);
      if (!box.isEmpty()) {
        const size = new Vector3();
        box.getSize(size);
        dims = {
          x: Math.round(Math.abs(size.x) * 10) / 10,
          y: Math.round(Math.abs(size.y) * 10) / 10,
          z: Math.round(Math.abs(size.z) * 10) / 10,
        };
      }
    } else if (ext === ".obj") {
      const { OBJLoader } = await import(
        "three/examples/jsm/loaders/OBJLoader.js"
      );
      const loader = new OBJLoader();
      const text = new TextDecoder().decode(buffer);
      const group = loader.parse(text);
      const box = new Box3().setFromObject(group);
      if (!box.isEmpty()) {
        const size = new Vector3();
        box.getSize(size);
        dims = {
          x: Math.round(Math.abs(size.x) * 10) / 10,
          y: Math.round(Math.abs(size.y) * 10) / 10,
          z: Math.round(Math.abs(size.z) * 10) / 10,
        };
      }
    } else if (ext === ".glb" || ext === ".gltf") {
      const { GLTFLoader } = await import(
        "three/examples/jsm/loaders/GLTFLoader.js"
      );
      const loader = new GLTFLoader();
      const gltf = await loader.parseAsync(buffer, "");
      const box = new Box3().setFromObject(gltf.scene);
      if (!box.isEmpty()) {
        const size = new Vector3();
        box.getSize(size);
        dims = {
          x: Math.round(Math.abs(size.x) * 10) / 10,
          y: Math.round(Math.abs(size.y) * 10) / 10,
          z: Math.round(Math.abs(size.z) * 10) / 10,
        };
      }
    }

    if (dims && (dims.x <= 0 || dims.y <= 0 || dims.z <= 0)) {
      dims = null;
    }

    (self.postMessage as (message: any, transfer: Transferable[]) => void)(
      {
        id,
        success: true,
        dims,
        positions: positionsBuffer,
        normals: normalsBuffer,
      },
      transferables,
    );
  } catch (err: unknown) {
    self.postMessage({
      id,
      success: false,
      error: err instanceof Error ? err.message : "Parsing failed",
    });
  }
};
