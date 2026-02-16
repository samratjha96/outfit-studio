# Outfit Studio

AI-powered outfit styling app. Upload your wardrobe, pick tops and bottoms, and generate outfit previews on your own model image.

## Features

- **Outfit Generation** — Select a top + bottom, generate an AI preview of the outfit on your model
- **Ideate with AI** — Describe an occasion and get AI-generated outfit suggestions
- **Outfit Transfer** — Upload an inspiration image and transfer the outfit to your model
- **User Accounts** — Google OAuth via Convex Auth, all data scoped per user
- **Default Wardrobe** — New users get seeded with starter clothing items automatically

## Tech Stack

React, TypeScript, Vite, Convex (backend + auth + storage), NVIDIA API (Gemini image generation)

## Quick Start

### Prerequisites

- Node.js 20+
- A [Convex](https://convex.dev) account
- Google OAuth credentials (Google Cloud Console)
- NVIDIA API key from [inference.nvidia.com](https://inference.nvidia.com)

### Setup

```bash
git clone git@github.com:samratjha96/outfit-studio.git
cd outfit-studio
npm install
```

### Configure Convex

```bash
npx convex dev        # creates deployment, generates .env.local
npx @convex-dev/auth  # generates JWT keys, sets them on Convex
```

### Set Environment Variables

On your Convex deployment (via dashboard or CLI):

```bash
npx convex env set AUTH_GOOGLE_ID <your-google-client-id>
npx convex env set AUTH_GOOGLE_SECRET <your-google-client-secret>
npx convex env set NVIDIA_API_KEY <your-nvidia-api-key>
npx convex env set BODY_IMAGE_STORAGE_ID <storage-id>  # optional default model image
```

Add the OAuth redirect URI in Google Cloud Console:

```
https://<your-deployment>.convex.site/api/auth/callback/google
```

### Run

```bash
npx convex dev   # watches and deploys Convex functions
npm run dev      # starts Vite dev server
```

Open http://localhost:5173, sign in with Google, and start styling.

## Docker

```bash
# Set VITE_CONVEX_URL in .env, then:
docker compose up --build
```

Serves on port 8318 by default. Override with `HOST_PORT` in `.env`.

Note: Convex functions run in the cloud. Deploy them first with `npx convex deploy`.

## Project Structure

```
src/
  App.tsx                    # Main app with auth wrappers
  main.tsx                   # ConvexAuthProvider setup
  hooks/
    useSeedDefaults.ts       # Two-phase default clothing seeding
    useCarousel.ts           # Carousel navigation
    useOutfitGeneration.ts   # Generation state management
  components/                # UI components
convex/
  schema.ts                  # DB schema with auth tables
  auth.ts                    # Google OAuth provider
  clothingItems.ts           # User-scoped clothing CRUD
  modelImages.ts             # User-scoped model images
  generations.ts             # Generation queries/actions
  generationWorker.ts        # Image generation pipeline
  imageProvider.ts           # NVIDIA/Gemini API integration
  seed.ts                    # Default clothing seeding
```

## License

MIT
