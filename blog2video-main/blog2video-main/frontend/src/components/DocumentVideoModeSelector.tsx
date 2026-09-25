/**
 * DocumentVideoModeSelector
 * -------------------------
 * A radio-card selector that lets the user pick *how* their document
 * should be converted to video, and in which aspect ratio.
 *
 * Modes:
 *   • "summary"      — Executive Summary / Key Points (short, ~30-60 s)
 *   • "explainer"    — Step-by-Step Explainer (medium, ~1-3 min)
 *   • "presentation" — Full Presentation (detailed, slide-by-slide)
 *   • "dataviz"      — Data Report / Charts (medium, data-heavy visuals)
 *
 * The component is fully controlled:
 *   • `mode`          / `onModeChange`
 *   • `aspectRatio`   / `onAspectRatioChange`
 *   • `videoLength`   / `onVideoLengthChange`  (derived from mode but
 *                                               overridable by the user)
 *
 * Exports `DocumentVideoMode` and `DOCUMENT_VIDEO_MODES` for consumers
 * that need the metadata array (e.g. for labels, default lengths, etc.).
 */

import { useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DocumentVideoMode = "summary" | "explainer" | "presentation" | "dataviz";
export type AspectRatio = "16:9" | "9:16" | "1:1";
export type VideoLength = "short" | "medium" | "detailed" | "more_detailed";

export interface DocumentVideoModeMeta {
  id: DocumentVideoMode;
  icon: React.ReactNode;
  title: string;
  description: string;
  durationLabel: string;
  defaultLength: VideoLength;
  /** Tailwind gradient pair for the icon background */
  gradientFrom: string;
  gradientTo: string;
  /** Tailwind color for selected ring/border */
  accentColor: string;
}

export interface DocumentVideoModeSelectorProps {
  mode: DocumentVideoMode;
  onModeChange: (mode: DocumentVideoMode) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ar: AspectRatio) => void;
  videoLength: VideoLength;
  onVideoLengthChange: (length: VideoLength) => void;
  /** Disable all controls (e.g. while generating) */
  disabled?: boolean;
  /** Hide the paid-only lock on "more_detailed" if the user is on a paid plan */
  isPaidUser?: boolean;
}

// ─── Mode metadata ────────────────────────────────────────────────────────────

const SummaryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const ExplainerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const PresentationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </svg>
);

const DataVizIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export const DOCUMENT_VIDEO_MODES: DocumentVideoModeMeta[] = [
  {
    id: "summary",
    icon: <SummaryIcon />,
    title: "Executive Summary",
    description: "Key points, highlights, and takeaways from your document. Ideal for Shorts, Reels, and LinkedIn.",
    durationLabel: "~30–90 s",
    defaultLength: "short",
    gradientFrom: "from-violet-500",
    gradientTo: "to-purple-600",
    accentColor: "border-purple-500",
  },
  {
    id: "explainer",
    icon: <ExplainerIcon />,
    title: "Step-by-Step Explainer",
    description: "Walks through ideas, processes, or concepts in a clear, tutorial-style narrative.",
    durationLabel: "~1–3 min",
    defaultLength: "medium",
    gradientFrom: "from-blue-500",
    gradientTo: "to-indigo-600",
    accentColor: "border-blue-500",
  },
  {
    id: "presentation",
    icon: <PresentationIcon />,
    title: "Full Presentation",
    description: "Converts each section or slide into a separate scene. Best for PPTX and structured reports.",
    durationLabel: "~3–8 min",
    defaultLength: "detailed",
    gradientFrom: "from-emerald-500",
    gradientTo: "to-teal-600",
    accentColor: "border-emerald-500",
  },
  {
    id: "dataviz",
    icon: <DataVizIcon />,
    title: "Data Report",
    description: "Highlights tables, metrics, and charts as animated data visualizations on screen.",
    durationLabel: "~1–4 min",
    defaultLength: "medium",
    gradientFrom: "from-orange-500",
    gradientTo: "to-amber-500",
    accentColor: "border-orange-400",
  },
];

// ─── Aspect-ratio options ─────────────────────────────────────────────────────

interface AspectRatioOption {
  id: AspectRatio;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  {
    id: "16:9",
    label: "16 : 9",
    sublabel: "Landscape",
    icon: (
      <svg viewBox="0 0 24 14" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-4">
        <rect x="1" y="1" width="22" height="12" rx="1.5" />
      </svg>
    ),
  },
  {
    id: "9:16",
    label: "9 : 16",
    sublabel: "Portrait",
    icon: (
      <svg viewBox="0 0 14 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-6">
        <rect x="1" y="1" width="12" height="22" rx="1.5" />
      </svg>
    ),
  },
  {
    id: "1:1",
    label: "1 : 1",
    sublabel: "Square",
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <rect x="1" y="1" width="16" height="16" rx="1.5" />
      </svg>
    ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DocumentVideoModeSelector({
  mode,
  onModeChange,
  aspectRatio,
  onAspectRatioChange,
  videoLength,
  onVideoLengthChange,
  disabled = false,
  isPaidUser = false,
}: DocumentVideoModeSelectorProps) {
  // When the mode changes, sync the videoLength to the mode's default
  // (unless the user has already overridden it manually — parent can ignore this
  // by not wiring onVideoLengthChange if it manages length independently).
  useEffect(() => {
    const meta = DOCUMENT_VIDEO_MODES.find((m) => m.id === mode);
    if (meta) onVideoLengthChange(meta.defaultLength);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const selectedMeta = DOCUMENT_VIDEO_MODES.find((m) => m.id === mode)!;

  return (
    <div className="space-y-4">
      {/* ── Section header ── */}
      <div>
        <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">
          Video Mode
        </label>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Choose how to convert your document into a video.
        </p>
      </div>

      {/* ── Mode cards ── */}
      <div className="grid grid-cols-2 gap-2">
        {DOCUMENT_VIDEO_MODES.map((meta) => {
          const isSelected = mode === meta.id;
          return (
            <button
              key={meta.id}
              type="button"
              disabled={disabled}
              onClick={() => onModeChange(meta.id)}
              className={[
                "group relative flex flex-col items-start gap-2.5 p-3.5 rounded-2xl border-2 text-left transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-purple-500/30",
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                isSelected
                  ? `${meta.accentColor} bg-white shadow-md shadow-black/5`
                  : "border-gray-200/70 bg-white/60 hover:border-gray-300 hover:bg-white hover:shadow-sm",
              ].join(" ")}
              aria-pressed={isSelected}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center shadow-sm">
                  <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth={2.5} className="w-2.5 h-2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                  </svg>
                </span>
              )}

              {/* Icon pill */}
              <span
                className={[
                  "inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br text-white shadow-sm transition-transform duration-200",
                  meta.gradientFrom,
                  meta.gradientTo,
                  !disabled && !isSelected ? "group-hover:scale-105" : "",
                ].join(" ")}
              >
                {meta.icon}
              </span>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-semibold leading-tight ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                  {meta.title}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-snug line-clamp-2">
                  {meta.description}
                </p>
              </div>

              {/* Duration badge */}
              <span
                className={[
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border",
                  isSelected
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-gray-50 text-gray-500 border-gray-200",
                ].join(" ")}
              >
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-2.5 h-2.5 opacity-70">
                  <path fillRule="evenodd" d="M8 1a7 7 0 100 14A7 7 0 008 1zM8 3a1 1 0 011 1v3.586l2.207 2.207a1 1 0 01-1.414 1.414l-2.5-2.5A1 1 0 017 8V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                {meta.durationLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Selected mode summary strip ── */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50/80 border border-gray-100">
        <span
          className={`inline-flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br ${selectedMeta.gradientFrom} ${selectedMeta.gradientTo} text-white shadow-sm flex-shrink-0`}
        >
          <span className="scale-75">{selectedMeta.icon}</span>
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-700 truncate">{selectedMeta.title}</p>
          <p className="text-[10px] text-gray-400 truncate">Default: {selectedMeta.durationLabel}</p>
        </div>
        {/* Manual length override — compact pill buttons */}
        <div className="flex gap-1 flex-shrink-0">
          {(["short", "medium", "detailed"] as const).map((opt) => {
            const labels: Record<string, string> = {
              short: "Short",
              medium: "Med",
              detailed: "Long",
            };
            const locked = !isPaidUser && opt === "detailed";
            const isActive = videoLength === opt;
            return (
              <button
                key={opt}
                type="button"
                disabled={disabled || locked}
                title={locked ? "Long-form video requires a paid plan" : undefined}
                onClick={() => onVideoLengthChange(opt)}
                className={[
                  "px-2 py-1 rounded-lg text-[10px] font-medium transition-all",
                  locked
                    ? "text-gray-300 cursor-not-allowed"
                    : isActive
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                ].join(" ")}
              >
                {labels[opt]}
                {locked && (
                  <span className="ml-0.5 opacity-60">🔒</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Aspect ratio ── */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider">
          Output Format
        </label>
        <div className="flex gap-2">
          {ASPECT_RATIO_OPTIONS.map((ar) => {
            const isActive = aspectRatio === ar.id;
            return (
              <button
                key={ar.id}
                type="button"
                disabled={disabled}
                onClick={() => onAspectRatioChange(ar.id)}
                className={[
                  "flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-purple-500/30",
                  disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                  isActive
                    ? "border-purple-500 bg-purple-50/60 shadow-sm"
                    : "border-gray-200/70 bg-white/60 hover:border-purple-300/60 hover:bg-white",
                ].join(" ")}
                aria-pressed={isActive}
              >
                <span className={isActive ? "text-purple-600" : "text-gray-400"}>{ar.icon}</span>
                <span className={`text-[10px] font-semibold ${isActive ? "text-purple-700" : "text-gray-500"}`}>
                  {ar.label}
                </span>
                <span className={`text-[9px] ${isActive ? "text-purple-400" : "text-gray-400"}`}>
                  {ar.sublabel}
                </span>
              </button>
            );
          })}
        </div>
        {/* Context hint */}
        <p className="text-[10px] text-gray-300 leading-relaxed">
          {aspectRatio === "16:9" && "Landscape — YouTube, web embeds, desktop."}
          {aspectRatio === "9:16" && "Portrait — TikTok, Instagram Reels, YouTube Shorts."}
          {aspectRatio === "1:1" && "Square — LinkedIn feed, Instagram posts."}
        </p>
      </div>
    </div>
  );
}
