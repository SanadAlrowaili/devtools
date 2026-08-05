# Campaign Concept Studio

Turn a short marketing brief into a full campaign starting point: a concept, three copy variants written for your channels, a sequenced launch checklist, and generated key visuals.

Built on the **OpenAI Responses API** for text and **`gpt-image-2`** for images.

---

## What it generates

From a brief, target audience, product details, tone, and channels, one run produces:

| Output | Detail |
| --- | --- |
| **Campaign concept** | Name, big idea, positioning statement, audience insight, 3 key messages |
| **Copy variants** | 3 headline + subheadline + body + CTA sets, each a different strategic angle, each assigned to one of your channels |
| **Launch checklist** | 6–10 sequenced tasks with phase, owning role, and relative timing |
| **Key visuals** | 3 model-authored image prompts, plus the rendered images |

---

## Requirements

- **Node.js 20.9+** (Next.js 16 requirement)
- An **OpenAI API key** with access to the text and image models

---

## Install

```bash
cd apps/campaign-concept-studio
npm install
```

## Configure

```bash
cp .env.example .env.local
```

Then set your key in `.env.local`:

```bash
OPENAI_API_KEY=sk-proj-...
```

Create a key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys). `.env.local` is git-ignored — never commit a real key.

`.env.example` also documents optional overrides for the model, reasoning effort, image size, quality, and output format. All of them have sensible defaults, so the key alone is enough to start.

## Run

```bash
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build     # production build
npm run start     # serve the production build
npm run lint      # eslint
npm run typecheck # tsc --noEmit
```

---

## Client/server boundary

**The OpenAI API key never reaches the browser.** The split is enforced three ways, not just by convention.

```
   BROWSER                        │  SERVER (Node runtime)              │  OPENAI
                                  │                                     │
   components/Studio.tsx          │                                     │
   components/BriefForm.tsx       │                                     │
   components/CampaignResult.tsx  │                                     │
            │                     │                                     │
            ▼                     │                                     │
   lib/api-client.ts              │                                     │
   (fetch, same-origin only)      │                                     │
            │                     │                                     │
            ├── POST /api/campaign ──────► app/api/campaign/route.ts ────┼──► responses.create()
            │                     │              │                      │
            │                     │              ├─ lib/config.ts       │
            │                     │              ├─ lib/prompts.ts      │
            │                     │              ├─ lib/schemas.ts      │
            │                     │              └─ lib/openai.server.ts│
            │                     │                 (holds the key)     │
            │                     │                                     │
            └── POST /api/campaign/images ─► app/api/campaign/images/    │──► images.generate()
                                  │           route.ts                  │
```

**How the boundary is enforced:**

1. **`import 'server-only'`** at the top of `lib/config.ts`, `lib/prompts.ts`, `lib/openai.server.ts`, and `lib/errors.server.ts`. If any client component imports these — directly or through a chain of imports — **the build fails**. It cannot fail silently. (Verified: adding `import '@/lib/config'` to `components/Studio.tsx` fails the build with *"'server-only' cannot be imported from a Client Component module"*.)
2. **No `NEXT_PUBLIC_` prefix.** Next.js only inlines env vars into the client bundle when they are prefixed `NEXT_PUBLIC_`. `OPENAI_API_KEY` is not, so it is unreadable from browser code.
3. **The browser never names a model.** `lib/api-client.ts` posts the brief to our own routes and knows nothing about OpenAI — no SDK import, no model names, no endpoints.

**Rules if you extend this app:**

- Client components (`'use client'`) may import `lib/api-client.ts` and `lib/types.ts`. Nothing else from `lib/`.
- `lib/config.ts`, `lib/prompts.ts`, and anything `*.server.ts` are server-only.
- Every new OpenAI call belongs in a route handler under `app/api/**`.

You can verify the boundary holds at any time:

```bash
npm run build
grep -r "OPENAI_API_KEY" .next/static/   # must return nothing
grep -r "api.openai.com" .next/static/   # must return nothing
```

---

## Where to adjust things later

Everything tunable lives in three files. Nothing is hard-coded in the route handlers.

### Model → [`lib/config.ts`](./lib/config.ts)

```ts
text: {
  model: process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.6-terra',
  reasoningEffort: 'low',
  maxOutputTokens: 6000,
}
```

Current lineup (see [developers.openai.com/api/docs/models](https://developers.openai.com/api/docs/models)):

| Model | Use it when |
| --- | --- |
| `gpt-5.6-sol` | You want the strongest strategic thinking and cost is secondary |
| `gpt-5.6-terra` | **Default.** Balanced quality and cost for production |
| `gpt-5.6-luna` | High volume, draft passes, or cost-sensitive workloads |

`reasoningEffort` accepts `none`, `low`, `medium`, `high`, `xhigh`, `max`. Concepting is creative rather than analytical, so `low` is the default — raise it to `medium`/`high` for more rigorous strategy at the cost of latency and output tokens.

If you ever see the "ran out of room" error, raise `maxOutputTokens` first.

Every value here can also be set per environment via env var, so you can A/B a model in staging without a code change.

### Prompt → [`lib/prompts.ts`](./lib/prompts.ts)

- `systemInstructions` — the strategist persona, the banned-phrase list, and the standing rules. This is where you encode your agency's or brand's voice.
- `buildBriefInput()` — how the brief fields get assembled into the request, and what deliverables are asked for.
- `buildImagePrompt()` — house art-direction rules appended to every model-authored image prompt. Change the look of all generated imagery here in one place, without touching concept generation.

To change the *shape* of what comes back (more variants, extra checklist fields), edit `campaignJsonSchema` in [`lib/schemas.ts`](./lib/schemas.ts) and the matching interfaces in [`lib/types.ts`](./lib/types.ts), then update the wording in `prompts.ts` to match.

### Image settings → [`lib/config.ts`](./lib/config.ts)

```ts
image: {
  model: 'gpt-image-2',
  size: '1024x1024',
  quality: 'medium',
  format: 'webp',
  count: 3,
}
```

- **`size`** — `gpt-image-2` accepts arbitrary `WIDTHxHEIGHT` where both dimensions are divisible by 16 and the aspect ratio is between 1:3 and 3:1. Useful presets: `1024x1024` (social), `1536x1024` (hero banner), `1024x1536` (story).
- **`quality`** — `low` for fast drafts, `medium` for review, `high` for hero assets. This is the biggest lever on both latency and cost.
- **`format`** — `webp` keeps the base64 payload small; use `png` for lossless assets.
- **`count`** — how many visuals per run. Also referenced by the JSON schema so the model produces exactly that many prompts.

---

## How the flow works

The run is deliberately split into **two requests** rather than one:

1. `POST /api/campaign` — returns the written plan in a few seconds.
2. `POST /api/campaign/images` — renders the visuals, which takes considerably longer.

The UI shows the concept and copy as soon as phase 1 lands, with the visuals streaming in behind it. If image generation fails, the written work stays on screen and only the visuals panel offers a retry.

Images render in parallel with `Promise.allSettled`, so one blocked prompt costs you that visual and not the whole set — the UI reports "2 of 3 rendered".

### Why Structured Outputs

`/api/campaign` passes a JSON Schema with `strict: true` under the Responses API's `text.format` parameter. The model's output is then guaranteed to match the schema, so the UI renders it without defensive checks on every field.

Note the API shape: on the **Responses API** this lives under `text.format`. (On the older Chat Completions API it was `response_format` — this app does not use that endpoint, nor the legacy Completions endpoint.)

---

## Deployment

The app is a standard Next.js 16 App Router project and deploys anywhere Next.js runs.

### Vercel

1. Import the repository and set the **root directory** to `apps/campaign-concept-studio`.
2. Add `OPENAI_API_KEY` under **Settings → Environment Variables** (all environments you plan to use). Add any optional overrides from `.env.example` alongside it.
3. Deploy. Build and output settings are detected automatically.

Image generation is slow, so `app/api/campaign/images/route.ts` declares `export const maxDuration = 300`. Confirm your plan allows that ceiling — on lower tiers, reduce it, or drop `image.quality` to `low` and `image.count` to `1` to stay inside the limit.

### Docker / self-hosted

```bash
npm ci
npm run build
OPENAI_API_KEY=sk-... npm run start   # defaults to port 3000
```

Set `PORT` to change the port. Put it behind a reverse proxy that allows response times of a couple of minutes for `/api/campaign/images`.

### Deployment notes

- **Both routes are `runtime = 'nodejs'` and `dynamic = 'force-dynamic'`.** They read env and call a provider, so they must never be statically evaluated at build time.
- **Responses are sent with `cache-control: no-store`.** Generated campaigns are per-user and must not be cached by a CDN.
- **`store: false`** is set on the text request, so runs are not persisted on OpenAI's side.
- **No database.** Results live in React state and are gone on refresh. Adding persistence means adding a store — pick one deliberately, and treat generated copy as customer data.
- **No auth.** Anyone who can reach the deployment can spend your OpenAI credits. Put it behind SSO, Vercel password protection, or your own middleware before exposing it publicly, and consider per-user rate limiting.

---

## Validation

See [`docs/validation-plan.md`](./docs/validation-plan.md) for the pre-ship checklist covering the client/server boundary, error states, output quality, and cost.

---

## Project structure

```
app/
  layout.tsx                      root layout, metadata, theme colours
  page.tsx                        server component; page shell
  globals.css                     design tokens + Tailwind v4 theme
  api/campaign/route.ts           TEXT  — Responses API, structured output
  api/campaign/images/route.ts    IMAGE — gpt-image-2
components/
  Studio.tsx                      the one stateful client component
  BriefForm.tsx                   brief input + client-side validation
  CampaignResult.tsx              concept, variants, checklist, visuals
  ui.tsx                          primitives + loading/error/empty states
lib/
  config.ts          SERVER  model, reasoning, image settings  ← tune here
  prompts.ts         SERVER  all prompt text                   ← tune here
  schemas.ts         SERVER  zod request validation + JSON Schema
  openai.server.ts   SERVER  the OpenAI client (holds the key)
  errors.server.ts   SERVER  provider errors → safe client messages
  api-client.ts      CLIENT  same-origin fetch wrappers
  types.ts           SHARED  types and constants only
docs/
  validation-plan.md
```

---

## A note on output

Everything generated here is a **first draft**. Model output can be confidently wrong, off-brand, or repeat a claim the brief did not support. The prompt explicitly forbids inventing statistics, awards, or customer quotes, but that is a constraint, not a guarantee. Review before anything ships.
