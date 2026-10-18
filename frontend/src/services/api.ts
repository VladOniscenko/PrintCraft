import axios from "axios";
import { resolveLanguage } from "../i18n/translations";
import type { FaqItem, FaqTopic, ManagedCity } from "../types";

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

        const stored =
          typeof window !== "undefined"
            ? localStorage.getItem("language")
            : null;
        const preferred = resolveLanguage(stored);

        if (!window.location.pathname.endsWith("/login")) {
          const next = encodeURIComponent(
            `${window.location.pathname}${window.location.search}${window.location.hash}`,
          );
          window.location.assign(`/${preferred}/login?expired=1&next=${next}`);
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

export async function getEmailTemplates(language?: string) {
  const query = language ? `?language=${encodeURIComponent(language)}` : "";
  const res = await api.get(`/email-templates${query}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function getEmailTemplate(id: string) {
  const res = await api.get(`/email-templates/${id}`);
  return res.data;
}

export async function createEmailTemplate(data: {
  templateName: string;
  language?: string;
  subject: string;
  body: string;
}) {
  const res = await api.post("/email-templates", data);
  return res.data;
}

export async function updateEmailTemplate(
  id: string,
  data: { templateName: string; language?: string; subject: string; body: string },
) {
  const res = await api.put(`/email-templates/${id}`, data);
  return res.data;
}

export async function deleteEmailTemplate(id: string) {
  const res = await api.delete(`/email-templates/${id}`);
  return res.data;
}

export async function previewEmailTemplate(
  id: string,
  customVars?: Record<string, string>,
) {
  const res = await api.post(`/email-templates/${id}/preview`, customVars || {});
  return res.data;
}

export async function previewRawEmailTemplate(data: {
  subject: string;
  body: string;
  variables?: Record<string, string>;
}) {
  const res = await api.post("/email-templates/preview-raw", data);
  return res.data;
}

export async function sendTestEmailTemplate(
  id: string,
  recipientEmail: string,
  variables?: Record<string, string>,
) {
  const res = await api.post(`/email-templates/${id}/send-test`, {
    recipientEmail,
    variables,
  });
  return res.data;
}

export async function resetDefaultEmailTemplates() {
  const res = await api.post("/email-templates/reset-defaults");
  return res.data;
}

// --- FAQ API ---

export async function getFaqItems(all = false, category?: string): Promise<FaqItem[]> {
  const params = new URLSearchParams();
  if (all) params.append("all", "true");
  if (category) params.append("category", category);
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await api.get(`/faq${query}`);
  return res.data;
}

export async function getFaqItem(id: string): Promise<FaqItem> {
  const res = await api.get(`/faq/${id}`);
  return res.data;
}

export async function createFaqItem(item: Partial<FaqItem>): Promise<FaqItem> {
  const res = await api.post("/faq", item);
  return res.data;
}

export async function updateFaqItem(id: string, item: Partial<FaqItem>): Promise<FaqItem> {
  const res = await api.put(`/faq/${id}`, item);
  return res.data;
}

export async function deleteFaqItem(id: string): Promise<{ message: string }> {
  const res = await api.delete(`/faq/${id}`);
  return res.data;
}

export async function seedFaqItems(forceReload = false): Promise<unknown> {
  const res = await api.post(`/faq/seed?forceReload=${forceReload}`);
  return res.data;
}

// --- FAQ Topics / Solutions (/faq/{alias}) API ---

export async function getFaqTopics(all = false): Promise<FaqTopic[]> {
  const query = all ? "?all=true" : "";
  const res = await api.get(`/faq-topics${query}`);
  return res.data;
}

export async function getFaqTopic(slugOrId: string): Promise<FaqTopic> {
  const res = await api.get(`/faq-topics/${encodeURIComponent(slugOrId)}`);
  return res.data;
}

export async function createFaqTopic(topic: Partial<FaqTopic>): Promise<FaqTopic> {
  const res = await api.post("/faq-topics", topic);
  return res.data;
}

export async function updateFaqTopic(id: string, topic: Partial<FaqTopic>): Promise<FaqTopic> {
  const res = await api.put(`/faq-topics/${id}`, topic);
  return res.data;
}

export async function deleteFaqTopic(id: string): Promise<{ message: string }> {
  const res = await api.delete(`/faq-topics/${id}`);
  return res.data;
}

export async function seedFaqTopics(forceReload = false): Promise<unknown> {
  const res = await api.post(`/faq-topics/seed?forceReload=${forceReload}`);
  return res.data;
}

// --- Cities API ---

export async function getCities(all = false, province?: string): Promise<ManagedCity[]> {
  const params = new URLSearchParams();
  if (all) params.append("all", "true");
  if (province) params.append("province", province);
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await api.get(`/cities${query}`);
  return res.data;
}

export async function getCity(slugOrId: string): Promise<ManagedCity> {
  const res = await api.get(`/cities/${encodeURIComponent(slugOrId)}`);
  return res.data;
}

export async function createCity(city: Partial<ManagedCity>): Promise<ManagedCity> {
  const res = await api.post("/cities", city);
  return res.data;
}

export async function updateCity(id: string, city: Partial<ManagedCity>): Promise<ManagedCity> {
  const res = await api.put(`/cities/${id}`, city);
  return res.data;
}

export async function deleteCity(id: string): Promise<{ message: string }> {
  const res = await api.delete(`/cities/${id}`);
  return res.data;
}

export async function seedCities(forceReload = false): Promise<unknown> {
  const res = await api.post(`/cities/seed?forceReload=${forceReload}`);
  return res.data;
}

export default api;
