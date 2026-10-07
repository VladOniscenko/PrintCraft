import { useState, useEffect, useRef } from "react";
import { Box3, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import {
  Upload,
  Trash2,
  Plus,
  Package,
  Loader2,
  CheckCircle,
  Layers,
  Palette,
  MessageSquare,
  Hash,
  Ruler,
  MapPin,
  User,
  ChevronRight,
  ChevronLeft,
  Home,
  Gauge,
  Sliders,
} from "lucide-react";
import Navbar from "./Navbar";
import Interactive3DViewer from "./Interactive3DViewer";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import type { OrderItem, Filament } from "../types";
import { useI18n } from "../i18n/I18nContext";
import Footer from "./Footer";
import { useNotify } from "../context/NotifyContext";
import { getOrCreateVisitorId } from "../services/api";
import { resolveAssetUrl } from "../utils/assetUrl";
import {
  validateShippingInfo,
  type ShippingInfo,
} from "../utils/shippingValidation";

const ALLOWED_UPLOAD_ACCEPT =
  ".stl,.obj,.3mf,.step,.stp,.png,.jpg,.jpeg,.webp,.gif";
const MODEL_EXTENSIONS = new Set([".stl", ".obj", ".3mf", ".step", ".stp"]);
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const MAX_FILES_PER_ITEM = 3;
const MAX_DIMENSION_MM = 256;
const SCALE_STEP = 0.01;

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex < 0) return "";
  return fileName.slice(dotIndex).toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hasDimensionValue(value?: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function formatDimensions(
  x?: number,
  y?: number,
  z?: number,
): string | undefined {
  if (!hasDimensionValue(x) && !hasDimensionValue(y) && !hasDimensionValue(z)) {
    return undefined;
  }

  if (!hasDimensionValue(x) || !hasDimensionValue(y) || !hasDimensionValue(z)) {
    return undefined;
  }

  return `${x} x ${y} x ${z} mm`;
}

function roundMillimeters(value: number): number {
  return Math.round(value * 10) / 10;
}

function getMaximumScaleForBase(x: number, y: number, z: number): number {
  if (x <= 0 || y <= 0 || z <= 0) return 1;
  return Math.min(
    MAX_DIMENSION_MM / x,
    MAX_DIMENSION_MM / y,
    MAX_DIMENSION_MM / z,
  );
}

function clampScale(scale: number, maxScale: number): number {
  const safeMaxScale = Math.max(0, maxScale);
  return Math.max(0, Math.min(scale, safeMaxScale));
}

function almostEqual(a: number, b: number, epsilon = 0.001) {
  return Math.abs(a - b) <= epsilon;
}

function formatScaleForFileName(scale: number): string {
  return scale
    .toFixed(2)
    .replace(/\.00$/, "")
    .replace(/(\.\d*[1-9])0$/, "$1");
}

function itemHasModel(item: OrderItem): boolean {
  if (item.files && item.files.some((f) => f.kind === "model")) return true;
  if (item.fileUrl && MODEL_EXTENSIONS.has(getFileExtension(item.fileUrl)))
    return true;
  return false;
}

async function detectModelDimensionsFromBuffer(
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

async function detectModelDimensions(file: File): Promise<{
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

interface SavedAddress {
  id: string;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  label?: string;
  isDefault: boolean;
}

export default function Quote() {
  const { t } = useI18n();
  const { notifyError } = useNotify();
  const navigate = useNavigate();

  const [items, setItems] = useState<OrderItem[]>(() => {
    try {
      const draft = JSON.parse(
        localStorage.getItem("printcraft-home-quote") || "null",
      );
      if (!draft?.fileUrl && !draft?.description) return [];
      const baseScale = draft.scaleFactor ?? 1.0;
      return [
        {
          fileUrl: draft.fileUrl || "",
          fileName: draft.fileName,
          imageUrl: "",
          material: draft.material || "PLA",
          color: draft.color || "Black",
          count: 1,
          price: 0,
          scaleFactor: baseScale,
          dimensionScale: baseScale,
          dimensionBaseX: draft.dimensionBaseX,
          dimensionBaseY: draft.dimensionBaseY,
          dimensionBaseZ: draft.dimensionBaseZ,
          dimensionX:
            draft.dimensionX ??
            (draft.dimensionBaseX
              ? roundMillimeters(draft.dimensionBaseX * baseScale)
              : undefined),
          dimensionY:
            draft.dimensionY ??
            (draft.dimensionBaseY
              ? roundMillimeters(draft.dimensionBaseY * baseScale)
              : undefined),
          dimensionZ:
            draft.dimensionZ ??
            (draft.dimensionBaseZ
              ? roundMillimeters(draft.dimensionBaseZ * baseScale)
              : undefined),
          infillPercent: 20,
          printQuality: "Standard (0.20mm)",
          supportsNeeded: false,
          notes: draft.description || "",
          files: draft.fileUrl
            ? [{ url: draft.fileUrl, name: draft.fileName, kind: "model" }]
            : [],
        },
      ];
    } catch {
      return [];
    }
  });
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const submittedRef = useRef(false);
  const uploadedFileUrlsRef = useRef<Set<string>>(new Set());

  const isLoggedIn = !!localStorage.getItem("token");

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestSubmittedOrderId, setGuestSubmittedOrderId] = useState<
    string | null
  >(null);
  const [guestAccountCreated, setGuestAccountCreated] = useState(false);

  // Address State
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [shippingDetails, setShippingDetails] = useState<ShippingInfo>({
    fullName: "",
    phoneNumber: "",
    addressLine1: "",
    city: "",
    postalCode: "",
  });
  const [shippingErrors, setShippingErrors] = useState<Record<string, string>>(
    {},
  );
  const [guestErrors, setGuestErrors] = useState<Record<string, string>>({});

  const [currentStep, setCurrentStep] = useState(1);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const totalSteps = 3;

  // Step 1 is now Models
  const validateStepOne = () => {
    if (items.length === 0) {
      return t("quote.noFiles");
    }

    if (
      items.some(
        (item) =>
          (!item.files || item.files.length === 0) &&
          !item.fileUrl &&
          !item.imageUrl &&
          !item.notes,
      )
    ) {
      return t("quote.itemContentRequired");
    }

    for (const item of items) {
      const dimensions = [item.dimensionX, item.dimensionY, item.dimensionZ];
      const hasAnyDimension = dimensions.some((value) =>
        hasDimensionValue(value),
      );

      if (!hasAnyDimension) continue;

      const allProvided = dimensions.every((value) => hasDimensionValue(value));
      if (!allProvided) {
        return t("quote.dimensionsAllOrNone");
      }

      const allWithinMax = dimensions.every(
        (value) => typeof value === "number" && value <= MAX_DIMENSION_MM,
      );
      if (!allWithinMax) {
        return t("quote.dimensionsMaxExceeded");
      }
    }

    return null;
  };

  // Step 2 is now Details (Contact & Shipping)
  const validateStepTwo = () => {
    if (!isLoggedIn) {
      const normalizedName = guestName.trim();
      const normalizedEmail = guestEmail.trim();

      if (normalizedName.length < 2) {
        return t("quote.guestRequiredName");
      }

      if (!normalizedEmail) {
        return t("quote.guestRequiredEmail");
      }

      if (!isValidEmail(normalizedEmail)) {
        return t("quote.guestInvalidEmail");
      }
    }

    const shippingErrors = validateShippingInfo(shippingDetails, t);
    if (Object.keys(shippingErrors).length > 0) {
      return Object.values(shippingErrors)[0];
    }

    return null;
  };

  const goToNextStep = () => {
    if (currentStep === 1) {
      const error = validateStepOne();
      if (error) {
        notifyError(error);
        return;
      }
    } else if (currentStep === 2) {
      // Run field-level validation and surface errors inline
      const fieldErrors = validateShippingInfo(shippingDetails, t);
      let hasError = false;

      if (Object.keys(fieldErrors).length > 0) {
        setShippingErrors(fieldErrors);
        notifyError(Object.values(fieldErrors)[0]);
        hasError = true;
      } else {
        setShippingErrors({});
      }

      // Guest-only contact validation
      if (!isLoggedIn) {
        const nextGuestErrors: Record<string, string> = {};
        const normalizedName = guestName.trim();
        const normalizedEmail = guestEmail.trim();
        if (normalizedName.length < 2) {
          nextGuestErrors.name = t("quote.guestRequiredName");
        }
        if (!normalizedEmail) {
          nextGuestErrors.email = t("quote.guestRequiredEmail");
        } else if (!isValidEmail(normalizedEmail)) {
          nextGuestErrors.email = t("quote.guestInvalidEmail");
        }

        if (Object.keys(nextGuestErrors).length > 0) {
          setGuestErrors(nextGuestErrors);
          if (!hasError) {
            notifyError(Object.values(nextGuestErrors)[0]);
          }
          hasError = true;
        } else {
          setGuestErrors({});
        }
      }

      if (hasError) return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToPreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateAgreement = () =>
    agreementAccepted ? null : t("quote.agreementRequired");

  // Fetch Filaments & Saved Addresses
  useEffect(() => {
    const fetchFilaments = async () => {
      try {
        const res = await api.get("/filaments");
        if (Array.isArray(res.data)) setFilaments(res.data);
      } catch (err) {
        console.error("Failed to fetch filaments", err);
      }
    };
    fetchFilaments();

    if (isLoggedIn) {
      const fetchAddresses = async () => {
        try {
          const res = await api.get("/me/addresses");
          if (Array.isArray(res.data) && res.data.length > 0) {
            setSavedAddresses(res.data);

            // Auto-select default address if available
            const defaultAddr =
              res.data.find((a: SavedAddress) => a.isDefault) || res.data[0];
            handleSelectSavedAddress(defaultAddr);
          }
        } catch (err) {
          console.error("Failed to fetch addresses", err);
        }
      };
      fetchAddresses();
    }
  }, [isLoggedIn]);

  // Auto-detect dimensions for models loaded from initial draft
  useEffect(() => {
    items.forEach((item, index) => {
      if (
        itemHasModel(item) &&
        item.fileUrl &&
        !hasDimensionValue(item.dimensionBaseX)
      ) {
        const url = resolveAssetUrl(item.fileUrl);
        fetch(url)
          .then((res) => {
            if (!res.ok) throw new Error("Failed to load model file");
            return res.arrayBuffer();
          })
          .then(async (buffer) => {
            const dims = await detectModelDimensionsFromBuffer(
              buffer,
              item.fileName || item.fileUrl || "model.stl",
            );
            if (dims) {
              setItems((prev) => {
                const next = [...prev];
                if (
                  !next[index] ||
                  hasDimensionValue(next[index].dimensionBaseX)
                )
                  return next;
                const maxScale = getMaximumScaleForBase(dims.x, dims.y, dims.z);
                const scale = clampScale(
                  next[index].scaleFactor ?? 1,
                  maxScale,
                );
                next[index] = {
                  ...next[index],
                  dimensionBaseX: dims.x,
                  dimensionBaseY: dims.y,
                  dimensionBaseZ: dims.z,
                  dimensionScale: scale,
                  scaleFactor: scale,
                  dimensionX: roundMillimeters(dims.x * scale),
                  dimensionY: roundMillimeters(dims.y * scale),
                  dimensionZ: roundMillimeters(dims.z * scale),
                };
                return next;
              });
            }
          })
          .catch(() => {
            // Best-effort
          });
      }
    });
  }, []);

  const availableMaterials = Array.from(
    new Set(filaments.map((f) => f.material?.trim()).filter(Boolean)),
  );
  const availableColors = Array.from(
    new Set(
      filaments.map((f) => f.color?.trim() || f.name?.trim()).filter(Boolean),
    ),
  );

  const finalMaterials =
    availableMaterials.length > 0 ? availableMaterials : ["PLA", "PETG"];
  const finalColors =
    availableColors.length > 0 ? availableColors : ["Black", "White"];

  const getColorsForMaterial = (selectedMaterial: string) => {
    const matchingFilaments = filaments.filter(
      (f) => f.material === selectedMaterial,
    );
    const colors = Array.from(
      new Set(
        matchingFilaments
          .map((f) => f.color?.trim() || f.name?.trim())
          .filter(Boolean),
      ),
    );
    return colors.length > 0 ? colors : finalColors;
  };

  // Ensure every item has a valid color once filaments load or change
  useEffect(() => {
    setItems((prevItems) => {
      let changed = false;
      const updated = prevItems.map((item) => {
        const validColors = getColorsForMaterial(item.material);
        const defaultColor = validColors[0] || "Black";
        if (!item.color || !validColors.includes(item.color)) {
          changed = true;
          return {
            ...item,
            color:
              item.color && validColors.includes(item.color)
                ? item.color
                : defaultColor,
          };
        }
        return item;
      });
      return changed ? updated : prevItems;
    });
  }, [filaments]);

  const handleSelectSavedAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setShippingDetails({
      fullName: addr.fullName,
      phoneNumber: addr.phoneNumber,
      addressLine1: addr.addressLine1,
      city: addr.city,
      postalCode: addr.postalCode,
    });
    setShippingErrors({});
  };

  const handleManualShippingChange = (
    field: keyof ShippingInfo,
    value: string,
  ) => {
    setSelectedAddressId("manual"); // Switch to manual mode immediately
    const updated = { ...shippingDetails, [field]: value };
    setShippingDetails(updated);

    // If this field currently has an error, clear it as soon as the user enters valid data
    if (shippingErrors[field]) {
      const currentErrors = validateShippingInfo(updated, t);
      if (!currentErrors[field]) {
        setShippingErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      } else {
        setShippingErrors((prev) => ({
          ...prev,
          [field]: currentErrors[field],
        }));
      }
    }
  };

  const handleGuestNameChange = (value: string) => {
    setGuestName(value);
    if (guestErrors.name && value.trim().length >= 2) {
      setGuestErrors((prev) => {
        const next = { ...prev };
        delete next.name;
        return next;
      });
    }
  };

  const handleGuestEmailChange = (value: string) => {
    setGuestEmail(value);
    if (guestErrors.email && isValidEmail(value.trim())) {
      setGuestErrors((prev) => {
        const next = { ...prev };
        delete next.email;
        return next;
      });
    }
  };

  const uploadSelectedFilesForItem = async (
    selectedFiles: File[],
    itemIndex: number,
  ) => {
    if (selectedFiles.length === 0) return;

    const existingFiles = items[itemIndex]?.files || [];
    const currentFileCount = existingFiles.length;
    const remainingSlots = MAX_FILES_PER_ITEM - currentFileCount;
    if (remainingSlots <= 0) {
      notifyError(`Max ${MAX_FILES_PER_ITEM} files per item.`);
      return;
    }

    let hasModelFile = existingFiles.some((file) => file.kind === "model");
    const filesToUpload: File[] = [];
    let skippedForModelConstraint = 0;

    for (const file of selectedFiles) {
      if (filesToUpload.length >= remainingSlots) break;

      const extension = getFileExtension(file.name);
      const isModel = MODEL_EXTENSIONS.has(extension);
      if (isModel && hasModelFile) {
        skippedForModelConstraint += 1;
        continue;
      }

      filesToUpload.push(file);
      if (isModel) {
        hasModelFile = true;
      }
    }

    const skippedForSlotConstraint =
      selectedFiles.length - filesToUpload.length - skippedForModelConstraint;

    if (skippedForModelConstraint > 0) {
      notifyError(t("quote.singleModelPerItem"));
    }

    if (skippedForSlotConstraint > 0) {
      notifyError(
        `Max ${MAX_FILES_PER_ITEM} files per item. Only ${filesToUpload.length} file(s) were added.`,
      );
    }

    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    let failedCount = 0;
    let firstErrorMessage: string | null = null;
    let detectedDimensions: { x: number; y: number; z: number } | null = null;
    const uploadedEntries: Array<{
      file: File;
      url: string;
      isImage: boolean;
      isModel: boolean;
    }> = [];

    try {
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await api.post("/upload", formData);

          const extension = getFileExtension(file.name);
          const isImage = IMAGE_EXTENSIONS.has(extension);
          const isModel = MODEL_EXTENSIONS.has(extension);

          if (typeof res.data?.url === "string" && res.data.url.length > 0) {
            uploadedFileUrlsRef.current.add(res.data.url);
            uploadedEntries.push({
              file,
              url: res.data.url,
              isImage,
              isModel,
            });
          }
        } catch (err: any) {
          failedCount += 1;

          if (!firstErrorMessage) {
            const backendMessage = err?.response?.data?.message;
            const isUnsupportedType =
              typeof backendMessage === "string" &&
              /unsupported file type|unsupported content type/i.test(
                backendMessage,
              );

            if (isUnsupportedType) {
              firstErrorMessage = `${t("quote.uploadUnsupportedType")} ${t("quote.allowedFilesInline")}`;
            } else {
              firstErrorMessage = backendMessage || t("quote.uploadFailed");
            }
          }
        }
      }

      if (!detectedDimensions) {
        const firstUploadedModel = uploadedEntries.find(
          (entry) => entry.isModel,
        );
        if (firstUploadedModel) {
          detectedDimensions = await detectModelDimensions(
            firstUploadedModel.file,
          );
        }
      }

      if (uploadedEntries.length > 0) {
        setItems((prev) => {
          const nextItems = [...prev];
          const defaultMat = finalMaterials[0] || "PLA";
          const defaultColor = getColorsForMaterial(defaultMat)[0] || "Black";

          const targetItem = nextItems[itemIndex] || {
            fileUrl: "",
            fileName: "",
            imageUrl: "",
            material: defaultMat,
            color: defaultColor,
            count: 1,
            price: 0,
            scaleFactor: 1.0,
            infillPercent: 20,
            printQuality: "Standard (0.20mm)",
            supportsNeeded: false,
            notes: "",
            files: [],
          };

          const existingFiles = targetItem.files || [];
          const newFiles = uploadedEntries.map((entry) => ({
            url: entry.url,
            name: entry.file.name,
            kind: (entry.isModel
              ? "model"
              : entry.isImage
                ? "image"
                : "other") as "model" | "image" | "other",
          }));

          const mergedFiles = [...existingFiles, ...newFiles];
          const firstModel = mergedFiles.find((file) => file.kind === "model");
          const firstImage = mergedFiles.find((file) => file.kind === "image");
          const firstAny = mergedFiles[0];

          const isModelUploaded = uploadedEntries.some((e) => e.isModel);

          let dimensionState: Partial<OrderItem> = {};

          if (detectedDimensions) {
            // New model with detected dimensions: ALWAYS override dimensions with model's actual size!
            const maxScale = getMaximumScaleForBase(
              detectedDimensions.x,
              detectedDimensions.y,
              detectedDimensions.z,
            );
            const scale = clampScale(1, maxScale);
            dimensionState = {
              dimensionBaseX: detectedDimensions.x,
              dimensionBaseY: detectedDimensions.y,
              dimensionBaseZ: detectedDimensions.z,
              dimensionScale: scale,
              scaleFactor: scale,
              dimensionX: roundMillimeters(detectedDimensions.x * scale),
              dimensionY: roundMillimeters(detectedDimensions.y * scale),
              dimensionZ: roundMillimeters(detectedDimensions.z * scale),
            };
          } else if (isModelUploaded) {
            // A 3D model was uploaded, but bounding box couldn't be auto-detected:
            // CLEAR stale non-file dimensions (e.g. 50 x 50 x 20) so they don't persist!
            dimensionState = {
              dimensionBaseX: undefined,
              dimensionBaseY: undefined,
              dimensionBaseZ: undefined,
              dimensionScale: 1.0,
              scaleFactor: 1.0,
              dimensionX: undefined,
              dimensionY: undefined,
              dimensionZ: undefined,
            };
          }

          nextItems[itemIndex] = {
            ...targetItem,
            color: targetItem.color || defaultColor,
            files: mergedFiles,
            fileUrl: firstModel?.url || firstAny?.url || "",
            fileName: firstModel?.name || firstAny?.name || "",
            imageUrl: firstImage?.url || targetItem.imageUrl || "",
            ...dimensionState,
          };

          return nextItems;
        });
      }

      if (failedCount > 0) {
        const hasSuccessfulUploads = uploadedEntries.length > 0;
        if (hasSuccessfulUploads) {
          notifyError(
            `${t("quote.uploadPartialFailed")} (${failedCount}/${selectedFiles.length})`,
          );
        } else {
          notifyError(firstErrorMessage || t("quote.uploadFailed"));
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    itemIndex: number,
  ) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    await uploadSelectedFilesForItem(selectedFiles, itemIndex);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    itemIndex: number,
  ) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isUploading) return;

    const droppedFiles = Array.from(e.dataTransfer.files ?? []);
    await uploadSelectedFilesForItem(droppedFiles, itemIndex);
  };

  const deleteTempUpload = async (fileUrl?: string | null) => {
    if (!fileUrl) return;

    try {
      await api.delete("/upload/temp", {
        params: { fileUrl },
      });
      uploadedFileUrlsRef.current.delete(fileUrl);
    } catch {
      // Best-effort cleanup
    }
  };

  const removeItem = (index: number) => {
    const removed = items[index];
    setItems(items.filter((_, i) => i !== index));

    if (removed?.fileUrl) void deleteTempUpload(removed.fileUrl);
    if (removed?.imageUrl) void deleteTempUpload(removed.imageUrl);

    if (Array.isArray(removed?.files)) {
      for (const file of removed.files) {
        if (!file?.url) continue;
        if (file.url === removed.fileUrl || file.url === removed.imageUrl)
          continue;
        void deleteTempUpload(file.url);
      }
    }
  };

  const removeItemFile = (itemIndex: number, fileIndex: number) => {
    setItems((prev) => {
      const nextItems = [...prev];
      const item = nextItems[itemIndex];
      if (!item) return nextItems;

      const existingFiles = item.files || [];
      if (fileIndex < 0 || fileIndex >= existingFiles.length) return nextItems;

      const removed = existingFiles[fileIndex];
      const nextFiles = existingFiles.filter((_, index) => index !== fileIndex);

      const firstModel = nextFiles.find((file) => file.kind === "model");
      const firstImage = nextFiles.find((file) => file.kind === "image");
      const firstAny = nextFiles[0];

      nextItems[itemIndex] = {
        ...item,
        files: nextFiles,
        fileUrl: firstModel?.url || firstAny?.url || "",
        fileName: firstModel?.name || firstAny?.name || "",
        imageUrl: firstImage?.url || "",
        ...(removed?.kind === "model" && !firstModel
          ? {
              dimensionX: undefined,
              dimensionY: undefined,
              dimensionZ: undefined,
              dimensionBaseX: undefined,
              dimensionBaseY: undefined,
              dimensionBaseZ: undefined,
              dimensionScale: undefined,
            }
          : {}),
      };

      if (removed?.url) void deleteTempUpload(removed.url);

      return nextItems;
    });
  };

  const clearItemFiles = (itemIndex: number) => {
    setItems((prev) => {
      const nextItems = [...prev];
      const item = nextItems[itemIndex];
      if (!item) return nextItems;

      const existingFiles = item.files || [];
      for (const file of existingFiles) {
        if (!file?.url) continue;
        void deleteTempUpload(file.url);
      }

      nextItems[itemIndex] = {
        ...item,
        files: [],
        fileUrl: "",
        fileName: "",
        imageUrl: "",
        dimensionX: undefined,
        dimensionY: undefined,
        dimensionZ: undefined,
        dimensionBaseX: undefined,
        dimensionBaseY: undefined,
        dimensionBaseZ: undefined,
        dimensionScale: undefined,
      };

      return nextItems;
    });
  };

  const addTextOnlyItem = () => {
    const defaultMat = finalMaterials[0];
    const defaultColor = getColorsForMaterial(defaultMat)[0];

    const newItem: OrderItem = {
      fileUrl: "",
      fileName: "",
      notes: "",
      size: "",
      dimensionX: undefined,
      dimensionY: undefined,
      dimensionZ: undefined,
      dimensionBaseX: undefined,
      dimensionBaseY: undefined,
      dimensionBaseZ: undefined,
      dimensionScale: undefined,
      imageUrl: "",
      files: [],
      material: defaultMat,
      color: defaultColor,
      price: 0,
      count: 1,
      scaleFactor: 1.0,
      infillPercent: 20,
      printQuality: "Standard (0.20mm)",
      supportsNeeded: false,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const updateItemScale = (index: number, nextScale: number) => {
    setItems((prev) => {
      const nextItems = [...prev];
      const item = nextItems[index];
      if (!item) return nextItems;

      if (
        !hasDimensionValue(item.dimensionBaseX) ||
        !hasDimensionValue(item.dimensionBaseY) ||
        !hasDimensionValue(item.dimensionBaseZ)
      ) {
        const safeScale = Math.max(
          0.1,
          Math.min(3.0, Math.round(nextScale * 100) / 100),
        );
        nextItems[index] = {
          ...item,
          scaleFactor: safeScale,
          dimensionScale: safeScale,
        };
        return nextItems;
      }

      const maxScale = getMaximumScaleForBase(
        item.dimensionBaseX,
        item.dimensionBaseY,
        item.dimensionBaseZ,
      );
      const clampedScale = clampScale(nextScale, maxScale);

      nextItems[index] = {
        ...item,
        scaleFactor: clampedScale,
        dimensionScale: clampedScale,
        dimensionX: roundMillimeters(item.dimensionBaseX * clampedScale),
        dimensionY: roundMillimeters(item.dimensionBaseY * clampedScale),
        dimensionZ: roundMillimeters(item.dimensionBaseZ * clampedScale),
      };

      return nextItems;
    });
  };

  const updateItemDimensions = (
    index: number,
    x?: number,
    y?: number,
    z?: number,
  ) => {
    setItems((prev) => {
      const nextItems = [...prev];
      const item = nextItems[index];
      if (!item) return nextItems;

      nextItems[index] = {
        ...item,
        dimensionX:
          x !== undefined && !Number.isNaN(x) ? roundMillimeters(x) : undefined,
        dimensionY:
          y !== undefined && !Number.isNaN(y) ? roundMillimeters(y) : undefined,
        dimensionZ:
          z !== undefined && !Number.isNaN(z) ? roundMillimeters(z) : undefined,
      };

      return nextItems;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const stepOneError = validateStepOne();
    if (stepOneError) {
      notifyError(stepOneError);
      setCurrentStep(1);
      return;
    }

    const stepTwoError = validateStepTwo();
    if (stepTwoError) {
      notifyError(stepTwoError);
      setCurrentStep(2);
      return;
    }

    const agreementError = validateAgreement();
    if (agreementError) {
      notifyError(agreementError);
      return;
    }

    setIsSubmitting(true);
    try {
      if (!isLoggedIn) {
        setGuestAccountCreated(false);
        setGuestSubmittedOrderId(null);
      }

      let replacedOriginalModelUrls: string[] = [];

      const itemsForPayload = await Promise.all(
        items.map(async (item) => {
          const modelFileIndex = (item.files || []).findIndex(
            (file) => file.kind === "model",
          );

          if (
            modelFileIndex < 0 ||
            !hasDimensionValue(item.dimensionScale) ||
            almostEqual(item.dimensionScale, 1)
          ) {
            return item;
          }

          const modelFile = item.files?.[modelFileIndex];
          if (!modelFile?.url) return item;

          const extension = getFileExtension(modelFile.name || "");
          if (extension !== ".stl") return item;

          try {
            const sourceUrl = resolveAssetUrl(modelFile.url);
            const sourceResponse = await fetch(sourceUrl);
            if (!sourceResponse.ok) {
              throw new Error("Failed to fetch STL for scaling.");
            }

            const sourceBuffer = await sourceResponse.arrayBuffer();
            const loader = new STLLoader();
            const geometry = loader.parse(sourceBuffer);
            geometry.scale(
              item.dimensionScale,
              item.dimensionScale,
              item.dimensionScale,
            );

            const exporter = new STLExporter();
            const mesh = new Mesh(geometry, new MeshStandardMaterial());
            const exported = exporter.parse(mesh, {
              binary: true,
            }) as DataView | ArrayBuffer | string;

            let scaledBlob: Blob;
            if (typeof exported === "string") {
              scaledBlob = new Blob([exported], { type: "model/stl" });
            } else if (exported instanceof DataView) {
              const bytes = new Uint8Array(exported.byteLength);
              for (let i = 0; i < exported.byteLength; i += 1) {
                bytes[i] = exported.getUint8(i);
              }
              scaledBlob = new Blob([bytes], { type: "model/stl" });
            } else {
              scaledBlob = new Blob([exported], { type: "model/stl" });
            }

            const scaleLabel = formatScaleForFileName(item.dimensionScale);
            const scaledFileName = modelFile.name.endsWith(".stl")
              ? modelFile.name.replace(/\.stl$/i, "") +
                `_scaled_${scaleLabel}x.stl`
              : modelFile.name + `_scaled_${scaleLabel}x.stl`;

            const scaledFile = new File([scaledBlob], scaledFileName, {
              type: "model/stl",
            });

            const uploadFormData = new FormData();
            uploadFormData.append("file", scaledFile);

            const uploadRes = await api.post("/upload", uploadFormData);
            const scaledUrl = uploadRes.data?.url;
            if (typeof scaledUrl !== "string" || !scaledUrl) {
              throw new Error("Failed to upload scaled STL.");
            }

            uploadedFileUrlsRef.current.add(scaledUrl);

            const nextFiles = [...(item.files || [])];
            nextFiles[modelFileIndex] = {
              ...nextFiles[modelFileIndex],
              url: scaledUrl,
              name: scaledFileName,
            };

            replacedOriginalModelUrls.push(modelFile.url);

            return {
              ...item,
              files: nextFiles,
              fileUrl: scaledUrl,
              fileName: scaledFileName,
            };
          } catch {
            throw new Error(t("quote.scaleFailed"));
          }
        }),
      );

      const payload: any = {
        items: itemsForPayload.map((item) => {
          const dims = formatDimensions(
            item.dimensionX,
            item.dimensionY,
            item.dimensionZ,
          );
          const hasModel = itemHasModel(item);
          const effectiveScale = hasModel
            ? (item.scaleFactor ?? item.dimensionScale ?? 1.0)
            : 1.0;
          return {
            fileUrl: item.fileUrl || undefined,
            imageUrl: item.imageUrl || undefined,
            fileName: item.fileName || undefined,
            notes: item.notes?.trim() || undefined,
            size: dims
              ? hasModel
                ? `${dims} (${effectiveScale.toFixed(2)}x)`
                : dims
              : hasModel
                ? `Scale: ${effectiveScale.toFixed(2)}x`
                : undefined,
            scaleFactor: effectiveScale,
            infillPercent: item.infillPercent ?? 20,
            printQuality: item.printQuality ?? "Standard (0.20mm)",
            supportsNeeded: !!item.supportsNeeded,
            material: item.material || "PLA",
            color:
              item.color ||
              getColorsForMaterial(item.material || "PLA")[0] ||
              "Black",
            count: item.count,
            files: (item.files || []).map((file) => ({
              url: file.url,
              name: file.name,
              kind: file.kind || "other",
            })),
          };
        }),
        shippingFullName: shippingDetails.fullName,
        shippingPhoneNumber: shippingDetails.phoneNumber,
        shippingAddressLine1: shippingDetails.addressLine1,
        shippingCity: shippingDetails.city,
        shippingPostalCode: shippingDetails.postalCode,
        agreementAccepted,
        agreementVersion: "2026-09-23",
      };

      if (!isLoggedIn) {
        payload.guestName = guestName.trim();
        payload.guestEmail = guestEmail.trim();
        payload.guestPhone = guestPhone.trim();
      }

      const res = await api.post("/orders/quote", payload);
      submittedRef.current = true;
      localStorage.removeItem("printcraft-home-quote");
      uploadedFileUrlsRef.current.clear();

      for (const originalUrl of replacedOriginalModelUrls) {
        void deleteTempUpload(originalUrl);
      }

      if (isLoggedIn) {
        const orderId = res?.data?.order?.id || res?.data?.id;
        navigate(orderId ? `/orders/${orderId}` : "/orders");
        return;
      }

      setItems([]);
      setGuestSubmittedOrderId(res?.data?.order?.id || res?.data?.id || null);
      setGuestAccountCreated(!!res?.data?.accountCreated);
      setCurrentStep(1);
    } catch (err: any) {
      const message = err?.response?.data?.message || t("quote.submitFailed");
      notifyError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (submittedRef.current) return;

      const pendingFileUrls = Array.from(uploadedFileUrlsRef.current);
      if (pendingFileUrls.length === 0) return;

      const token = localStorage.getItem("token");
      const visitorId = getOrCreateVisitorId();

      void fetch("/api/upload/temp/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Visitor-Id": visitorId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ fileUrls: pendingFileUrls }),
        keepalive: true,
      }).catch(() => {
        // Best-effort fallback if keepalive batch call fails.
      });

      for (const fileUrl of pendingFileUrls) {
        void api
          .delete("/upload/temp", {
            params: { fileUrl },
          })
          .catch(() => {
            // Best-effort cleanup only.
          });
      }
    };
  }, []);

  const stepLabels = [
    t("quote.stepModels"),
    t("quote.stepDetails"),
    t("quote.stepReview"),
  ];

  return (
    <div className="site-shell">
      <Navbar />

      <main className="site-main px-4 sm:px-6 py-12 max-w-7xl mx-auto">
        <div className="mb-10 text-center">
          <h2 className="site-heading text-4xl font-bold mb-2">
            {t("quote.title")}
          </h2>
          <p className="site-subheading text-lg">{t("quote.subtitle")}</p>
        </div>

        {/* Improved Step Progress Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-center max-w-3xl mx-auto">
            {stepLabels.map((label, index) => {
              const stepNumber = index + 1;
              const isActive = currentStep === stepNumber;
              const isComplete = currentStep > stepNumber;

              return (
                <div
                  key={label}
                  className="flex items-center flex-1 last:flex-none"
                >
                  <div className="flex flex-col items-center relative z-10 w-24">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                        isActive
                          ? "border-emerald-600 bg-emerald-600 text-white shadow-md"
                          : isComplete
                            ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                            : "border-gray-200 bg-white text-gray-400"
                      }`}
                    >
                      {isComplete ? <CheckCircle size={18} /> : stepNumber}
                    </div>
                    <span
                      className={`absolute top-12 mt-1 text-xs font-semibold whitespace-nowrap transition-colors duration-300 ${
                        isActive
                          ? "text-emerald-800"
                          : isComplete
                            ? "text-emerald-600"
                            : "text-gray-400"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {index < stepLabels.length - 1 && (
                    <div className="flex-1 mx-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500 ease-in-out"
                        style={{ width: isComplete ? "100%" : "0%" }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {!isLoggedIn && guestSubmittedOrderId && (
          <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 text-center">
            <h3 className="text-xl font-bold text-emerald-800">
              {guestAccountCreated
                ? t("quote.guestAccountCreatedTitle")
                : t("quote.guestSubmittedTitle")}
            </h3>
            <p className="mt-2 text-sm text-emerald-900/80 max-w-lg mx-auto">
              {guestAccountCreated
                ? t("quote.guestAccountCreatedBody")
                : t("quote.guestSubmittedBody")}
            </p>
            <div className="mt-4 inline-block bg-white px-4 py-2 rounded-lg border border-emerald-100 shadow-sm text-sm font-semibold text-emerald-800">
              {t("quote.guestSubmittedReference")}{" "}
              <span className="font-mono text-emerald-600 ml-2">
                {guestSubmittedOrderId}
              </span>
            </div>
            {guestAccountCreated && (
              <p className="mt-4 text-xs text-[#0f766e] font-semibold">
                {t("quote.guestAccountCreatedHint")}
              </p>
            )}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
        >
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* STEP 1: MODELS */}
            {currentStep === 1 && (
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                      <Package className="text-emerald-600" size={24} />
                      {t("quote.models")}
                    </h3>
                    <p className="mt-1 text-sm text-[#5f736d]">
                      {t("quote.allowedFilesInline")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addTextOnlyItem}
                    className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    {t("quote.addItem")}
                  </button>
                </div>

                <p className="mb-6 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100">
                  {t("quote.materialAvailabilityDisclaimer")}
                </p>

                {items.length === 0 ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 0)}
                    className={`border-2 border-dashed rounded-2xl py-16 text-center transition-colors ${
                      isDragOver
                        ? "border-emerald-400 bg-emerald-50/50"
                        : "border-gray-200 bg-gray-50/50 hover:bg-gray-50"
                    } ${isUploading ? "opacity-70" : ""}`}
                  >
                    <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                      <Upload className="text-emerald-500" size={28} />
                    </div>
                    <p className="text-gray-800 font-semibold text-lg">
                      {t("quote.noFiles")}
                    </p>
                    <p className="mt-2 text-sm text-[#5f736d] max-w-sm mx-auto">
                      {t("quote.dragAndDropHint")}
                    </p>
                    <div className="mt-6 flex justify-center">
                      <label className="cursor-pointer bg-[#133827] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#1c4d37] transition-all flex items-center gap-2 shadow-sm">
                        {isUploading ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Upload size={16} />
                        )}
                        {t("quote.browseFiles")}
                        <input
                          type="file"
                          multiple
                          accept={ALLOWED_UPLOAD_ACCEPT}
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 0)}
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-5 md:p-6 border border-gray-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, idx)}
                      >
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-5 border-b border-gray-100 pb-4">
                          <span className="font-bold text-gray-800 text-lg truncate flex-1">
                            {item.fileName || t("quote.textDescription")}
                          </span>
                          <div className="flex items-center gap-3">
                            <label className="cursor-pointer bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 border border-emerald-100">
                              {isUploading ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <Plus size={16} />
                              )}
                              {t("quote.addFile")}
                              <input
                                type="file"
                                multiple
                                accept={ALLOWED_UPLOAD_ACCEPT}
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, idx)}
                                disabled={
                                  isUploading ||
                                  (item.files || []).length >=
                                    MAX_FILES_PER_ITEM
                                }
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-100"
                              title={t("quote.removeItemTitle")}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        {(item.files || []).length > 0 && (
                          <div className="mb-5 flex flex-wrap gap-2 items-center">
                            {(item.files || []).map((file, fileIndex) => (
                              <div
                                key={`${file.url}-${fileIndex}`}
                                className="inline-flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 pl-3 pr-2 py-1.5 text-sm text-gray-700 font-medium"
                              >
                                <span className="truncate max-w-[200px]">
                                  {file.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeItemFile(idx, fileIndex)}
                                  className="text-gray-400 hover:text-rose-600 bg-white rounded-md p-0.5 shadow-sm border border-gray-100 hover:border-rose-200 transition-colors"
                                  aria-label={`Remove ${file.name}`}
                                  title={t("quote.removeItemTitle")}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => clearItemFiles(idx)}
                              className="text-xs font-semibold text-rose-600 hover:text-rose-800 ml-2"
                            >
                              {t("quote.removeFile")}
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                              <Layers size={14} /> {t("quote.material")}
                            </label>
                            <select
                              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all cursor-pointer"
                              value={item.material}
                              onChange={(e) => {
                                const newMaterial = e.target.value;
                                const validColors =
                                  getColorsForMaterial(newMaterial);
                                const newItems = [...items];
                                newItems[idx].material = newMaterial;
                                if (
                                  !validColors.includes(newItems[idx].color)
                                ) {
                                  newItems[idx].color = validColors[0];
                                }
                                setItems(newItems);
                              }}
                            >
                              {finalMaterials.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                              <Palette size={14} /> {t("quote.color")}
                            </label>
                            <select
                              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all cursor-pointer"
                              value={
                                item.color ||
                                getColorsForMaterial(item.material)[0] ||
                                "Black"
                              }
                              onChange={(e) =>
                                updateItem(idx, "color", e.target.value)
                              }
                            >
                              {getColorsForMaterial(item.material).map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                              <Hash size={14} /> {t("quote.quantity")}
                            </label>
                            <input
                              type="number"
                              min="1"
                              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                              value={item.count}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  "count",
                                  parseInt(e.target.value, 10) || 1,
                                )
                              }
                            />
                          </div>
                        </div>

                        {/* Interactive WebGL 3D Viewer with Live Color Preview, Dimension Check, and UX Instructions */}
                        {(() => {
                          const modelFile = (item.files || []).find(
                            (f) => f.kind === "model",
                          );
                          const activeModelUrl =
                            modelFile?.url ||
                            (item.fileUrl &&
                            MODEL_EXTENSIONS.has(getFileExtension(item.fileUrl))
                              ? item.fileUrl
                              : undefined);
                          const activeModelName =
                            modelFile?.name || item.fileName || "model.stl";

                          if (!activeModelUrl && !itemHasModel(item))
                            return null;

                          return (
                            <div className="mb-5">
                              <Interactive3DViewer
                                fileUrl={activeModelUrl}
                                fileName={activeModelName}
                                colorName={
                                  item.color ||
                                  getColorsForMaterial(item.material)[0] ||
                                  "Black"
                                }
                                materialName={item.material}
                                scaleFactor={
                                  item.scaleFactor ?? item.dimensionScale ?? 1.0
                                }
                                count={item.count}
                                filaments={filaments}
                                showHelp={true}
                                onDimensionsDetected={(dims: {
                                  x: number;
                                  y: number;
                                  z: number;
                                }) => {
                                  if (!hasDimensionValue(item.dimensionBaseX)) {
                                    setItems((prev) => {
                                      const next = [...prev];
                                      if (
                                        !next[idx] ||
                                        hasDimensionValue(
                                          next[idx].dimensionBaseX,
                                        )
                                      )
                                        return next;
                                      const maxScale = getMaximumScaleForBase(
                                        dims.x,
                                        dims.y,
                                        dims.z,
                                      );
                                      const scale = clampScale(
                                        next[idx].scaleFactor ?? 1.0,
                                        maxScale,
                                      );
                                      next[idx] = {
                                        ...next[idx],
                                        dimensionBaseX: dims.x,
                                        dimensionBaseY: dims.y,
                                        dimensionBaseZ: dims.z,
                                        dimensionScale: scale,
                                        scaleFactor: scale,
                                        dimensionX: roundMillimeters(
                                          dims.x * scale,
                                        ),
                                        dimensionY: roundMillimeters(
                                          dims.y * scale,
                                        ),
                                        dimensionZ: roundMillimeters(
                                          dims.z * scale,
                                        ),
                                      };
                                      return next;
                                    });
                                  }
                                }}
                              />
                            </div>
                          );
                        })()}

                        {/* 3D Slicing & Print Specifications */}
                        <div className="mb-5 rounded-2xl border border-gray-200/90 bg-gradient-to-b from-gray-50/90 to-white p-5 shadow-sm space-y-4">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div>
                              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Gauge size={15} className="text-emerald-600" />
                                {t("quote.printSpecs")}
                              </h4>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {t("quote.printSpecsSubtitle")}
                              </p>
                            </div>
                          </div>

                          {/* Sizing & Scale or Dimensions selection */}
                          {(() => {
                            const hasModel = itemHasModel(item);
                            const hasBaseDimensions =
                              hasDimensionValue(item.dimensionBaseX) &&
                              hasDimensionValue(item.dimensionBaseY) &&
                              hasDimensionValue(item.dimensionBaseZ);
                            const currentScale =
                              item.scaleFactor ?? item.dimensionScale ?? 1.0;
                            const maxScale = hasBaseDimensions
                              ? getMaximumScaleForBase(
                                  item.dimensionBaseX!,
                                  item.dimensionBaseY!,
                                  item.dimensionBaseZ!,
                                )
                              : 3.0;
                            const targetX =
                              item.dimensionX ??
                              (hasBaseDimensions
                                ? roundMillimeters(
                                    item.dimensionBaseX! * currentScale,
                                  )
                                : undefined);
                            const targetY =
                              item.dimensionY ??
                              (hasBaseDimensions
                                ? roundMillimeters(
                                    item.dimensionBaseY! * currentScale,
                                  )
                                : undefined);
                            const targetZ =
                              item.dimensionZ ??
                              (hasBaseDimensions
                                ? roundMillimeters(
                                    item.dimensionBaseZ! * currentScale,
                                  )
                                : undefined);
                            const fitsBuildVolume =
                              (!targetX || targetX <= MAX_DIMENSION_MM) &&
                              (!targetY || targetY <= MAX_DIMENSION_MM) &&
                              (!targetZ || targetZ <= MAX_DIMENSION_MM);

                            if (hasModel) {
                              return (
                                <div className="space-y-3">
                                  {/* Sizing Header & Prominent mm Dimensions */}
                                  {hasBaseDimensions &&
                                  targetX &&
                                  targetY &&
                                  targetZ ? (
                                    <div
                                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                        fitsBuildVolume
                                          ? "bg-emerald-50/70 border-emerald-200"
                                          : "bg-rose-50/70 border-rose-200"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <div
                                          className={`p-2 rounded-lg ${
                                            fitsBuildVolume
                                              ? "bg-emerald-100 text-emerald-700"
                                              : "bg-rose-100 text-rose-700"
                                          }`}
                                        >
                                          <Ruler size={18} />
                                        </div>
                                        <div>
                                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                            {t("quote.dimensionsPreview")}
                                          </p>
                                          <p className="text-base font-extrabold text-gray-900">
                                            {targetX} mm × {targetY} mm ×{" "}
                                            {targetZ} mm
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-bold text-gray-700 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm">
                                          {currentScale.toFixed(2)}x
                                        </span>
                                        {fitsBuildVolume ? (
                                          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                            ✓ {t("quote.buildVolumeFits")}
                                          </span>
                                        ) : (
                                          <span className="text-[11px] font-semibold text-rose-800 bg-rose-100/90 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                            ⚠️ {t("quote.buildVolumeExceeded")}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                                      <div className="flex items-center gap-2">
                                        <Loader2
                                          size={14}
                                          className="animate-spin text-emerald-600"
                                        />
                                        <span className="text-xs font-medium text-gray-600">
                                          {t("quote.detectingDimensions")}
                                        </span>
                                      </div>
                                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                        {currentScale.toFixed(2)}x
                                      </span>
                                    </div>
                                  )}

                                  {/* Quick Scale Presets (Pills) */}
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                        <Sliders
                                          size={13}
                                          className="text-gray-500"
                                        />{" "}
                                        {t("quote.scalePreset")}
                                      </label>
                                      <span className="text-[11px] text-gray-500">
                                        {t("quote.dimensionsMaxHint")}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                      {[
                                        { scale: 0.5, label: "0.5x" },
                                        { scale: 1.0, label: "1.0x" },
                                        { scale: 1.5, label: "1.5x" },
                                        { scale: 2.0, label: "2.0x" },
                                      ].map((preset) => {
                                        const isCurrent =
                                          Math.abs(
                                            currentScale - preset.scale,
                                          ) < 0.04;
                                        const canFit = hasBaseDimensions
                                          ? preset.scale <= maxScale + 0.001
                                          : true;
                                        const pX = hasBaseDimensions
                                          ? roundMillimeters(
                                              item.dimensionBaseX! *
                                                preset.scale,
                                            )
                                          : null;
                                        const pY = hasBaseDimensions
                                          ? roundMillimeters(
                                              item.dimensionBaseY! *
                                                preset.scale,
                                            )
                                          : null;
                                        const pZ = hasBaseDimensions
                                          ? roundMillimeters(
                                              item.dimensionBaseZ! *
                                                preset.scale,
                                            )
                                          : null;

                                        return (
                                          <button
                                            key={preset.scale}
                                            type="button"
                                            disabled={!canFit}
                                            onClick={() =>
                                              updateItemScale(idx, preset.scale)
                                            }
                                            className={`p-2 rounded-xl text-left transition-all border ${
                                              !canFit
                                                ? "bg-gray-100 border-gray-200 text-gray-400 opacity-60 cursor-not-allowed"
                                                : isCurrent
                                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                                            }`}
                                            title={
                                              !canFit
                                                ? t("quote.scaleWontFit")
                                                : undefined
                                            }
                                          >
                                            <div className="flex items-center justify-between">
                                              <span
                                                className={`text-xs font-bold ${
                                                  !canFit
                                                    ? "line-through text-gray-400"
                                                    : ""
                                                }`}
                                              >
                                                {preset.label}
                                              </span>
                                              {!canFit && (
                                                <span className="text-[9px] font-bold text-rose-600 uppercase bg-rose-50 px-1 py-0.5 rounded">
                                                  &gt;256mm
                                                </span>
                                              )}
                                            </div>
                                            {hasBaseDimensions && (
                                              <p
                                                className={`text-[10px] truncate mt-0.5 ${
                                                  !canFit
                                                    ? "text-gray-400"
                                                    : isCurrent
                                                      ? "text-emerald-100"
                                                      : "text-gray-500"
                                                }`}
                                              >
                                                {pX}×{pY}×{pZ} mm
                                              </p>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Custom Scale Slider */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <label className="text-xs font-bold text-gray-700">
                                        {t("quote.scaleCustom")}
                                      </label>
                                      {hasBaseDimensions && (
                                        <span className="text-xs font-semibold text-gray-600">
                                          Max: {maxScale.toFixed(2)}x
                                        </span>
                                      )}
                                    </div>
                                    <input
                                      type="range"
                                      min="0.1"
                                      max={hasBaseDimensions ? maxScale : 3.0}
                                      step={SCALE_STEP}
                                      value={currentScale}
                                      className="w-full accent-emerald-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                      onChange={(e) =>
                                        updateItemScale(
                                          idx,
                                          Number(e.target.value),
                                        )
                                      }
                                    />
                                    <div className="flex justify-between items-center text-[11px] text-gray-500 pt-0.5">
                                      <span>
                                        {t("quote.dimensionsMaxHint")}
                                      </span>
                                      {targetX && targetY && targetZ && (
                                        <span className="font-semibold text-gray-800">
                                          {targetX} × {targetY} × {targetZ} mm
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            // Non-file item: scale is NOT applicable! Show dimension selector in mm
                            return (
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                      <Ruler
                                        size={14}
                                        className="text-emerald-600"
                                      />
                                      {t("quote.dimensionsMm")}
                                    </label>
                                    <span className="text-[11px] text-gray-500">
                                      {t("quote.dimensionsMaxHint")}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-500">
                                    {t("quote.dimensionsNonFilePrompt")}
                                  </p>
                                  <p className="text-[11px] text-amber-700/80 bg-amber-50/60 px-2.5 py-1.5 rounded-lg border border-amber-200/50">
                                    💡 {t("quote.scaleNeedsStl")}
                                  </p>
                                </div>

                                {/* Quick Dimension Presets */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {[
                                    {
                                      name: t("quote.presetSmall"),
                                      x: 50,
                                      y: 50,
                                      z: 20,
                                    },
                                    {
                                      name: t("quote.presetMedium"),
                                      x: 100,
                                      y: 100,
                                      z: 50,
                                    },
                                    {
                                      name: t("quote.presetLarge"),
                                      x: 180,
                                      y: 180,
                                      z: 100,
                                    },
                                    {
                                      name: t("quote.presetMax"),
                                      x: 250,
                                      y: 250,
                                      z: 250,
                                    },
                                  ].map((preset) => {
                                    const isCurrent =
                                      item.dimensionX === preset.x &&
                                      item.dimensionY === preset.y &&
                                      item.dimensionZ === preset.z;
                                    return (
                                      <button
                                        key={preset.name}
                                        type="button"
                                        onClick={() =>
                                          updateItemDimensions(
                                            idx,
                                            preset.x,
                                            preset.y,
                                            preset.z,
                                          )
                                        }
                                        className={`p-2.5 rounded-xl text-left border transition-all ${
                                          isCurrent
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                                        }`}
                                      >
                                        <p
                                          className={`text-xs font-bold ${
                                            isCurrent
                                              ? "text-white"
                                              : "text-gray-800"
                                          }`}
                                        >
                                          {preset.name.split(" ")[0]}
                                        </p>
                                        <p
                                          className={`text-[11px] mt-0.5 truncate ${
                                            isCurrent
                                              ? "text-emerald-100"
                                              : "text-gray-500"
                                          }`}
                                        >
                                          {preset.x} × {preset.y} × {preset.z}{" "}
                                          mm
                                        </p>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Custom Dimensions Inputs (Length X, Width Y, Height Z) */}
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">
                                      {t("quote.dimensionLength")}
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="256"
                                      step="1"
                                      placeholder="X mm"
                                      value={item.dimensionX ?? ""}
                                      onChange={(e) => {
                                        const val =
                                          e.target.value === ""
                                            ? undefined
                                            : parseFloat(e.target.value);
                                        updateItemDimensions(
                                          idx,
                                          val,
                                          item.dimensionY,
                                          item.dimensionZ,
                                        );
                                      }}
                                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">
                                      {t("quote.dimensionWidth")}
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="256"
                                      step="1"
                                      placeholder="Y mm"
                                      value={item.dimensionY ?? ""}
                                      onChange={(e) => {
                                        const val =
                                          e.target.value === ""
                                            ? undefined
                                            : parseFloat(e.target.value);
                                        updateItemDimensions(
                                          idx,
                                          item.dimensionX,
                                          val,
                                          item.dimensionZ,
                                        );
                                      }}
                                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">
                                      {t("quote.dimensionHeight")}
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="256"
                                      step="1"
                                      placeholder="Z mm"
                                      value={item.dimensionZ ?? ""}
                                      onChange={(e) => {
                                        const val =
                                          e.target.value === ""
                                            ? undefined
                                            : parseFloat(e.target.value);
                                        updateItemDimensions(
                                          idx,
                                          item.dimensionX,
                                          item.dimensionY,
                                          val,
                                        );
                                      }}
                                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                  </div>
                                </div>

                                {/* Real-time Volume Fit Feedback Badge */}
                                {hasDimensionValue(item.dimensionX) &&
                                  hasDimensionValue(item.dimensionY) &&
                                  hasDimensionValue(item.dimensionZ) && (
                                    <div
                                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
                                        (item.dimensionX ?? 0) <= 256 &&
                                        (item.dimensionY ?? 0) <= 256 &&
                                        (item.dimensionZ ?? 0) <= 256
                                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                          : "bg-rose-50 text-rose-800 border-rose-200"
                                      }`}
                                    >
                                      <span className="flex items-center gap-1.5">
                                        {(item.dimensionX ?? 0) <= 256 &&
                                        (item.dimensionY ?? 0) <= 256 &&
                                        (item.dimensionZ ?? 0) <= 256 ? (
                                          <>✓ {t("quote.buildVolumeFits")}</>
                                        ) : (
                                          <>
                                            ⚠️ {t("quote.buildVolumeExceeded")}
                                          </>
                                        )}
                                      </span>
                                      <span className="font-bold">
                                        {item.dimensionX} × {item.dimensionY} ×{" "}
                                        {item.dimensionZ} mm
                                      </span>
                                    </div>
                                  )}
                              </div>
                            );
                          })()}

                          {/* Infill Density & Print Quality */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {/* Infill Density */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Layers size={13} className="text-gray-500" />
                                  {t("quote.infill")}
                                </span>
                                <span className="text-[11px] font-semibold text-emerald-600">
                                  {item.infillPercent ?? 20}%
                                </span>
                              </label>
                              <select
                                value={item.infillPercent ?? 20}
                                onChange={(e) =>
                                  updateItem(
                                    idx,
                                    "infillPercent",
                                    parseInt(e.target.value, 10) || 20,
                                  )
                                }
                                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                              >
                                <option value={15}>
                                  {t("quote.infillLight")}
                                </option>
                                <option value={20}>
                                  {t("quote.infillStandard")}
                                </option>
                                <option value={40}>
                                  {t("quote.infillStrong")}
                                </option>
                                <option value={80}>
                                  {t("quote.infillSolid")}
                                </option>
                              </select>
                              <p className="text-[10px] text-gray-400">
                                {t("quote.infillHint")}
                              </p>
                            </div>

                            {/* Print Quality */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                <Sliders size={13} className="text-gray-500" />
                                {t("quote.quality")}
                              </label>
                              <select
                                value={item.printQuality ?? "Standard (0.20mm)"}
                                onChange={(e) =>
                                  updateItem(
                                    idx,
                                    "printQuality",
                                    e.target.value,
                                  )
                                }
                                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                              >
                                <option value="Detail (0.12mm)">
                                  {t("quote.qualityDetail")}
                                </option>
                                <option value="Standard (0.20mm)">
                                  {t("quote.qualityStandard")}
                                </option>
                                <option value="Draft (0.28mm)">
                                  {t("quote.qualityDraft")}
                                </option>
                              </select>
                              <p className="text-[10px] text-gray-400">
                                {t("quote.qualityHint")}
                              </p>
                            </div>
                          </div>

                          {/* Supports Toggle */}
                          <div className="pt-2 border-t border-gray-100">
                            <label className="flex items-start gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!item.supportsNeeded}
                                onChange={(e) =>
                                  updateItem(
                                    idx,
                                    "supportsNeeded",
                                    e.target.checked,
                                  )
                                }
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <div>
                                <span className="text-xs font-semibold text-gray-800">
                                  {t("quote.supportsLabel")}
                                </span>
                                <p className="text-[11px] text-gray-500">
                                  {t("quote.supportsHint")}
                                </p>
                              </div>
                            </label>
                          </div>
                        </div>

                        <div className="relative">
                          <MessageSquare
                            className="absolute left-3.5 top-3.5 text-gray-400"
                            size={18}
                          />
                          <textarea
                            placeholder={t("quote.notesPlaceholder")}
                            className="w-full p-3 pl-11 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all min-h-[100px] resize-y"
                            value={item.notes}
                            onChange={(e) =>
                              updateItem(idx, "notes", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: DETAILS (Contact & Shipping) */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {!isLoggedIn && (
                  <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                        <User size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {t("quote.guestContactTitle")}
                        </h3>
                        <p className="text-sm text-[#5f736d]">
                          {t("quote.guestContactSubtitle")}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {t("quote.fullName")}
                        </label>
                        <input
                          type="text"
                          value={guestName}
                          onChange={(e) =>
                            handleGuestNameChange(e.target.value)
                          }
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                          placeholder={t("quote.placeholderName")}
                        />
                        {guestErrors.name && (
                          <p className="text-xs text-red-600 mt-1">
                            {guestErrors.name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {t("quote.guestEmail")}
                        </label>
                        <input
                          type="email"
                          value={guestEmail}
                          onChange={(e) =>
                            handleGuestEmailChange(e.target.value)
                          }
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                          placeholder={t("quote.placeholderEmail")}
                        />
                        {guestErrors.email && (
                          <p className="text-xs text-red-600 mt-1">
                            {guestErrors.email}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {t("quote.phone")}
                        </label>
                        <input
                          type="text"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                          placeholder={t("quote.placeholderPhone")}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {t("quote.shippingDetailsTitle")}
                      </h3>
                      <p className="text-sm text-[#5f736d]">
                        {t("quote.shippingDetailsSubtitle")}
                      </p>
                    </div>
                  </div>

                  {/* Saved Address Selector (Only if logged in and has addresses) */}
                  {isLoggedIn && savedAddresses.length > 0 && (
                    <div className="mb-8">
                      <label className="text-sm font-bold text-gray-700 block mb-3">
                        {t("profile.addressBook") || "Saved Addresses"}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {savedAddresses.map((addr) => (
                          <div
                            key={addr.id}
                            onClick={() => handleSelectSavedAddress(addr)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedAddressId === addr.id
                                ? "border-emerald-500 bg-emerald-50/50"
                                : "border-gray-200 hover:border-emerald-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Home
                                size={14}
                                className={
                                  selectedAddressId === addr.id
                                    ? "text-emerald-600"
                                    : "text-gray-400"
                                }
                              />
                              <span className="font-bold text-gray-900 text-sm">
                                {addr.label || "Address"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {addr.fullName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {addr.addressLine1}
                            </p>
                            <p className="text-xs text-gray-500">
                              {addr.postalCode} {addr.city}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative">
                    {/* Visual overlay if a saved address is selected, optional based on UX preference, but simply updating states works well. */}

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {t("quote.fullName")}
                      </label>
                      <input
                        type="text"
                        value={shippingDetails.fullName}
                        onChange={(e) =>
                          handleManualShippingChange("fullName", e.target.value)
                        }
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                        placeholder={t("quote.placeholderShippingName")}
                      />
                      {shippingErrors.fullName && (
                        <p className="text-xs text-red-600 mt-1">
                          {shippingErrors.fullName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {t("quote.phone")}
                      </label>
                      <input
                        type="text"
                        value={shippingDetails.phoneNumber}
                        onChange={(e) =>
                          handleManualShippingChange(
                            "phoneNumber",
                            e.target.value,
                          )
                        }
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                        placeholder={t("quote.placeholderShippingPhone")}
                      />
                      {shippingErrors.phoneNumber && (
                        <p className="text-xs text-red-600 mt-1">
                          {shippingErrors.phoneNumber}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {t("quote.street")}
                      </label>
                      <input
                        type="text"
                        value={shippingDetails.addressLine1}
                        onChange={(e) =>
                          handleManualShippingChange(
                            "addressLine1",
                            e.target.value,
                          )
                        }
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                        placeholder={t("quote.placeholderStreet")}
                      />
                      {shippingErrors.addressLine1 && (
                        <p className="text-xs text-red-600 mt-1">
                          {shippingErrors.addressLine1}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {t("quote.city")}
                      </label>
                      <input
                        type="text"
                        value={shippingDetails.city}
                        onChange={(e) =>
                          handleManualShippingChange("city", e.target.value)
                        }
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                        placeholder={t("quote.placeholderCity")}
                      />
                      {shippingErrors.city && (
                        <p className="text-xs text-red-600 mt-1">
                          {shippingErrors.city}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {t("quote.postalCode")}
                      </label>
                      <input
                        type="text"
                        value={shippingDetails.postalCode}
                        onChange={(e) =>
                          handleManualShippingChange(
                            "postalCode",
                            e.target.value,
                          )
                        }
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                        placeholder={t("quote.placeholderPostalCode")}
                      />
                      {shippingErrors.postalCode && (
                        <p className="text-xs text-red-600 mt-1">
                          {shippingErrors.postalCode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <CheckCircle className="text-emerald-500" size={28} />
                    {t("quote.reviewTitle")}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Models Review */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">
                        {t("quote.models")} ({items.length})
                      </h4>
                      <ul className="space-y-4">
                        {items.map((item, idx) => (
                          <li
                            key={idx}
                            className="bg-gray-50 p-4 rounded-xl border border-gray-100"
                          >
                            <p className="font-bold text-gray-800 text-sm truncate mb-1">
                              {item.fileName || t("quote.textDescription")}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                              <span>
                                <span className="font-semibold text-gray-400">
                                  {t("quote.qty")}
                                </span>{" "}
                                {item.count}
                              </span>
                              <span>
                                <span className="font-semibold text-gray-400">
                                  {t("quote.mat")}
                                </span>{" "}
                                {item.material}
                              </span>
                              <span>
                                <span className="font-semibold text-gray-400">
                                  {t("quote.colorLabel")}
                                </span>{" "}
                                {item.color ||
                                  getColorsForMaterial(item.material)[0] ||
                                  "Black"}
                              </span>
                              {itemHasModel(item) ? (
                                <>
                                  {hasDimensionValue(item.dimensionX) &&
                                  hasDimensionValue(item.dimensionY) &&
                                  hasDimensionValue(item.dimensionZ) ? (
                                    <span>
                                      <span className="font-semibold text-gray-400">
                                        {t("quote.dimensionsMm")}:
                                      </span>{" "}
                                      {item.dimensionX} × {item.dimensionY} ×{" "}
                                      {item.dimensionZ} mm
                                      <span className="ml-1 text-gray-400 font-normal">
                                        (
                                        {(
                                          item.scaleFactor ??
                                          item.dimensionScale ??
                                          1.0
                                        ).toFixed(2)}
                                        x)
                                      </span>
                                    </span>
                                  ) : (
                                    <span>
                                      <span className="font-semibold text-gray-400">
                                        {t("quote.scale")}:
                                      </span>{" "}
                                      {(
                                        item.scaleFactor ??
                                        item.dimensionScale ??
                                        1.0
                                      ).toFixed(2)}
                                      x
                                    </span>
                                  )}
                                </>
                              ) : (
                                hasDimensionValue(item.dimensionX) &&
                                hasDimensionValue(item.dimensionY) &&
                                hasDimensionValue(item.dimensionZ) && (
                                  <span>
                                    <span className="font-semibold text-gray-400">
                                      {t("quote.dimensionsMm")}:
                                    </span>{" "}
                                    {item.dimensionX} × {item.dimensionY} ×{" "}
                                    {item.dimensionZ} mm
                                  </span>
                                )
                              )}
                              <span>
                                <span className="font-semibold text-gray-400">
                                  {t("quote.infill")}
                                </span>{" "}
                                {item.infillPercent ?? 20}%
                              </span>
                              <span>
                                <span className="font-semibold text-gray-400">
                                  {t("quote.quality")}
                                </span>{" "}
                                {item.printQuality ?? "Standard (0.20mm)"}
                              </span>
                              {item.supportsNeeded && (
                                <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  + Supports
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Details Review */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">
                          {t("quote.contactInfo")}
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-700 space-y-1">
                          {isLoggedIn ? (
                            <p className="font-medium text-emerald-700">
                              {t("quote.loggedInUser")}
                            </p>
                          ) : (
                            <>
                              <p className="font-bold text-gray-800">
                                {guestName || "-"}
                              </p>
                              <p>{guestEmail || "-"}</p>
                              <p>{guestPhone || "-"}</p>
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">
                          {t("quote.shippingDetailsTitle")}
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-700 space-y-1">
                          <p className="font-bold text-gray-800">
                            {shippingDetails.fullName || "-"}
                          </p>
                          <p>{shippingDetails.phoneNumber || "-"}</p>
                          <p>{shippingDetails.addressLine1 || "-"}</p>
                          <p>
                            {shippingDetails.city || "-"},{" "}
                            {shippingDetails.postalCode || "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 sticky top-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
              <div>
                <h4 className="font-bold text-gray-800 text-lg mb-2">
                  {t("quote.orderSummary")}
                </h4>
                <p className="text-sm text-gray-600 mb-6 pb-6 border-b border-gray-100">
                  {currentStep === 1
                    ? t("quote.step2SidebarNote") // Actually step 1 now (Models)
                    : currentStep === 2
                      ? t("quote.shippingDetailsNote") // Step 2 (Details)
                      : t("quote.reviewSidebarNote")}
                </p>

                <div className="flex justify-between items-center mb-6 font-semibold text-gray-700">
                  <span>{t("quote.totalItems")}</span>
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                    {items.reduce((acc, curr) => acc + curr.count, 0)}
                  </span>
                </div>
              </div>

              <div className="mt-auto pt-6">
                <p className="text-xs leading-relaxed text-[#5e7069] mb-4 text-center">
                  {t("quote.pricingDisclaimer")}{" "}
                  <Link
                    to="/terms"
                    className="font-semibold text-emerald-700 hover:underline"
                  >
                    {t("footer.terms")}
                  </Link>
                </p>

                <div className="flex flex-col gap-3">
                  {currentStep === totalSteps && (
                    <label className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left text-sm text-emerald-950">
                      <input
                        type="checkbox"
                        checked={agreementAccepted}
                        onChange={(event) =>
                          setAgreementAccepted(event.target.checked)
                        }
                        className="mt-1 h-4 w-4 shrink-0 accent-emerald-600"
                      />
                      <span>
                        {t("orderDetail.agreementText")}{" "}
                        <Link
                          to="/terms"
                          target="_blank"
                          className="font-bold underline"
                        >
                          {t("orderDetail.agreementLink")}
                        </Link>
                      </span>
                    </label>
                  )}
                  <button
                    type="button"
                    onClick={
                      currentStep === totalSteps ? handleSubmit : goToNextStep
                    }
                    disabled={
                      isSubmitting || (currentStep === 1 && items.length === 0)
                    }
                    className="w-full bg-[#133827] text-white font-bold py-4 rounded-xl hover:bg-[#1c4d37] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : currentStep === totalSteps ? (
                      <>
                        <CheckCircle size={20} />
                        {t("quote.submit")}
                      </>
                    ) : (
                      <>
                        {currentStep === 1
                          ? t("quote.nextStep")
                          : t("quote.reviewStep")}
                        <ChevronRight size={18} />
                      </>
                    )}
                  </button>

                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={goToPreviousStep}
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
                    >
                      <ChevronLeft size={16} />
                      {t("quote.backStep")}
                    </button>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {t("quote.secure")}
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
