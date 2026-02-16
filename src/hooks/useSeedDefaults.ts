import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const DEFAULT_TOPS = [
  "top1.png",
  "top2.png",
  "top3.png",
  "top4.png",
  "top5.png",
  "top6.png",
  "top7.png",
];

const DEFAULT_BOTTOMS = [
  "bottom1.png",
  "bottom2.png",
  "bottom3.png",
  "bottom4.png",
  "bottom5.png",
  "bottom6.webp",
];

export function useSeedDefaults() {
  const populatingDefaults = useRef(false);
  const seedingUser = useRef(false);

  const defaults = useQuery(api.seed.listDefaults);
  const userTops = useQuery(api.clothingItems.list, { category: "tops" });

  const generateUploadUrl = useMutation(api.seed.generateUploadUrl);
  const addDefault = useMutation(api.seed.addDefault);
  const seedUser = useMutation(api.seed.seedUser);

  // Phase 1: populate defaultClothing table (once ever, first authenticated load)
  useEffect(() => {
    if (populatingDefaults.current) return;
    if (defaults === undefined) return;
    if (defaults.length > 0) return;

    populatingDefaults.current = true;

    async function populateDefaults() {
      const items = [
        ...DEFAULT_TOPS.map((file, i) => ({
          path: `/assets/tops/${file}`,
          name: `Top ${i + 1}`,
          category: "tops" as const,
        })),
        ...DEFAULT_BOTTOMS.map((file, i) => ({
          path: `/assets/bottoms/${file}`,
          name: `Bottom ${i + 1}`,
          category: "bottoms" as const,
        })),
      ];

      try {
        await Promise.all(
          items.map(async ({ path, name, category }) => {
            const response = await fetch(path);
            const blob = await response.blob();

            const uploadUrl = await generateUploadUrl();
            const uploadResponse = await fetch(uploadUrl, {
              method: "POST",
              headers: { "Content-Type": blob.type },
              body: blob,
            });

            if (!uploadResponse.ok) {
              throw new Error(`Failed to upload ${name}`);
            }

            const { storageId } = await uploadResponse.json();
            await addDefault({ name, category, storageId });
          }),
        );
      } catch (error) {
        console.error("Failed to populate default clothing:", error);
        populatingDefaults.current = false;
      }
    }

    populateDefaults();
  }, [defaults, generateUploadUrl, addDefault]);

  // Phase 2: seed user's clothingItems from defaults (per-user, on first sign-in)
  useEffect(() => {
    if (seedingUser.current) return;
    if (defaults === undefined || userTops === undefined) return;
    if (defaults.length === 0) return;
    if (userTops.length > 0) return;

    seedingUser.current = true;

    seedUser()
      .catch((error) => {
        console.error("Failed to seed user clothing:", error);
        seedingUser.current = false;
      });
  }, [defaults, userTops, seedUser]);
}
