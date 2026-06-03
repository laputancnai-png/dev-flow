import { useRef, useState } from "react";
import { FileText, FileCode, FileSpreadsheet, Image, CloudUpload, X, Terminal } from "lucide-react";
import type { Doc } from "../types";
import { api } from "../api";

interface Props {
  docs: Doc[];
  projectSlug: string;
  onRefresh: () => void;
}

function DocIcon({ mimeType, size = 18 }: { mimeType: string; size?: number }) {
  if (mimeType.includes("pdf")) return <FileText size={size} style={{ color: "#534AB7" }} />;
  if (mimeType.includes("image")) return <Image size={size} style={{ color: "#185FA5" }} />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv"))
    return <FileSpreadsheet size={size} style={{ color: "#854F0B" }} />;
  if (mimeType.includes("code") || mimeType.includes("json") || mimeType.includes("xml"))
    return <FileCode size={size} style={{ color: "#0F6E56" }} />;
  return <FileText size={size} style={{ color: "#0F6E56" }} />;
}

function DocIconBg(mimeType: string) {
  if (mimeType.includes("pdf")) return "#EEEDFE";
  if (mimeType.includes("image")) return "#E6F1FB";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "#FAEEDA";
  return "#E1F5EE";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function mimeLabel(mimeType: string, filename: string) {
  const ext = filename.split(".").pop()?.toUpperCase() || "";
  return ext || mimeType.split("/")[1]?.toUpperCase() || "FILE";
}

export default function DocumentsView({ docs, projectSlug, onRefresh }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      await api.documents.upload(projectSlug, file).catch(console.error);
    }
    setUploading(false);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    await api.documents.delete(id).catch(console.error);
    onRefresh();
  };

  return (
    <div>
      {docs.length > 0 && (
        <div className="docs-grid">
          {docs.map((doc) => (
            <div key={doc.id} className="doc-card">
              <div className="doc-card-inner">
                <div className="doc-icon" style={{ background: DocIconBg(doc.mimeType) as string }}>
                  <DocIcon mimeType={doc.mimeType} />
                </div>
                <div className="doc-name">{doc.name}</div>
                <div className="doc-meta">
                  {mimeLabel(doc.mimeType, doc.filename)} · {formatSize(doc.sizeBytes)} · {timeAgo(doc.createdAt)}
                </div>
              </div>
              <button
                className="doc-delete-btn"
                title="Delete"
                onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className={`upload-zone ${dragOver ? "drag-over" : ""} ${uploading ? "uploading" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      >
        <CloudUpload size={28} style={{ marginBottom: "8px", display: "block" }} />
        {uploading ? "Uploading..." : "Drop files here or click to upload"}
        <div style={{ fontSize: "11px", marginTop: "4px", color: "var(--color-text-tertiary)" }}>
          PDF, DOCX, XLSX, PNG, MD — any project document
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <div className="api-hint" style={{ marginTop: "14px" }}>
        <Terminal size={14} style={{ color: "#534AB7" }} />
        <span>Upload via API —</span>
        <code>POST /v1/projects/{projectSlug}/documents</code>
        <code>GET /v1/projects/{projectSlug}/documents</code>
      </div>
    </div>
  );
}
