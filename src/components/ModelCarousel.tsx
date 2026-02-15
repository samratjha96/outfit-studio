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
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 8px",
        background: "#c0c0c0",
        border: "2px inset #c0c0c0",
        marginBottom: "2px",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          fontWeight: "bold",
          whiteSpace: "nowrap",
        }}
      >
        Model:
      </span>

      <button
        className="nav-button"
        onClick={carousel.prev}
        disabled={items.length === 0}
        style={{ width: "24px", height: "24px", minWidth: "24px", minHeight: "24px", fontSize: "10px" }}
        aria-label="Previous model"
      >
        ◀
      </button>

      <div
        className="field-border"
        style={{
          width: "64px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          padding: "2px",
        }}
      >
        {items.length > 0 && items[carousel.index] ? (
          <img
            src={items[carousel.index].imageUrl ?? undefined}
            alt={items[carousel.index].name}
            style={{
              maxWidth: "58px",
              maxHeight: "58px",
              objectFit: "contain",
            }}
            onError={() => {
              const url = items[carousel.index].imageUrl;
              if (url) onImageError(url);
            }}
          />
        ) : (
          <span style={{ fontSize: "10px", color: "#666", textAlign: "center" }}>
            No models
          </span>
        )}
      </div>

      <button
        className="nav-button"
        onClick={carousel.next}
        disabled={items.length === 0}
        style={{ width: "24px", height: "24px", minWidth: "24px", minHeight: "24px", fontSize: "10px" }}
        aria-label="Next model"
      >
        ▶
      </button>

      <span style={{ fontSize: "10px", color: "#444", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {items.length > 0 && items[carousel.index]
          ? items[carousel.index].name
          : "Default"}
      </span>

      <button
        onClick={onUpload}
        style={{
          padding: "2px 6px",
          fontSize: "10px",
          background: "#c0c0c0",
          border: "2px outset #c0c0c0",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
        title="Upload model image"
      >
        + Model
      </button>
    </div>
  );
}
