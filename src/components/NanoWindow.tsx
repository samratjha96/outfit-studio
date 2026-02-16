interface NanoWindowProps {
  show: boolean;
  nanoText: string;
  onClose: () => void;
  onTextChange: (text: string) => void;
  onStyle: () => void;
}

export function NanoWindow({
  show,
  nanoText,
  onClose,
  onTextChange,
  onStyle,
}: NanoWindowProps) {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        <h2 className="modal-title">Ideate with AI</h2>
        <p className="modal-body">What should I wear to...</p>
        <textarea
          className="modal-input"
          rows={4}
          value={nanoText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="a rooftop dinner party..."
        />
        <div className="modal-actions">
          <button className="btn-primary" onClick={onStyle}>
            Style me
          </button>
        </div>
      </div>
    </div>
  );
}
