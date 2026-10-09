import { useState } from "react";
import {
  FolderArchive,
  Download,
  Eye,
  Box,
  Image as ImageIcon,
  FileText,
  Layers,
} from "lucide-react";
import type { OrderDetailsDto, OrderFileAsset } from "../types";
import { resolveAssetUrl } from "../../../utils/assetUrl";
import ModelInspectorModal from "../../ModelInspectorModal";

interface FilesAssetsCardProps {
  order: OrderDetailsDto;
}

export default function FilesAssetsCard({ order }: FilesAssetsCardProps) {
  const [inspectingFile, setInspectingFile] = useState<OrderFileAsset | null>(
    null,
  );

  const files = order.files || [];

  const getFileBadgeColor = (ext: string, kind: string) => {
    const cleanExt = ext.toLowerCase();
    if (
      cleanExt.includes("stl") ||
      cleanExt.includes("step") ||
      cleanExt.includes("stp") ||
      cleanExt.includes("3mf") ||
      cleanExt.includes("glb") ||
      cleanExt.includes("gltf")
    ) {
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
    if (
      kind === "image" ||
      cleanExt.includes("png") ||
      cleanExt.includes("jpg") ||
      cleanExt.includes("jpeg")
    ) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const getFileIcon = (file: OrderFileAsset) => {
    if (file.is3DModel || file.kind === "model") {
      return <Box size={16} className="text-indigo-600 shrink-0" />;
    }
    if (file.kind === "image") {
      return <ImageIcon size={16} className="text-emerald-600 shrink-0" />;
    }
    return <FileText size={16} className="text-slate-500 shrink-0" />;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 transition-shadow hover:shadow">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
            <FolderArchive size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Files & Assets
            </h3>
            <p className="text-xs text-slate-500">
              {files.length} uploaded {files.length === 1 ? "file" : "files"}{" "}
              (.stl, .step, images)
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {files.length}
        </span>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <Layers className="mx-auto text-slate-300 mb-1.5" size={28} />
          <p className="text-xs text-slate-500">
            No uploaded files associated with this order
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {files.map((file) => {
            const downloadHref = resolveAssetUrl(
              file.fileUrl || file.downloadUrl,
            );
            const canPreview3D =
              file.is3DModel ||
              file.kind === "model" ||
              [".stl", ".obj", ".3mf", ".glb", ".gltf"].some((e) =>
                file.fileName.toLowerCase().endsWith(e),
              );
              

            return (
              <div
                key={file.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-150 hover:border-slate-300 bg-slate-50/40 hover:bg-white transition-all group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    {getFileIcon(file)}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-xs font-medium text-slate-800 truncate"
                      title={file.fileName}
                    >
                      {file.fileName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {file.role === "source" || file.label?.includes("Source") || file.kind === "image" ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
                          Source File
                        </span>
                      ) : file.role === "preview" || file.label?.includes("Preview") || file.fileName.toLowerCase().endsWith(".glb") ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-purple-50 text-purple-700 border-purple-200">
                          Web Preview (.glb)
                        </span>
                      ) : file.role === "production" || file.label?.includes("Production") || [".3mf", ".stl", ".obj", ".step"].some(e => file.fileName.toLowerCase().endsWith(e)) ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
                          Production File ({file.extension ? file.extension.replace(".", "").toUpperCase() : "3MF/STL"})
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded border ${getFileBadgeColor(
                            file.extension || file.fileName,
                            file.kind,
                          )}`}
                        >
                          {file.extension
                            ? file.extension.replace(".", "")
                            : file.kind}
                        </span>
                      )}
                      {file.material && (
                        <span className="text-[10px] text-slate-400">
                          {file.material}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">

                  {canPreview3D && (
                    <button
                      type="button"
                      onClick={() => setInspectingFile(file)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Inspect 3D Model"
                    >
                      <Eye size={14} />
                    </button>
                  )}

                  <a
                    href={downloadHref}
                    download={file.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                    title="Download file"
                  >
                    <Download size={14} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3D Inspector Modal */}
      {inspectingFile && (
        <ModelInspectorModal
          isOpen={true}
          onClose={() => setInspectingFile(null)}
          fileName={inspectingFile.fileName}
          fileUrl={inspectingFile.fileUrl}
          material={inspectingFile.material || undefined}
          color={inspectingFile.color || undefined}
          size={inspectingFile.size || undefined}
        />
      )}
    </div>
  );
}
