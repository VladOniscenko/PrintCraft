import { useState } from "react";
import {
  MessageSquare,
  Mail,
  RefreshCw,
  Lock,
  User,
  Trash2,
  Send,
  Clock,
} from "lucide-react";
import type { OrderDetailsDto, OrderTimelineEvent } from "../types";
import api from "../../../services/api";
import { useNotify } from "../../../context/NotifyContext";

interface CommunicationTimelineCardProps {
  order: OrderDetailsDto;
  onRefresh: () => Promise<void>;
}

export default function CommunicationTimelineCard({
  order,
  onRefresh,
}: CommunicationTimelineCardProps) {
  const { notifySuccess, notifyError } = useNotify();

  // Tab for active note composer: "internal" | "customer"
  const [activeNoteTab, setActiveNoteTab] = useState<"internal" | "customer">(
    "internal",
  );
  const [noteContent, setNoteContent] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  // Timeline filter
  const [filterType, setFilterType] = useState<
    "all" | "note" | "email" | "status_change"
  >("all");

  const timeline = order.timeline || [];

  const filteredTimeline = timeline.filter((event) => {
    if (filterType === "all") return true;
    return event.type === filterType;
  });

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setSubmittingNote(true);
    try {
      await api.post(`/admin/orders/${order.id}/notes`, {
        content: noteContent.trim(),
        visibility: activeNoteTab,
      });
      notifySuccess(
        activeNoteTab === "internal"
          ? "Internal admin note added"
          : "Customer note added",
      );
      setNoteContent("");
      await onRefresh();
    } catch (err: unknown) {
      console.error(err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to add note to order";
      notifyError(errMsg);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    setDeletingNoteId(noteId);
    try {
      await api.delete(`/admin/orders/${order.id}/notes/${noteId}`);
      notifySuccess("Note deleted successfully");
      await onRefresh();
    } catch (err: unknown) {
      console.error(err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to delete note";
      notifyError(errMsg);
    } finally {
      setDeletingNoteId(null);
    }
  };

  const renderTimelineIcon = (event: OrderTimelineEvent) => {
    switch (event.type) {
      case "email":
        return (
          <div className="p-1.5 rounded-full bg-blue-100 text-blue-700">
            <Mail size={12} />
          </div>
        );
      case "status_change":
        return (
          <div className="p-1.5 rounded-full bg-purple-100 text-purple-700">
            <RefreshCw size={12} />
          </div>
        );
      case "note":
        if (event.visibility === "internal") {
          return (
            <div className="p-1.5 rounded-full bg-amber-100 text-amber-800">
              <Lock size={12} />
            </div>
          );
        }
        return (
          <div className="p-1.5 rounded-full bg-teal-100 text-teal-800">
            <User size={12} />
          </div>
        );
      default:
        return (
          <div className="p-1.5 rounded-full bg-slate-100 text-slate-600">
            <Clock size={12} />
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 transition-shadow hover:shadow flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
            <MessageSquare size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Communication History
            </h3>
            <p className="text-xs text-slate-500">
              Unified timeline & note log
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
              filterType === "all"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterType("note")}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
              filterType === "note"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Notes
          </button>
          <button
            type="button"
            onClick={() => setFilterType("email")}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
              filterType === "email"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Emails
          </button>
          <button
            type="button"
            onClick={() => setFilterType("status_change")}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
              filterType === "status_change"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Status
          </button>
        </div>
      </div>

      {/* Note Composer */}
      <div className="mb-4 bg-slate-50 border border-slate-200/80 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveNoteTab("internal")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeNoteTab === "internal"
                  ? "bg-amber-100 text-amber-900 font-semibold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <Lock size={12} className="text-amber-700" />
              <span>Internal Admin Note</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveNoteTab("customer")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeNoteTab === "customer"
                  ? "bg-teal-100 text-teal-900 font-semibold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <User size={12} className="text-teal-700" />
              <span>Customer Note</span>
            </button>
          </div>

          <span className="text-[10px] text-slate-400">
            {activeNoteTab === "internal"
              ? "Only visible to admins"
              : "Visible to customer"}
          </span>
        </div>

        <form onSubmit={handleAddNote} className="space-y-2">
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={2}
            placeholder={
              activeNoteTab === "internal"
                ? "Add an internal note for your team (e.g., slicing notes, printer calibration)..."
                : "Add a message or note visible to the customer..."
            }
            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingNote || !noteContent.trim()}
              className={`px-3 py-1 text-xs font-medium text-white rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
                activeNoteTab === "internal"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              <Send size={11} />
              <span>{submittingNote ? "Adding..." : "Post Note"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Unified Timeline List */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {filteredTimeline.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs italic">
            No events found for this filter.
          </div>
        ) : (
          filteredTimeline.map((event) => {
            const formattedDate = new Date(event.timestamp).toLocaleString(
              undefined,
              {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              },
            );

            const isNote = event.type === "note";
            const noteId = event.metadata?.noteId;

            return (
              <div
                key={event.id}
                className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-150 bg-white hover:border-slate-300 transition-colors"
              >
                <div className="mt-0.5 shrink-0">
                  {renderTimelineIcon(event)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {event.title}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {formattedDate}
                    </span>
                  </div>

                  {event.content && (
                    <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap break-words leading-relaxed">
                      {event.content}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-1.5 text-[10px] text-slate-400">
                    <span className="truncate">
                      By: <strong className="font-medium text-slate-600">{event.author || "System"}</strong>
                    </span>

                    {isNote && noteId && (
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(noteId)}
                        disabled={deletingNoteId === noteId}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                        title="Delete Note"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
