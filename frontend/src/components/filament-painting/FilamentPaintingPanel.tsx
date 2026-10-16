import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  Upload,
  Image as ImageIcon,
  Palette,
  Sparkles,
  Ruler,
  Loader2,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
} from "lucide-react";
import type { Filament } from "../../types/filament";
import {
  type FilamentPaintingConfig,
  type FilamentPaintingPaletteItem,
  type FilamentPaintingGenerationResult,
  type HueForgeQualityPreset,
  CURATED_PALETTES,
} from "../../types/filamentPainting";
import Interactive3DViewer, {
  getFilamentHexColor,
} from "../Interactive3DViewer";
import api from "../../services/api";
import { useI18n } from "../../i18n/I18nContext";
import { translateColorText } from "../../utils/formatters";

export interface QualityPresetOption {
  id: HueForgeQualityPreset;
  label: string;
  badge: string;
  description: string;
}

export const QUALITY_OPTIONS: QualityPresetOption[] = [
  {
    id: "Low",
    label: "Low Quality",
    badge: "Draft / Fast",
    description:
      "Fastest print time, ideal for bold graphics and high-contrast art.",
  },
  {
    id: "Medium",
    label: "Medium Quality",
    badge: "Standard (Recommended)",
    description:
      "Excellent balance of print time and rich optical color blending.",
  },
  {
    id: "Best",
    label: "Best Quality",
    badge: "Ultra Detail",
    description: "Maximum resolution with silky smooth color gradients.",
  },
];

export interface FilamentPaintingPanelProps {
  filamentsCatalog?: Filament[];
  initialFile?: File | null;
  onAddToOrder: (payload: {
    liveResult: FilamentPaintingGenerationResult;
    config: FilamentPaintingConfig;
    sourceFile: File;
  }) => void;
  className?: string;
}

const DEFAULT_PRESET_ID = "monochrome-greyscale";

// Standard default solid color names for customer 3D filament paintings
const DEFAULT_SOLID_COLOR_KEYWORDS = [
  "black",
  "white",
  "grey",
  "gray",
  "red",
  "green",
  "blue",
  "yellow",
  "orange",
  "purple",
  "violet",
  "pink",
  "brown",
  "cyan",
  "magenta",
  "teal",
  "navy",
  "gold",
  "silver",
  "bronze",
  "copper",
  "beige",
  "tan",
  "olive",
  "maroon",
  "turquoise",
  "ivory",
  "charcoal",
  "crimson",
];

export function isAllowedFilamentColor(f: Filament): boolean {
  const col = (f.color || "").trim().toLowerCase();
  const name = (f.name || "").trim().toLowerCase();

  // Strictly exclude multicolor, rainbow, gradient, dual-color, tri-color, clear filaments
  if (
    col.includes("multi") ||
    name.includes("multi") ||
    col.includes("rainbow") ||
    name.includes("rainbow") ||
    col.includes("gradient") ||
    name.includes("gradient") ||
    col.includes("dual") ||
    name.includes("dual") ||
    col.includes("tri") ||
    name.includes("tri") ||
    col.includes("transparent") ||
    name.includes("transparent") ||
    col.includes("clear") ||
    name.includes("clear")
  ) {
    return false;
  }

  // Must match at least one default solid color name
  return DEFAULT_SOLID_COLOR_KEYWORDS.some(
    (kw) => col.includes(kw) || name.includes(kw),
  );
}

export function getPlaFilamentHex(f: Filament): string {
  const custom = (f as any).hexCode || (f as any).colorHex;
  if (custom && /^#?[0-9a-f]{6}$/i.test(String(custom).trim())) {
    const s = String(custom).trim();
    return s.startsWith("#") ? s : `#${s}`;
  }
  const hexNum = getFilamentHexColor(f.color || f.name);
  return `#${hexNum.toString(16).padStart(6, "0")}`;
}

function estimateTypicalTd(colorNameOrHex: string): number {
  const c = colorNameOrHex.toLowerCase();
  if (c.includes("black") || c.includes("dark") || c.includes("charcoal"))
    return 0.6;
  if (c.includes("white") || c.includes("ivory") || c.includes("snow"))
    return 5.0;
  if (c.includes("yellow") || c.includes("gold") || c.includes("sun"))
    return 3.8;
  if (c.includes("orange") || c.includes("amber")) return 3.2;
  if (c.includes("red") || c.includes("crimson") || c.includes("ruby"))
    return 2.2;
  if (c.includes("blue") || c.includes("navy") || c.includes("cyan"))
    return 2.5;
  if (c.includes("green") || c.includes("lime") || c.includes("pine"))
    return 2.2;
  if (c.includes("purple") || c.includes("magenta") || c.includes("violet"))
    return 2.6;
  if (c.includes("grey") || c.includes("gray") || c.includes("silver"))
    return 2.0;
  return 2.5;
}

async function convertImageToPngBlob(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        resolve(blob || file);
      }, "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
}

function createPresetPalette(
  presetId: string,
  storePlaFilaments: Filament[] = [],
): FilamentPaintingPaletteItem[] {
  const preset =
    CURATED_PALETTES.find((p) => p.id === presetId) ||
    CURATED_PALETTES.find((p) => p.id === DEFAULT_PRESET_ID) ||
    CURATED_PALETTES[0];

  // Strictly enforce maximum 4 colors
  const presetFilaments = preset.filaments.slice(0, 4);

  return presetFilaments.map((f, idx) => {
    const catalogMatch =
      storePlaFilaments.find(
        (cat) =>
          cat.color?.toLowerCase() === f.name.toLowerCase() ||
          cat.name?.toLowerCase().includes(f.name.toLowerCase()) ||
          f.name.toLowerCase().includes((cat.color || "").toLowerCase()),
      ) || storePlaFilaments[idx % Math.max(1, storePlaFilaments.length)];

    const matchedHex = catalogMatch
      ? getPlaFilamentHex(catalogMatch)
      : f.colorHex;

    return {
      filamentId:
        catalogMatch?.id ||
        (typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `pla-slot-${idx + 1}`),
      name: catalogMatch?.name || f.name,
      colorHex: matchedHex,
      material: "PLA",
      transmissionDistanceMm: f.transmissionDistanceMm,
      startHeightMm: 0.0,
      endHeightMm: 0.0,
    };
  });
}

export default function FilamentPaintingPanel({
  filamentsCatalog = [],
  initialFile = null,
  onAddToOrder,
  className = "",
}: FilamentPaintingPanelProps) {
  const { t } = useI18n();

  const qualityOptions = useMemo<QualityPresetOption[]>(
    () => [
      {
        id: "Low",
        label: t("filamentPainting.qualityDraftLabel"),
        badge: t("filamentPainting.qualityDraftBadge"),
        description: t("filamentPainting.qualityDraftDesc"),
      },
      {
        id: "Medium",
        label: t("filamentPainting.qualityMediumLabel"),
        badge: t("filamentPainting.qualityMediumBadge"),
        description: t("filamentPainting.qualityMediumDesc"),
      },
      {
        id: "Best",
        label: t("filamentPainting.qualityBestLabel"),
        badge: t("filamentPainting.qualityBestBadge"),
        description: t("filamentPainting.qualityBestDesc"),
      },
    ],
    [t],
  );

  const getPresetLabel = (preset: (typeof CURATED_PALETTES)[number]) => {
    if (preset.id === "classic-4color")
      return t("filamentPainting.themeClassic4");
    if (preset.id === "monochrome-greyscale")
      return t("filamentPainting.themeMonochrome");
    if (preset.id === "sunset-glow") return t("filamentPainting.themeSunset");
    return preset.name;
  };

  // Filter store catalog strictly to PLA filaments only with default solid color names (no multicolor)
  const storePlaFilaments = useMemo<Filament[]>(() => {
    const list = (filamentsCatalog || []).filter(
      (f) =>
        (f.material || "").trim().toUpperCase() === "PLA" &&
        isAllowedFilamentColor(f),
    );
    if (list.length > 0) return list;
    return [
      {
        id: "pla-black",
        name: "Black PLA",
        color: "Black",
        material: "PLA",
        pricePerGram: 0.03,
      },
      {
        id: "pla-white",
        name: "White PLA",
        color: "White",
        material: "PLA",
        pricePerGram: 0.03,
      },
      {
        id: "pla-red",
        name: "Red PLA",
        color: "Red",
        material: "PLA",
        pricePerGram: 0.03,
      },
      {
        id: "pla-yellow",
        name: "Yellow PLA",
        color: "Yellow",
        material: "PLA",
        pricePerGram: 0.03,
      },
      {
        id: "pla-blue",
        name: "Blue PLA",
        color: "Blue",
        material: "PLA",
        pricePerGram: 0.03,
      },
      {
        id: "pla-green",
        name: "Green PLA",
        color: "Green",
        material: "PLA",
        pricePerGram: 0.03,
      },
      {
        id: "pla-grey",
        name: "Grey PLA",
        color: "Grey",
        material: "PLA",
        pricePerGram: 0.03,
      },
      {
        id: "pla-orange",
        name: "Orange PLA",
        color: "Orange",
        material: "PLA",
        pricePerGram: 0.03,
      },
    ];
  }, [filamentsCatalog]);

  // 1. Source Image State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 2. Customer Controls: Quality ("Low", "Medium", "Best"), Size (Width/Height), Colors (Palette)
  const [qualityPreset, setQualityPreset] =
    useState<HueForgeQualityPreset>("Medium");
  const [targetWidthMm, setTargetWidthMm] = useState<number>(150);
  const [targetHeightMm, setTargetHeightMm] = useState<number>(150);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [selectedPresetId, setSelectedPresetId] =
    useState<string>(DEFAULT_PRESET_ID);

  // Active palette configuration (strictly PLA, max 4 colors)
  const [customPalette, setCustomPalette] = useState<
    FilamentPaintingPaletteItem[]
  >(() =>
    createPresetPalette(DEFAULT_PRESET_ID, storePlaFilaments).slice(0, 4),
  );

  // 3. Live 3D Configurator State
  const [liveResult, setLiveResult] =
    useState<FilamentPaintingGenerationResult | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Prevent reactive debounce on initial mount before image is selected
  const hasInitializedRef = useRef(false);
  const activeRequestSeqRef = useRef(0);
  const convertedPngRef = useRef<File | null>(null);

  // Session / Visitor Slot ID for file reuse (overwrites draft during edits)
  const slotIdRef = useRef<string>(
    `slot_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
  );

  // Core API generation function
  const requestGeneration = useCallback(
    async (
      file: File,
      paletteToUse: FilamentPaintingPaletteItem[],
      qualityToUse: HueForgeQualityPreset,
    ) => {
      const seq = ++activeRequestSeqRef.current;
      
      let pngFile = convertedPngRef.current;
      if (!pngFile) {
        const pngBlob = await convertImageToPngBlob(file);
        pngFile = new File(
          [pngBlob],
          file.name.replace(/\.[^/.]+$/, ".png"),
          {
            type: "image/png",
          },
        );
        convertedPngRef.current = pngFile;
      }

      // Strict enforcement of max 4 colors and clean auto-distributed layer heights
      const safePalette = paletteToUse.slice(0, 4).map((item) => ({
        ...item,
        startHeightMm: 0,
        endHeightMm: 0,
      }));

      const config: FilamentPaintingConfig = {
        quality: qualityToUse,
        targetWidthMm,
        targetHeightMm,
        palette: safePalette,
        slotId: slotIdRef.current,
      };

      const formData = new FormData();
      formData.append("image", pngFile);
      formData.append("config", JSON.stringify(config));

      const res = await api.post("/3d-generate-painting", formData);
      if (seq === activeRequestSeqRef.current) {
        setLiveResult(res.data);
      }
    },
    [targetWidthMm, targetHeightMm],
  );

  // Step 1: Instant Upload & Default Preview on Image Drop/Selection
  const handleFileChange = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;

      setSelectedFile(file);
      convertedPngRef.current = null;
      slotIdRef.current = `slot_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);

      // Initial palette: Greyscale (Monochrome Portrait)
      const initialPalette = createPresetPalette(
        DEFAULT_PRESET_ID,
        storePlaFilaments,
      ).slice(0, 4);
      setSelectedPresetId(DEFAULT_PRESET_ID);
      setCustomPalette(initialPalette);

      setIsInitialLoading(true);
      hasInitializedRef.current = false;

      const img = new Image();
      img.onload = async () => {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        let computedHeight = 150;
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          const aspect = img.naturalHeight / img.naturalWidth;
          computedHeight = Math.round(150 * aspect);
          setTargetHeightMm(computedHeight);
        }

        try {
          await requestGeneration(file, initialPalette, qualityPreset);
          hasInitializedRef.current = true;
        } catch (err) {
          console.error("Instant 3D preview generation failed:", err);
        } finally {
          setIsInitialLoading(false);
        }
      };
      img.src = url;
    },
    [storePlaFilaments, qualityPreset, requestGeneration],
  );

  // Support initial file passed from parent
  useEffect(() => {
    if (initialFile && !selectedFile) {
      void handleFileChange(initialFile);
    }
  }, [initialFile, selectedFile, handleFileChange]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFileChange(file);
  };

  // Step 3: Reactive Debounced Updates when Palette, Size, or Quality Changes (500ms debounce)
  useEffect(() => {
    if (!selectedFile || !hasInitializedRef.current || isInitialLoading) return;

    const timer = setTimeout(async () => {
      setIsRegenerating(true);
      try {
        await requestGeneration(selectedFile, customPalette, qualityPreset);
      } catch (err) {
        console.warn("Reactive 3D preview update failed:", err);
      } finally {
        setIsRegenerating(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    customPalette,
    targetWidthMm,
    targetHeightMm,
    qualityPreset,
    selectedFile,
    isInitialLoading,
    requestGeneration,
  ]);

  // Palette Preset Switcher
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId === "custom") return;
    const newPalette = createPresetPalette(presetId, storePlaFilaments).slice(
      0,
      4,
    );
    setCustomPalette(newPalette);
  };

  // Select a store filament for an existing layer slot (Strictly modifies slot in-place, NEVER adds an extra color)
  const handleSelectCatalogFilament = (index: number, filamentId: string) => {
    if (index < 0 || index >= customPalette.length) return;
    const found = storePlaFilaments.find((f) => f.id === filamentId);
    if (!found) return;

    setSelectedPresetId("custom");
    const hex = getPlaFilamentHex(found);
    const td = estimateTypicalTd(found.color || found.name);

    setCustomPalette((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        filamentId: found.id,
        name: found.name,
        colorHex: hex,
        material: "PLA",
        transmissionDistanceMm: td,
      };
      return next.slice(0, 4);
    });
  };

  // Add Color (strictly capped at max 4 colors)
  const handleAddColor = () => {
    if (customPalette.length >= 4) return;
    setSelectedPresetId("custom");
    const count = customPalette.length;

    // Pick next unused PLA filament from catalog
    const unusedFilament =
      storePlaFilaments.find(
        (f) => !customPalette.some((p) => p.filamentId === f.id),
      ) || storePlaFilaments[count % storePlaFilaments.length];

    const hex = getPlaFilamentHex(unusedFilament);
    const td = estimateTypicalTd(unusedFilament.color || unusedFilament.name);

    const newItem: FilamentPaintingPaletteItem = {
      filamentId: unusedFilament.id,
      name: unusedFilament.name,
      colorHex: hex,
      material: "PLA",
      transmissionDistanceMm: td,
      startHeightMm: 0,
      endHeightMm: 0,
    };

    setCustomPalette((prev) => [...prev, newItem].slice(0, 4));
  };

  const handleRemoveColor = (index: number) => {
    if (customPalette.length <= 2) return;
    setSelectedPresetId("custom");
    const nextPalette = customPalette
      .filter((_, i) => i !== index)
      .slice(0, 4)
      .map((item) => ({
        ...item,
        startHeightMm: 0,
        endHeightMm: 0,
      }));
    setCustomPalette(nextPalette);
  };

  const handleMoveColor = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= customPalette.length) return;
    setSelectedPresetId("custom");
    const updated = [...customPalette];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setCustomPalette(
      updated.slice(0, 4).map((item) => ({
        ...item,
        startHeightMm: 0,
        endHeightMm: 0,
      })),
    );
  };

  // Step 4: Clean State Reset on Add to Order
  const handleAddToCart = () => {
    if (!selectedFile || !liveResult) return;

    const finalConfig: FilamentPaintingConfig = {
      quality: qualityPreset,
      targetWidthMm,
      targetHeightMm,
      palette: customPalette.slice(0, 4),
      slotId: slotIdRef.current,
    };

    onAddToOrder({
      liveResult,
      config: finalConfig,
      sourceFile: selectedFile,
    });

    // Completely reset the configurator state
    slotIdRef.current = `slot_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setImageDimensions(null);
    setLiveResult(null);
    setIsInitialLoading(false);
    setIsRegenerating(false);
    hasInitializedRef.current = false;
    setSelectedPresetId(DEFAULT_PRESET_ID);
    setTargetWidthMm(150);
    setTargetHeightMm(150);
    setQualityPreset("Medium");
    setCustomPalette(
      createPresetPalette(DEFAULT_PRESET_ID, storePlaFilaments).slice(0, 4),
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 2. Image Dropzone (When No Image is Loaded) */}
      {!selectedFile && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragOver(false);
            }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[300px] ${
              isDragOver
                ? "border-emerald-500 bg-emerald-50/60 scale-[0.99]"
                : "border-gray-200 bg-gray-50/50 hover:border-emerald-400 hover:bg-emerald-50/20"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileChange(file);
              }}
            />
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 shadow-inner">
              <Upload size={30} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">
              {t("filamentPainting.dropTitle")}
            </h3>
            <p className="text-gray-500 text-xs mt-1.5 max-w-sm">
              {t("filamentPainting.dropSubtitle")}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#133827] text-white text-xs font-bold hover:bg-[#1c4d37] transition-all shadow-sm">
              <ImageIcon size={15} />
              {t("filamentPainting.browseImage")}
            </span>
          </div>
        </div>
      )}

      {/* 3. Live Customer Configurator (Once Image is Selected) */}
      {selectedFile && (
        <div className="space-y-6">
          {/* Customer Controls: Formaat, Printkwaliteit, Filamentkleuren (Compact Stack) */}
          <div className="space-y-3">
            {/* Top Row: Formaat & Printkwaliteit side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* CONTROL 1: SIZE (DIMENSIONS) */}
              <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-2xs space-y-2.5 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <Ruler className="text-emerald-600" size={15} />
                      <h4 className="font-bold text-gray-900 text-xs">{t("filamentPainting.sizeTitle")}</h4>
                    </div>
                    <span className="text-[11px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                      {targetWidthMm} × {targetHeightMm} mm
                    </span>
                  </div>

                  {/* Quick Size Presets */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {[100, 150, 200].map((presetW) => {
                      const isSelected = targetWidthMm === presetW;
                      return (
                        <button
                          key={presetW}
                          type="button"
                          onClick={() => {
                            setTargetWidthMm(presetW);
                            if (lockAspectRatio && imageDimensions) {
                              const aspect =
                                imageDimensions.height / imageDimensions.width;
                              setTargetHeightMm(Math.round(presetW * aspect));
                            }
                          }}
                          className={`py-1 px-2 rounded-lg text-xs font-bold transition-all border text-center ${
                            isSelected
                              ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                              : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {presetW} mm
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Width & Height Inputs */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div className="flex items-center justify-between gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 min-w-0 focus-within:ring-2 focus-within:ring-emerald-500">
                      <span className="text-[11px] font-semibold text-gray-600 truncate">{t("filamentPainting.widthMm")}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min="50"
                          max="250"
                          value={targetWidthMm}
                          onChange={(e) => {
                            const val = Math.max(20, Number(e.target.value));
                            setTargetWidthMm(val);
                            if (lockAspectRatio && imageDimensions) {
                              const aspect =
                                imageDimensions.height / imageDimensions.width;
                              setTargetHeightMm(Math.round(val * aspect));
                            }
                          }}
                          className="w-10 bg-transparent text-xs font-bold text-gray-800 text-right outline-none"
                        />
                        <span className="text-[10px] font-medium text-gray-400">mm</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 min-w-0 focus-within:ring-2 focus-within:ring-emerald-500">
                      <span className="text-[11px] font-semibold text-gray-600 truncate">{t("filamentPainting.heightMm")}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min="50"
                          max="250"
                          value={targetHeightMm}
                          onChange={(e) =>
                            setTargetHeightMm(Math.max(20, Number(e.target.value)))
                          }
                          disabled={lockAspectRatio && !!imageDimensions}
                          className="w-10 bg-transparent text-xs font-bold text-gray-800 text-right outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        <span className="text-[10px] font-medium text-gray-400">mm</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end text-[11px] text-gray-500 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={lockAspectRatio}
                      onChange={(e) => setLockAspectRatio(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span>{t("filamentPainting.lockAspectRatio")}</span>
                  </label>
                </div>
              </div>

              {/* CONTROL 2: QUALITY SELECTION (Low, Medium, Best) */}
              <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-2xs space-y-2 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="text-emerald-600" size={15} />
                      <h4 className="font-bold text-gray-900 text-xs">{t("filamentPainting.qualityTitle")}</h4>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                      {qualityOptions.find((q) => q.id === qualityPreset)?.badge}
                    </span>
                  </div>

                  {/* 3 Quality Cards */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {qualityOptions.map((opt) => {
                      const isActive = qualityPreset === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setQualityPreset(opt.id)}
                          className={`py-1.5 px-2 rounded-lg text-center transition-all border ${
                            isActive
                              ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                              : "bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-200"
                          }`}
                        >
                          <span className="text-xs font-bold block leading-tight">{opt.label}</span>
                          <span
                            className={`text-[10px] block mt-0.5 leading-tight truncate ${
                              isActive ? "text-emerald-100" : "text-gray-400"
                            }`}
                          >
                            {opt.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 leading-normal pt-1">
                  {qualityOptions.find((q) => q.id === qualityPreset)?.description}
                </p>
              </div>
            </div>

            {/* CONTROL 3: COLORS (FILAMENT PALETTE) - Strictly Max 4 Colors, PLA Solid Colors Only */}
            <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                <div className="flex items-center gap-1.5">
                  <Palette className="text-emerald-600" size={15} />
                  <h4 className="font-bold text-gray-900 text-xs">{t("filamentPainting.colorsTitle")}</h4>
                </div>
                <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded-full">
                  {customPalette.length} / 4 {t("filamentPainting.colorsCount")}
                </span>
              </div>

              {/* Theme Preset Selector */}
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-semibold text-gray-500 shrink-0">
                  {t("filamentPainting.colorTheme")}
                </label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="flex-1 max-w-xs px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                >
                  {CURATED_PALETTES.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {getPresetLabel(preset)}
                    </option>
                  ))}
                  <option value="custom">{t("filamentPainting.customCombination")}</option>
                </select>
              </div>

              {/* Color Swatch Slots */}
              <div className="space-y-1.5">
                {customPalette.map((item, idx) => (
                  <div
                    key={`palette-slot-${item.filamentId || idx}`}
                    className="p-1.5 rounded-lg border border-gray-200 bg-gray-50/70 hover:bg-gray-50 transition-all flex items-center justify-between gap-2"
                  >
                    {/* Swatch & Store PLA Dropdown */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-5 h-5 rounded-md shadow-2xs border border-black/15 shrink-0 flex items-center justify-center font-bold text-[9px] text-white select-none"
                        style={{ backgroundColor: item.colorHex }}
                        title={`${item.name} (${item.colorHex})`}
                      >
                        <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">{idx + 1}</span>
                      </div>

                      {/* Store PLA Filament Dropdown */}
                      <select
                        value={item.filamentId}
                        onChange={(e) => handleSelectCatalogFilament(idx, e.target.value)}
                        className="flex-1 min-w-[120px] px-2 py-1 bg-white border border-gray-200 rounded-md text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs truncate"
                      >
                        {storePlaFilaments.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({translateColorText(f.color, t)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Reorder and Remove Controls */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveColor(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed"
                        title={t("filamentPainting.moveEarlier")}
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveColor(idx, "down")}
                        disabled={idx === customPalette.length - 1}
                        className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed"
                        title={t("filamentPainting.moveLater")}
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(idx)}
                        disabled={customPalette.length <= 2}
                        className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-20 disabled:cursor-not-allowed"
                        title={t("filamentPainting.removeColor")}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Color Action */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={handleAddColor}
                  disabled={customPalette.length >= 4}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={13} />
                  <span>{customPalette.length >= 4 ? t("filamentPainting.maxColorsReached") : t("filamentPainting.addAnotherColor")}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live 3D Relief Preview Viewer */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles className="text-emerald-600" size={18} />
                <h3 className="font-bold text-gray-800 text-base">
                  {t("filamentPainting.previewTitle")}
                </h3>
              </div>

              {liveResult && (
                <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {liveResult.dimensions.x} × {liveResult.dimensions.y} mm
                </span>
              )}
            </div>

            {/* 3D Canvas Container */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 min-h-[380px] flex items-center justify-center border border-gray-800 shadow-inner">
              {isInitialLoading ? (
                <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <Loader2
                    className="animate-spin text-emerald-400"
                    size={34}
                  />
                  <p className="font-bold text-white text-sm">
                    {t("filamentPainting.generatingTitle")}
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    {t("filamentPainting.generatingSubtitle")}
                  </p>
                </div>
              ) : liveResult?.modelGlbUrl ? (
                <>
                  <Interactive3DViewer
                    key={`${liveResult.modelGlbUrl}-${customPalette.length}-${activeRequestSeqRef.current}`}
                    fileUrl={`${liveResult.modelGlbUrl}?seq=${activeRequestSeqRef.current}`}
                    fileName={liveResult.modelGlbUrl}
                    className="w-full h-full min-h-[380px]"
                    compact={false}
                  />

                  {isRegenerating && (
                    <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-lg z-20">
                      <Loader2
                        className="animate-spin text-emerald-400"
                        size={13}
                      />
                      <span>{t("filamentPainting.updatingPreview")}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-slate-400 text-xs">
                  {t("filamentPainting.failedPreview")}
                </div>
              )}
            </div>

            {/* Source Image Summary Bar */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {imagePreviewUrl && (
                  <img
                    src={imagePreviewUrl}
                    alt="Source thumbnail"
                    className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0 bg-slate-900"
                  />
                )}
                <div className="min-w-0 text-xs">
                  <p className="font-bold text-gray-800 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    {imageDimensions
                      ? `${imageDimensions.width} × ${imageDimensions.height} px`
                      : t("filamentPainting.uploadedPhoto")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-bold px-2 py-1 rounded-md hover:bg-emerald-50 transition-colors"
                >
                  {t("filamentPainting.changePhoto")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setImagePreviewUrl(null);
                    setLiveResult(null);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold p-1 rounded-md hover:bg-rose-50 transition-colors"
                  title={t("filamentPainting.removeImage")}
                >
                  <Trash2 size={14} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFileChange(file);
                  }}
                />
              </div>
            </div>
          </div>

          {/* 4. Bottom Sticky Action Bar: SINGLE "Add to Order" Button */}
          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">
                  {t("filamentPainting.readyToPrint")}
                </h4>
                <p className="text-xs text-gray-500">
                  {liveResult
                    ? `${liveResult.dimensions.x} × ${liveResult.dimensions.y} mm · ${customPalette.length} ${t("filamentPainting.colorsCount")}`
                    : t("filamentPainting.configuring")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!liveResult || isInitialLoading}
              className={`py-3.5 px-8 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2.5 shadow-md transition-all ${
                !liveResult || isInitialLoading
                  ? "bg-gray-300 cursor-not-allowed text-gray-500 shadow-none"
                  : "bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] shadow-emerald-700/20"
              }`}
            >
              <CheckCircle2 size={18} />
              {t("filamentPainting.confirmAndAddToOrder")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
