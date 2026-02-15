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
      <div>
        {/* Show progress indicator when generating */}
        {isGenerating && (
          <div
            className="progress-indicator segmented"
            style={{
              position: "absolute",
              top: "45%",
              left: "70%",
              transform: "translate(-50%, -50%)",
              width: "240px",
              height: "20px",
              zIndex: 10,
            }}
          >
            <span
              className="progress-indicator-bar"
              style={{ width: `${generationProgress}%` }}
            />
          </div>
        )}

        {/* Show model image when not generating */}
        {!isGenerating && (
          <div
            className="field-border"
            style={{
              position: "absolute",
              top: "45%",
              left: "70%",
              transform: "translate(-50%, -50%)",
              padding: "8px",
              width: "240px",
              height: "480px",
              zIndex: 5,
            }}
          >
            <img
              src={displayModelImage}
              alt="Model"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                imageRendering: "auto",
                display: "block",
              }}
            />
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
            <button onClick={onClearGeneratedImage}>Clear</button>
          </div>
        )}

        {generatedImage && !isGenerating && (
          <div
            className="field-border"
            style={{
              position: "absolute",
              top: "45%",
              left: "70%",
              transform: "translate(-50%, -50%)",
              padding: "8px",
              width: "240px",
              height: "480px",
              zIndex: 10,
            }}
          >
            <Zoom>
              <img
                src={generatedImage}
                alt="Generated Outfit"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  imageRendering: "auto",
                  backgroundColor: "white",
                  mixBlendMode: "normal",
                  display: "block",
                }}
              />
            </Zoom>
          </div>
        )}
      </div>
    </div>
  );
}
