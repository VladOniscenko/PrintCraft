export interface IndicativePriceInput {
  dimensionX?: number;
  dimensionY?: number;
  dimensionZ?: number;
  scaleFactor?: number;
  infillPercent?: number;
  quality?: string;
  material?: string;
  supports?: boolean;
  count: number;
}

export function calculateIndicativePrice({
  dimensionX,
  dimensionY,
  dimensionZ,
  scaleFactor = 1.0,
  infillPercent = 20,
  quality = "Standard (0.20mm)",
  material = "PLA",
  supports = false,
  count = 1,
}: IndicativePriceInput): number | null {
  if (
    !dimensionX ||
    !dimensionY ||
    !dimensionZ ||
    dimensionX <= 0 ||
    dimensionY <= 0 ||
    dimensionZ <= 0
  ) {
    return null;
  }

  const effectiveScale = scaleFactor > 0 ? scaleFactor : 1.0;
  const realX = dimensionX * (scaleFactor !== 1.0 ? 1.0 : effectiveScale);
  const realY = dimensionY * (scaleFactor !== 1.0 ? 1.0 : effectiveScale);
  const realZ = dimensionZ * (scaleFactor !== 1.0 ? 1.0 : effectiveScale);

  // Bounding box volume in cm³
  const volumeCm3 = (realX * realY * realZ) / 1000;

  // Material density in g/cm³
  const density =
    material === "TPU"
      ? 1.21
      : material === "PETG"
        ? 1.27
        : material === "ABS"
          ? 1.04
          : 1.24; // PLA default

  // Realistic volumetric fill fraction based on shells and infill
  const fillFraction = Math.min(
    1.0,
    0.12 + ((infillPercent || 20) / 100) * 0.28,
  );
  const estimatedGrams = Math.max(5, volumeCm3 * density * fillFraction);

  // Filament material cost (€0.06/g average)
  const pricePerGram =
    material === "TPU" ? 0.09 : material === "ABS" ? 0.07 : 0.055;
  const materialCost = estimatedGrams * pricePerGram;

  // Layer height quality multiplier on machine print time
  let qualityMultiplier = 1.0;
  if (quality.includes("0.12")) qualityMultiplier = 1.55;
  else if (quality.includes("0.24") || quality.includes("0.28"))
    qualityMultiplier = 0.82;

  // Support material surcharge
  const supportMultiplier = supports ? 1.2 : 1.0;

  // Base machine run and calibration cost
  const baseMachineCost = Math.max(
    3.5,
    (estimatedGrams / 15) * 1.8 * qualityMultiplier * supportMultiplier,
  );

  // Unit price per item
  const unitPrice = materialCost + baseMachineCost;

  // Fixed order preparation and plate setup fee
  const setupFee = 4.0;

  // Quantity tier volume discounting
  let discount = 0;
  if (count >= 100) discount = 0.25;
  else if (count >= 50) discount = 0.2;
  else if (count >= 10) discount = 0.12;
  else if (count >= 5) discount = 0.05;

  const total = setupFee + unitPrice * count * (1 - discount);
  return Math.round(total * 100) / 100;
}

