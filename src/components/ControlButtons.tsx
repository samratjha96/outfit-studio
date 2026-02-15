interface ControlButtonsProps {
  isGenerating: boolean;
  onRandom: () => void;
  onSelect: () => void;
  onNanoBananify: () => void;
  onOutfitTransfer: () => void;
}

export function ControlButtons({
  isGenerating,
  onRandom,
  onSelect,
  onNanoBananify,
  onOutfitTransfer,
}: ControlButtonsProps) {
  return (
    <div
      className="bottom-buttons"
      style={{ display: "flex", flexDirection: "column", gap: "8px" }}
    >
      {/* First Row */}
      <div
        style={{
          display: "flex",
          gap: "40px",
          justifyContent: "center",
        }}
      >
        <button
          className="default"
          onClick={onRandom}
          title="Random outfit"
          aria-label="Random outfit"
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            width: "120px",
          }}
        >
          Random
        </button>
        <button
          className={`default ${isGenerating ? "disabled" : ""}`}
          onClick={onSelect}
          title={
            isGenerating
              ? "Generation in progress..."
              : "Generate outfit preview"
          }
          disabled={isGenerating}
          aria-label="Generate outfit preview"
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            width: "120px",
          }}
        >
          Select
        </button>
      </div>

      {/* Second Row */}
      <div
        style={{
          display: "flex",
          gap: "40px",
          justifyContent: "center",
        }}
      >
        <button
          className="default"
          onClick={onNanoBananify}
          title="Nano Bananify"
          aria-label="Nano Bananify"
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            width: "120px",
          }}
        >
          Nano Bananify
        </button>
        <button
          className="default"
          onClick={onOutfitTransfer}
          title="Outfit Transfer"
          aria-label="Outfit Transfer"
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            width: "120px",
          }}
        >
          Outfit Transfer
        </button>
      </div>
    </div>
  );
}
