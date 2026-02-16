import { ClothingItem } from "../types";

interface CarouselControls {
  index: number;
  prev: () => void;
  next: () => void;
}

interface ClothingCarouselProps {
  items: ClothingItem[];
  carousel: CarouselControls;
  category: "tops" | "bottoms";
  onImageError: (imageUrl: string) => void;
  onUpload: () => void;
}

export function ClothingCarousel({
  items,
  carousel,
  category,
  onImageError,
  onUpload,
}: ClothingCarouselProps) {
  const label = category === "tops" ? "TOPS" : "BOTTOMS";

  return (
    <div className="clothing-card">
      <div className="clothing-header">
        <span className="caption">{label}</span>
        <button className="clothing-add-link" onClick={onUpload}>
          + Add
        </button>
      </div>
      <div className="clothing-viewport">
        {items.length > 0 && items[carousel.index] ? (
          <img
            src={items[carousel.index].imageUrl ?? undefined}
            alt={items[carousel.index].name}
            onError={() => {
              const url = items[carousel.index].imageUrl;
              if (url) onImageError(url);
            }}
          />
        ) : (
          <span className="clothing-empty">
            No {category} yet
          </span>
        )}
      </div>
      <div className="clothing-nav">
        <button
          className="arrow-btn"
          onClick={carousel.prev}
          disabled={items.length === 0}
          aria-label={`Previous ${category.slice(0, -1)}`}
        >
          &#8249;
        </button>
        {items.length > 0 && (
          <span className="carousel-count">
            {carousel.index + 1} / {items.length}
          </span>
        )}
        <button
          className="arrow-btn"
          onClick={carousel.next}
          disabled={items.length === 0}
          aria-label={`Next ${category.slice(0, -1)}`}
        >
          &#8250;
        </button>
      </div>
    </div>
  );
}
