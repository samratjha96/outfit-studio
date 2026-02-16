import { useState, useRef } from "react";

interface OutfitTransferWindowProps {
  show: boolean;
  onClose: () => void;
  onUploadImage: (file: File) => void;
}

export function OutfitTransferWindow({
  show,
  onClose,
  onUploadImage,
}: OutfitTransferWindowProps) {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!show) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleTransferClick = () => {
    if (uploadedImage) {
      onUploadImage(uploadedImage);
      onClose();
    }
  };

  const handleClose = () => {
    setUploadedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>
          &times;
        </button>
        <h2 className="modal-title">Outfit Transfer</h2>
        <p className="modal-body">
          Upload an inspiration image to transfer its outfit onto the model
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        {!uploadedImage ? (
          <div className="modal-actions">
            <button className="btn-secondary" onClick={handleUploadClick}>
              Select Image
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            {previewUrl && (
              <div style={{ marginBottom: 16 }}>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="modal-preview-img"
                />
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                  {uploadedImage.name}
                </p>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={handleUploadClick}>
                Change
              </button>
              <button className="btn-primary" onClick={handleTransferClick}>
                Transfer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
