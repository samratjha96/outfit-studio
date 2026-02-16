// Data types for clothing items (as returned from Convex queries)
export interface ClothingItem {
  _id: string;
  name: string;
  imageUrl: string | null;
  category: "tops" | "bottoms";
  storageId: string;
  userId: string;
  createdAt: number;
}

export interface ModelImage {
  _id: string;
  name: string;
  imageUrl: string | null;
  storageId: string;
  userId: string;
  createdAt: number;
}

// Carousel hook return type
export interface UseCarouselReturn {
  index: number;
  next: () => void;
  prev: () => void;
  setRandom: () => void;
  setIndex: (index: number) => void;
}
