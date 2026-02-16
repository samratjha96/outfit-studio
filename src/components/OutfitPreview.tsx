import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

interface HistoryItem {
  _id: string;
  type: "outfit" | "nano" | "transfer";
  imageUrl: string | null;
  createdAt: number;
}

interface OutfitPreviewProps {
  isGenerating: boolean;
  generationProgress: number;
  error: string | null;
  generatedImage: string | null;
  modelImageUrl?: string | null;
  onClearGeneratedImage: () => void;
  history: HistoryItem[];
  onDeleteGeneration: (id: string) => void;
}

function friendlyError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("no image data")) return "Generation didn't produce an image — try again?";
  if (lower.includes("rate limit") || lower.includes("429")) return "Too many requests — wait a moment and retry.";
  if (lower.includes("timeout") || lower.includes("timed out")) return "Generation timed out — try again.";
  if (lower.includes("not authenticated")) return "Session expired — please sign in again.";
  if (lower.includes("failed to upload")) return "Upload failed — check your file and try again.";
  if (lower.includes("failed to start")) return "Couldn't start generation — try again.";
  return "Something went wrong — try again.";
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function OutfitPreview({
  isGenerating,
  generationProgress,
  error,
  generatedImage,
  modelImageUrl,
  onClearGeneratedImage,
  history,
  onDeleteGeneration,
}: OutfitPreviewProps) {
  const displayModelImage = modelImageUrl || "/assets/model.png";
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const prevGeneratedRef = useRef<string | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const visibleHistory = useMemo(
    () => history.filter((h) => h.imageUrl),
    [history],
  );

  // When generating, clear history selection so shimmer shows
  useEffect(() => {
    if (isGenerating) {
      setSelectedHistoryId(null);
    }
  }, [isGenerating]);

  // When a new generation completes, reset to live view
  useEffect(() => {
    if (generatedImage && generatedImage !== prevGeneratedRef.current && !isGenerating) {
      prevGeneratedRef.current = generatedImage;
      setSelectedHistoryId(null);
      setIsRevealed(true);
      const timer = setTimeout(() => setIsRevealed(false), 1500);
      return () => clearTimeout(timer);
    }
    prevGeneratedRef.current = generatedImage;
  }, [generatedImage, isGenerating]);

  // Auto-scroll selected thumb into view
  useEffect(() => {
    if (!selectedHistoryId) return;
    const el = thumbRefs.current.get(selectedHistoryId);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [selectedHistoryId]);

  const selectByOffset = useCallback(
    (offset: number) => {
      if (isGenerating || visibleHistory.length === 0) return;

      const currentIndex = selectedHistoryId
        ? visibleHistory.findIndex((h) => h._id === selectedHistoryId)
        : -1;

      let nextIndex: number;
      if (currentIndex === -1) {
        // Nothing selected — start from first (offset > 0) or last (offset < 0)
        nextIndex = offset > 0 ? 0 : visibleHistory.length - 1;
      } else {
        nextIndex = currentIndex + offset;
      }

      // Clamp
      nextIndex = Math.max(0, Math.min(nextIndex, visibleHistory.length - 1));
      setSelectedHistoryId(visibleHistory[nextIndex]._id);
    },
    [isGenerating, visibleHistory, selectedHistoryId],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          selectByOffset(1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          selectByOffset(-1);
          break;
        case "Home":
          e.preventDefault();
          if (visibleHistory.length > 0) {
            setSelectedHistoryId(visibleHistory[0]._id);
          }
          break;
        case "End":
          e.preventDefault();
          if (visibleHistory.length > 0) {
            setSelectedHistoryId(visibleHistory[visibleHistory.length - 1]._id);
          }
          break;
        case "Delete":
        case "Backspace":
          e.preventDefault();
          if (selectedHistoryId) {
            const idx = visibleHistory.findIndex((h) => h._id === selectedHistoryId);
            onDeleteGeneration(selectedHistoryId);
            // Move selection to next item, or previous, or clear
            const next = visibleHistory[idx + 1] ?? visibleHistory[idx - 1];
            setSelectedHistoryId(next?._id ?? null);
          }
          break;
        case "Escape":
          e.preventDefault();
          setSelectedHistoryId(null);
          break;
      }
    },
    [selectByOffset, visibleHistory, selectedHistoryId, onDeleteGeneration],
  );

  const selectedHistoryItem = selectedHistoryId
    ? visibleHistory.find((h) => h._id === selectedHistoryId)
    : null;

  const displayImage = selectedHistoryItem?.imageUrl ?? generatedImage;
  const showGenerated = displayImage && !isGenerating;

  const cardClassName = [
    "preview-card",
    isGenerating && "is-generating",
    isRevealed && "is-revealed",
  ].filter(Boolean).join(" ");

  const selectedIndex = selectedHistoryId
    ? visibleHistory.findIndex((h) => h._id === selectedHistoryId)
    : -1;

  return (
    <div className="right-column">
      <div className={cardClassName}>
        <div className="preview-image-container">
          {showGenerated ? (
            <Zoom>
              <img
                src={displayImage}
                alt={selectedHistoryItem ? `Past ${selectedHistoryItem.type}` : "Generated Outfit"}
              />
            </Zoom>
          ) : (
            <img
              src={displayModelImage}
              alt="Model"
            />
          )}
        </div>

        {showGenerated && (
          <div className="preview-actions">
            <a
              className="preview-download-btn"
              href={displayImage!}
              download={`outfit-${Date.now()}.png`}
              title="Download image"
            >
              ↓
            </a>
          </div>
        )}

        {isGenerating && (
          <div className="preview-status-text">Creating your look...</div>
        )}

        {error && (
          <div className="error-message">
            <p>{friendlyError(error)}</p>
            <button className="btn-secondary" onClick={onClearGeneratedImage}>
              Clear
            </button>
          </div>
        )}

        {isGenerating && (
          <div className="preview-progress">
            <div
              className="preview-progress-bar"
              style={{ width: `${generationProgress}%` }}
            />
          </div>
        )}
      </div>

      {visibleHistory.length === 0 ? (
        <div className="history-strip">
          <div className="history-empty">No generations yet</div>
        </div>
      ) : (
        <div className="history-strip-wrapper">
          {selectedIndex >= 0 && (
            <div className="history-position">
              {selectedIndex + 1} / {visibleHistory.length}
            </div>
          )}
          <div
            ref={stripRef}
            className="history-strip has-items"
            tabIndex={0}
            role="listbox"
            aria-label="Generation history"
            onKeyDown={handleKeyDown}
          >
            {visibleHistory.map((item) => {
              const isActive =
                selectedHistoryId === item._id ||
                (!selectedHistoryId && !isGenerating && generatedImage === item.imageUrl);
              return (
                <button
                  key={item._id}
                  ref={(el) => {
                    if (el) thumbRefs.current.set(item._id, el);
                    else thumbRefs.current.delete(item._id);
                  }}
                  role="option"
                  aria-selected={isActive}
                  className={`history-thumb${isActive ? " active" : ""}`}
                  title={`${item.type} — ${formatRelativeTime(item.createdAt)}`}
                  tabIndex={-1}
                  onClick={() => {
                    if (isGenerating) return;
                    setSelectedHistoryId(
                      selectedHistoryId === item._id ? null : item._id,
                    );
                  }}
                >
                  <img src={item.imageUrl!} alt={item.type} />
                  <span className="history-type-badge">{item.type}</span>
                  <span
                    className="history-delete-btn"
                    role="button"
                    aria-label="Delete generation"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedHistoryId === item._id) {
                        setSelectedHistoryId(null);
                      }
                      onDeleteGeneration(item._id);
                    }}
                  >
                    ×
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
