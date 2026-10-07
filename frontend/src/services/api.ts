import axios from "axios";

const VISITOR_ID_STORAGE_KEY = "pc_visitor_id";

function generateVisitorId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getOrCreateVisitorId() {
  let id = localStorage.getItem(VISITOR_ID_STORAGE_KEY);
  if (!id) {
    id = generateVisitorId();
    localStorage.setItem(VISITOR_ID_STORAGE_KEY, id);
  }

  return id;
}

const api = axios.create({
  baseURL: "/api",
});

// Attach token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const visitorId = getOrCreateVisitorId();

  config.headers = config.headers || {};
  config.headers["X-Visitor-Id"] = visitorId;

  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// If backend reports unauthorized for a tokened session,
// clear stale auth state and force a fresh login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const hadToken = !!localStorage.getItem("token");
      if (hadToken) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        if (window.location.pathname !== "/login") {
          const next = encodeURIComponent(
            `${window.location.pathname}${window.location.search}${window.location.hash}`,
          );
          window.location.assign(`/login?expired=1&next=${next}`);
        }
      }
    }

    return Promise.reject(error);
  },
);

export async function getActiveHeroSlides() {
  const res = await api.get("/heroslides/active");
  return Array.isArray(res.data) ? res.data : [];
}

export async function getHeroSlides(all?: boolean) {
  const res = await api.get(all ? "/heroslides?all=true" : "/heroslides");
  return Array.isArray(res.data) ? res.data : [];
}

export async function getHeroAvailableFiles() {
  try {
    const res = await api.get("/heroslides/files");
    if (Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
  } catch {
    // Fallback to /upload/models if needed
  }

  const fallbackRes = await api.get("/upload/models");
  return Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
}

export async function uploadHeroMedia(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await api.post("/heroslides/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch {
    // Fallback to /upload
    const fallbackRes = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const url = fallbackRes.data.url;
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isModel = ["stl", "obj", "3mf", "step", "stp"].includes(ext);
    return {
      url,
      fileName: file.name,
      mediaType: isModel ? "model3d" : "image",
      sizeBytes: file.size,
    };
  }
}

export async function seedDefaultHeroSlides() {
  const res = await api.post("/heroslides/seed-defaults");
  return Array.isArray(res.data) ? res.data : [];
}

export default api;
