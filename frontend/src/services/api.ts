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

export default api;
