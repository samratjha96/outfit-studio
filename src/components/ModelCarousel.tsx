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
    <div>
      <span className="caption">MODEL</span>
      <div className="model-carousel">
        <button
          className="arrow-btn"
          onClick={carousel.prev}
          disabled={items.length <= 1}
          aria-label="Previous model"
        >
          &#8249;
        </button>

        <div className="model-thumb">
          {currentItem ? (
            <img
              src={currentItem.imageUrl ?? undefined}
              alt={currentItem.name}
              onError={() => {
                const url = currentItem.imageUrl;
                if (url) onImageError(url);
              }}
            />
          ) : (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              None
            </span>
          )}
        </div>

        <button
          className="arrow-btn"
          onClick={carousel.next}
          disabled={items.length <= 1}
          aria-label="Next model"
        >
          &#8250;
        </button>

        <span className="model-name">
          {currentItem ? currentItem.name : "No model"}
        </span>

        <button
          className="model-upload-link"
          onClick={onUpload}
          title="Upload model image"
        >
          Upload
        </button>
      </div>
    </div>
  );
}
