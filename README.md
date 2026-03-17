# AskIt — RAG + MCP + Multimodal + Agentic AI

Premium AI web app with **RAG** (retrieval-augmented generation), **multimodal** (text + images), and **agentic** tools. Neuromorphism UI (black, pink, white) with Playfair Display on the landing page. Built with **Bun**, **Next.js 15**, and **Supabase**; everything is stored in Supabase (auth, profiles, documents, chunks, chats).

## Features

- **Landing page** — Public landing with sign up / log in; no app access without auth
- **Auth** — Email/password and **Sign in with Google** (Supabase Auth)
- **RAG** — Upload documents (or paste text); chunked, embedded (OpenAI), stored in Supabase (pgvector); retrieval used in chat
- **Multimodal** — Send images with messages (vision API)
- **Agentic** — Tools (e.g. `search_documents`) in an agent loop (multi-step)
- **UI** — Neuromorphism style, black + pink + white, Playfair Display (italic) on landing

## Stack

- **Runtime / package manager:** Bun
- **Framework:** Next.js 15 (App Router, React 19)
- **Database & auth:** Supabase (PostgreSQL, Auth, RLS, pgvector)
- **AI:** Vercel AI SDK, OpenAI (GPT-4o, text-embedding-3-small)
- **Styling:** Tailwind CSS

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the migrations in order:
   - `supabase/migrations/00001_initial.sql`
   - `supabase/migrations/00002_match_chunks.sql`
3. Enable **Google** under **Authentication → Providers** and add your Google OAuth client ID/secret (with redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`).
4. Copy **Project URL** and **anon (public) key** from **Settings → API**.

### 3. Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-...
```

### 4. Run

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up or log in (email or Google); then use the app (chat, documents, RAG, images).

## Project structure

- `src/app/` — Routes: `/` (landing), `/login`, `/signup`, `/app` (chat), `/app/documents`
- `src/app/api/chat/` — Chat API (streaming, tools, multimodal)
- `src/app/api/documents/ingest/` — Document ingest (chunk + embed + store)
- `src/lib/supabase/` — Supabase client (browser + server) and middleware
- `src/lib/rag/` — Embeddings and retrieval (Supabase pgvector)
- `supabase/migrations/` — Schema (profiles, documents, chunks, chats, messages, RLS, `match_chunks`)

## License

MIT
