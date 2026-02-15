import type { ModelImage } from "../types";

interface CarouselControls {
  index: number;
  prev: () => void;
  next: () => void;
}

interface ModelCarouselProps {
  items: ModelImage[];
  carousel: CarouselControls;
  onUpload: () => void;
  onImageError: (imageUrl: string) => void;
}

export function ModelCarousel({
  items,
  carousel,
  onUpload,
  onImageError,
}: ModelCarouselProps) {
  const currentItem = items[carousel.index];

  return (
    <fieldset style={{ padding: "2px 8px 4px", margin: 0 }}>
      <legend>Model</legend>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <button
          className="nav-button"
          onClick={carousel.prev}
          disabled={items.length <= 1}
          style={{ width: "24px", height: "24px", minWidth: "24px", minHeight: "24px" }}
          aria-label="Previous model"
        >
          ◀
        </button>

        <div
          className="field-border"
          style={{
            width: "48px",
            height: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            padding: "1px",
          }}
        >
          {currentItem ? (
            <img
              src={currentItem.imageUrl ?? undefined}
              alt={currentItem.name}
              style={{
                maxWidth: "44px",
                maxHeight: "44px",
                objectFit: "contain",
              }}
              onError={() => {
                const url = currentItem.imageUrl;
                if (url) onImageError(url);
              }}
            />
          ) : (
            <span style={{ fontSize: "9px", color: "#666", textAlign: "center" }}>
              None
            </span>
          )}
        </div>

        <button
          className="nav-button"
          onClick={carousel.next}
          disabled={items.length <= 1}
          style={{ width: "24px", height: "24px", minWidth: "24px", minHeight: "24px" }}
          aria-label="Next model"
        >
          ▶
        </button>

        <span style={{
          fontSize: "11px",
          fontWeight: "bold",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {currentItem ? currentItem.name : "None"}
        </span>

        <button
          onClick={onUpload}
          style={{
            padding: "2px 6px",
            fontSize: "11px",
            background: "#c0c0c0",
            border: "2px outset #c0c0c0",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
          title="Upload model image"
        >
          Upload...
        </button>
      </div>
    </fieldset>
  );
}
