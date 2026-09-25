/**
 * DocumentUploadZone
 * ------------------
 * A fully self-contained drag-and-drop upload zone for multi-format documents.
 * Replaces the minimal upload widget inside BlogUrlForm with a richer, visual-first
 * component designed specifically for the "Document → Video" conversion flow.
 *
 * Supported formats: PDF, DOCX, PPTX, XLSX, CSV, MD, TXT, VTT
 *
 * Props:
 *   files          – controlled list of staged File objects
 *   onFilesChange  – setter called whenever the list changes
 *   error          – optional validation error string to surface below the zone
 *   maxFiles       – maximum number of files allowed (default: 5)
 *   maxSizeMB      – maximum size per file in MB (default: 5)
 *   disabled       – greys out the zone (e.g. while generating)
 */

import { useRef, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DocumentUploadZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  error?: string | null;
  maxFiles?: number;
  maxSizeMB?: number;
  disabled?: boolean;
}

// ─── File-format metadata ─────────────────────────────────────────────────────

interface FormatBadge {
  ext: string;
  label: string;
  accept: string[];
  colorClass: string;
  icon: React.ReactNode;
}

const FilePdfIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 14.5c0 .55-.45 1-1 1s-1-.45-1-1V13c0-.55.45-1 1-1s1 .45 1 1v1.5zm3 1.5H10v-5h1.5a1.5 1.5 0 0 1 0 3H11v2zm4-3.5h-1v1h1c.28 0 .5-.22.5-.5s-.22-.5-.5-.5zm0-1.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-1v1.5H14v-4.5h1.5z" />
  </svg>
);

const FileWordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM9 17l-2-8h1.5l1.25 5.5L11 9.5h2l1.25 5L15.5 9H17l-2 8h-1.5l-1.25-5L11 17H9z" />
  </svg>
);

const FilePptIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM9 13.5a1.5 1.5 0 0 1 0-3h2a1.5 1.5 0 0 1 0 3H10v3H8.5v-3H9z" />
  </svg>
);

const FileXlsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM9.5 17 8 14.5 6.5 17H5l2.25-4L5 9h1.5L8 11.5 9.5 9H11l-2.25 4L11 17H9.5zm4.5 0h-1.5V9H15c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2h-1v3z" />
  </svg>
);

const FileCsvIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 13.5A1.5 1.5 0 0 1 7 12c0-.83.67-1.5 1.5-1.5h1V12H8.5c-.28 0-.5.22-.5.5s.22.5.5.5H10c.83 0 1.5.67 1.5 1.5S10.83 16 10 16H8.5v-1.5H10c.28 0 .5-.22.5-.5s-.22-.5-.5-.5H8.5zm7 2.5H14l-1.5-5H14l.75 2.5.75-2.5h1.5L15.5 16z" />
  </svg>
);

const FileTextIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 16h8v1.5H8V16zm0-3h8v1.5H8V13zm0-3h5v1.5H8V10z" />
  </svg>
);

const FORMAT_BADGES: FormatBadge[] = [
  {
    ext: ".pdf",
    label: "PDF",
    accept: ["application/pdf"],
    colorClass: "bg-red-50 text-red-600 border-red-200",
    icon: <FilePdfIcon />,
  },
  {
    ext: ".docx",
    label: "Word",
    accept: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ],
    colorClass: "bg-blue-50 text-blue-600 border-blue-200",
    icon: <FileWordIcon />,
  },
  {
    ext: ".pptx",
    label: "PowerPoint",
    accept: [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    colorClass: "bg-orange-50 text-orange-600 border-orange-200",
    icon: <FilePptIcon />,
  },
  {
    ext: ".xlsx",
    label: "Excel",
    accept: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ],
    colorClass: "bg-emerald-50 text-emerald-600 border-emerald-200",
    icon: <FileXlsIcon />,
  },
  {
    ext: ".csv",
    label: "CSV",
    accept: ["text/csv"],
    colorClass: "bg-teal-50 text-teal-600 border-teal-200",
    icon: <FileCsvIcon />,
  },
  {
    ext: ".txt",
    label: "TXT",
    accept: ["text/plain"],
    colorClass: "bg-gray-100 text-gray-600 border-gray-200",
    icon: <FileTextIcon />,
  },
  {
    ext: ".md",
    label: "Markdown",
    accept: ["text/markdown", "text/x-markdown"],
    colorClass: "bg-purple-50 text-purple-600 border-purple-200",
    icon: <FileTextIcon />,
  },
  {
    ext: ".vtt",
    label: "VTT",
    accept: ["text/vtt"],
    colorClass: "bg-indigo-50 text-indigo-600 border-indigo-200",
    icon: <FileTextIcon />,
  },
];

// Full accept string for the hidden <input>
const ACCEPT_STRING = [
  ...FORMAT_BADGES.flatMap((f) => [f.ext, ...f.accept]),
  // also accept .doc, .ppt, .xls legacy formats even if backend skips them gracefully
  ".doc",
  ".ppt",
  ".xls",
  ".markdown",
  ".srt",
].join(",");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFormatBadge(filename: string): FormatBadge | undefined {
  const lower = filename.toLowerCase();
  return FORMAT_BADGES.find(
    (b) => lower.endsWith(b.ext) || (b.ext === ".md" && lower.endsWith(".markdown"))
  );
}

function getFileColorClasses(filename: string): string {
  const badge = getFormatBadge(filename);
  return badge?.colorClass ?? "bg-gray-100 text-gray-600 border-gray-200";
}

function getFileIcon(filename: string): React.ReactNode {
  const badge = getFormatBadge(filename);
  return badge?.icon ?? <FileTextIcon />;
}

function getFileLabelExt(filename: string): string {
  const badge = getFormatBadge(filename);
  if (badge) return badge.label;
  const parts = filename.split(".");
  return parts.length > 1 ? parts.at(-1)!.toUpperCase() : "FILE";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DocumentUploadZone({
  files,
  onFilesChange,
  error,
  maxFiles = 5,
  maxSizeMB = 5,
  disabled = false,
}: DocumentUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  // ── File validation & deduplication ─────────────────────────────────────────

  const addFiles = useCallback(
    (incoming: FileList | File[] | null) => {
      if (!incoming || disabled) return;
      setInternalError(null);

      const incomingArr = Array.from(incoming);
      const toAdd: File[] = [];
      const errors: string[] = [];

      for (const file of incomingArr) {
        if (files.length + toAdd.length >= maxFiles) {
          errors.push(`Maximum of ${maxFiles} files allowed.`);
          break;
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
          errors.push(`"${file.name}" exceeds ${maxSizeMB} MB.`);
          continue;
        }
        // Deduplicate by name + size
        const isDuplicate = [...files, ...toAdd].some(
          (f) => f.name === file.name && f.size === file.size
        );
        if (isDuplicate) continue;
        toAdd.push(file);
      }

      if (errors.length) setInternalError(errors[0]);
      if (toAdd.length) onFilesChange([...files, ...toAdd]);
    },
    [files, onFilesChange, disabled, maxFiles, maxSizeMB]
  );

  const removeFile = (index: number) => {
    setInternalError(null);
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const addPastedText = useCallback(
    (text: string) => {
      const blob = new Blob([text], { type: "text/plain" });
      const name = `pasted-text-${Date.now()}.txt`;
      const file = new File([blob], name, { type: "text/plain" });
      addFiles([file]);
    },
    [addFiles]
  );

  // ── Drag handlers ───────────────────────────────────────────────────────────

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    // Only clear when leaving the outer element (not a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) addFiles(e.dataTransfer.files);
  };

  // ── Paste handler ────────────────────────────────────────────────────────────

  const onPaste = (e: React.ClipboardEvent) => {
    e.stopPropagation();
    const cd = e.clipboardData;
    if (cd.files && cd.files.length > 0) {
      e.preventDefault();
      addFiles(cd.files);
      return;
    }
    const text = cd.getData("text/plain")?.trim();
    if (text) {
      e.preventDefault();
      addPastedText(text);
    }
  };

  // ── Display error ────────────────────────────────────────────────────────────

  const displayError = error || internalError;

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider">
          Documents
          <span className="ml-1.5 text-gray-300 font-normal normal-case">
            (up to {maxFiles} files · {maxSizeMB} MB each)
          </span>
        </label>

        {files.length > 0 && (
          <button
            type="button"
            onClick={() => { setInternalError(null); onFilesChange([]); }}
            disabled={disabled}
            className="text-[10px] text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload documents — drag files here or click to browse"
        className={[
          "relative rounded-2xl border-2 border-dashed transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-purple-500/40",
          disabled
            ? "opacity-50 cursor-not-allowed border-gray-200/60 bg-gray-50/40"
            : isDragging
            ? "border-purple-400 bg-purple-50/40 cursor-copy scale-[1.005]"
            : files.length > 0
            ? "border-gray-200/60 bg-white/60 cursor-pointer hover:border-purple-300/60"
            : "border-gray-200/80 bg-white/30 cursor-pointer hover:border-purple-300/60 hover:bg-purple-50/20",
        ].join(" ")}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) inputRef.current?.click();
          }
        }}
        onPaste={onPaste}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {/* Empty state */}
        {files.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-10">
            {/* Animated upload icon */}
            <div
              className={[
                "relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                isDragging
                  ? "bg-purple-100 scale-110"
                  : "bg-gray-100/80",
              ].join(" ")}
            >
              <svg
                className={`w-7 h-7 transition-colors duration-200 ${isDragging ? "text-purple-500" : "text-gray-400"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 16v-8m0 0l-3 3m3-3l3 3M3 16.5A2.5 2.5 0 005.5 19h13a2.5 2.5 0 002.5-2.5V14a.5.5 0 00-1 0v2.5A1.5 1.5 0 0119.5 18h-13A1.5 1.5 0 015 16.5V14a.5.5 0 00-1 0v2.5z"
                />
              </svg>
              {/* Drag sparkle */}
              {isDragging && (
                <span className="absolute inset-0 rounded-2xl ring-4 ring-purple-300/40 animate-ping" />
              )}
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">
                {isDragging ? (
                  <span className="text-purple-600">Drop to add your documents</span>
                ) : (
                  <>
                    Drop files here or{" "}
                    <span className="text-purple-600 font-semibold">click to browse</span>
                  </>
                )}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                You can also paste text directly (Ctrl+V)
              </p>
            </div>

            {/* Format badges */}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {FORMAT_BADGES.map((badge) => (
                <span
                  key={badge.ext}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-medium ${badge.colorClass}`}
                >
                  {badge.icon}
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Files list (when files are staged) */}
        {files.length > 0 && (
          <div className="p-3 space-y-2">
            {files.map((file, index) => {
              const colorClasses = getFileColorClasses(file.name);
              const icon = getFileIcon(file.name);
              const extLabel = getFileLabelExt(file.name);

              return (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 px-3.5 py-2.5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow transition-shadow"
                >
                  {/* Format badge icon */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${colorClasses}`}
                  >
                    {icon}
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {extLabel} · {formatFileSize(file.size)}
                    </p>
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    disabled={disabled}
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}

            {/* Add more — only if under limit */}
            {files.length < maxFiles && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) inputRef.current?.click();
                }}
                disabled={disabled}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-gray-200 text-[11px] font-medium text-gray-400 hover:border-purple-300/80 hover:text-purple-500 hover:bg-purple-50/30 transition-all disabled:opacity-40"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add more files ({files.length}/{maxFiles})
              </button>
            )}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_STRING}
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            addFiles(e.target.files);
            // Reset so the same file can be re-selected if removed
            e.target.value = "";
          }}
        />
      </div>

      {/* Error message */}
      {displayError && (
        <div className="flex items-start gap-1.5 px-3 py-2 rounded-lg bg-red-50 border border-red-200/60">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-[11px] text-red-600">{displayError}</p>
        </div>
      )}

      {/* Keyboard / paste hint */}
      {files.length === 0 && !displayError && (
        <p className="text-[10px] text-gray-300 text-center leading-relaxed">
          Supported: PDF · Word · PowerPoint · Excel · CSV · Markdown · TXT · VTT
        </p>
      )}
    </div>
  );
}
