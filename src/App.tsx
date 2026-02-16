import { useState, useEffect, useCallback } from "react";
import { Authenticated, Unauthenticated, AuthLoading, useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { useCarousel } from "./hooks/useCarousel";
import { useOutfitGeneration } from "./hooks/useOutfitGeneration";
import { useSeedDefaults } from "./hooks/useSeedDefaults";
import type { ClothingItem, ModelImage } from "./types";
import type { Id } from "../convex/_generated/dataModel";

// Import components
import { MenuBar } from "./components/MenuBar";

import { ClothingCarousel } from "./components/ClothingCarousel";
import { ModelCarousel } from "./components/ModelCarousel";
import { ControlButtons } from "./components/ControlButtons";
import { OutfitPreview } from "./components/OutfitPreview";
import { NanoWindow } from "./components/NanoWindow";
import { OutfitTransferWindow } from "./components/OutfitTransferWindow";
import { InspoBoard } from "./components/InspoBoard";

function SignIn() {
  const { signIn } = useAuthActions();
  return (
    <div className="sign-in-container">
      <div className="sign-in-window">
        <div className="sign-in-title-bar">
          <span>Welcome to Outfit Studio</span>
        </div>
        <div className="sign-in-body">
          <p>Sign in to get started</p>
          <button className="sign-in-btn" onClick={() => signIn("google")}>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const { signOut } = useAuthActions();
  const [previewTop, setPreviewTop] = useState<number>(0);
  const [previewBottom, setPreviewBottom] = useState<number>(0);
  const [, setIsUploading] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [showNanoWindow, setShowNanoWindow] = useState<boolean>(false);
  const [nanoText, setNanoText] = useState<string>("");
  const [showOutfitTransferWindow, setShowOutfitTransferWindow] =
    useState<boolean>(false);

  // Convex queries — real-time, auto-updating
  const topsQuery = useQuery(api.clothingItems.list, { category: "tops" });
  const bottomsQuery = useQuery(api.clothingItems.list, {
    category: "bottoms",
  });
  const modelImagesQuery = useQuery(api.modelImages.list);
  const inspoImagesQuery = useQuery(api.inspoImages.list);
  const completedGenerations = useQuery(api.generations.listCompleted);
  const usage = useQuery(api.usage.getRemaining);

  // Seed default clothing items on first sign-in if DB is empty
  useSeedDefaults();

  const topsList: ClothingItem[] = (topsQuery ?? []) as ClothingItem[];
  const bottomsList: ClothingItem[] = (bottomsQuery ?? []) as ClothingItem[];
  const modelImagesList: ModelImage[] = (modelImagesQuery ?? []) as ModelImage[];

  // Convex mutations for upload flow
  const generateUploadUrl = useMutation(api.clothingItems.generateUploadUrl);
  const addClothingItem = useMutation(api.clothingItems.add);
  const generateModelUploadUrl = useMutation(api.modelImages.generateUploadUrl);
  const deleteGeneration = useMutation(api.generations.remove);
  const addModelImage = useMutation(api.modelImages.add);

  const topsCarousel = useCarousel(topsList.length, "tops");
  const bottomsCarousel = useCarousel(bottomsList.length, "bottoms");
  const modelsCarousel = useCarousel(modelImagesList.length, "models");
  const {
    generatedImage,
    isGenerating,
    error,
    generateOutfit,
    generateNanoOutfit,
    generateOutfitTransfer,
    transferFromStorageId,
    clearGeneratedImage,
  } = useOutfitGeneration();

  // Handle file upload via Convex storage
  const handleFileUpload = useCallback(
    async (category: "tops" | "bottoms") => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = true;

      input.onchange = async (event) => {
        const files = (event.target as HTMLInputElement).files;

        if (files && files.length > 0) {
          setIsUploading(true);

          try {
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              const nextNumber =
                (category === "tops"
                  ? topsList.length
                  : bottomsList.length) +
                i +
                1;
              const name = `${
                category === "tops" ? "Top" : "Bottom"
              } ${nextNumber}`;

              // Get presigned upload URL from Convex
              const uploadUrl = await generateUploadUrl();

              // Upload the file directly to Convex storage
              const uploadResponse = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
              });

              if (!uploadResponse.ok) {
                throw new Error(`Failed to upload ${name}`);
              }

              const { storageId } = await uploadResponse.json();

              // Create the clothing item record
              await addClothingItem({
                name,
                category,
                storageId,
              });
            }
          } catch (error) {
            console.error(`Error uploading ${category}:`, error);
            alert(`Failed to upload some ${category}. Please try again.`);
          } finally {
            setIsUploading(false);
          }
        }
      };

      input.click();
    },
    [topsList.length, bottomsList.length, generateUploadUrl, addClothingItem],
  );

  // Handle model image upload via Convex storage
  const handleModelUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;

    input.onchange = async (event) => {
      const files = (event.target as HTMLInputElement).files;

      if (files && files.length > 0) {
        setIsUploading(true);

        try {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const name = `Model ${modelImagesList.length + i + 1}`;

            const uploadUrl = await generateModelUploadUrl();
            const uploadResponse = await fetch(uploadUrl, {
              method: "POST",
              headers: { "Content-Type": file.type },
              body: file,
            });

            if (!uploadResponse.ok) {
              throw new Error(`Failed to upload ${name}`);
            }

            const { storageId } = await uploadResponse.json();
            await addModelImage({ name, storageId });
          }
        } catch (error) {
          console.error("Error uploading model images:", error);
          alert("Failed to upload some model images. Please try again.");
        } finally {
          setIsUploading(false);
        }
      }
    };

    input.click();
  }, [modelImagesList.length, generateModelUploadUrl, addModelImage]);

  // Handle random selection
  const handleRandom = useCallback(() => {
    if (topsList.length === 0 || bottomsList.length === 0) return;

    const randomTop = Math.floor(Math.random() * topsList.length);
    const randomBottom = Math.floor(Math.random() * bottomsList.length);

    topsCarousel.setIndex(randomTop);
    bottomsCarousel.setIndex(randomBottom);
  }, [topsList, bottomsList, topsCarousel, bottomsCarousel]);

  // Get the selected model image's storage ID (undefined if none selected)
  const selectedModelStorageId =
    modelImagesList.length > 0 && modelImagesList[modelsCarousel.index]
      ? (modelImagesList[modelsCarousel.index].storageId as any)
      : undefined;

  // Handle select button — generate outfit via Convex action
  const handleSelect = useCallback(async () => {
    const topItem = topsList[previewTop];
    const bottomItem = bottomsList[previewBottom];

    if (topItem && bottomItem) {
      setGenerationProgress(0);
      await generateOutfit(topItem._id as any, bottomItem._id as any, selectedModelStorageId);
    }
  }, [generateOutfit, previewTop, previewBottom, topsList, bottomsList, selectedModelStorageId]);

  // Progress animation effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isGenerating) {
      setGenerationProgress(0);

      interval = setInterval(() => {
        setGenerationProgress((prev) => {
          const increment = Math.max(1, Math.floor((100 - prev) * 0.1));
          const newProgress = Math.min(prev + increment, 95);
          return newProgress;
        });
      }, 200);
    } else {
      setGenerationProgress(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isGenerating]);

  // Update preview when carousel changes
  useEffect(() => {
    setPreviewTop(topsCarousel.index);
  }, [topsCarousel.index]);

  useEffect(() => {
    setPreviewBottom(bottomsCarousel.index);
  }, [bottomsCarousel.index]);

  // Helper function to handle image load errors
  const handleImageError = useCallback((imageUrl: string) => {
    console.error("Failed to load image:", imageUrl);
  }, []);

  // Handle nano banana styling
  const handleNanoStyle = useCallback(async () => {
    if (!nanoText.trim()) {
      alert("Please enter what you want to wear to!");
      return;
    }

    setShowNanoWindow(false);
    const occasionText = nanoText;
    setNanoText("");

    try {
      await generateNanoOutfit(occasionText, selectedModelStorageId);
    } catch (error: any) {
      console.error("Error in nano styling:", error);
    }
  }, [nanoText, generateNanoOutfit, selectedModelStorageId]);

  // Handle outfit transfer
  const handleOutfitTransfer = useCallback(
    async (file: File) => {
      try {
        await generateOutfitTransfer(file, selectedModelStorageId);
      } catch (error: any) {
        console.error("Error in outfit transfer:", error);
      }
    },
    [generateOutfitTransfer, selectedModelStorageId],
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <MenuBar />
        <div className="header-actions">
          {usage && (
            <span
              className={`usage-indicator${usage.limit - usage.used <= 3 ? " usage-low" : ""}`}
              title={`${usage.used} of ${usage.limit} daily generations used`}
            >
              {usage.used}/{usage.limit}
            </span>
          )}
          <button className="sign-out-btn" onClick={() => signOut()}>
            Sign Out
          </button>
        </div>
      </header>

      <div className="main-container">
        <div className="left-column">
          <ModelCarousel
            items={modelImagesList}
            carousel={modelsCarousel}
            onUpload={handleModelUpload}
            onImageError={handleImageError}
          />

          <ClothingCarousel
            items={topsList}
            carousel={topsCarousel}
            category="tops"
            onImageError={handleImageError}
            onUpload={() => handleFileUpload("tops")}
          />

          <ClothingCarousel
            items={bottomsList}
            carousel={bottomsCarousel}
            category="bottoms"
            onImageError={handleImageError}
            onUpload={() => handleFileUpload("bottoms")}
          />

          <ControlButtons
            isGenerating={isGenerating}
            onRandom={handleRandom}
            onSelect={handleSelect}
            onNanoBananify={() => setShowNanoWindow(true)}
            onOutfitTransfer={() => setShowOutfitTransferWindow(true)}
          />

          <InspoBoard
            items={inspoImagesQuery ?? []}
            onTransfer={(storageId) =>
              transferFromStorageId(storageId, selectedModelStorageId)
            }
            isGenerating={isGenerating}
          />
        </div>

        <OutfitPreview
          isGenerating={isGenerating}
          generationProgress={generationProgress}
          error={error}
          generatedImage={generatedImage}
          modelImageUrl={
            modelImagesList.length > 0 && modelImagesList[modelsCarousel.index]
              ? modelImagesList[modelsCarousel.index].imageUrl
              : null
          }
          onClearGeneratedImage={clearGeneratedImage}
          history={completedGenerations ?? []}
          onDeleteGeneration={(id) => deleteGeneration({ id: id as Id<"generations"> })}
        />
      </div>

      <NanoWindow
        show={showNanoWindow}
        nanoText={nanoText}
        onClose={() => setShowNanoWindow(false)}
        onTextChange={setNanoText}
        onStyle={handleNanoStyle}
      />

      <OutfitTransferWindow
        show={showOutfitTransferWindow}
        onClose={() => setShowOutfitTransferWindow(false)}
        onUploadImage={handleOutfitTransfer}
      />
    </div>
  );
}

function App() {
  return (
    <>
      <AuthLoading>
        <div className="sign-in-container">
          <p>Loading...</p>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <SignIn />
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedApp />
      </Authenticated>
    </>
  );
}

export default App;
