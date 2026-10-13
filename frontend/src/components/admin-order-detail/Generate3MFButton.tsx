import { useState, useEffect } from "react";
import { Download, Loader2, Trash2 } from "lucide-react";
import api from "../../services/api";
import { useNotify } from "../../context/NotifyContext";
import type { AdminOrderItem } from "../../types/order";

interface Generate3MFButtonProps {
  item: AdminOrderItem;
}

export default function Generate3MFButton({ item }: Generate3MFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [existingJobId, setExistingJobId] = useState<string | null>(item.autoForgeJobId || null);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const { notifyError, notifySuccess } = useNotify();

  useEffect(() => {
    if (existingJobId) {
      api.get(`/autoforge/status/${existingJobId}`).then(res => {
        setExistingStatus(res.data.status);
      }).catch(err => {
         console.error(err);
      });
    }
  }, [existingJobId]);

  const handleDelete = async () => {
    if (!existingJobId) return;
    try {
      await api.delete(`/autoforge/${existingJobId}`);
      setExistingJobId(null);
      setExistingStatus(null);
      notifySuccess("Generated 3MF deleted successfully");
    } catch (error) {
      console.error("Error deleting job:", error);
      notifyError("Failed to delete generated 3MF");
    }
  };

  const handleDownload = async () => {
    if (!existingJobId) return;
    try {
      const downloadRes = await api.get(`/autoforge/download/${existingJobId}`, {
        responseType: "blob",
      });
      const blob = downloadRes.data;
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${item.fileName || "model"}.3mf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading:", error);
      notifyError("Failed to download generated 3MF");
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);

      // Determine image URL
      const imageUrl =
        item.imageUrl ||
        (item.files || []).find((f) => f.kind === "image")?.fileUrl;

      if (!imageUrl) {
        notifyError("No image found for this item");
        setIsGenerating(false);
        return;
      }

      // Fetch the image as blob
      const res = await fetch(imageUrl);
      if (!res.ok) {
        throw new Error("Failed to fetch image");
      }
      const imageBlob = await res.blob();

      // Create FormData
      const formData = new FormData();
      formData.append("Image", imageBlob, "image.png");

      // Colors (list of strings, exactly 4 required by backend)
      const parsedColors = item.color ? item.color.split(",").map((c) => c.trim()) : [];
      const defaultColors = ["Black", "Dark Gray", "Light Gray", "White"];
      const finalColors = Array.from({ length: 4 }).map((_, i) => parsedColors[i] || defaultColors[i]);
      
      finalColors.forEach((c) => {
        formData.append("Colors", c);
      });

      formData.append("Size", item.size || "Standard");
      formData.append("Quality", item.printQuality || "Standard");
      formData.append("OrderItemId", item.id);

      const response = await api.post("/autoforge/generate", formData);
      const { jobId, existing } = response.data;

      if (!jobId) {
        throw new Error("No job ID returned");
      }

      setExistingJobId(jobId);
      if (existing) {
        notifySuccess("Job already exists for this item");
        setIsGenerating(false);
        return;
      }

      setExistingStatus("Pending");

      // Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await api.get(`/autoforge/status/${jobId}`);
          const { status, errorMessage } = statusRes.data;
          setExistingStatus(status);

          if (status === "Complete") {
            clearInterval(pollInterval);
            
            // Download the file
            const downloadRes = await api.get(`/autoforge/download/${jobId}`, {
              responseType: "blob",
            });
            const blob = downloadRes.data;
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `${item.fileName || "model"}.3mf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            notifySuccess("Generated 3MF file successfully");
            setIsGenerating(false);
          } else if (status === "Failed") {
            clearInterval(pollInterval);
            notifyError(`Generation failed: ${errorMessage || "Unknown error"}`);
            setIsGenerating(false);
          }
        } catch (error) {
          console.error("Error polling 3MF status:", error);
          clearInterval(pollInterval);
          notifyError("Failed to check generation status");
          setIsGenerating(false);
        }
      }, 3000);

    } catch (error) {
      console.error("Error generating 3MF:", error);
      notifyError("Failed to start 3MF generation");
      setIsGenerating(false);
    }
  };

  if (existingJobId) {
    const isWorking = existingStatus === "Pending" || existingStatus === "Processing";
    const isComplete = existingStatus === "Complete";
    
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={isComplete ? handleDownload : undefined}
          disabled={!isComplete}
          className="p-1.5 text-xs font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors disabled:opacity-50"
          title={isComplete ? "Download 3MF" : "Processing"}
        >
          {isWorking ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Download size={13} />
          )}
          <span>{isWorking ? existingStatus : isComplete ? "Download 3MF" : existingStatus}</span>
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="p-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors"
          title="Delete Generated 3MF"
        >
          <Trash2 size={13} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={isGenerating}
      className="p-1.5 text-xs font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors disabled:opacity-50"
      title="Generate 3MF"
    >
      {isGenerating ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <Download size={13} />
      )}
      <span>{isGenerating ? "Processing..." : "Generate 3MF"}</span>
    </button>
  );
}
