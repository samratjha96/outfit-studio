import OpenAI from "openai";

export interface ReferenceImage {
  data: ArrayBuffer;
  mimeType: string;
}

export interface GenerationInput {
  prompt: string;
  referenceImages?: ReferenceImage[];
}

export type GenerationOutput =
  | {
      success: true;
      imageBlob: Blob;
      mimeType: string;
      model: string;
    }
  | {
      success: false;
      error: string;
    };

export interface ImageProvider {
  id: string;
  generate(input: GenerationInput): Promise<GenerationOutput>;
}

// Prompt builders for the three generation modes

export function buildOutfitCombinePrompt(): string {
  return "Create a new image by combining the elements from the provided images. Take the top clothing item from image 1 and the bottom clothing item from image 2, and place them naturally onto the body in image 3 so it looks like the person is wearing the selected outfit. Fit to body shape and pose, preserve garment proportions and textures, match lighting and shadows, handle occlusion by hair and arms. CRITICAL: The background must be completely white (#FFFFFF) - do not use black, transparent, or any other background color. Replace any existing background with solid white. Do not change the person identity or add accessories.";
}

export function buildNanoPrompt(occasion: string): string {
  return `Using the provided image of a model, please add an outfit to the model that would work in this occasion: ${occasion}. Ensure the outfit integrates naturally with the model's body shape, pose, and lighting. Keep the background plain white so the focus stays on the model and the outfit.`;
}

export function buildTransferPrompt(): string {
  return "Using the provided images, place the outfit from image 2 onto the person in image 1. Keep the face, body shape, and background of image 1 completely unchanged. Ensure the outfit integrates naturally with the model's body shape, pose, and lighting. CRITICAL: The background must be completely white (#FFFFFF) - do not use black, transparent, or any other background color. Do not change the person identity or add accessories.";
}

// Base64 utilities for Convex server-side (no btoa/atob available)

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const result: string[] = [];

  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;

    result.push(
      chars.charAt(a >> 2),
      chars.charAt(((a & 3) << 4) | (b >> 4)),
      i + 1 < bytes.length ? chars.charAt(((b & 15) << 2) | (c >> 6)) : "=",
      i + 2 < bytes.length ? chars.charAt(c & 63) : "=",
    );
  }

  return result.join("");
}

function arrayBufferToDataUri(buffer: ArrayBuffer, mimeType: string): string {
  const base64 = arrayBufferToBase64(buffer);
  return `data:${mimeType};base64,${base64}`;
}

function extractImageFromDataUri(dataUri: string): {
  data: ArrayBuffer;
  mimeType: string;
} | null {
  const match = dataUri.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match || !match[1] || !match[2]) return null;

  const format = match[1];
  const base64Data = match[2];
  const mimeType = format === "jpeg" ? "image/jpeg" : `image/${format}`;

  const binaryString = atob(base64Data);
  const buffer = new ArrayBuffer(binaryString.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binaryString.length; i++) {
    view[i] = binaryString.charCodeAt(i);
  }

  return { data: buffer, mimeType };
}

function parseImageResponse(response: OpenAI.ChatCompletion): {
  data: ArrayBuffer;
  mimeType: string;
} | null {
  const message = response.choices[0]?.message;
  if (!message) return null;

  // Check for images array (some models return this way)
  const images = (
    message as unknown as { images?: Array<{ image_url?: { url?: string } }> }
  ).images;
  if (images && images.length > 0) {
    const imageUrl = images[0]?.image_url?.url;
    if (imageUrl?.startsWith("data:image")) {
      return extractImageFromDataUri(imageUrl);
    }
  }

  // Check for data URI in content string
  const content = message.content;
  if (content) {
    const dataUriMatch = content.match(
      /data:image\/\w+;base64,[A-Za-z0-9+/=]+/,
    );
    if (dataUriMatch) {
      return extractImageFromDataUri(dataUriMatch[0]);
    }
  }

  return null;
}

const NVIDIA_MODEL = "gcp/google/gemini-3-pro-image-preview";
const NVIDIA_API_URL = "https://inference-api.nvidia.com";

const nvidiaProvider: ImageProvider = {
  id: "nvidia",
  async generate(input: GenerationInput): Promise<GenerationOutput> {
    const apiKey = process.env.NVIDIA_API_KEY || process.env.NVAPIKEY;
    if (!apiKey) {
      return {
        success: false,
        error:
          "NVIDIA_API_KEY environment variable not set. Get one from https://inference.nvidia.com/key-management",
      };
    }

    const client = new OpenAI({
      apiKey,
      baseURL: NVIDIA_API_URL,
    });

    const hasReferenceImages =
      input.referenceImages && input.referenceImages.length > 0;

    try {
      let response: OpenAI.ChatCompletion;

      if (hasReferenceImages && input.referenceImages) {
        const content: OpenAI.ChatCompletionContentPart[] = [];

        // Add all reference images first
        for (const img of input.referenceImages) {
          const dataUri = arrayBufferToDataUri(img.data, img.mimeType);
          content.push({ type: "image_url", image_url: { url: dataUri } });
        }

        // Add the text prompt
        content.push({ type: "text", text: input.prompt });

        response = await client.chat.completions.create({
          model: NVIDIA_MODEL,
          messages: [{ role: "user", content }],
          temperature: 0.7,
          max_tokens: 4096,
        });
      } else {
        response = await client.chat.completions.create({
          model: NVIDIA_MODEL,
          messages: [{ role: "user", content: input.prompt }],
          temperature: 0.7,
          max_tokens: 4096,
        });
      }

      const imageData = parseImageResponse(response);
      if (!imageData) {
        return {
          success: false,
          error: "No image data found in response from NVIDIA API",
        };
      }

      return {
        success: true,
        imageBlob: new Blob([imageData.data], { type: imageData.mimeType }),
        mimeType: imageData.mimeType,
        model: NVIDIA_MODEL,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: `NVIDIA API error: ${message}`,
      };
    }
  },
};

export function getProvider(): ImageProvider {
  return nvidiaProvider;
}
