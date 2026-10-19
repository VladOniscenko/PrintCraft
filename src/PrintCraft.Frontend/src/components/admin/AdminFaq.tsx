import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Edit2,
  ExternalLink,
  HelpCircle,
  Layers,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import AdminBreadcrumb from "./AdminBreadcrumb";
import AdminLayout from "./AdminLayout";
import {
  createFaqItem,
  createFaqTopic,
  deleteFaqItem,
  deleteFaqTopic,
  getFaqItems,
  getFaqTopics,
  seedFaqItems,
  seedFaqTopics,
  updateFaqItem,
  updateFaqTopic,
} from "../../services/api";
import type { FaqItem, FaqTopic, FaqQuestionAnswer } from "../../types";
import { useNotify } from "../../context/NotifyContext";
import { useI18n } from "../../i18n/I18nContext";
import {
  supportedLanguages,
  type SupportedLanguage,
  defaultLanguage,
} from "../../i18n/translations";
import { getLocalizedText } from "../../utils/i18nHelpers";

export default function AdminFaq() {
  const { t, language, localizePath } = useI18n();
  const { notifyError, notifySuccess } = useNotify();

  const [activeTab, setActiveTab] = useState<"items" | "topics">("items");

  // FAQ Items state
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemsSearch, setItemsSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // FAQ Topics state
  const [topics, setTopics] = useState<FaqTopic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [topicsSearch, setTopicsSearch] = useState("");

  // Item Modal state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FaqItem | null>(null);
  const [itemLangTab, setItemLangTab] = useState<SupportedLanguage>(defaultLanguage);
  const [itemQuestions, setItemQuestions] = useState<Record<string, string>>({});
  const [itemAnswers, setItemAnswers] = useState<Record<string, string>>({});
  const [itemCategory, setItemCategory] = useState("general");
  const [itemSortOrder, setItemSortOrder] = useState(0);
  const [itemIsActive, setItemIsActive] = useState(true);
  const [savingItem, setSavingItem] = useState(false);

  // Topic Modal state
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<FaqTopic | null>(null);
  const [topicLangTab, setTopicLangTab] = useState<SupportedLanguage>(defaultLanguage);
  const [topicSlug, setTopicSlug] = useState("");
  const [topicNames, setTopicNames] = useState<Record<string, string>>({});
  const [topicTagline, setTopicTagline] = useState<Record<string, string>>({});
  const [topicBadge, setTopicBadge] = useState<Record<string, string>>({});
  const [topicHeroTitle, setTopicHeroTitle] = useState<Record<string, string>>({});
  const [topicHeroSubtitle, setTopicHeroSubtitle] = useState<Record<string, string>>({});
  const [topicDescription, setTopicDescription] = useState<Record<string, string>>({});
  const [topicBenefits, setTopicBenefits] = useState<Record<string, string[]>>({});
  const [topicMaterials, setTopicMaterials] = useState<string>("PETG, TPU, PLA");
  const [topicLeadTime, setTopicLeadTime] = useState("2-5 werkdagen / business days");
  const [topicPrecision, setTopicPrecision] = useState("±0.1mm industriële tolerantie");
  const [topicMetaTitle, setTopicMetaTitle] = useState<Record<string, string>>({});
  const [topicMetaDescription, setTopicMetaDescription] = useState<Record<string, string>>({});
  const [topicMetaKeywords, setTopicMetaKeywords] = useState<Record<string, string>>({});
  const [topicFaqs, setTopicFaqs] = useState<Record<string, FaqQuestionAnswer[]>>({});
  const [topicSortOrder, setTopicSortOrder] = useState(0);
  const [topicIsActive, setTopicIsActive] = useState(true);
  const [savingTopic, setSavingTopic] = useState(false);

  // Delete & Seed Modals state
  const [deleteItemTarget, setDeleteItemTarget] = useState<FaqItem | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);
  const [deleteTopicTarget, setDeleteTopicTarget] = useState<FaqTopic | null>(null);
  const [deletingTopic, setDeletingTopic] = useState(false);

  const [seedItemsConfirmOpen, setSeedItemsConfirmOpen] = useState(false);
  const [seedingItems, setSeedingItems] = useState(false);
  const [seedTopicsConfirmOpen, setSeedTopicsConfirmOpen] = useState(false);
  const [seedingTopics, setSeedingTopics] = useState(false);

  // Load FAQ items
  const loadItems = async () => {
    setLoadingItems(true);
    try {
      const data = await getFaqItems(true);
      setItems(data);
    } catch {
      notifyError(t("admin.faq.loadFailed"));
    } finally {
      setLoadingItems(false);
    }
  };

  // Load FAQ topics
  const loadTopics = async () => {
    setLoadingTopics(true);
    try {
      const data = await getFaqTopics(true);
      setTopics(data);
    } catch {
      notifyError(t("admin.faq.loadFailed"));
    } finally {
      setLoadingTopics(false);
    }
  };

  useEffect(() => {
    loadItems();
    loadTopics();
  }, []);

  // Filtered FAQ Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }
      if (!itemsSearch.trim()) return true;
      const term = itemsSearch.toLowerCase();
      const q = getLocalizedText(item.question, language).toLowerCase();
      const a = getLocalizedText(item.answer, language).toLowerCase();
      const cat = (item.category || "").toLowerCase();
      return q.includes(term) || a.includes(term) || cat.includes(term);
    });
  }, [items, itemsSearch, selectedCategory, language]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set).sort();
  }, [items]);

  // Filtered FAQ Topics
  const filteredTopics = useMemo(() => {
    if (!topicsSearch.trim()) return topics;
    const term = topicsSearch.toLowerCase();
    return topics.filter((top) => {
      const slug = top.slug.toLowerCase();
      const name = getLocalizedText(top.names, language).toLowerCase();
      const mats = (top.recommendedMaterials || []).join(" ").toLowerCase();
      return slug.includes(term) || name.includes(term) || mats.includes(term);
    });
  }, [topics, topicsSearch, language]);

  // Open Item Modal (Create or Edit)
  const openItemModal = (item?: FaqItem) => {
    if (item) {
      setEditingItem(item);
      setItemQuestions({ ...(item.question || {}) });
      setItemAnswers({ ...(item.answer || {}) });
      setItemCategory(item.category || "general");
      setItemSortOrder(item.sortOrder || 0);
      setItemIsActive(item.isActive);
    } else {
      setEditingItem(null);
      setItemQuestions({});
      setItemAnswers({});
      setItemCategory("general");
      setItemSortOrder((items.length + 1) * 10);
      setItemIsActive(true);
    }
    setItemLangTab(language);
    setIsItemModalOpen(true);
  };

  // Save Item
  const handleSaveItem = async () => {
    setSavingItem(true);
    try {
      const payload: Partial<FaqItem> = {
        question: itemQuestions,
        answer: itemAnswers,
        category: itemCategory.trim().toLowerCase(),
        sortOrder: Number(itemSortOrder),
        isActive: itemIsActive,
      };

      if (editingItem) {
        await updateFaqItem(editingItem.id, payload);
      } else {
        await createFaqItem(payload);
      }
      notifySuccess(t("admin.faq.saveSuccess"));
      setIsItemModalOpen(false);
      await loadItems();
    } catch {
      notifyError(t("admin.faq.saveFailed"));
    } finally {
      setSavingItem(false);
    }
  };

  // Toggle Item Active
  const handleToggleItemActive = async (item: FaqItem) => {
    try {
      await updateFaqItem(item.id, { isActive: !item.isActive });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i)),
      );
      notifySuccess(t("admin.faq.saveSuccess"));
    } catch {
      notifyError(t("admin.faq.saveFailed"));
    }
  };

  // Delete Item
  const handleDeleteItem = async () => {
    if (!deleteItemTarget) return;
    setDeletingItem(true);
    try {
      await deleteFaqItem(deleteItemTarget.id);
      notifySuccess(t("admin.faq.deleteSuccess"));
      setDeleteItemTarget(null);
      await loadItems();
    } catch {
      notifyError(t("admin.faq.deleteFailed"));
    } finally {
      setDeletingItem(false);
    }
  };

  // Seed Items
  const handleSeedItems = async () => {
    setSeedingItems(true);
    try {
      await seedFaqItems(true);
      notifySuccess(t("admin.faq.seedSuccess"));
      setSeedItemsConfirmOpen(false);
      await loadItems();
    } catch {
      notifyError(t("admin.faq.seedFailed"));
    } finally {
      setSeedingItems(false);
    }
  };

  // Open Topic Modal (Create or Edit)
  const openTopicModal = (topic?: FaqTopic) => {
    if (topic) {
      setEditingTopic(topic);
      setTopicSlug(topic.slug);
      setTopicNames({ ...(topic.names || {}) });
      setTopicTagline({ ...(topic.tagline || {}) });
      setTopicBadge({ ...(topic.badge || {}) });
      setTopicHeroTitle({ ...(topic.heroTitle || {}) });
      setTopicHeroSubtitle({ ...(topic.heroSubtitle || {}) });
      setTopicDescription({ ...(topic.description || {}) });
      setTopicBenefits({ ...(topic.benefits || {}) });
      setTopicMaterials((topic.recommendedMaterials || []).join(", "));
      setTopicLeadTime(topic.leadTime || "");
      setTopicPrecision(topic.precision || "");
      setTopicMetaTitle({ ...(topic.metaTitle || {}) });
      setTopicMetaDescription({ ...(topic.metaDescription || {}) });
      setTopicMetaKeywords({ ...(topic.metaKeywords || {}) });
      setTopicFaqs({ ...(topic.faqs || {}) });
      setTopicSortOrder(topic.sortOrder || 0);
      setTopicIsActive(topic.isActive);
    } else {
      setEditingTopic(null);
      setTopicSlug("");
      setTopicNames({});
      setTopicTagline({});
      setTopicBadge({});
      setTopicHeroTitle({});
      setTopicHeroSubtitle({});
      setTopicDescription({});
      setTopicBenefits({});
      setTopicMaterials("PETG, TPU, PLA");
      setTopicLeadTime("2-5 werkdagen / business days");
      setTopicPrecision("±0.1mm industriële tolerantie");
      setTopicMetaTitle({});
      setTopicMetaDescription({});
      setTopicMetaKeywords({});
      setTopicFaqs({});
      setTopicSortOrder((topics.length + 1) * 10);
      setTopicIsActive(true);
    }
    setTopicLangTab(language);
    setIsTopicModalOpen(true);
  };

  // Save Topic
  const handleSaveTopic = async () => {
    setSavingTopic(true);
    try {
      const materialsArray = topicMaterials
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);

      const payload: Partial<FaqTopic> = {
        slug: topicSlug.trim().toLowerCase().replace(/\s+/g, "-"),
        names: topicNames,
        tagline: topicTagline,
        badge: topicBadge,
        heroTitle: topicHeroTitle,
        heroSubtitle: topicHeroSubtitle,
        description: topicDescription,
        benefits: topicBenefits,
        recommendedMaterials: materialsArray,
        leadTime: topicLeadTime.trim(),
        precision: topicPrecision.trim(),
        metaTitle: topicMetaTitle,
        metaDescription: topicMetaDescription,
        metaKeywords: topicMetaKeywords,
        faqs: topicFaqs,
        sortOrder: Number(topicSortOrder),
        isActive: topicIsActive,
      };

      if (editingTopic) {
        await updateFaqTopic(editingTopic.id, payload);
      } else {
        await createFaqTopic(payload);
      }
      notifySuccess(t("admin.faq.saveSuccess"));
      setIsTopicModalOpen(false);
      await loadTopics();
    } catch {
      notifyError(t("admin.faq.saveFailed"));
    } finally {
      setSavingTopic(false);
    }
  };

  // Toggle Topic Active
  const handleToggleTopicActive = async (topic: FaqTopic) => {
    try {
      await updateFaqTopic(topic.id, { isActive: !topic.isActive });
      setTopics((prev) =>
        prev.map((t) => (t.id === topic.id ? { ...t, isActive: !t.isActive } : t)),
      );
      notifySuccess(t("admin.faq.saveSuccess"));
    } catch {
      notifyError(t("admin.faq.saveFailed"));
    }
  };

  // Delete Topic
  const handleDeleteTopic = async () => {
    if (!deleteTopicTarget) return;
    setDeletingTopic(true);
    try {
      await deleteFaqTopic(deleteTopicTarget.id);
      notifySuccess(t("admin.faq.deleteSuccess"));
      setDeleteTopicTarget(null);
      await loadTopics();
    } catch {
      notifyError(t("admin.faq.deleteFailed"));
    } finally {
      setDeletingTopic(false);
    }
  };

  // Seed Topics
  const handleSeedTopics = async () => {
    setSeedingTopics(true);
    try {
      await seedFaqTopics(true);
      notifySuccess(t("admin.faq.seedSuccess"));
      setSeedTopicsConfirmOpen(false);
      await loadTopics();
    } catch {
      notifyError(t("admin.faq.seedFailed"));
    } finally {
      setSeedingTopics(false);
    }
  };

  // Helpers for topic-specific FAQ Q&A editor
  const handleAddTopicFaq = () => {
    const list = topicFaqs[topicLangTab] ? [...topicFaqs[topicLangTab]] : [];
    list.push({ q: "", a: "" });
    setTopicFaqs({ ...topicFaqs, [topicLangTab]: list });
  };

  const handleUpdateTopicFaq = (index: number, field: "q" | "a", val: string) => {
    const list = topicFaqs[topicLangTab] ? [...topicFaqs[topicLangTab]] : [];
    if (!list[index]) return;
    list[index] = { ...list[index], [field]: val };
    setTopicFaqs({ ...topicFaqs, [topicLangTab]: list });
  };

  const handleRemoveTopicFaq = (index: number) => {
    const list = topicFaqs[topicLangTab] ? [...topicFaqs[topicLangTab]] : [];
    list.splice(index, 1);
    setTopicFaqs({ ...topicFaqs, [topicLangTab]: list });
  };

  return (
    <AdminLayout wide>
      <AdminBreadcrumb
        title={t("admin.faq.title")}
        items={[
          { label: t("admin.nav.dashboard"), to: "/admin" },
          { label: t("admin.faq.title") },
        ]}
      />

      <div className="space-y-6">
        {/* Top Header & Tab Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#d8e6df]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("items")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "items"
                  ? "bg-teal-700 text-white shadow-sm"
                  : "bg-white text-[#314842] hover:bg-[#eaf4f1] border border-[#d8e6df]"
              }`}
            >
              <HelpCircle className="w-4 h-4 inline mr-2" />
              <span>{t("admin.faq.itemsTab")}</span>
              <span className="ml-2 text-xs opacity-80">({items.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("topics")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "topics"
                  ? "bg-teal-700 text-white shadow-sm"
                  : "bg-white text-[#314842] hover:bg-[#eaf4f1] border border-[#d8e6df]"
              }`}
            >
              <Layers className="w-4 h-4 inline mr-2" />
              <span>{t("admin.faq.topicsTab")}</span>
              <span className="ml-2 text-xs opacity-80">({topics.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "items" ? (
              <>
                <button
                  onClick={() => setSeedItemsConfirmOpen(true)}
                  className="site-btn-soft px-3 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t("admin.faq.seedDefaults")}</span>
                </button>
                <button
                  onClick={() => openItemModal()}
                  className="site-btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t("admin.faq.addItem")}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setSeedTopicsConfirmOpen(true)}
                  className="site-btn-soft px-3 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t("admin.faq.seedDefaults")}</span>
                </button>
                <button
                  onClick={() => openTopicModal()}
                  className="site-btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t("admin.faq.addTopic")}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* TAB 1: FAQ ITEMS */}
        {activeTab === "items" && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={itemsSearch}
                  onChange={(e) => setItemsSearch(e.target.value)}
                  placeholder={t("admin.faq.searchPlaceholder")}
                  className="site-input pl-10 pr-4 py-2 w-full text-sm rounded-xl"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="site-input px-3 py-2 text-sm rounded-xl shrink-0"
              >
                <option value="all">{t("admin.faq.filterCategory")}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Items Table */}
            {loadingItems ? (
              <div className="p-12 text-center text-[#556b64] flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                <span>{t("common.loading")}</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-12 text-center text-[#68817a] site-card rounded-2xl">
                <HelpCircle className="w-10 h-10 mx-auto text-gray-400 mb-2 opacity-60" />
                <p className="font-semibold text-base">{t("admin.faq.emptyItems")}</p>
              </div>
            ) : (
              <div className="site-card rounded-2xl overflow-hidden border border-[#d8e6df]">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-[#f4f9f6] text-[#283d36] font-bold text-xs uppercase tracking-wider border-b border-[#d8e6df]">
                    <tr>
                      <th className="py-3 px-4">{t("admin.faq.colQuestion")}</th>
                      <th className="py-3 px-4 w-32">{t("admin.faq.colCategory")}</th>
                      <th className="py-3 px-4 w-20 text-center">{t("admin.faq.colSort")}</th>
                      <th className="py-3 px-4 w-24 text-center">{t("admin.faq.colStatus")}</th>
                      <th className="py-3 px-4 w-28 text-right">{t("admin.faq.colActions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e9f2ee]">
                    {filteredItems.map((item) => {
                      const qText = getLocalizedText(item.question, language);
                      const aText = getLocalizedText(item.answer, language);

                      return (
                        <tr key={item.id} className="hover:bg-[#fafdff] transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-bold text-[#142621] line-clamp-1">{qText}</p>
                            <p className="text-xs text-[#5f746e] line-clamp-2 mt-0.5">{aText}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#edf5f1] text-[#1c473c]">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-xs text-gray-600">
                            {item.sortOrder}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleToggleItemActive(item)}
                              className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all ${
                                item.isActive
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {item.isActive ? t("admin.faq.active") : t("admin.faq.inactive")}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => openItemModal(item)}
                                className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                                title={t("admin.faq.edit")}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteItemTarget(item)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title={t("admin.faq.delete")}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TOPICS & SOLUTIONS */}
        {activeTab === "topics" && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={topicsSearch}
                onChange={(e) => setTopicsSearch(e.target.value)}
                placeholder={t("admin.faq.searchTopicsPlaceholder")}
                className="site-input pl-10 pr-4 py-2 w-full text-sm rounded-xl"
              />
            </div>

            {/* Topics Table */}
            {loadingTopics ? (
              <div className="p-12 text-center text-[#556b64] flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                <span>{t("common.loading")}</span>
              </div>
            ) : filteredTopics.length === 0 ? (
              <div className="p-12 text-center text-[#68817a] site-card rounded-2xl">
                <Layers className="w-10 h-10 mx-auto text-gray-400 mb-2 opacity-60" />
                <p className="font-semibold text-base">{t("admin.faq.emptyTopics")}</p>
              </div>
            ) : (
              <div className="site-card rounded-2xl overflow-hidden border border-[#d8e6df]">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-[#f4f9f6] text-[#283d36] font-bold text-xs uppercase tracking-wider border-b border-[#d8e6df]">
                    <tr>
                      <th className="py-3 px-4">{t("admin.faq.colSlug")}</th>
                      <th className="py-3 px-4">{t("admin.faq.colTitle")}</th>
                      <th className="py-3 px-4">{t("admin.faq.colBadge")}</th>
                      <th className="py-3 px-4">{t("admin.faq.colMaterials")}</th>
                      <th className="py-3 px-4 w-20 text-center">{t("admin.faq.colSort")}</th>
                      <th className="py-3 px-4 w-24 text-center">{t("admin.faq.colStatus")}</th>
                      <th className="py-3 px-4 w-32 text-right">{t("admin.faq.colActions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e9f2ee]">
                    {filteredTopics.map((top) => {
                      const name = getLocalizedText(top.names, language);
                      const badge = getLocalizedText(top.badge, language);

                      return (
                        <tr key={top.id} className="hover:bg-[#fafdff] transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded">
                              /faq/{top.slug}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-[#142621]">{name}</td>
                          <td className="py-3 px-4 text-xs text-[#526b64]">{badge}</td>
                          <td className="py-3 px-4 text-xs text-[#526b64]">
                            {(top.recommendedMaterials || []).join(", ")}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-xs text-gray-600">
                            {top.sortOrder}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleToggleTopicActive(top)}
                              className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all ${
                                top.isActive
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {top.isActive ? t("admin.faq.active") : t("admin.faq.inactive")}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <a
                                href={localizePath(`/faq/${top.slug}`)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                title={t("admin.faq.viewLive")}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => openTopicModal(top)}
                                className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                                title={t("admin.faq.edit")}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTopicTarget(top)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title={t("admin.faq.delete")}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: CREATE / EDIT FAQ ITEM */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {editingItem
                  ? t("admin.faq.modalItemTitleEdit")
                  : t("admin.faq.modalItemTitleNew")}
              </h2>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Switcher Tabs */}
            <div className="bg-[#f0f7f4] p-1.5 rounded-xl flex items-center gap-1">
              <span className="text-xs font-semibold text-[#345148] px-2">
                {t("admin.faq.editingLanguage")}
              </span>
              {supportedLanguages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setItemLangTab(lang)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    itemLangTab === lang
                      ? "bg-white text-teal-800 shadow-xs"
                      : "text-[#4e6b62] hover:text-teal-900"
                  }`}
                >
                  {lang.toUpperCase()}
                  {itemQuestions[lang]?.trim() && itemAnswers[lang]?.trim() && (
                    <Check className="w-3 h-3 inline ml-1 text-emerald-600" />
                  )}
                </button>
              ))}
            </div>

            {/* Multilingual Question Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t("admin.faq.questionLabel")} ({itemLangTab.toUpperCase()})
              </label>
              <input
                type="text"
                value={itemQuestions[itemLangTab] || ""}
                onChange={(e) =>
                  setItemQuestions({ ...itemQuestions, [itemLangTab]: e.target.value })
                }
                className="site-input w-full px-3 py-2 text-sm rounded-xl"
                placeholder={t("admin.faq.questionLabel")}
              />
            </div>

            {/* Multilingual Answer Textarea */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t("admin.faq.answerLabel")} ({itemLangTab.toUpperCase()})
              </label>
              <textarea
                rows={4}
                value={itemAnswers[itemLangTab] || ""}
                onChange={(e) =>
                  setItemAnswers({ ...itemAnswers, [itemLangTab]: e.target.value })
                }
                className="site-input w-full px-3 py-2 text-sm rounded-xl"
                placeholder={t("admin.faq.answerLabel")}
              />
            </div>

            {/* Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t("admin.faq.categoryLabel")}
                </label>
                <input
                  type="text"
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="site-input w-full px-3 py-2 text-sm rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t("admin.faq.sortOrderLabel")}
                </label>
                <input
                  type="number"
                  value={itemSortOrder}
                  onChange={(e) => setItemSortOrder(Number(e.target.value))}
                  className="site-input w-full px-3 py-2 text-sm rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="itemIsActive"
                checked={itemIsActive}
                onChange={(e) => setItemIsActive(e.target.checked)}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <label htmlFor="itemIsActive" className="text-xs font-bold text-gray-800">
                {t("admin.faq.isActiveLabel")}
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="site-btn-soft px-4 py-2 text-xs font-semibold"
              >
                {t("admin.faq.cancel")}
              </button>
              <button
                type="button"
                disabled={savingItem}
                onClick={handleSaveItem}
                className="site-btn-primary px-5 py-2 text-xs font-bold inline-flex items-center gap-1.5"
              >
                {savingItem && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{savingItem ? t("admin.faq.saving") : t("admin.faq.save")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE / EDIT FAQ TOPIC */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {editingTopic
                  ? t("admin.faq.modalTopicTitleEdit")
                  : t("admin.faq.modalTopicTitleNew")}
              </h2>
              <button
                onClick={() => setIsTopicModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slug input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t("admin.faq.slugLabel")}
              </label>
              <div className="flex items-center gap-1">
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2.5 py-2 rounded-xl">
                  /faq/
                </span>
                <input
                  type="text"
                  value={topicSlug}
                  onChange={(e) => setTopicSlug(e.target.value)}
                  placeholder={t("admin.faq.slugPlaceholder")}
                  className="site-input flex-grow px-3 py-2 text-sm rounded-xl font-mono"
                />
              </div>
            </div>

            {/* Language Switcher Tabs */}
            <div className="bg-[#f0f7f4] p-1.5 rounded-xl flex items-center gap-1">
              <span className="text-xs font-semibold text-[#345148] px-2">
                {t("admin.faq.editingLanguage")}
              </span>
              {supportedLanguages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setTopicLangTab(lang)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    topicLangTab === lang
                      ? "bg-white text-teal-800 shadow-xs"
                      : "text-[#4e6b62] hover:text-teal-900"
                  }`}
                >
                  {lang.toUpperCase()}
                  {topicNames[lang]?.trim() && (
                    <Check className="w-3 h-3 inline ml-1 text-emerald-600" />
                  )}
                </button>
              ))}
            </div>

            {/* Localized Topic Fields for active tab */}
            <div className="space-y-3 bg-[#fafcfb] p-4 rounded-2xl border border-[#e3ede8]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t("admin.faq.nameLabel")} ({topicLangTab.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={topicNames[topicLangTab] || ""}
                    onChange={(e) =>
                      setTopicNames({ ...topicNames, [topicLangTab]: e.target.value })
                    }
                    className="site-input w-full px-3 py-2 text-sm rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t("admin.faq.badgeLabel")} ({topicLangTab.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={topicBadge[topicLangTab] || ""}
                    onChange={(e) =>
                      setTopicBadge({ ...topicBadge, [topicLangTab]: e.target.value })
                    }
                    className="site-input w-full px-3 py-2 text-sm rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t("admin.faq.taglineLabel")} ({topicLangTab.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={topicTagline[topicLangTab] || ""}
                  onChange={(e) =>
                    setTopicTagline({ ...topicTagline, [topicLangTab]: e.target.value })
                  }
                  className="site-input w-full px-3 py-2 text-sm rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t("admin.faq.heroTitleLabel")} ({topicLangTab.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={topicHeroTitle[topicLangTab] || ""}
                    onChange={(e) =>
                      setTopicHeroTitle({
                        ...topicHeroTitle,
                        [topicLangTab]: e.target.value,
                      })
                    }
                    className="site-input w-full px-3 py-2 text-sm rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t("admin.faq.heroSubtitleLabel")} ({topicLangTab.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={topicHeroSubtitle[topicLangTab] || ""}
                    onChange={(e) =>
                      setTopicHeroSubtitle({
                        ...topicHeroSubtitle,
                        [topicLangTab]: e.target.value,
                      })
                    }
                    className="site-input w-full px-3 py-2 text-sm rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t("admin.faq.descriptionLabel")} ({topicLangTab.toUpperCase()})
                </label>
                <textarea
                  rows={3}
                  value={topicDescription[topicLangTab] || ""}
                  onChange={(e) =>
                    setTopicDescription({
                      ...topicDescription,
                      [topicLangTab]: e.target.value,
                    })
                  }
                  className="site-input w-full px-3 py-2 text-sm rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t("admin.faq.benefitsLabel")} ({topicLangTab.toUpperCase()})
                </label>
                <textarea
                  rows={3}
                  value={(topicBenefits[topicLangTab] || []).join("\n")}
                  onChange={(e) => {
                    const lines = e.target.value.split("\n");
                    setTopicBenefits({ ...topicBenefits, [topicLangTab]: lines });
                  }}
                  className="site-input w-full px-3 py-2 text-sm rounded-xl font-mono text-xs"
                />
              </div>

              {/* Dedicated Topic FAQs */}
              <div className="pt-2 border-t border-[#d8e6df]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-800">
                    {t("admin.faq.topicFaqsHeader")} ({topicLangTab.toUpperCase()})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddTopicFaq}
                    className="site-btn-soft px-2.5 py-1 text-xs inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{t("admin.faq.addTopicFaq")}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(topicFaqs[topicLangTab] || []).map((faqItem, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white border border-[#d8e6df] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-500">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTopicFaq(idx)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                        >
                          {t("admin.faq.removeFaq")}
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder={t("admin.faq.topicFaqQuestion")}
                        value={faqItem.q}
                        onChange={(e) =>
                          handleUpdateTopicFaq(idx, "q", e.target.value)
                        }
                        className="site-input w-full px-2.5 py-1 text-xs rounded-lg"
                      />
                      <textarea
                        rows={2}
                        placeholder={t("admin.faq.topicFaqAnswer")}
                        value={faqItem.a}
                        onChange={(e) =>
                          handleUpdateTopicFaq(idx, "a", e.target.value)
                        }
                        className="site-input w-full px-2.5 py-1 text-xs rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Technical & Shared Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t("admin.faq.materialsLabel")}
                </label>
                <input
                  type="text"
                  value={topicMaterials}
                  onChange={(e) => setTopicMaterials(e.target.value)}
                  className="site-input w-full px-3 py-2 text-sm rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t("admin.faq.leadTimeLabel")}
                </label>
                <input
                  type="text"
                  value={topicLeadTime}
                  onChange={(e) => setTopicLeadTime(e.target.value)}
                  className="site-input w-full px-3 py-2 text-sm rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t("admin.faq.precisionLabel")}
                </label>
                <input
                  type="text"
                  value={topicPrecision}
                  onChange={(e) => setTopicPrecision(e.target.value)}
                  className="site-input w-full px-3 py-2 text-sm rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t("admin.faq.sortOrderLabel")}
                </label>
                <input
                  type="number"
                  value={topicSortOrder}
                  onChange={(e) => setTopicSortOrder(Number(e.target.value))}
                  className="site-input w-full px-3 py-2 text-sm rounded-xl"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="topicIsActive"
                  checked={topicIsActive}
                  onChange={(e) => setTopicIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <label htmlFor="topicIsActive" className="text-xs font-bold text-gray-800">
                  {t("admin.faq.isActiveLabel")}
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setIsTopicModalOpen(false)}
                className="site-btn-soft px-4 py-2 text-xs font-semibold"
              >
                {t("admin.faq.cancel")}
              </button>
              <button
                type="button"
                disabled={savingTopic}
                onClick={handleSaveTopic}
                className="site-btn-primary px-5 py-2 text-xs font-bold inline-flex items-center gap-1.5"
              >
                {savingTopic && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{savingTopic ? t("admin.faq.saving") : t("admin.faq.save")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE ITEM MODAL */}
      {deleteItemTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              {t("admin.faq.deleteConfirmTitle")}
            </h2>
            <p className="text-sm text-gray-600">
              {t("admin.faq.deleteConfirmMessage")}
            </p>
            <p className="text-xs font-semibold text-teal-900 bg-teal-50 p-2.5 rounded-xl border border-teal-100">
              {getLocalizedText(deleteItemTarget.question, language)}
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setDeleteItemTarget(null)}
                className="site-btn-soft px-4 py-2 text-xs font-semibold"
              >
                {t("admin.faq.cancel")}
              </button>
              <button
                disabled={deletingItem}
                onClick={handleDeleteItem}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl inline-flex items-center gap-1.5"
              >
                {deletingItem && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deletingItem ? t("admin.faq.deleting") : t("admin.faq.delete")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE TOPIC MODAL */}
      {deleteTopicTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              {t("admin.faq.deleteTopicConfirmTitle")}
            </h2>
            <p className="text-sm text-gray-600">
              {t("admin.faq.deleteTopicConfirmMessage")}
            </p>
            <p className="text-xs font-semibold text-teal-900 bg-teal-50 p-2.5 rounded-xl border border-teal-100 font-mono">
              /faq/{deleteTopicTarget.slug}
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setDeleteTopicTarget(null)}
                className="site-btn-soft px-4 py-2 text-xs font-semibold"
              >
                {t("admin.faq.cancel")}
              </button>
              <button
                disabled={deletingTopic}
                onClick={handleDeleteTopic}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl inline-flex items-center gap-1.5"
              >
                {deletingTopic && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deletingTopic ? t("admin.faq.deleting") : t("admin.faq.delete")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM SEED ITEMS MODAL */}
      {seedItemsConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              {t("admin.faq.seedConfirmTitle")}
            </h2>
            <p className="text-sm text-gray-600">
              {t("admin.faq.seedConfirmMessage")}
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setSeedItemsConfirmOpen(false)}
                className="site-btn-soft px-4 py-2 text-xs font-semibold"
              >
                {t("admin.faq.cancel")}
              </button>
              <button
                disabled={seedingItems}
                onClick={handleSeedItems}
                className="site-btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5"
              >
                {seedingItems && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{t("admin.faq.seedDefaults")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM SEED TOPICS MODAL */}
      {seedTopicsConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              {t("admin.faq.seedConfirmTitle")}
            </h2>
            <p className="text-sm text-gray-600">
              {t("admin.faq.seedConfirmMessage")}
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setSeedTopicsConfirmOpen(false)}
                className="site-btn-soft px-4 py-2 text-xs font-semibold"
              >
                {t("admin.faq.cancel")}
              </button>
              <button
                disabled={seedingTopics}
                onClick={handleSeedTopics}
                className="site-btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5"
              >
                {seedingTopics && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{t("admin.faq.seedDefaults")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
