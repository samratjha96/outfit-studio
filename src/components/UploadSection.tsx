interface UploadSectionProps {
  isUploading: boolean;
  showUploadMenu: boolean;
  onToggleUploadMenu: () => void;
  onUploadTops: () => void;
  onUploadBottoms: () => void;
  onUploadModels: () => void;
}

export function UploadSection({
  isUploading,
  showUploadMenu,
  onToggleUploadMenu,
  onUploadTops,
  onUploadBottoms,
  onUploadModels,
}: UploadSectionProps) {
  return (
    <div className="upload-trigger">
      <button
        className="upload-btn"
        onClick={onToggleUploadMenu}
        disabled={isUploading}
        title="Upload new clothing item"
      >
        {isUploading ? "..." : "+"}
      </button>

      {showUploadMenu && !isUploading && (
        <>
          <div className="upload-backdrop" onClick={onToggleUploadMenu} />
          <div className="upload-menu">
            <button className="upload-menu-item" onClick={onUploadTops}>
              Upload Tops
            </button>
            <button className="upload-menu-item" onClick={onUploadBottoms}>
              Upload Bottoms
            </button>
            <button className="upload-menu-item" onClick={onUploadModels}>
              Upload Models
            </button>
          </div>
        </>
      )}
    </div>
  );
}
