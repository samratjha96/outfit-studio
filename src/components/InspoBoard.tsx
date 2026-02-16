import { useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface InspoImage {
  _id: Id<"inspoImages">;
  name: string;
  imageUrl: string | null;
  storageId: Id<"_storage">;
}

interface InspoBoardProps {
  items: InspoImage[];
  onTransfer: (storageId: Id<"_storage">) => void;
  isGenerating: boolean;
}

export function InspoBoard({ items, onTransfer, isGenerating }: InspoBoardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.inspoImages.generateUploadUrl);
  const addInspoImage = useMutation(api.inspoImages.add);
  const removeInspoImage = useMutation(api.inspoImages.remove);

  const handleUpload = useCallback(async () => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const uploadUrl = await generateUploadUrl();
          const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload image");
          }

          const { storageId } = await uploadResponse.json();
          const name = file.name.replace(/\.[^.]+$/, "") || `Inspo ${items.length + i + 1}`;
          await addInspoImage({ name, storageId });
        }
      } catch (error) {
        console.error("Error uploading inspo image:", error);
        alert("Failed to upload some images. Please try again.");
      }

      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [generateUploadUrl, addInspoImage, items.length],
  );

  const handleDelete = useCallback(
    async (id: Id<"inspoImages">) => {
      try {
        await removeInspoImage({ id });
      } catch (error) {
        console.error("Error deleting inspo image:", error);
      }
    },
    [removeInspoImage],
  );

  return (
    <div className="inspo-board">
      <div className="clothing-header">
        <span className="caption">INSPO BOARD</span>
        <button className="clothing-add-link" onClick={handleUpload}>
          + Add
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div className="inspo-grid">
        {items.length === 0 ? (
          <span className="inspo-empty">
            Save inspiration outfits here.
            <br />
            Click + Add to get started.
          </span>
        ) : (
          items.map((item) => (
            <div key={item._id} className="inspo-thumb">
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.name} />
              )}
              <div className="inspo-thumb-actions">
                <button
                  className="inspo-thumb-btn"
                  title="Transfer this outfit"
                  disabled={isGenerating}
                  onClick={() => onTransfer(item.storageId)}
                >
                  &#x21c4;
                </button>
                <button
                  className="inspo-thumb-btn delete"
                  title="Delete"
                  onClick={() => handleDelete(item._id)}
                >
                  &#x2715;
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
