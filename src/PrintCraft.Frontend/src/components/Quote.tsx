import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Mesh, MeshStandardMaterial } from "three";
import {
  detectModelDimensions,
  detectModelDimensionsFromBuffer,
} from "../utils/modelDimensions";
import {
  Upload,
  Plus,
  Loader2,
  CheckCircle,
  MapPin,
  User,
  UserPlus,
  LogIn,
  Lock,
  Mail,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Home,
  Sparkles,
  X,
  CheckCircle2,
  Check,
  Truck,
  ShieldCheck,
  Zap,
  HelpCircle,
} from "lucide-react";
import Navbar from "./Navbar";
import Checkout3DHeroHeader from "./checkout/Checkout3DHeroHeader";
import Checkout3DViewerCard from "./checkout/Checkout3DViewerCard";
import Checkout3DConfiguratorCard from "./checkout/Checkout3DConfiguratorCard";
import FarmCatalogModal from "./checkout/FarmCatalogModal";
import Checkout3DMultiModelTabs from "./checkout/Checkout3DMultiModelTabs";
import { getDefaultSampleModel } from "../utils/sampleModels";
const FilamentPaintingPanel = lazy(
  () => import("./filament-painting/FilamentPaintingPanel"),
);
import type {
  FilamentPaintingConfig,
  FilamentPaintingGenerationResult,
} from "../types/filamentPainting";
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
import { translateColorText, formatPrintQuality } from "../utils/formatters";

const ALLOWED_UPLOAD_ACCEPT = ".stl,.obj,.3mf,.step,.stp";
const MODEL_EXTENSIONS = new Set([
  ".stl",
  ".obj",
  ".3mf",
  ".step",
  ".stp",
  ".glb",
  ".gltf",
]);
const MAX_FILES_PER_ITEM = 3;
const MAX_DIMENSION_MM = 256;
const MAX_ITEM_QUANTITY = 25;

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

interface SavedAddress {
  id: string;
  fullName: string;
  phoneNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
  label?: string;
}

interface QuoteProps {
  initialMode?: "filament-painting" | "custom-request";
}

export default function Quote({ initialMode }: QuoteProps = {}) {
  const { t, localizePath, language } = useI18n();
  const { notifyError, notifySuccess } = useNotify();
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
          count: Math.max(
            1,
            Math.min(MAX_ITEM_QUANTITY, Number(draft.count) || 1),
          ),
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
  const [activeCreatorFlow, setActiveCreatorFlow] = useState<"filament-painting" | "custom-request" | null>(() => {
    if (initialMode === "filament-painting") return "filament-painting";
    if (initialMode === "custom-request") return "custom-request";
    if (typeof window !== "undefined") {
      const isPaintingPath = window.location.pathname.endsWith("/filament-painting");
      const modeParam = new URLSearchParams(window.location.search).get("mode");
      if (isPaintingPath || modeParam === "filament-painting") return "filament-painting";
      if (modeParam === "custom-request" || modeParam === "custom" || modeParam === "help") return "custom-request";
    }
    return null;
  });

  const [isExpressProduction, setIsExpressProduction] = useState<boolean>(false);
  const [submittedWasExpress, setSubmittedWasExpress] = useState<boolean>(false);

  // Custom Request flow state
  const [customDescription, setCustomDescription] = useState<string>("");
  const [customMaterial, setCustomMaterial] = useState<string>("PLA");
  const [customColor, setCustomColor] = useState<string>("Black");
  const [customCount, setCustomCount] = useState<number>(1);
  const [customRefFiles, setCustomRefFiles] = useState<Array<{ url: string; name: string; kind: "image" | "other" }>>([]);
  const [isUploadingCustomRef, setIsUploadingCustomRef] = useState<boolean>(false);
  const customRefFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeCreatorFlow) {
      const timer = setTimeout(() => {
        const id = activeCreatorFlow === "filament-painting"
          ? "filament-painting-configurator"
          : "custom-request-configurator";
        document.getElementById(id)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeCreatorFlow]);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [pendingPaintingFile, setPendingPaintingFile] = useState<File | null>(null);
  const new3dFileInputRef = useRef<HTMLInputElement | null>(null);
  const newPaintingImageInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittedRef = useRef(false);
  const uploadedFileUrlsRef = useRef<Set<string>>(new Set());

  const [activeModelIndex, setActiveModelIndex] = useState<number>(0);
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [isFarmCatalogOpen, setIsFarmCatalogOpen] = useState<boolean>(false);

  const activeItem = items[activeModelIndex] || items[0] || null;
  const hasModel = !!(
    activeItem &&
    (activeItem.fileUrl ||
      (activeItem.files && activeItem.files.length > 0) ||
      activeItem.imageUrl)
  );

  const fallbackItem: OrderItem = {
    fileUrl: isDemoActive ? getDefaultSampleModel().url : "",
    fileName: isDemoActive ? getDefaultSampleModel().fileName : "",
    imageUrl: "",
    material: "PLA",
    color: "Dark Teal",
    count: 1,
    price: 0,
    scaleFactor: 1.0,
    infillPercent: 20,
    printQuality: "Standard (0.20mm)",
    supportsNeeded: false,
    notes: "",
    files: isDemoActive
      ? [
          {
            url: getDefaultSampleModel().url,
            name: getDefaultSampleModel().fileName,
            kind: "model",
          },
        ]
      : [],
  };

  const handleUpdateActiveItem = <K extends keyof OrderItem>(
    field: K,
    value: OrderItem[K],
  ) => {
    if (items.length === 0) {
      setItems([{ ...fallbackItem, [field]: value }]);
      return;
    }
    updateItem(activeModelIndex, field as any, value);
  };

  const handleViewerDropFiles = async (droppedFiles: File[]) => {
    if (isUploading || isProcessing) return;
    setIsDemoActive(false);
    setIsProcessing(true);
    const targetIdx = items.length === 0 ? 0 : activeModelIndex;
    await uploadSelectedFilesForItem(droppedFiles, targetIdx, true);
  };

  const handleLoadSampleModel = () => {
    const sample = getDefaultSampleModel();
    setIsDemoActive(true);
    const targetIndex = items.length > 0 ? activeModelIndex : 0;

    setItems((prev) => {
      const next = [...prev];
      const defaultMat = sample.defaultMaterial;
      const defaultColor = sample.defaultColor;
      const existing = next[targetIndex] || {
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

      next[targetIndex] = {
        ...existing,
        fileUrl: sample.url,
        fileName: sample.fileName,
        material: existing.material || defaultMat,
        color: existing.color || defaultColor,
        files: [{ url: sample.url, name: sample.fileName, kind: "model" }],
      };
      return next;
    });
    setActiveModelIndex(targetIndex);
  };

  const handleDimensionsDetected = (dims: {
    x: number;
    y: number;
    z: number;
  }) => {
    setItems((prev) => {
      if (prev.length === 0) {
        return [
          {
            ...fallbackItem,
            dimensionBaseX: dims.x,
            dimensionBaseY: dims.y,
            dimensionBaseZ: dims.z,
            dimensionScale: 1.0,
            scaleFactor: 1.0,
            dimensionX: roundMillimeters(dims.x),
            dimensionY: roundMillimeters(dims.y),
            dimensionZ: roundMillimeters(dims.z),
          },
        ];
      }
      const next = [...prev];
      const targetIdx = Math.min(activeModelIndex, next.length - 1);
      if (!next[targetIdx]) return next;
      const currentScale = next[targetIdx].scaleFactor ?? 1.0;
      next[targetIdx] = {
        ...next[targetIdx],
        dimensionBaseX: dims.x,
        dimensionBaseY: dims.y,
        dimensionBaseZ: dims.z,
        dimensionScale: currentScale,
        dimensionX: roundMillimeters(dims.x * currentScale),
        dimensionY: roundMillimeters(dims.y * currentScale),
        dimensionZ: roundMillimeters(dims.z * currentScale),
      };
      return next;
    });
  };

  const handleRemoveModel = (idx: number) => {
    removeItem(idx);
    setActiveModelIndex((prev) =>
      Math.max(0, Math.min(prev, items.length - 2)),
    );
  };

  const handleAddNewModel = () => {
    if (items.length >= 8) return;
    new3dFileInputRef.current?.click();
  };

  const openFilamentPaintingCreator = (file?: File) => {
    if (file) {
      setPendingPaintingFile(file);
    }
    setEditingItemIndex(null);
    setActiveCreatorFlow("filament-painting");
    setTimeout(() => {
      document.getElementById("filament-painting-configurator")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("token"));
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  // Account Step State (Login / Register)
  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
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

  type StepId = "models" | "account" | "shipping" | "review";

  const steps: Array<{ id: StepId; label: string }> = [
    { id: "models", label: t("quote.stepModels") },
    { id: "account", label: t("quote.stepAccount") },
    { id: "shipping", label: t("quote.stepShipping") },
    { id: "review", label: t("quote.stepReview") },
  ];

  const [currentStepId, setCurrentStepId] = useState<StepId>("models");

  const currentStepIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === currentStepId),
  );
  const [agreementAccepted, setAgreementAccepted] = useState(false);

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

  const handleRegisterAndLogin = async (
    e?: React.FormEvent | React.SyntheticEvent,
  ) => {
    if (e) e.preventDefault();
    const normalizedName = regName.trim();
    const normalizedEmail = regEmail.trim().toLowerCase();
    const password = regPassword;

    if (normalizedName.length < 2) {
      const err = t("quote.nameMinLength") || "Name must be at least 2 characters.";
      setAuthError(err);
      notifyError(err);
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      const err = t("quote.guestInvalidEmail") || "A valid email is required.";
      setAuthError(err);
      notifyError(err);
      return;
    }
    if (!password || password.length < 8) {
      const err = t("quote.passwordMinLength") || "Password must be at least 8 characters.";
      setAuthError(err);
      notifyError(err);
      return;
    }

    setAuthLoading(true);
    setAuthError("");
    try {
      // 1. Register account
      await api.post("/auth/register", {
        name: normalizedName,
        email: normalizedEmail,
        password: password,
        preferredLanguage: language,
      });

      // 2. Automatically log the user in
      const loginRes = await api.post("/auth/login", {
        email: normalizedEmail,
        password: password,
      });

      const token = loginRes.data.token;
      const user = loginRes.data.user;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("storage"));

      setIsLoggedIn(true);
      setCurrentUser(user);
      setGuestName(normalizedName);
      setGuestEmail(normalizedEmail);
      setSavedAddresses([]);
      setSelectedAddressId(null);
      setShippingDetails({
        fullName: normalizedName,
        phoneNumber: "",
        addressLine1: "",
        city: "",
        postalCode: "",
      });
      setShippingErrors({});
      setAgreementAccepted(false);

      // Redeem quote draft if present
      try {
        const draft = JSON.parse(
          localStorage.getItem("printcraft-home-quote") || "null",
        );
        if (draft?.quoteToken) {
          await api.post("/quote-drafts/redeem", {
            quoteToken: draft.quoteToken,
          });
        }
      } catch {
        /* best-effort draft redemption */
      }

      // Proceed immediately to shipping step
      setCurrentStepId("shipping");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        t("quote.registerFailed") ||
        "Failed to create account. Email may already be in use.";
      setAuthError(msg);
      notifyError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (
    e?: React.FormEvent | React.SyntheticEvent,
  ) => {
    if (e) e.preventDefault();
    const normalizedEmail = loginEmail.trim().toLowerCase();
    const password = loginPassword;

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      const err = t("quote.guestInvalidEmail") || "A valid email is required.";
      setAuthError(err);
      notifyError(err);
      return;
    }
    if (!password) {
      const err = t("quote.passwordRequired") || "Password is required.";
      setAuthError(err);
      notifyError(err);
      return;
    }

    setAuthLoading(true);
    setAuthError("");
    try {
      const loginRes = await api.post("/auth/login", {
        email: normalizedEmail,
        password: password,
      });

      const token = loginRes.data.token;
      const user = loginRes.data.user;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("storage"));

      setIsLoggedIn(true);
      setCurrentUser(user);
      if (user?.name) {
        setGuestName(user.name);
      }
      setGuestEmail(normalizedEmail);
      setShippingErrors({});
      setAgreementAccepted(false);

      // Fetch saved addresses for the newly logged in user
      try {
        const addrRes = await api.get("/me/addresses");
        if (Array.isArray(addrRes.data) && addrRes.data.length > 0) {
          setSavedAddresses(addrRes.data);
          const defaultAddr =
            addrRes.data.find((a: SavedAddress) => a.isDefault) ||
            addrRes.data[0];
          handleSelectSavedAddress(defaultAddr);
        } else {
          setSavedAddresses([]);
          setSelectedAddressId(null);
          setShippingDetails({
            fullName: user?.name || "",
            phoneNumber: "",
            addressLine1: "",
            city: "",
            postalCode: "",
          });
        }
      } catch {
        setSavedAddresses([]);
        setSelectedAddressId(null);
        setShippingDetails({
          fullName: user?.name || "",
          phoneNumber: "",
          addressLine1: "",
          city: "",
          postalCode: "",
        });
      }

      // Redeem quote draft if present
      try {
        const draft = JSON.parse(
          localStorage.getItem("printcraft-home-quote") || "null",
        );
        if (draft?.quoteToken) {
          await api.post("/quote-drafts/redeem", {
            quoteToken: draft.quoteToken,
          });
        }
      } catch {
        /* best-effort */
      }

      // Proceed immediately to shipping step
      setCurrentStepId("shipping");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        t("login.error.invalid") ||
        "Invalid email or password.";
      setAuthError(msg);
      notifyError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSwitchAccount = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("storage"));
    setIsLoggedIn(false);
    setCurrentUser(null);
    setSavedAddresses([]);
    setSelectedAddressId(null);
    setShippingDetails({
      fullName: "",
      phoneNumber: "",
      addressLine1: "",
      city: "",
      postalCode: "",
    });
    setShippingErrors({});
    setGuestName("");
    setGuestEmail("");
    setGuestAccountCreated(false);
    setAgreementAccepted(false);
    setRegName("");
    setRegEmail("");
    setRegPassword("");
    setLoginEmail("");
    setLoginPassword("");
    setAuthMode("login");
    setAuthError("");
    setCurrentStepId("account");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToNextStep = async () => {
    if (currentStepId === "models") {
      const error = validateStepOne();
      if (error) {
        notifyError(error);
        return;
      }
      setEditingItemIndex(null);
      setActiveCreatorFlow(null);
      const nextStep = steps[currentStepIndex + 1]?.id || "shipping";
      setCurrentStepId(nextStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStepId === "account") {
      if (!isLoggedIn) {
        if (authMode === "register") {
          await handleRegisterAndLogin();
        } else {
          await handleLogin();
        }
        return;
      }
      setCurrentStepId("shipping");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStepId === "shipping") {
      const fieldErrors = validateShippingInfo(shippingDetails, t);
      if (Object.keys(fieldErrors).length > 0) {
        setShippingErrors(fieldErrors);
        notifyError(Object.values(fieldErrors)[0]);
        return;
      }
      setShippingErrors({});
      setCurrentStepId("review");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      const prevStep = steps[currentStepIndex - 1]?.id || "models";
      setCurrentStepId(prevStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
    } else {
      setSavedAddresses([]);
      setSelectedAddressId(null);
    }
  }, [isLoggedIn]);

  // Sync auth state when changed across tabs or via Navbar logout
  useEffect(() => {
    const syncAuth = () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      if (!token) {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setSavedAddresses([]);
        setSelectedAddressId(null);
        setShippingDetails({
          fullName: "",
          phoneNumber: "",
          addressLine1: "",
          city: "",
          postalCode: "",
        });
        setShippingErrors({});
        setGuestName("");
        setGuestEmail("");
        setGuestAccountCreated(false);
        setAgreementAccepted(false);
      } else {
        setIsLoggedIn(true);
        try {
          setCurrentUser(JSON.parse(userStr || "null"));
        } catch {
          setCurrentUser(null);
        }
      }
    };

    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

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
      phoneNumber: addr.phoneNumber || "",
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


  const uploadSelectedFilesForItem = async (
    selectedFiles: File[],
    itemIndex: number,
    isReplacement: boolean = false,
  ) => {
    if (selectedFiles.length === 0) {
      if (items.length === 0) {
        setEditingItemIndex(null);
      }
      setIsProcessing(false);
      return;
    }

    const nonModelFiles: File[] = [];
    const validModelFiles: File[] = [];

    for (const file of selectedFiles) {
      const extension = getFileExtension(file.name);
      if (!MODEL_EXTENSIONS.has(extension)) {
        nonModelFiles.push(file);
      } else {
        validModelFiles.push(file);
      }
    }

    if (nonModelFiles.length > 0) {
      notifyError(t("quote.errorOnly3dFiles"));
    }

    if (validModelFiles.length === 0) {
      if (items.length === 0) {
        setEditingItemIndex(null);
      }
      setIsProcessing(false);
      return;
    }

    if (items[itemIndex]?.uploadType === "filament-painting") {
      notifyError(t("quote.errorPaintingBundleLocked"));
      if (items.length === 0) {
        setEditingItemIndex(null);
      }
      setIsProcessing(false);
      return;
    }

    if (isReplacement) {
      const oldFiles = items[itemIndex]?.files || [];
      for (const file of oldFiles) {
        if (file?.url) void deleteTempUpload(file.url);
      }
      if (items[itemIndex]?.fileUrl) void deleteTempUpload(items[itemIndex].fileUrl);
    }

    const existingFiles = isReplacement ? [] : (items[itemIndex]?.files || []);
    const currentFileCount = existingFiles.length;
    const remainingSlots = MAX_FILES_PER_ITEM - currentFileCount;
    if (remainingSlots <= 0) {
      notifyError(t("quote.errorMaxFilesPerItem", { max: MAX_FILES_PER_ITEM }));
      if (items.length === 0) {
        setEditingItemIndex(null);
      }
      setIsProcessing(false);
      return;
    }

    let hasModelFile = existingFiles.some((file) => file.kind === "model");
    const filesToUpload: File[] = [];
    let skippedForModelConstraint = 0;

    for (const file of validModelFiles) {
      if (filesToUpload.length >= remainingSlots) break;

      if (hasModelFile) {
        skippedForModelConstraint += 1;
        continue;
      }

      filesToUpload.push(file);
      hasModelFile = true;
    }

    const skippedForSlotConstraint =
      validModelFiles.length - filesToUpload.length - skippedForModelConstraint;

    if (skippedForModelConstraint > 0) {
      notifyError(t("quote.singleModelPerItem"));
    }

    if (skippedForSlotConstraint > 0) {
      notifyError(
        t("quote.errorMaxFilesPartial", {
          max: MAX_FILES_PER_ITEM,
          count: filesToUpload.length,
        }),
      );
    }

    if (filesToUpload.length === 0) {
      if (items.length === 0) {
        setEditingItemIndex(null);
      }
      setIsProcessing(false);
      return;
    }

    setIsUploading(true);
    setIsProcessing(true);
    let failedCount = 0;
    let firstErrorMessage: string | null = null;
    let detectedDimensions: { x: number; y: number; z: number } | null = null;
    const uploadedEntries: Array<{
      file: File;
      url: string;
    }> = [];

    try {
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await api.post("/upload", formData);

          if (typeof res.data?.url === "string" && res.data.url.length > 0) {
            uploadedFileUrlsRef.current.add(res.data.url);
            uploadedEntries.push({
              file,
              url: res.data.url,
            });
          }
        } catch (err: any) {
          failedCount += 1;

          if (!firstErrorMessage) {
            const backendMessage = err?.response?.data?.message;
            const isUnsupportedType =
              typeof backendMessage === "string" &&
              /unsupported file type|unsupported content type|image files are not accepted/i.test(
                backendMessage,
              );

            if (isUnsupportedType) {
              firstErrorMessage =
                backendMessage ||
                `${t("quote.uploadUnsupportedType")} ${t("quote.allowedFilesInline")}`;
            } else {
              firstErrorMessage = backendMessage || t("quote.uploadFailed");
            }
          }
        }
      }

      if (!detectedDimensions && uploadedEntries.length > 0) {
        try {
          detectedDimensions = await detectModelDimensions(
            uploadedEntries[0].file,
          );
        } catch (dimErr) {
          console.warn("Failed to detect model dimensions:", dimErr);
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

          const existingFiles = isReplacement ? [] : (targetItem.files || []);
          const newFiles = uploadedEntries.map((entry) => ({
            url: entry.url,
            name: entry.file.name,
            kind: "model" as const,
          }));

          const mergedFiles = [...existingFiles, ...newFiles];
          const firstModel = mergedFiles.find((file) => file.kind === "model") || mergedFiles[0];

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
          } else {
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
            fileUrl: firstModel?.url || "",
            fileName: firstModel?.name || "",
            imageUrl: targetItem.imageUrl || "",
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
    } catch (err: any) {
      console.error("Upload/processing failed:", err);
      notifyError(err?.message || t("quote.uploadFailed"));
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
      setItems((latest) => {
        if (latest.length === 0 || !latest[itemIndex]) {
          setEditingItemIndex(null);
        }
        return latest;
      });
    }
  };




  const handleFilamentPaintingAdded = ({
    liveResult,
    config,
    sourceFile,
  }: {
    liveResult: FilamentPaintingGenerationResult;
    config: FilamentPaintingConfig;
    sourceFile: File;
  }) => {
    const defaultMat = config.palette[0]?.material || "PLA";
    const paletteSummary = config.palette.map((p) => p.name).join(", ");
    const swapsSummary = (liveResult.layerSwaps || [])
      .map((s) => `L${s.layerNumber} (${s.heightMm.toFixed(2)}mm): ${s.colorName}`)
      .join(" | ");

    const baseName = sourceFile.name.replace(/\.[^/.]+$/, "");

    if (liveResult.modelGlbUrl) uploadedFileUrlsRef.current.add(liveResult.modelGlbUrl);
    if (liveResult.modelStlUrl) uploadedFileUrlsRef.current.add(liveResult.modelStlUrl);
    if (liveResult.previewImageUrl) uploadedFileUrlsRef.current.add(liveResult.previewImageUrl);

    const productionFileUrl = liveResult.modelStlUrl || "";
    const productionFileName = `${baseName}_production.stl`;

    const organizedFiles: Array<{ url: string; name: string; kind: "image" | "model" }> = [
      // 1. Source File: Original 2D Image
      {
        url: liveResult.previewImageUrl || "",
        name: sourceFile.name,
        kind: "image",
      },
      // 2. Web Preview: .glb
      ...(liveResult.modelGlbUrl
        ? [
            {
              url: liveResult.modelGlbUrl,
              name: `${baseName}_preview.glb`,
              kind: "model" as const,
            },
          ]
        : []),
      // 3. Production File: .3mf (Bambu Studio native project with embedded infill and layer swap metadata)
      ...(productionFileUrl
        ? [
            {
              url: productionFileUrl,
              name: productionFileName,
              kind: "model" as const,
            },
          ]
        : []),
    ];

    const prevCount =
      editingItemIndex !== null && items[editingItemIndex]
        ? items[editingItemIndex].count
        : 1;

    const newItem: OrderItem = {
      uploadType: "filament-painting",
      fileName: `${baseName}_painting`,
      fileUrl: productionFileUrl || liveResult.modelGlbUrl || "",
      imageUrl: liveResult.previewImageUrl || "",
      material: defaultMat,
      color: paletteSummary,
      count: prevCount,
      price: 0,
      unitPrice: 0,
      estimatedPrintTime: liveResult.estimatedPrintTime,
      filamentUsedGrams: liveResult.estimatedGrams,
      dimensionBaseX: liveResult.dimensions.x,
      dimensionBaseY: liveResult.dimensions.y,
      dimensionBaseZ: liveResult.dimensions.z,
      dimensionX: liveResult.dimensions.x,
      dimensionY: liveResult.dimensions.y,
      dimensionZ: liveResult.dimensions.z,
      dimensionScale: 1.0,
      scaleFactor: 1.0,
      infillPercent: 100,
      printQuality: `${config.quality || "Medium"} Quality (Filament Painting)`,
      supportsNeeded: false,
      layerSwaps: liveResult.layerSwaps,
      layerColorMap: liveResult.layerColorMap,
      files: organizedFiles,
      notes: `Filament Painting (${config.quality || "Medium"} Quality, ${config.palette.length} colors: ${paletteSummary}). Dimensions: ${liveResult.dimensions.x}x${liveResult.dimensions.y}x${liveResult.dimensions.z}mm. Total Layers: ${liveResult.totalLayers || 30}. Swaps: ${swapsSummary}. 100% Solid Infill.`,
    };

    if (editingItemIndex !== null && editingItemIndex >= 0 && editingItemIndex < items.length) {
      setItems((prev) => {
        const next = [...prev];
        next[editingItemIndex] = newItem;
        return next;
      });
      notifySuccess(t("quote.successPaintingUpdated"));
    } else {
      setItems((prev) => [...prev, newItem]);
      notifySuccess(t("quote.successPaintingAdded"));
    }

    setActiveCreatorFlow(null);
    setPendingPaintingFile(null);
    setEditingItemIndex(null);
  };

  const handleUploadCustomRefFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    e.target.value = "";

    if (customRefFiles.length + files.length > 3) {
      notifyError(t("quote.customMaxFilesReached"));
      return;
    }

    setIsUploadingCustomRef(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await api.post("/upload?allowImages=true", formData);
        if (typeof res.data?.url === "string" && res.data.url.length > 0) {
          uploadedFileUrlsRef.current.add(res.data.url);
          setCustomRefFiles((prev) => [
            ...prev,
            {
              url: res.data.url,
              name: file.name,
              kind: "image",
            },
          ]);
        }
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || t("quote.customUploadImageFailed");
      notifyError(message);
    } finally {
      setIsUploadingCustomRef(false);
    }
  };

  const handleRemoveCustomRefFile = (urlToRemove: string) => {
    setCustomRefFiles((prev) => prev.filter((f) => f.url !== urlToRemove));
    void deleteTempUpload(urlToRemove);
  };

  const handleAddCustomRequestToOrder = () => {
    if (!customDescription.trim() && customRefFiles.length === 0) {
      notifyError(t("quote.customRequestNotesRequired"));
      return;
    }

    const newItem: OrderItem = {
      fileName: t("quote.customRequestItemName"),
      notes: customDescription.trim(),
      material: customMaterial,
      color: customColor,
      count: Math.max(1, Math.min(MAX_ITEM_QUANTITY, customCount)),
      price: 0,
      uploadType: "custom-request",
      files: customRefFiles,
      imageUrl: customRefFiles[0]?.url || "",
    };

    setItems((prev) => [...prev, newItem]);
    setActiveCreatorFlow(null);
    setEditingItemIndex(null);
    setCustomDescription("");
    setCustomRefFiles([]);
    setCustomCount(1);
    notifySuccess(t("quote.successItemAdded"));
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
    setItems((prev) => prev.filter((_, i) => i !== index));

    if (editingItemIndex === index) {
      setEditingItemIndex(null);
    } else if (editingItemIndex !== null && editingItemIndex > index) {
      setEditingItemIndex(editingItemIndex - 1);
    }

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

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    let nextValue = value;
    if (field === "count") {
      const parsed = typeof value === "number" ? value : parseInt(value, 10);
      nextValue = isNaN(parsed)
        ? 1
        : Math.max(1, Math.min(MAX_ITEM_QUANTITY, parsed));
    }
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: nextValue };
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

  const handleScaleFactorChange = (newScale: number) => {
    if (items.length > 0 && items[activeModelIndex]) {
      updateItemScale(activeModelIndex, newScale);
    }
  };
  void handleScaleFactorChange;

  const handleSubmit = async (
    e?: React.FormEvent | React.SyntheticEvent,
  ) => {
    if (e) e.preventDefault();

    if (currentStepId !== "review") {
      return;
    }

    const stepOneError = validateStepOne();
    if (stepOneError) {
      notifyError(stepOneError);
      setCurrentStepId("models");
      return;
    }

    if (!isLoggedIn) {
      notifyError(t("quote.authSubtitle") || "Please sign in or create an account.");
      setCurrentStepId("account");
      return;
    }

    const fieldErrors = validateShippingInfo(shippingDetails, t);
    if (Object.keys(fieldErrors).length > 0) {
      setShippingErrors(fieldErrors);
      notifyError(Object.values(fieldErrors)[0]);
      setCurrentStepId("shipping");
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

      const replacedOriginalModelUrls: string[] = [];

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
            const [{ STLLoader }, { STLExporter }] = await Promise.all([
              import("three/examples/jsm/loaders/STLLoader.js"),
              import("three/examples/jsm/exporters/STLExporter.js"),
            ]);
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
            geometry.dispose();

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
            count: Math.max(
              1,
              Math.min(MAX_ITEM_QUANTITY, item.count || 1),
            ),
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
        language,
        isExpress: isExpressProduction,
        requestType: items.some((i) => i.uploadType === "custom-request")
          ? "CustomRequest"
          : (items.length > 0 && items.every((i) => i.uploadType === "filament-painting")
              ? "FilamentPainting"
              : "StandardUpload"),
        customProjectDescription: items.find((i) => i.uploadType === "custom-request")?.notes || undefined,
      };

      if (!isLoggedIn) {
        payload.guestName = (guestName || shippingDetails.fullName || "").trim();
        payload.guestEmail = (guestEmail || "").trim();
        payload.guestPhone = (shippingDetails.phoneNumber || "").trim();
      }

      const res = await api.post("/orders/quote", payload);
      setSubmittedWasExpress(isExpressProduction);
      submittedRef.current = true;
      localStorage.removeItem("printcraft-home-quote");
      uploadedFileUrlsRef.current.clear();

      for (const originalUrl of replacedOriginalModelUrls) {
        void deleteTempUpload(originalUrl);
      }

      if (isLoggedIn) {
        const orderId = res?.data?.order?.id || res?.data?.id;
        navigate(orderId ? localizePath(`/orders/${orderId}`) : localizePath("/orders"));
        return;
      }

      setItems([]);
      setGuestSubmittedOrderId(res?.data?.order?.id || res?.data?.id || null);
      setGuestAccountCreated(!!res?.data?.accountCreated);
      setCurrentStepId("models");
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


  return (
    <div className="site-shell">
      <Navbar />

      <main
        className={`site-main px-4 sm:px-6 py-8 md:py-12 mx-auto ${
          currentStepId === "models" && !activeCreatorFlow
            ? "max-w-7xl"
            : "max-w-5xl"
        }`}
      >
        {/* Modern 3D Checkout Hero Header for Step 1 */}
        {currentStepId === "models" && !activeCreatorFlow ? (
          <Checkout3DHeroHeader />
        ) : (
          <>
            {/* Apple-Style Clean Header */}
            <div className="mb-8 md:mb-12 text-center max-w-3xl mx-auto">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-3">
                {t("quote.title")}
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
                {t("quote.subtitle")}
              </p>

              {/* High-Trust Reassurance Badges */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-100/90 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 shadow-2xs">
                  <Truck size={14} className="text-[#133827] dark:text-emerald-400" />
                  {t("quote.trustBadgePostNl")}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-100/90 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 shadow-2xs">
                  <ShieldCheck size={14} className="text-[#133827] dark:text-emerald-400" />
                  {t("quote.trustBadgeReview")}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-100/90 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 shadow-2xs">
                  <MapPin size={14} className="text-[#133827] dark:text-emerald-400" />
                  {t("quote.trustBadgeRotterdam")}
                </span>
              </div>
            </div>

            {/* Apple-Style Segmented Stepper Pill Bar */}
            <div className="flex justify-center mb-10 sm:mb-12">
              <div className="inline-flex items-center p-1.5 bg-gray-100/90 dark:bg-white/5 rounded-full border border-gray-200/80 dark:border-white/10 shadow-2xs gap-1 max-w-full overflow-x-auto">
                {steps.map((step, index) => {
                  const stepNumber = index + 1;
                  const isActive = currentStepId === step.id;
                  const isComplete = currentStepIndex > index;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      disabled={!isComplete}
                      onClick={() => {
                        if (isComplete) {
                          setCurrentStepId(step.id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }}
                      className={`rounded-full px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                        isActive
                          ? "bg-white dark:bg-[#0e1512] text-gray-900 dark:text-white shadow-xs border border-gray-200/60 dark:border-white/10"
                          : isComplete
                            ? "text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 hover:bg-white/60 dark:hover:bg-white/10 cursor-pointer"
                            : "text-gray-400 dark:text-gray-500 cursor-default"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center transition-colors ${
                          isActive
                            ? "bg-[#133827] dark:bg-emerald-600 text-white"
                            : isComplete
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                              : "bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {isComplete ? <Check size={12} strokeWidth={2.5} /> : stepNumber}
                      </span>
                      <span>{step.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {!isLoggedIn && guestSubmittedOrderId && (
          <div className="mb-8 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/30 p-5 text-center">
            <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300">
              {guestAccountCreated
                ? t("quote.guestAccountCreatedTitle")
                : t("quote.guestSubmittedTitle")}
            </h3>
            <p className="mt-2 text-sm text-emerald-900/80 dark:text-emerald-200/80 max-w-lg mx-auto">
              {guestAccountCreated
                ? t("quote.guestAccountCreatedBody")
                : t("quote.guestSubmittedBody")}
            </p>
            <div className="mt-4 inline-block bg-white dark:bg-[#0e1512] px-4 py-2 rounded-lg border border-emerald-100 dark:border-emerald-800/40 shadow-sm text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              {t("quote.guestSubmittedReference")}{" "}
              <span className="font-mono text-emerald-600 dark:text-emerald-400 ml-2">
                {guestSubmittedOrderId}
              </span>
            </div>
            {guestAccountCreated && (
              <p className="mt-4 text-xs text-[#0f766e] dark:text-emerald-400 font-semibold">
                {t("quote.guestAccountCreatedHint")}
              </p>
            )}
            {submittedWasExpress && (
              <div className="mt-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <Zap size={14} className="fill-amber-500 text-amber-500" />
                  <span>{t("quote.badgeExpressPriority")}</span>
                </div>
                <p className="mt-1.5 text-xs text-amber-800 dark:text-amber-300 font-medium">
                  {t("quote.guestSubmittedExpressNote")}
                </p>
              </div>
            )}
          </div>
        )}

        <div className={`mx-auto space-y-6 ${currentStepId === "models" && !activeCreatorFlow ? "w-full" : "max-w-4xl"}`}>
            {/* STEP 1: MODELS */}
            {currentStepId === "models" && (
              <div className="space-y-6">
                {/* Hidden File Input for adding standard 3D CAD files to a new item */}
                <input
                  ref={new3dFileInputRef}
                  type="file"
                  multiple
                  accept={ALLOWED_UPLOAD_ACCEPT}
                  className="hidden"
                  onChange={async (e) => {
                    if (isUploading || isProcessing) return;
                    const selectedFiles = Array.from(e.target.files ?? []);
                    if (selectedFiles.length === 0) return;
                    e.target.value = "";
                    const newIndex = items.length;
                    setIsProcessing(true);
                    setEditingItemIndex(newIndex);
                    await uploadSelectedFilesForItem(selectedFiles, newIndex);
                  }}
                  disabled={isUploading || isProcessing}
                />

                {/* Hidden File Input for adding 2D images for HueForge filament painting */}
                <input
                  ref={newPaintingImageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (isUploading || isProcessing) return;
                    const file = e.target.files?.[0];
                    if (file) {
                      openFilamentPaintingCreator(file);
                    }
                    e.target.value = "";
                  }}
                  disabled={isUploading || isProcessing}
                />

                {/* Active Creator Panel: HueForge Filament Painting */}
                {activeCreatorFlow === "filament-painting" && (
                  <div
                    id="filament-painting-configurator"
                    className="rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0e1512] p-6 md:p-8 shadow-xs space-y-6"
                  >
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-100/70 dark:border-amber-800/40 flex items-center justify-center shadow-2xs">
                          <Sparkles size={18} />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-gray-900 dark:text-white">
                            {items.length > 0
                              ? t("quote.configureItemPaintingNumber", {
                                  number: items.length + 1,
                                })
                              : t("quote.configurePaintingTitle")}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t("quote.configurePaintingSubtitle")}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCreatorFlow(null);
                          setPendingPaintingFile(null);
                        }}
                        className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        {t("quote.cancelAndBack")}
                      </button>
                    </div>

                    <Suspense
                      fallback={
                        <div className="w-full h-80 rounded-2xl bg-white dark:bg-[#0e1512] border border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 gap-2 p-8">
                          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-semibold">{t("quote.loadingPaintingStudio")}</span>
                        </div>
                      }
                    >
                      <FilamentPaintingPanel
                        filamentsCatalog={filaments}
                        initialFile={pendingPaintingFile}
                        onAddToOrder={(payload) => {
                          handleFilamentPaintingAdded(payload);
                        }}
                      />
                    </Suspense>
                  </div>
                )}

                {/* Active Creator Panel: Custom Request / Need Help */}
                {activeCreatorFlow === "custom-request" && (
                  <div
                    id="custom-request-configurator"
                    className="rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0e1512] p-6 md:p-8 shadow-xs space-y-6"
                  >
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-100/70 dark:border-amber-800/40 flex items-center justify-center shadow-2xs">
                          <HelpCircle size={18} />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-gray-900 dark:text-white">
                            {t("quote.customRequestPanelTitle")}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t("quote.customRequestPanelSubtitle")}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCreatorFlow(null);
                          setCustomDescription("");
                          setCustomRefFiles([]);
                        }}
                        className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        {t("quote.cancelAndBack")}
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Description textarea */}
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200">
                          {t("quote.customProjectDescLabel")}
                        </label>
                        <textarea
                          rows={4}
                          value={customDescription}
                          onChange={(e) => setCustomDescription(e.target.value)}
                          placeholder={t("quote.customProjectDescPlaceholder")}
                          className="w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#133827] dark:focus:ring-emerald-500 transition-all resize-y"
                        />
                      </div>

                      {/* Reference photos upload */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-bold text-gray-800 dark:text-gray-200">
                            {t("quote.customRefPhotosLabel")}
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {t("quote.customRefPhotosSubtitle")}
                          </p>
                        </div>

                        {/* Uploaded reference files list */}
                        {customRefFiles.length > 0 && (
                          <div className="flex flex-wrap gap-3">
                            {customRefFiles.map((file, idx) => (
                              <div
                                key={idx}
                                className="relative group rounded-xl border border-gray-200 dark:border-white/10 p-2 bg-[#fbfbfd] dark:bg-white/5 flex items-center gap-3 pr-4"
                              >
                                <img
                                  src={resolveAssetUrl(file.url)}
                                  alt={file.name}
                                  className="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-white/10"
                                />
                                <div className="min-w-0 max-w-[160px]">
                                  <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">
                                    {file.name}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomRefFile(file.url)}
                                  className="text-gray-400 hover:text-rose-500 p-1 rounded-full transition-colors cursor-pointer"
                                  title={t("quote.removeFile")}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {customRefFiles.length < 3 && (
                          <div>
                            <input
                              ref={customRefFileInputRef}
                              type="file"
                              multiple
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              onChange={handleUploadCustomRefFile}
                              disabled={isUploadingCustomRef}
                            />
                            <button
                              type="button"
                              onClick={() => customRefFileInputRef.current?.click()}
                              disabled={isUploadingCustomRef}
                              className="px-5 py-2.5 rounded-full border border-gray-300 dark:border-white/20 hover:border-gray-400 dark:hover:border-white/30 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-all flex items-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50"
                            >
                              {isUploadingCustomRef ? (
                                <Loader2 size={14} className="animate-spin text-amber-600 dark:text-amber-400" />
                              ) : (
                                <Upload size={14} className="text-amber-600 dark:text-amber-400" />
                              )}
                              <span>
                                {isUploadingCustomRef
                                  ? t("quote.customUploadingImage")
                                  : t("quote.customUploadRefBtn")}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Material, Color & Quantity row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100 dark:border-white/10">
                        {/* Material Preference */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                            {t("quote.customMaterialPrefLabel")}
                          </label>
                          <select
                            value={customMaterial}
                            onChange={(e) => {
                              const newMat = e.target.value;
                              setCustomMaterial(newMat);
                              const availableColors = getColorsForMaterial(newMat);
                              if (!availableColors.includes(customColor)) {
                                setCustomColor(availableColors[0] || "Black");
                              }
                            }}
                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151d18] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#133827] dark:focus:ring-emerald-500"
                          >
                            {finalMaterials.map((mat) => (
                              <option key={mat} value={mat}>
                                {mat}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Color Preference */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                            {t("quote.customColorPrefLabel")}
                          </label>
                          <select
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151d18] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#133827] dark:focus:ring-emerald-500"
                          >
                            {getColorsForMaterial(customMaterial).map((color) => (
                              <option key={color} value={color}>
                                {translateColorText(color, t)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                            {t("quote.customQuantityLabel")}
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setCustomCount((c) => Math.max(1, c - 1))}
                              className="w-10 h-10 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 flex items-center justify-center font-bold text-sm cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-12 text-center font-bold text-gray-900 dark:text-white text-sm">
                              {customCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => setCustomCount((c) => Math.min(MAX_ITEM_QUANTITY, c + 1))}
                              className="w-10 h-10 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 flex items-center justify-center font-bold text-sm cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Action CTA */}
                      <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddCustomRequestToOrder}
                          className="bg-[#133827] dark:bg-emerald-600 hover:bg-[#1c4d37] dark:hover:bg-emerald-700 text-white px-8 py-3.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                        >
                          <Plus size={16} />
                          <span>{t("quote.addCustomRequestToQuote")}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!activeCreatorFlow && (
                  <div className="w-full space-y-6 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* Left Column: 3D Viewport & Dropzone */}
                      <div className="lg:col-span-7 space-y-4">
                        {items.length > 1 && (
                          <Checkout3DMultiModelTabs
                            items={items}
                            activeIndex={activeModelIndex}
                            onSelectIndex={setActiveModelIndex}
                            onRemoveIndex={handleRemoveModel}
                            onAddNewModel={handleAddNewModel}
                          />
                        )}
                        <Checkout3DViewerCard
                          fileUrl={
                            activeItem?.fileUrl ||
                            (isDemoActive
                              ? getDefaultSampleModel().url
                              : undefined)
                          }
                          fileName={
                            activeItem?.fileName ||
                            (isDemoActive
                              ? getDefaultSampleModel().fileName
                              : undefined)
                          }
                          isDemo={isDemoActive}
                          material={activeItem?.material || "PLA"}
                          color={activeItem?.color || "Dark Teal"}
                          scaleFactor={activeItem?.scaleFactor ?? 1.0}
                          count={activeItem?.count ?? 1}
                          filaments={filaments}
                          dimensionX={
                            activeItem?.dimensionX ?? activeItem?.dimensionBaseX
                          }
                          dimensionY={
                            activeItem?.dimensionY ?? activeItem?.dimensionBaseY
                          }
                          dimensionZ={
                            activeItem?.dimensionZ ?? activeItem?.dimensionBaseZ
                          }
                          onDimensionsDetected={handleDimensionsDetected}
                          onChooseFile={() => new3dFileInputRef.current?.click()}
                          onDropFiles={handleViewerDropFiles}
                          onLoadSampleModel={handleLoadSampleModel}
                          isUploading={isUploading}
                          isProcessing={isProcessing}
                        />
                      </div>

                      {/* Right Column: Configurator Card */}
                      <div className="lg:col-span-5">
                        <Checkout3DConfiguratorCard
                          item={activeItem || fallbackItem}
                          filaments={filaments}
                          hasModel={hasModel || isDemoActive}
                          onUpdateItem={handleUpdateActiveItem}
                          onOpenFarmCatalog={() => setIsFarmCatalogOpen(true)}
                          onAddNewModel={handleAddNewModel}
                          onProceed={goToNextStep}
                          onUploadTrigger={() =>
                            new3dFileInputRef.current?.click()
                          }
                          canAddMoreModels={items.length < 8}
                        />
                      </div>
                    </div>

                    {/* Creative workflows alternative triggers */}
                    <div className="pt-6 border-t border-gray-200/60 dark:border-white/10 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500">
                      <button
                        type="button"
                        onClick={() => openFilamentPaintingCreator()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-semibold transition-colors cursor-pointer shadow-2xs"
                      >
                        <Sparkles size={14} className="text-emerald-600" />
                        <span>{t("quote.createFilamentPainting")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCreatorFlow("custom-request")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-semibold transition-colors cursor-pointer shadow-2xs"
                      >
                        <HelpCircle size={14} className="text-amber-600" />
                        <span>{t("quote.requestCustomDesign")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP: ACCOUNT */}
            {currentStepId === "account" && (
              <div className="bg-white dark:bg-[#0e1512] p-6 sm:p-8 md:p-10 rounded-3xl shadow-xs border border-gray-200/80 dark:border-white/10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-100/70 dark:border-emerald-800/40 flex items-center justify-center shadow-2xs">
                    <User size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                      {t("quote.authTitle")}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {t("quote.authSubtitle")}
                    </p>
                  </div>
                </div>

                {isLoggedIn ? (
                  <div className="bg-[#fbfbfd] dark:bg-white/5 border border-emerald-200/80 dark:border-emerald-800/40 rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                        <CheckCircle size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 dark:text-white text-base">
                          {t("quote.loggedInAs")}:{" "}
                          <span className="text-emerald-800 dark:text-emerald-400">
                            {currentUser?.name || currentUser?.email}
                          </span>
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {currentUser?.email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSwitchAccount}
                        className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 underline ml-auto transition-colors cursor-pointer"
                      >
                        {t("quote.switchAccount")}
                      </button>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-3 pt-6 border-t border-gray-200/80 dark:border-white/10">
                      <button
                        type="button"
                        onClick={goToPreviousStep}
                        className="border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 px-7 py-3.5 rounded-full font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                      >
                        <ChevronLeft size={16} />
                        <span>{t("quote.backToModels")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={goToNextStep}
                        className="bg-[#133827] dark:bg-emerald-600 text-white px-8 py-3.5 rounded-full font-semibold text-sm hover:bg-[#1c4d37] dark:hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                      >
                        <span>{t("quote.continueToShipping")}</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Tab Navigation: Apple Pill Bar */}
                    <div className="inline-flex p-1 bg-gray-100/90 dark:bg-white/5 rounded-full border border-gray-200/60 dark:border-white/10 shadow-2xs gap-1 mb-6">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("register");
                          setAuthError("");
                        }}
                        className={`rounded-full py-2 px-5 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                          authMode === "register"
                            ? "bg-white dark:bg-[#141e1a] text-gray-900 dark:text-white shadow-xs"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        <UserPlus size={16} />
                        {t("quote.registerTab")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("login");
                          setAuthError("");
                        }}
                        className={`rounded-full py-2 px-5 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                          authMode === "login"
                            ? "bg-white dark:bg-[#141e1a] text-gray-900 dark:text-white shadow-xs"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        <LogIn size={16} />
                        {t("quote.signInTab")}
                      </button>
                    </div>

                    {authError && (
                      <div className="mb-6 flex items-center gap-2.5 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300 text-sm">
                        <AlertCircle size={18} className="shrink-0" />
                        <span>{authError}</span>
                      </div>
                    )}

                    {authMode === "register" ? (
                      <form
                        method="post"
                        onSubmit={handleRegisterAndLogin}
                        className="space-y-4 max-w-lg"
                        noValidate
                      >
                        <div className="space-y-1.5">
                          <label
                            htmlFor="register-name"
                            className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5"
                          >
                            <User size={14} className="text-emerald-700 dark:text-emerald-400" />
                            {t("quote.fullName")}
                          </label>
                          <input
                            id="register-name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            value={regName}
                            onChange={(e) => {
                              setRegName(e.target.value);
                              setGuestName(e.target.value);
                              if (authError) setAuthError("");
                            }}
                            className="w-full p-3.5 bg-[#fbfbfd] dark:bg-white/5 border border-gray-200/90 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-900 dark:text-white rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#133827]/15 focus:border-[#133827] focus:bg-white dark:focus:bg-[#141e1a] transition-all"
                            placeholder={t("quote.placeholderName")}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="register-email"
                            className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5"
                          >
                            <Mail size={14} className="text-emerald-700 dark:text-emerald-400" />
                            {t("quote.email")}
                          </label>
                          <input
                            id="register-email"
                            name="email"
                            type="email"
                            autoComplete="username"
                            value={regEmail}
                            onChange={(e) => {
                              setRegEmail(e.target.value);
                              setGuestEmail(e.target.value);
                              if (authError) setAuthError("");
                            }}
                            className="w-full p-3.5 bg-[#fbfbfd] dark:bg-white/5 border border-gray-200/90 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-900 dark:text-white rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#133827]/15 focus:border-[#133827] focus:bg-white dark:focus:bg-[#141e1a] transition-all"
                            placeholder={t("quote.placeholderEmail") || "jane@example.com"}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label
                              htmlFor="register-password"
                              className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5"
                            >
                              <Lock size={14} className="text-emerald-700 dark:text-emerald-400" />
                              {t("quote.password")}
                            </label>
                            <span className="text-[11px] text-gray-400 dark:text-gray-500">
                              {t("quote.min8Chars")}
                            </span>
                          </div>
                          <input
                            id="register-password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            value={regPassword}
                            onChange={(e) => {
                              setRegPassword(e.target.value);
                              if (authError) setAuthError("");
                            }}
                            className="w-full p-3.5 bg-[#fbfbfd] dark:bg-white/5 border border-gray-200/90 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-900 dark:text-white rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#133827]/15 focus:border-[#133827] focus:bg-white dark:focus:bg-[#141e1a] transition-all"
                            placeholder="••••••••"
                          />
                        </div>

                        <div className="pt-6 mt-6 flex items-center justify-between gap-3 border-t border-gray-100 dark:border-white/10">
                          <button
                            type="button"
                            onClick={goToPreviousStep}
                            className="border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 px-7 py-3.5 rounded-full font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                          >
                            <ChevronLeft size={16} />
                            <span>{t("quote.backToModels")}</span>
                          </button>
                          <button
                            type="submit"
                            disabled={authLoading}
                            className="bg-[#133827] dark:bg-emerald-600 text-white px-8 py-3.5 rounded-full font-semibold text-sm hover:bg-[#1c4d37] dark:hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                          >
                            {authLoading ? (
                              <Loader2 className="animate-spin" size={18} />
                            ) : (
                              <>
                                <span>{t("quote.registerToContinue")}</span>
                                <ChevronRight size={18} />
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form
                        method="post"
                        onSubmit={handleLogin}
                        className="space-y-4 max-w-lg"
                        noValidate
                      >
                        <div className="space-y-1.5">
                          <label
                            htmlFor="login-email"
                            className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5"
                          >
                            <Mail size={14} className="text-emerald-700 dark:text-emerald-400" />
                            {t("quote.email")}
                          </label>
                          <input
                            id="login-email"
                            name="email"
                            type="email"
                            autoComplete="username"
                            value={loginEmail}
                            onChange={(e) => {
                              setLoginEmail(e.target.value);
                              setGuestEmail(e.target.value);
                              if (authError) setAuthError("");
                            }}
                            className="w-full p-3.5 bg-[#fbfbfd] dark:bg-white/5 border border-gray-200/90 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-900 dark:text-white rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#133827]/15 focus:border-[#133827] focus:bg-white dark:focus:bg-[#141e1a] transition-all"
                            placeholder={t("quote.placeholderEmail") || "jane@example.com"}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="login-password"
                            className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5"
                          >
                            <Lock size={14} className="text-emerald-700 dark:text-emerald-400" />
                            {t("quote.password")}
                          </label>
                          <input
                            id="login-password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            value={loginPassword}
                            onChange={(e) => {
                              setLoginPassword(e.target.value);
                              if (authError) setAuthError("");
                            }}
                            className="w-full p-3.5 bg-[#fbfbfd] dark:bg-white/5 border border-gray-200/90 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-900 dark:text-white rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#133827]/15 focus:border-[#133827] focus:bg-white dark:focus:bg-[#141e1a] transition-all"
                            placeholder="••••••••"
                          />
                        </div>

                        <div className="pt-6 mt-6 flex items-center justify-between gap-3 border-t border-gray-100 dark:border-white/10">
                          <button
                            type="button"
                            onClick={goToPreviousStep}
                            className="border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 px-7 py-3.5 rounded-full font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                          >
                            <ChevronLeft size={16} />
                            <span>{t("quote.backToModels")}</span>
                          </button>
                          <button
                            type="submit"
                            disabled={authLoading}
                            className="bg-[#133827] dark:bg-emerald-600 text-white px-8 py-3.5 rounded-full font-semibold text-sm hover:bg-[#1c4d37] dark:hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                          >
                            {authLoading ? (
                              <Loader2 className="animate-spin" size={18} />
                            ) : (
                              <>
                                <span>{t("quote.loginToContinue")}</span>
                                <ChevronRight size={18} />
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP: SHIPPING DETAILS */}
            {currentStepId === "shipping" && (
              <div className="space-y-6">

                <div className="bg-white dark:bg-[#0e1512] p-6 sm:p-8 md:p-10 rounded-3xl shadow-xs border border-gray-200/80 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-100/70 dark:border-emerald-800/40 flex items-center justify-center shadow-2xs">
                      <MapPin size={22} />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                        {t("quote.shippingDetailsTitle")}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {t("quote.shippingDetailsSubtitle")}
                      </p>
                    </div>
                  </div>

                  {isLoggedIn && (
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 text-xs">
                      <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-medium">
                        <User size={15} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                        <span>
                          {t("quote.signedInAs")}:{" "}
                          <strong>{currentUser?.name || guestName || t("quote.customerFallback")}</strong>{" "}
                          ({currentUser?.email || guestEmail})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleSwitchAccount}
                        className="font-bold text-emerald-700 dark:text-emerald-300 hover:text-red-600 dark:hover:text-red-400 underline transition-colors ml-auto cursor-pointer"
                      >
                        {t("quote.switchAccount")}
                      </button>
                    </div>
                  )}

                  {/* Saved Address Selector (Only if logged in and has addresses) */}
                  {isLoggedIn && savedAddresses.length > 0 && (
                    <div className="mb-8">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-3">
                        {t("profile.addressBook")}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {savedAddresses.map((addr) => (
                          <div
                            key={addr.id}
                            onClick={() => handleSelectSavedAddress(addr)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
                              selectedAddressId === addr.id
                                ? "border-[#133827] dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30"
                                : "border-gray-200/90 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-white/5 hover:bg-gray-50/50 dark:hover:bg-white/10"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Home
                                size={14}
                                className={
                                  selectedAddressId === addr.id
                                    ? "text-[#133827] dark:text-emerald-400"
                                    : "text-gray-400 dark:text-gray-500"
                                }
                              />
                              <span className="font-bold text-gray-900 dark:text-white text-sm">
                                {addr.label || t("quote.addressFallback")}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                              {addr.fullName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {addr.addressLine1}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {addr.postalCode} {addr.city}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative">
                    <div className="space-y-1.5 md:col-span-2">
                      <label
                        htmlFor="shipping-name"
                        className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {t("quote.fullName")}
                      </label>
                      <input
                        id="shipping-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        value={shippingDetails.fullName}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        onChange={(e) =>
                          handleManualShippingChange("fullName", e.target.value)
                        }
                        className="w-full p-3.5 bg-[#fbfbfd] dark:bg-white/5 border border-gray-200/90 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-900 dark:text-white rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#133827]/15 focus:border-[#133827] focus:bg-white dark:focus:bg-[#141e1a] transition-all"
                        placeholder={t("quote.placeholderShippingName")}
                      />
                      {shippingErrors.fullName && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {shippingErrors.fullName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label
                        htmlFor="shipping-phone"
                        className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {t("quote.phone")}
                      </label>
                      <input
                        id="shipping-phone"
                        name="tel"
                        type="tel"
                        autoComplete="tel"
                        value={shippingDetails.phoneNumber}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        onChange={(e) =>
                          handleManualShippingChange(
                            "phoneNumber",
                            e.target.value,
                          )
                        }
                        className="w-full p-3.5 bg-[#fbfbfd] dark:bg-white/5 border border-gray-200/90 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-900 dark:text-white rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#133827]/15 focus:border-[#133827] focus:bg-white dark:focus:bg-[#141e1a] transition-all"
                        placeholder={t("quote.placeholderShippingPhone")}
                      />
                      {shippingErrors.phoneNumber && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {shippingErrors.phoneNumber}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label
                        htmlFor="shipping-street"
                        className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {t("quote.street")}
                      </label>
                      <input
                        id="shipping-street"
                        name="street-address"
                        type="text"
                        autoComplete="street-address"
                        value={shippingDetails.addressLine1}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        onChange={(e) =>
                          handleManualShippingChange(
                            "addressLine1",
                            e.target.value,
                          )
                        }
                        className="w-full p-3.5 bg-[#fbfbfd] dark:bg-white/5 border border-gray-200/90 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-900 dark:text-white rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#133827]/15 focus:border-[#133827] focus:bg-white dark:focus:bg-[#141e1a] transition-all"
                        placeholder={t("quote.placeholderStreet")}
                      />
                      {shippingErrors.addressLine1 && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {shippingErrors.addressLine1}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="shipping-city"
                        className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {t("quote.city")}
                      </label>
                      <input
                        id="shipping-city"
                        name="address-level2"
                        type="text"
                        autoComplete="address-level2"
                        value={shippingDetails.city}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        onChange={(e) =>
                          handleManualShippingChange("city", e.target.value)
                        }
                        className="w-full p-3.5 bg-[#fbfbfd] dark:bg-white/5 border border-gray-200/90 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-900 dark:text-white rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#133827]/15 focus:border-[#133827] focus:bg-white dark:focus:bg-[#141e1a] transition-all"
                        placeholder={t("quote.placeholderCity")}
                      />
                      {shippingErrors.city && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {shippingErrors.city}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="shipping-postal"
                        className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {t("quote.postalCode")}
                      </label>
                      <input
                        id="shipping-postal"
                        name="postal-code"
                        type="text"
                        autoComplete="postal-code"
                        value={shippingDetails.postalCode}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        onChange={(e) =>
                          handleManualShippingChange(
                            "postalCode",
                            e.target.value,
                          )
                        }
                        className="w-full p-3.5 bg-[#fbfbfd] dark:bg-white/5 border border-gray-200/90 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-900 dark:text-white rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#133827]/15 focus:border-[#133827] focus:bg-white dark:focus:bg-[#141e1a] transition-all"
                        placeholder={t("quote.placeholderPostalCode")}
                      />
                      {shippingErrors.postalCode && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {shippingErrors.postalCode}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Step Navigation */}
                  <div className="pt-6 mt-8 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={goToPreviousStep}
                      className="border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 px-7 py-3.5 rounded-full font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <ChevronLeft size={16} />
                      <span>{t("quote.backStep")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={goToNextStep}
                      className="bg-[#133827] dark:bg-emerald-600 text-white px-8 py-3.5 rounded-full font-semibold text-sm hover:bg-[#1c4d37] dark:hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                      <span>{t("quote.reviewStep")}</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP: REVIEW */}
            {currentStepId === "review" && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-[#0e1512] p-6 sm:p-8 md:p-10 rounded-3xl shadow-xs border border-gray-200/80 dark:border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-100/70 dark:border-emerald-800/40 flex items-center justify-center shadow-2xs">
                        <CheckCircle2 size={22} />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                        {t("quote.reviewTitle")}
                      </h3>
                    </div>
                    {isExpressProduction && (
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-2xs">
                        <Zap size={14} className="fill-amber-500 text-amber-500" />
                        <span>{t("quote.badgeExpressPriority")}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Models Review */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/10 pb-2 mb-4">
                        {t("quote.models")} ({items.length})
                      </h4>
                      <ul className="space-y-4">
                        {items.map((item, idx) => (
                          <li
                            key={idx}
                            className="bg-[#fbfbfd] dark:bg-white/5 p-5 rounded-2xl border border-gray-200/80 dark:border-white/10"
                          >
                            <p className="font-bold text-gray-800 dark:text-white text-sm truncate mb-1">
                              {item.fileName || t("quote.textDescription")}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
                              <span>
                                <span className="font-semibold text-gray-400 dark:text-gray-500">
                                  {t("quote.qty")}
                                </span>{" "}
                                {item.count}
                              </span>
                              <span>
                                <span className="font-semibold text-gray-400 dark:text-gray-500">
                                  {t("quote.mat")}
                                </span>{" "}
                                {item.material}
                              </span>
                              <span>
                                <span className="font-semibold text-gray-400 dark:text-gray-500">
                                  {t("quote.colorLabel")}
                                </span>{" "}
                                {translateColorText(
                                  item.color ||
                                    getColorsForMaterial(item.material)[0] ||
                                    "Black",
                                  t
                                )}
                              </span>
                              {itemHasModel(item) ? (
                                <>
                                  {hasDimensionValue(item.dimensionX) &&
                                  hasDimensionValue(item.dimensionY) &&
                                  hasDimensionValue(item.dimensionZ) ? (
                                    <span>
                                      <span className="font-semibold text-gray-400 dark:text-gray-500">
                                        {t("quote.dimensionsMm")}:
                                      </span>{" "}
                                      {item.dimensionX} × {item.dimensionY} ×{" "}
                                      {item.dimensionZ} mm
                                      <span className="ml-1 text-gray-400 dark:text-gray-500 font-normal">
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
                                      <span className="font-semibold text-gray-400 dark:text-gray-500">
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
                                    <span className="font-semibold text-gray-400 dark:text-gray-500">
                                      {t("quote.dimensionsMm")}:
                                    </span>{" "}
                                    {item.dimensionX} × {item.dimensionY} ×{" "}
                                    {item.dimensionZ} mm
                                  </span>
                                )
                              )}
                              <span>
                                <span className="font-semibold text-gray-400 dark:text-gray-500">
                                  {t("quote.infill")}
                                </span>{" "}
                                {item.infillPercent ?? 20}%
                              </span>
                              <span>
                                <span className="font-semibold text-gray-400 dark:text-gray-500">
                                  {t("quote.quality")}
                                </span>{" "}
                                {formatPrintQuality(
                                  item.printQuality ?? "Standard (0.20mm)",
                                  t
                                )}
                              </span>
                              {item.supportsNeeded && (
                                <span className="text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                                  {t("quote.plusSupports")}
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
                        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/10 pb-2 mb-4">
                          {t("quote.contactInfo")}
                        </h4>
                        <div className="bg-[#fbfbfd] dark:bg-white/5 p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                          {isLoggedIn ? (
                            <div>
                              <p className="font-bold text-emerald-800 dark:text-emerald-400">
                                {currentUser?.name || shippingDetails.fullName || t("quote.loggedInUser")}
                              </p>
                              {currentUser?.email && (
                                <p className="text-gray-600 dark:text-gray-400">{currentUser.email}</p>
                              )}
                              {shippingDetails.phoneNumber && (
                                <p className="text-gray-600 dark:text-gray-400">{shippingDetails.phoneNumber}</p>
                              )}
                            </div>
                          ) : (
                            <>
                              <p className="font-bold text-gray-800 dark:text-white">
                                {shippingDetails.fullName || guestName || "-"}
                              </p>
                              <p>{currentUser?.email || guestEmail || "-"}</p>
                              <p>{shippingDetails.phoneNumber || "-"}</p>
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/10 pb-2 mb-4">
                          {t("quote.shippingDetailsTitle")}
                        </h4>
                        <div className="bg-[#fbfbfd] dark:bg-white/5 p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                          <p className="font-bold text-gray-800 dark:text-white">
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

                      <div>
                        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/10 pb-2 mb-4">
                          {t("quote.expressProductionTitle")}
                        </h4>
                        <div onClick={() => setIsExpressProduction(!isExpressProduction)}
                          role="button"
                          tabIndex={0}
                          className={`p-5 rounded-2xl border text-sm transition-all cursor-pointer ${
                          isExpressProduction
                            ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30"
                            : "bg-[#fbfbfd] dark:bg-white/5 border-gray-200/80 dark:border-white/10"
                        }`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                              {isExpressProduction && <Zap size={16} className="fill-amber-500 text-amber-500" />}
                              {isExpressProduction
                                ? t("quote.badgeExpressPriority")
                                : t("quote.trustBadgePostNl")}
                            </span>
                            {isExpressProduction && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                                {t("quote.expressBadgeTag")}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                            {isExpressProduction
                              ? t("quote.expressProductionSubtitle")
                              : t("quote.trustBadgeReview")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Disclaimer & Terms & Conditions agreement */}
                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10 space-y-4">
                    <label className="flex items-start gap-3 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-[#fbfbfd] dark:bg-white/5 p-4 text-left text-sm text-gray-800 dark:text-gray-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreementAccepted}
                        onChange={(event) =>
                          setAgreementAccepted(event.target.checked)
                        }
                        className="mt-1 h-4 w-4 shrink-0 accent-[#133827] dark:accent-emerald-500 rounded"
                      />
                      <span>
                        {t("orderDetail.agreementText")}{" "}
                        <Link
                          to={localizePath("/terms")}
                          target="_blank"
                          className="font-bold underline text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300"
                        >
                          {t("orderDetail.agreementLink")}
                        </Link>
                      </span>
                    </label>

                    <p className="text-xs leading-relaxed text-[#5e7069] dark:text-gray-400 text-center">
                      {t("quote.pricingDisclaimer")}{" "}
                      <Link
                        to={localizePath("/terms")}
                        className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                      >
                        {t("footer.terms")}
                      </Link>
                    </p>

                    {/* Step Navigation */}
                    <div className="flex items-center justify-between gap-4 pt-2">
                      <button
                        type="button"
                        onClick={goToPreviousStep}
                        disabled={isSubmitting}
                        className="border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 px-7 py-4 rounded-full font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-2xs"
                      >
                        <ChevronLeft size={16} />
                        <span>{t("quote.backStep")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-[#133827] dark:bg-emerald-600 text-white px-9 py-4 rounded-full font-bold text-base hover:bg-[#1c4d37] dark:hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-sm cursor-pointer"
                      >
                        {isSubmitting ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <>
                            <CheckCircle size={20} />
                            <span>{t("quote.submit")}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        <FarmCatalogModal isOpen={isFarmCatalogOpen} onClose={() => setIsFarmCatalogOpen(false)} />
      </main>
      <Footer />
    </div>
  );
}
