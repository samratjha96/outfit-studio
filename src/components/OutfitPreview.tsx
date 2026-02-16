import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

interface OutfitPreviewProps {
  isGenerating: boolean;
  generationProgress: number;
  error: string | null;
  generatedImage: string | null;
  modelImageUrl?: string | null;
  onClearGeneratedImage: () => void;
}

export function OutfitPreview({
  isGenerating,
  generationProgress,
  error,
  generatedImage,
  modelImageUrl,
  onClearGeneratedImage,
}: OutfitPreviewProps) {
  const displayModelImage = modelImageUrl || "/assets/model.png";

  return (
    <div className="right-column">
      <div className="preview-card">
        <div className="preview-image-container">
          {generatedImage && !isGenerating ? (
            <Zoom>
              <img
                src={generatedImage}
                alt="Generated Outfit"
              />
            </Zoom>
          ) : (
            <img
              src={displayModelImage}
              alt="Model"
            />
          )}
        </div>

        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
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
    </div>
  );
}
