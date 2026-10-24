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
      try {
        let parsedViaLoader = false;
        try {
          const { ThreeMFLoader } = await import(
            "three/examples/jsm/loaders/3MFLoader.js"
          );
          const loader = new ThreeMFLoader();
          const group = loader.parse(buffer);

          // Iterate over all child meshes/objects in group and combine bounding box
          const box = new Box3();
          let meshCount = 0;
          const positions: number[] = [];

          group.traverse((child: any) => {
            if (child.isMesh && child.geometry) {
              meshCount++;
              child.geometry.computeBoundingBox();
              const geomBox = child.geometry.boundingBox;
              if (geomBox && !geomBox.isEmpty()) {
                box.expandByPoint(geomBox.min.clone().applyMatrix4(child.matrixWorld));
                box.expandByPoint(geomBox.max.clone().applyMatrix4(child.matrixWorld));
              }

              if (includeGeometry && child.geometry.attributes?.position) {
                const posArray = child.geometry.attributes.position.array;
                for (let i = 0; i < posArray.length; i += 3) {
                  const v = new Vector3(posArray[i], posArray[i + 1], posArray[i + 2]);
                  v.applyMatrix4(child.matrixWorld);
                  positions.push(v.x, v.y, v.z);
                }
              }
            }
          });

          if (meshCount > 0 && !box.isEmpty()) {
            const size = new Vector3();
            box.getSize(size);
            if (size.x > 0 && size.y > 0 && size.z > 0) {
              dims = {
                x: Math.round(Math.abs(size.x) * 10) / 10,
                y: Math.round(Math.abs(size.y) * 10) / 10,
                z: Math.round(Math.abs(size.z) * 10) / 10,
              };
              parsedViaLoader = true;
              if (includeGeometry && positions.length > 0) {
                const posCopy = new Float32Array(positions).buffer;
                positionsBuffer = posCopy;
                transferables.push(posCopy);
              }
            }
          }
        } catch {
          // ThreeMFLoader may throw on multi-plate / multi-object 3MF archives
        }

        // Fallback: Safely inspect raw 3MF ZIP archive for multi-plate and multi-mesh data
        if (!parsedViaLoader) {
          const { unzipSync } = await import(
            "three/examples/jsm/libs/fflate.module.js"
          );
          const unzipped = unzipSync(new Uint8Array(buffer));

          let minX = Infinity, maxX = -Infinity;
          let minY = Infinity, maxY = -Infinity;
          let minZ = Infinity, maxZ = -Infinity;
          let hasVertices = false;
          const fallbackPositions: number[] = [];

          const textDecoder = new TextDecoder();
          const modelKeys = Object.keys(unzipped).filter((k) =>
            k.toLowerCase().endsWith(".model"),
          );

          for (const key of modelKeys) {
            const xmlText = textDecoder.decode(unzipped[key]);

            // Scan all mesh blocks or whole document across plates
            const meshBlocks =
              xmlText.match(/<(?:\w+:)?mesh[\s\S]*?<\/(?:\w+:)?mesh>/gi) || [xmlText];

            for (const block of meshBlocks) {
              const meshVerts: [number, number, number][] = [];
              const vertexRegex = /<(?:\w+:)?vertex\s+([^>]+)\/?>/gi;
              let vm: RegExpExecArray | null;

              while ((vm = vertexRegex.exec(block)) !== null) {
                const attrs = vm[1];
                const xm = /x="([^"]+)"/i.exec(attrs);
                const ym = /y="([^"]+)"/i.exec(attrs);
                const zm = /z="([^"]+)"/i.exec(attrs);
                if (xm && ym && zm) {
                  const x = parseFloat(xm[1]);
                  const y = parseFloat(ym[1]);
                  const z = parseFloat(zm[1]);
                  if (!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(z)) {
                    meshVerts.push([x, y, z]);
                    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
                    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
                    hasVertices = true;
                  }
                }
              }

              if (includeGeometry && meshVerts.length > 0) {
                const triRegex = /<(?:\w+:)?triangle\s+([^>]+)\/?>/gi;
                let tm: RegExpExecArray | null;
                while ((tm = triRegex.exec(block)) !== null) {
                  const tattrs = tm[1];
                  const v1m = /v1="([^"]+)"/i.exec(tattrs);
                  const v2m = /v2="([^"]+)"/i.exec(tattrs);
                  const v3m = /v3="([^"]+)"/i.exec(tattrs);
                  if (v1m && v2m && v3m) {
                    const i1 = parseInt(v1m[1], 10);
                    const i2 = parseInt(v2m[1], 10);
                    const i3 = parseInt(v3m[1], 10);
                    if (
                      i1 >= 0 && i1 < meshVerts.length &&
                      i2 >= 0 && i2 < meshVerts.length &&
                      i3 >= 0 && i3 < meshVerts.length
                    ) {
                      const [x1, y1, z1] = meshVerts[i1];
                      const [x2, y2, z2] = meshVerts[i2];
                      const [x3, y3, z3] = meshVerts[i3];
                      fallbackPositions.push(x1, y1, z1, x2, y2, z2, x3, y3, z3);
                    }
                  }
                }
              }
            }
          }

          if (hasVertices && minX !== Infinity) {
            const sx = Math.max(0.1, maxX - minX);
            const sy = Math.max(0.1, maxY - minY);
            const sz = Math.max(0.1, maxZ - minZ);
            dims = {
              x: Math.round(sx * 10) / 10,
              y: Math.round(sy * 10) / 10,
              z: Math.round(sz * 10) / 10,
            };

            if (includeGeometry && fallbackPositions.length > 0) {
              const posCopy = new Float32Array(fallbackPositions).buffer;
              positionsBuffer = posCopy;
              transferables.push(posCopy);
            }
          }
        }
      } catch (err: unknown) {
        console.warn("3MF multi-plate parsing error:", err);
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
