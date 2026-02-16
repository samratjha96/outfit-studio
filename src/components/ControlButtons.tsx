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
    <div className="control-buttons">
      <button
        className="btn-primary"
        onClick={onSelect}
        disabled={isGenerating}
        title={isGenerating ? "Generation in progress..." : "Generate outfit preview"}
        aria-label="Generate outfit preview"
      >
        Generate
      </button>
      <button
        className="btn-secondary"
        onClick={onRandom}
        title="Random outfit"
        aria-label="Random outfit"
      >
        Random
      </button>
      <button
        className="btn-secondary"
        onClick={onNanoBananify}
        title="Ideate with AI"
        aria-label="Ideate with AI"
      >
        Ideate with AI
      </button>
      <button
        className="btn-secondary"
        onClick={onOutfitTransfer}
        title="Outfit Transfer"
        aria-label="Outfit Transfer"
      >
        Outfit Transfer
      </button>
    </div>
  );
}
