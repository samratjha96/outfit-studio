import OpenAI from "openai";

export interface ReferenceImage {
  data: ArrayBuffer;
  mimeType: string;
}

export interface LabeledImage {
  label: string;
  image: ReferenceImage;
}

export interface GenerationInput {
  prompt: string;
  labeledImages?: LabeledImage[];
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
  return "Dress the person in the labeled top and bottom clothing items shown above. Use EXACTLY those garments — same color, pattern, fabric, and style. Fit them to the person's body shape and pose. Preserve garment proportions and textures, match lighting and shadows, handle occlusion by hair and arms. CRITICAL: The background must be completely white (#FFFFFF). Do not change the person's identity or add accessories.";
}

export function buildNanoPrompt(occasion: string): string {
  return `Using the person shown above, dress them in an outfit appropriate for: ${occasion}. Ensure the outfit integrates naturally with their body shape, pose, and lighting. Keep the background plain white.`;
}

export function buildTransferPrompt(): string {
  return "Dress the person in the exact outfit shown in the inspiration image above. Recreate the outfit faithfully — same garments, colors, and style. Keep the person's face, body shape, and pose unchanged. CRITICAL: The background must be completely white (#FFFFFF). Do not change the person's identity or add accessories.";
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

    const hasImages =
      input.labeledImages && input.labeledImages.length > 0;

    try {
      let response: OpenAI.ChatCompletion;

      if (hasImages && input.labeledImages) {
        const content: OpenAI.ChatCompletionContentPart[] = [];

        // Interleave labels with images so the model knows what each one is
        for (const { label, image } of input.labeledImages) {
          content.push({ type: "text", text: label });
          const dataUri = arrayBufferToDataUri(image.data, image.mimeType);
          content.push({ type: "image_url", image_url: { url: dataUri } });
        }

        // Add the instruction prompt last
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
