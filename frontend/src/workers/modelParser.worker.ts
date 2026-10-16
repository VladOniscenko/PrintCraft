import { Box3, Vector3 } from "three";

self.onmessage = async (
  e: MessageEvent<{ id: string; buffer: ArrayBuffer; fileName: string }>,
) => {
  const { id, buffer, fileName } = e.data;
  try {
    const clean = fileName.split("?")[0].trim().toLowerCase();
    const lastDot = clean.lastIndexOf(".");
    const ext = lastDot >= 0 ? clean.slice(lastDot) : "";

    let dims: { x: number; y: number; z: number } | null = null;

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

    self.postMessage({ id, success: true, dims });
  } catch (err: unknown) {
    self.postMessage({
      id,
      success: false,
      error: err instanceof Error ? err.message : "Parsing failed",
    });
  }
};
