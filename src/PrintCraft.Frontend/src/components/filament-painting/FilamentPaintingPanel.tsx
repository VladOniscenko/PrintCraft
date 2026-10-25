import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  lazy,
  Suspense,
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
  CheckCircle2,
  Box,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import type { Filament } from "../../types/filament";
import {
  type FilamentPaintingConfig,
  type FilamentPaintingPaletteItem,
  type FilamentPaintingGenerationResult,
  type HueForgeQualityPreset,
  CURATED_PALETTES,
} from "../../types/filamentPainting";
import { getFilamentHexColor } from "../../utils/filamentColors";
const Interactive3DViewer = lazy(() => import("../Interactive3DViewer"));
import api from "../../services/api";
import { useI18n } from "../../i18n/I18nContext";
import { translateColorText } from "../../utils/formatters";

export interface QualityPresetOption {
  id: HueForgeQualityPreset;
  label: string;
  badge: string;
  description: string;
}

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

const DEFAULT_PRESET_ID = "classic-bw";

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

function getHexLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? `${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`
      : clean;
  const r = parseInt(full.substring(0, 2), 16) || 0;
  const g = parseInt(full.substring(2, 4), 16) || 0;
  const b = parseInt(full.substring(4, 6), 16) || 0;
  return 0.299 * r + 0.587 * g + 0.114 * b;
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
      // Pre-fill solid white background so transparent areas do not turn into black pits
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
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

  const presetFilaments = preset.filaments.slice(0, 4);

  const mapped = presetFilaments.map((f, idx) => {
    // Match catalog filament only if color name is genuinely related
    const targetColor = f.name.toLowerCase();
    const catalogMatch = storePlaFilaments.find((cat) => {
      const col = (cat.color || "").toLowerCase();
      const n = (cat.name || "").toLowerCase();
      return (
        col === targetColor ||
        n === targetColor ||
        (targetColor.includes("black") && (col.includes("black") || n.includes("black"))) ||
        (targetColor.includes("white") && (col.includes("white") || n.includes("white"))) ||
        (targetColor.includes("grey") && (col.includes("grey") || col.includes("gray") || n.includes("grey") || n.includes("gray"))) ||
        (targetColor.includes("gray") && (col.includes("grey") || col.includes("gray") || n.includes("grey") || n.includes("gray"))) ||
        (targetColor.includes("red") && (col.includes("red") || n.includes("red"))) ||
        (targetColor.includes("yellow") && (col.includes("yellow") || n.includes("yellow"))) ||
        (targetColor.includes("blue") && (col.includes("blue") || n.includes("blue"))) ||
        (targetColor.includes("orange") && (col.includes("orange") || n.includes("orange")))
      );
    });

    const matchedHex = catalogMatch
      ? getPlaFilamentHex(catalogMatch)
      : f.colorHex;

    return {
      filamentId:
        catalogMatch?.id ||
        `preset-${preset.id}-${idx}`,
      name: catalogMatch?.name || f.name,
      colorHex: matchedHex,
      material: "PLA",
      transmissionDistanceMm: f.transmissionDistanceMm,
      startHeightMm: 0.0,
      endHeightMm: 0.0,
    };
  });

  // Automatically sort by luminance from darkest to lightest
  return mapped.sort(
    (a, b) => getHexLuminance(a.colorHex) - getHexLuminance(b.colorHex),
  );
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
        id: "pla-grey",
        name: "Grey PLA",
        color: "Grey",
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
        id: "pla-brown",
        name: "Brown PLA",
        color: "Brown",
        material: "PLA",
        pricePerGram: 0.03,
      },
      {
        id: "pla-beige",
        name: "Beige PLA",
        color: "Beige",
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
    ];
  }, [filamentsCatalog]);

  // Step 1: Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Step 2: Color Style (Presets & Custom)
  const [selectedPresetId, setSelectedPresetId] =
    useState<string>(DEFAULT_PRESET_ID);
  const [customPalette, setCustomPalette] = useState<
    FilamentPaintingPaletteItem[]
  >(() =>
    createPresetPalette(DEFAULT_PRESET_ID, storePlaFilaments).slice(0, 4),
  );
  const [editingLayerIndex, setEditingLayerIndex] = useState<number | null>(null);

  // Step 3: Size (10cm, 15cm, 20cm longest side)
  const [selectedSizePreset, setSelectedSizePreset] = useState<
    100 | 150 | 200 | "custom"
  >(150);
  const [targetWidthMm, setTargetWidthMm] = useState<number>(150);
  const [targetHeightMm, setTargetHeightMm] = useState<number>(150);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [qualityPreset, setQualityPreset] =
    useState<HueForgeQualityPreset>("Medium");

  // Live 3D / 2D Preview State
  const [previewMode, setPreviewMode] = useState<"3d" | "2d">("3d");
  const [liveResult, setLiveResult] =
    useState<FilamentPaintingGenerationResult | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [generationKey, setGenerationKey] = useState(0);

  const hasInitializedRef = useRef(false);
  const activeRequestSeqRef = useRef(0);
  const convertedPngRef = useRef<File | null>(null);
  const lastGeneratedConfigKeyRef = useRef<string>("");

  const slotIdRef = useRef<string>(
    `slot_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
  );

  const applySizePreset = useCallback(
    (sizeMm: 100 | 150 | 200) => {
      setSelectedSizePreset(sizeMm);
      if (
        imageDimensions &&
        imageDimensions.width > 0 &&
        imageDimensions.height > 0
      ) {
        const aspect = imageDimensions.height / imageDimensions.width;
        if (aspect >= 1.0) {
          // Portrait or square: height is sizeMm, width scales down
          setTargetHeightMm(sizeMm);
          setTargetWidthMm(Math.max(20, Math.round(sizeMm / aspect)));
        } else {
          // Landscape: width is sizeMm, height scales down
          setTargetWidthMm(sizeMm);
          setTargetHeightMm(Math.max(20, Math.round(sizeMm * aspect)));
        }
      } else {
        setTargetWidthMm(sizeMm);
        setTargetHeightMm(sizeMm);
      }
    },
    [imageDimensions],
  );

  const requestGeneration = useCallback(
    async (
      file: File,
      paletteToUse: FilamentPaintingPaletteItem[],
      qualityToUse: HueForgeQualityPreset,
      widthOverride?: number,
      heightOverride?: number,
    ) => {
      const finalWidth = widthOverride ?? targetWidthMm;
      const finalHeight = heightOverride ?? targetHeightMm;
      const configKey = `${file.name}_${file.size}_${file.lastModified}_${finalWidth}_${finalHeight}_${qualityToUse}_${paletteToUse.map((p) => `${p.filamentId || p.name}:${p.colorHex}`).join(",")}`;

      if (lastGeneratedConfigKeyRef.current === configKey) {
        return;
      }
      lastGeneratedConfigKeyRef.current = configKey;

      const seq = ++activeRequestSeqRef.current;

      let pngFile = convertedPngRef.current;
      if (!pngFile) {
        const pngBlob = await convertImageToPngBlob(file);
        pngFile = new File([pngBlob], file.name.replace(/\.[^/.]+$/, ".png"), {
          type: "image/png",
        });
        convertedPngRef.current = pngFile;
      }

      // Automatically sort palette dark to light
      const sortedPalette = [...paletteToUse]
        .slice(0, 4)
        .sort(
          (a, b) => getHexLuminance(a.colorHex) - getHexLuminance(b.colorHex),
        )
        .map((item) => ({
          ...item,
          startHeightMm: 0,
          endHeightMm: 0,
        }));

      const config: FilamentPaintingConfig = {
        quality: qualityToUse,
        targetWidthMm: finalWidth,
        targetHeightMm: finalHeight,
        palette: sortedPalette,
        slotId: slotIdRef.current,
      };

      const formData = new FormData();
      formData.append("image", pngFile);
      formData.append("config", JSON.stringify(config));

      const res = await api.post("/3d-generate-painting", formData);
      if (seq === activeRequestSeqRef.current) {
        setLiveResult(res.data);
        setGenerationKey((k) => k + 1);
      }
    },
    [targetWidthMm, targetHeightMm],
  );

  const handleFileChange = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;

      setSelectedFile(file);
      convertedPngRef.current = null;
      lastGeneratedConfigKeyRef.current = "";
      slotIdRef.current = `slot_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);

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

        let initW = 150;
        let initH = 150;
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          const aspect = img.naturalHeight / img.naturalWidth;
          if (aspect >= 1.0) {
            initH = 150;
            initW = Math.max(20, Math.round(150 / aspect));
          } else {
            initW = 150;
            initH = Math.max(20, Math.round(150 * aspect));
          }
          setTargetWidthMm(initW);
          setTargetHeightMm(initH);
          setSelectedSizePreset(150);
        }

        try {
          await requestGeneration(
            file,
            initialPalette,
            qualityPreset,
            initW,
            initH,
          );
          hasInitializedRef.current = true;
        } catch (err) {
          console.error("3D relief generation failed:", err);
        } finally {
          setIsInitialLoading(false);
        }
      };
      img.src = url;
    },
    [storePlaFilaments, qualityPreset, requestGeneration],
  );

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
    }, 400);

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

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId === "custom") return;
    const newPalette = createPresetPalette(presetId, storePlaFilaments).slice(
      0,
      4,
    );
    setCustomPalette(newPalette);
  };

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
      // Keep sorted dark to light
      return next
        .slice(0, 4)
        .sort(
          (a, b) => getHexLuminance(a.colorHex) - getHexLuminance(b.colorHex),
        );
    });
  };

  const handleAddColor = () => {
    if (customPalette.length >= 4) return;
    setSelectedPresetId("custom");
    const count = customPalette.length;

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

    setCustomPalette((prev) =>
      [...prev, newItem]
        .slice(0, 4)
        .sort(
          (a, b) => getHexLuminance(a.colorHex) - getHexLuminance(b.colorHex),
        ),
    );
  };

  const handleRemoveColor = (index: number) => {
    if (customPalette.length <= 2) return;
    setSelectedPresetId("custom");
    const nextPalette = customPalette
      .filter((_, i) => i !== index)
      .slice(0, 4);
    setCustomPalette(nextPalette);
  };

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
      {/* Upload Dropzone (When No Image is Loaded) */}
      {!selectedFile && (
        <div className="bg-white dark:bg-[#0e1512] rounded-2xl border border-gray-200 dark:border-white/10 p-8 shadow-sm">
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
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[320px] ${
              isDragOver
                ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 scale-[0.99]"
                : "border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 hover:border-emerald-400 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20"
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
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-inner">
              <Upload size={32} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
              {t("filamentPainting.step1Title")}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1.5 max-w-sm">
              {t("filamentPainting.dropSubtitle")}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-all shadow-sm">
              <ImageIcon size={15} />
              {t("filamentPainting.browseImage")}
            </span>
          </div>
        </div>
      )}

      {/* 3-Step Configurator & Live Multi-Color Preview */}
      {selectedFile && (
        <div className="space-y-6">
          {/* STEP CONTROLS (Steps 1, 2, 3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* STEP 1: PHOTO SUMMARY */}
            <div className="bg-white dark:bg-[#0e1512] rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon
                      className="text-emerald-600 dark:text-emerald-400"
                      size={16}
                    />
                    <h4 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">
                      {t("filamentPainting.step1Title")}
                    </h4>
                  </div>
                  {imageDimensions && (
                    <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                      {imageDimensions.width} × {imageDimensions.height} px
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {imagePreviewUrl && (
                    <img
                      src={imagePreviewUrl}
                      alt={t("filamentPainting.uploadedPhoto")}
                      loading="lazy"
                      decoding="async"
                      className="w-14 h-14 rounded-lg object-cover border border-gray-200 dark:border-white/10 shrink-0 bg-slate-900"
                    />
                  )}
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-bold text-gray-800 dark:text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(0)} KB ·{" "}
                      {imageDimensions && imageDimensions.height >= imageDimensions.width
                        ? "Portrait"
                        : "Landscape"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold hover:underline"
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
                  className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold flex items-center gap-1"
                  title={t("filamentPainting.removeImage")}
                >
                  <Trash2 size={13} />
                  <span>{t("filamentPainting.removeImage")}</span>
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

            {/* STEP 2: CHOOSE COLOR STYLE (PRESETS & CUSTOM) */}
            <div className="bg-white dark:bg-[#0e1512] rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    <Palette
                      className="text-emerald-600 dark:text-emerald-400"
                      size={16}
                    />
                    <h4 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">
                      {t("filamentPainting.step2Title")}
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800/40">
                    {customPalette.length} {t("filamentPainting.colorsCount")}
                  </span>
                </div>

                {/* Quick Starter Palettes */}
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    {t("filamentPainting.quickPresetsTitle")}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      {
                        id: "classic-bw",
                        label: t("filamentPainting.themeClassicBw"),
                        colors: ["#111111", "#71717A", "#FFFFFF"],
                      },
                      {
                        id: "warm-sepia",
                        label: t("filamentPainting.themeWarmSepia"),
                        colors: ["#1C1917", "#78350F", "#D97706", "#FFFFFF"],
                      },
                      {
                        id: "standard-4-color",
                        label: t("filamentPainting.themeClassic4"),
                        colors: ["#111111", "#DC2626", "#FBBF24", "#FFFFFF"],
                      },
                      {
                        id: "warm-sunset",
                        label: t("filamentPainting.themeSunset"),
                        colors: ["#0F172A", "#C026D3", "#F97316", "#FEF3C7"],
                      },
                    ].map((style) => {
                      const isSelected = selectedPresetId === style.id;
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => handleSelectPreset(style.id)}
                          className={`p-2 rounded-lg text-left transition-all border flex flex-col gap-1.5 ${
                            isSelected
                              ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-2xs"
                              : "bg-gray-50/70 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10"
                          }`}
                        >
                          <span className="text-[11px] font-bold text-gray-800 dark:text-white truncate">
                            {style.label}
                          </span>
                          <div className="flex items-center gap-1">
                            {style.colors.map((c, i) => (
                              <span
                                key={i}
                                className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-2xs inline-block"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Physical Layer Color Stack (ALWAYS VISIBLE & EDITABLE) */}
                <div className="pt-2 border-t border-gray-100 dark:border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    <span>{t("filamentPainting.selectedColorsOrder")}</span>
                    <span>
                      {customPalette.length}/4 {t("filamentPainting.colorsCount")}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {customPalette.map((item, idx) => {
                      const isBase = idx === 0;
                      const isTop = idx === customPalette.length - 1;
                      const layerLabel = isBase
                        ? t("filamentPainting.layerBaseLabel")
                        : isTop
                        ? t("filamentPainting.layerHighlightLabel", {
                            layer: (idx + 1).toString(),
                          })
                        : t("filamentPainting.layerMidtoneLabel", {
                            layer: (idx + 1).toString(),
                          });

                      return (
                        <div
                          key={`layer-${item.filamentId || idx}`}
                          onClick={() => setEditingLayerIndex(idx)}
                          className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-all cursor-pointer group"
                        >
                          <div
                            className="w-5 h-5 rounded-full border border-black/20 shadow-inner shrink-0 ring-1 ring-black/10 group-hover:scale-105 transition-transform"
                            style={{ backgroundColor: item.colorHex }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                              {layerLabel}
                            </div>
                            <div className="text-xs font-semibold text-gray-800 dark:text-white truncate">
                              {item.name}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingLayerIndex(idx);
                              }}
                              className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                            >
                              {t("filamentPainting.changeColor")}
                            </button>
                            {customPalette.length > 2 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveColor(idx);
                                }}
                                className="p-1 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                                title={t("filamentPainting.removeColor")}
                                aria-label={t("filamentPainting.removeColor")}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {customPalette.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddColor}
                      className="w-full py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg border border-dashed border-emerald-300 dark:border-emerald-700/50 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus size={13} />
                      <span>{t("filamentPainting.addAnotherColor")}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Filament Swatch Picker Modal */}
              {editingLayerIndex !== null && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
                  onClick={() => setEditingLayerIndex(null)}
                >
                  <div
                    className="bg-white dark:bg-[#121a16] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl max-w-md w-full p-5 space-y-4 max-h-[85vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
                      <div>
                        <h3 className="font-bold text-base text-gray-900 dark:text-white">
                          {t("filamentPainting.chooseLayerColor", {
                            layer: (editingLayerIndex + 1).toString(),
                          })}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {t("filamentPainting.stockFilaments")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingLayerIndex(null)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        aria-label={t("filamentPainting.closePicker")}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Grid of Store Filaments */}
                    <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 flex-1 min-h-[220px]">
                      {storePlaFilaments.map((f) => {
                        const fHex = getPlaFilamentHex(f);
                        const isCurrent =
                          customPalette[editingLayerIndex]?.filamentId === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              handleSelectCatalogFilament(
                                editingLayerIndex,
                                f.id,
                              );
                              setEditingLayerIndex(null);
                            }}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                              isCurrent
                                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                                : "bg-gray-50/70 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300"
                            }`}
                          >
                            <span
                              className="w-7 h-7 rounded-full border border-black/20 shadow-inner shrink-0 ring-2 ring-black/5"
                              style={{ backgroundColor: fHex }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {f.name}
                              </div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                {translateColorText(f.color, t)} ·{" "}
                                {f.material || "PLA"}
                              </div>
                            </div>
                            {isCurrent && (
                              <CheckCircle2
                                size={15}
                                className="text-emerald-600 dark:text-emerald-400 shrink-0"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingLayerIndex(null)}
                        className="px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-xl transition-colors"
                      >
                        {t("filamentPainting.closePicker")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 3: CHOOSE SIZE (10cm, 15cm, 20cm) */}
            <div className="bg-white dark:bg-[#0e1512] rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    <Ruler
                      className="text-emerald-600 dark:text-emerald-400"
                      size={16}
                    />
                    <h4 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">
                      {t("filamentPainting.step3Title")}
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                    {targetWidthMm} × {targetHeightMm} mm
                  </span>
                </div>

                {/* 3 Size Buttons */}
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { val: 100 as const, label: t("filamentPainting.sizeSmall") },
                    { val: 150 as const, label: t("filamentPainting.sizeMedium") },
                    { val: 200 as const, label: t("filamentPainting.sizeLarge") },
                  ].map((size) => {
                    const isSelected = selectedSizePreset === size.val;
                    return (
                      <button
                        key={size.val}
                        type="button"
                        onClick={() => applySizePreset(size.val)}
                        className={`py-2 px-1 rounded-lg text-center transition-all border ${
                          isSelected
                            ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                            : "bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-white/10"
                        }`}
                      >
                        <span className="text-xs font-bold block leading-tight">
                          {size.val / 10} cm
                        </span>
                        <span
                          className={`text-[10px] block mt-0.5 leading-tight truncate ${
                            isSelected ? "text-emerald-100" : "text-gray-400"
                          }`}
                        >
                          {size.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                  {t("filamentPainting.lockAspectRatio")} ({targetWidthMm} ×{" "}
                  {targetHeightMm} mm).
                </p>
              </div>

              {/* Advanced Toggle */}
              <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="w-full flex items-center justify-between text-[11px] font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <span>
                    {showAdvanced
                      ? t("filamentPainting.hideAdvanced")
                      : t("filamentPainting.advancedSettings")}
                  </span>
                  {showAdvanced ? (
                    <ChevronUp size={13} />
                  ) : (
                    <ChevronDown size={13} />
                  )}
                </button>

                {showAdvanced && (
                  <div className="pt-2 space-y-2 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded px-2 py-1">
                        <span className="text-[10px] text-gray-500">
                          {t("filamentPainting.widthMm")}
                        </span>
                        <input
                          type="number"
                          min="50"
                          max="250"
                          value={targetWidthMm}
                          onChange={(e) => {
                            setSelectedSizePreset("custom");
                            const val = Math.max(20, Number(e.target.value));
                            setTargetWidthMm(val);
                            if (lockAspectRatio && imageDimensions) {
                              const aspect =
                                imageDimensions.height / imageDimensions.width;
                              setTargetHeightMm(Math.round(val * aspect));
                            }
                          }}
                          className="w-10 bg-transparent text-xs font-bold text-right outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded px-2 py-1">
                        <span className="text-[10px] text-gray-500">
                          {t("filamentPainting.heightMm")}
                        </span>
                        <input
                          type="number"
                          min="50"
                          max="250"
                          value={targetHeightMm}
                          onChange={(e) => {
                            setSelectedSizePreset("custom");
                            setTargetHeightMm(
                              Math.max(20, Number(e.target.value)),
                            );
                          }}
                          disabled={lockAspectRatio && !!imageDimensions}
                          className="w-10 bg-transparent text-xs font-bold text-right outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-gray-500">
                      <input
                        type="checkbox"
                        checked={lockAspectRatio}
                        onChange={(e) => setLockAspectRatio(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-3 h-3"
                      />
                      <span>{t("filamentPainting.lockAspectRatio")}</span>
                    </label>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-semibold text-gray-500">
                        {t("filamentPainting.qualityTitle")}
                      </span>
                      <div className="flex gap-1">
                        {qualityOptions.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setQualityPreset(opt.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              qualityPreset === opt.id
                                ? "bg-emerald-700 text-white border-emerald-700"
                                : "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300"
                            }`}
                          >
                            {opt.id}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LIVE MULTI-COLOR PREVIEW & SIMULATION */}
          <div className="bg-white dark:bg-[#0e1512] rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles
                  className="text-emerald-600 dark:text-emerald-400"
                  size={18}
                />
                <h3 className="font-bold text-gray-800 dark:text-white text-base">
                  {t("filamentPainting.previewTitle")}
                </h3>
              </div>

              {/* View Switcher: 3D Relief vs 2D Simulation */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/10 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPreviewMode("3d")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    previewMode === "3d"
                      ? "bg-white dark:bg-[#141e1a] text-emerald-700 dark:text-emerald-400 shadow-2xs"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                  }`}
                >
                  <Box size={14} />
                  <span>{t("filamentPainting.view3dRelief")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("2d")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    previewMode === "2d"
                      ? "bg-white dark:bg-[#141e1a] text-emerald-700 dark:text-emerald-400 shadow-2xs"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                  }`}
                >
                  <Eye size={14} />
                  <span>{t("filamentPainting.view2dSim")}</span>
                </button>
              </div>
            </div>

            {/* Display Canvas Container */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 min-h-[380px] flex items-center justify-center border border-gray-800 shadow-inner">
              {isInitialLoading ? (
                <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <Loader2
                    className="animate-spin text-emerald-400"
                    size={38}
                  />
                  <p className="font-bold text-white text-sm">
                    {t("filamentPainting.convertingPhoto")}
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    {t("filamentPainting.generatingSubtitle")}
                  </p>
                </div>
              ) : liveResult ? (
                <>
                  {previewMode === "3d" && (
                    <Suspense
                      fallback={
                        <div className="w-full h-full min-h-[380px] bg-slate-900 flex flex-col items-center justify-center text-slate-400 gap-2">
                          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                          <span className="text-xs font-semibold">
                            {t("quote.loading3dPreview")}
                          </span>
                        </div>
                      }
                    >
                      <Interactive3DViewer
                        key={`${liveResult.modelGlbUrl}_${generationKey}`}
                        fileUrl={liveResult.modelGlbUrl}
                        fileName={liveResult.modelGlbUrl}
                        className="w-full h-full min-h-[380px]"
                        compact={false}
                      />
                    </Suspense>
                  )}

                  {previewMode === "2d" && (
                    <div className="w-full h-full min-h-[380px] flex items-center justify-center p-4 bg-slate-950">
                      <img
                        src={
                          liveResult.previewImageUrl ||
                          liveResult.previewImageBase64
                        }
                        alt={t("filamentPainting.view2dSim")}
                        className="max-h-[360px] max-w-full rounded-lg object-contain shadow-2xl border border-white/10"
                      />
                    </div>
                  )}

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

            {/* Layer Color Stack Bar */}
            {liveResult?.layerColorMap && liveResult.layerColorMap.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="text-emerald-600" size={13} />
                    <span>{t("filamentPainting.layerStackTitle")}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-normal">
                    {liveResult.totalLayers} {t("filamentPainting.colorsCount")}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {liveResult.layerColorMap.map((l, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-[#141e1a] border border-gray-200 dark:border-white/10 shadow-2xs"
                    >
                      <div
                        className="w-5 h-5 rounded-md border border-black/20 shrink-0 shadow-2xs flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ backgroundColor: l.hexColor }}
                      >
                        <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                          {i + 1}
                        </span>
                      </div>
                      <div className="min-w-0 text-[11px]">
                        <p className="font-bold text-gray-800 dark:text-white truncate">
                          {l.filamentName}
                        </p>
                        <p className="text-gray-400 text-[10px]">
                          {l.zMin.toFixed(2)} - {l.zMax.toFixed(2)} mm
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PRIMARY CTA: Add 3D Photo to Quote */}
          <div className="bg-white dark:bg-[#0e1512] p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                  {t("filamentPainting.readyToPrint")}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
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
                  ? "bg-gray-300 dark:bg-white/10 cursor-not-allowed text-gray-500 dark:text-gray-500 shadow-none"
                  : "bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] shadow-emerald-700/20"
              }`}
            >
              <CheckCircle2 size={18} />
              <span>{t("filamentPainting.add3dPhotoToQuote")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
