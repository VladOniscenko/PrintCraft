import {
  Group,
  Mesh,
  PlaneGeometry,
  BoxGeometry,
  MeshStandardMaterial,
  ShadowMaterial,
  CanvasTexture,
  SRGBColorSpace,
  DoubleSide,
} from "three";

/**
 * Creates an authentic Bambu Lab Studio style 256 x 256 mm textured PEI build plate.
 * Sits flat on the XZ ground plane at y = 0 with contact shadow reception.
 */
export function createBambuBuildPlate(): any {
  const group = new Group();
  group.name = "BambuBuildPlate";

  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    // 1. Dark charcoal textured PEI background
    ctx.fillStyle = "#1b1f24";
    ctx.fillRect(0, 0, size, size);

    // 2. Subtle PEI surface stippling
    ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
    for (let i = 0; i < 25000; i++) {
      const rx = Math.random() * size;
      const ry = Math.random() * size;
      ctx.fillRect(rx, ry, 1.5, 1.5);
    }

    // 3. Printable area definition (256mm x 256mm with 40px margins on canvas)
    const margin = 40;
    const printAreaSize = size - margin * 2;

    // Subtle bed boundary
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(margin, margin, printAreaSize, printAreaSize);

    // 4. Grid lines (16 divisions across 256mm -> 16mm grid cells like Bambu Studio)
    const divisions = 16;
    const step = printAreaSize / divisions;

    // Minor grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;
    for (let i = 1; i < divisions; i++) {
      const p = margin + i * step;
      ctx.beginPath();
      ctx.moveTo(p, margin);
      ctx.lineTo(p, size - margin);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(margin, p);
      ctx.lineTo(size - margin, p);
      ctx.stroke();
    }

    // Major grid lines (every 4 divisions = 64mm)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1.5;
    for (let i = 4; i < divisions; i += 4) {
      const p = margin + i * step;
      ctx.beginPath();
      ctx.moveTo(p, margin);
      ctx.lineTo(p, size - margin);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(margin, p);
      ctx.lineTo(size - margin, p);
      ctx.stroke();
    }

    // 5. Center crosshair in soft Bambu cyan/sky
    const center = size / 2;
    ctx.strokeStyle = "rgba(56, 189, 248, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center - 20, center);
    ctx.lineTo(center + 20, center);
    ctx.moveTo(center, center - 20);
    ctx.lineTo(center, center + 20);
    ctx.stroke();

    // 6. Corner alignment marks (classic Bambu corner brackets)
    const cornerLen = 22;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 2.5;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(margin, margin + cornerLen);
    ctx.lineTo(margin, margin);
    ctx.lineTo(margin + cornerLen, margin);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(size - margin - cornerLen, margin);
    ctx.lineTo(size - margin, margin);
    ctx.lineTo(size - margin, margin + cornerLen);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(margin, size - margin - cornerLen);
    ctx.lineTo(margin, size - margin);
    ctx.lineTo(margin + cornerLen, size - margin);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(size - margin - cornerLen, size - margin);
    ctx.lineTo(size - margin, size - margin);
    ctx.lineTo(size - margin, size - margin - cornerLen);
    ctx.stroke();

    // 7. Plate Labels
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.font = "bold 16px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("BAMBU LAB  ·  256 × 256 mm", center, size - margin / 2);

    ctx.font = "bold 12px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillText("TEXTURED PEI PLATE", center, margin / 2);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;

  // 1. Top Textured PEI Sheet
  const plateGeom = new PlaneGeometry(256, 256);
  const plateMat = new MeshStandardMaterial({
    map: texture,
    roughness: 0.9,
    metalness: 0.1,
    side: DoubleSide,
  });
  const plateMesh = new Mesh(plateGeom, plateMat);
  plateMesh.rotation.x = -Math.PI / 2;
  plateMesh.position.y = 0;
  plateMesh.receiveShadow = true;
  group.add(plateMesh);

  // 2. Realistic Spring Steel Sheet Edge (1.2mm thickness)
  const baseGeom = new BoxGeometry(257, 1.2, 257);
  const baseMat = new MeshStandardMaterial({
    color: 0x14181d,
    roughness: 0.75,
    metalness: 0.4,
  });
  const baseMesh = new Mesh(baseGeom, baseMat);
  baseMesh.position.y = -0.6;
  group.add(baseMesh);

  // 3. Realistic Contact Shadow Receiver right at y = 0.01
  const shadowGeom = new PlaneGeometry(256, 256);
  const shadowMat = new ShadowMaterial({
    opacity: 0.45,
  });
  const shadowMesh = new Mesh(shadowGeom, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.01;
  shadowMesh.receiveShadow = true;
  group.add(shadowMesh);

  return group;
}
