# AskIt

AskIt is a premium, high-performance AI web application featuring an advanced multi-modal agentic architecture. It seamlessly integrates Retrieval-Augmented Generation (RAG), Model Context Protocol (MCP), and vision-based reasoning within a sleek, neuromorphic user interface.

Built entirely on the modern Next.js 15 App Router and powered by Bun, AskIt utilizes Supabase as a robust vector store and authentication provider, creating a secure and highly scalable conversational AI platform.

## Features

* **Multi-Modal Agentic AI:** Supports complex, multi-step reasoning using tools (like `search_documents`) and natively processes both text and image inputs (vision API).
* **High-Performance RAG:** Automatically chunks, embeds (via OpenAI), and stores uploaded documents in a Supabase `pgvector` database for low-latency semantic retrieval during chat.
* **Neuromorphic Design System:** A meticulously crafted visual identity featuring a black, pink, and white palette, smooth Framer Motion animations, and beautiful typography (Playfair Display and Inter).
* **Secure Authentication:** Integrated Supabase Auth offering both traditional email/password and seamless Google OAuth sign-in.
* **Production-Ready Dockerization:** Highly optimized `standalone` output configuration for easy containerization and deployment to modern cloud platforms like AWS App Runner or ECS Fargate.

## Architecture & Stack

The application stack is chosen for maximum developer velocity and production performance:

* **Runtime & Package Manager:** Bun
* **Framework:** Next.js 15 (React 19, Turbopack)
* **Database & Auth:** Supabase (PostgreSQL, Auth, Row Level Security, `pgvector`)
* **AI & Orchestration:** Vercel AI SDK, OpenAI (`gpt-4o`, `text-embedding-3-small`), Groq, Google Generative AI
* **Styling & UI:** Tailwind CSS, Framer Motion, Neuromorphic design principles

## Repository Structure

The repository is organized to separate the public landing experience from the secure application core.

* `src/app/` — Next.js App Router routes including the landing page (`/`), authentication pages (`/login`, `/signup`), and the core application interface (`/app`).
* `src/app/api/` — API routes handling the streaming chat interface, multimodal processing, and document ingestion (chunking, embedding, storing).
* `src/lib/` — Core utilities including the Supabase client logic and the RAG engine handling pgvector matching.
* `supabase/migrations/` — Essential SQL schemas defining profiles, documents, chunks, chats, messages, Row Level Security (RLS) policies, and the `match_chunks` RPC function.

## Getting Started

### 1. Installation

Ensure you have [Bun](https://bun.sh/) installed, then clone the repository and install dependencies:

```bash
cd askit
bun install
```

### 2. Supabase Configuration

1. Create a new project at [supabase.com](https://supabase.com).
2. Navigate to the **SQL Editor** and run the initial migrations sequentially:
   * `supabase/migrations/00001_initial.sql`
   * `supabase/migrations/00002_match_chunks.sql`
3. Enable **Google** under **Authentication → Providers** and add your Google OAuth credentials.
4. Set the redirect URI to `https://<your-project-ref>.supabase.co/auth/v1/callback`.
5. Retrieve your **Project URL** and **anon (public) key** from **Settings → API**.

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-...
# Add other required API keys (Groq, Google, etc.) as needed.
```

### 4. Running Locally

Start the development server using Turbopack for ultra-fast compilation:

```bash
bun run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

## Deployment

AskIt is fully configured for Dockerized deployment, making it trivial to host on AWS.

### Building and Running with Docker

```bash
docker build -t askit-app .
docker-compose up
```

### Deploying to AWS App Runner

AWS App Runner provides a zero-management container deployment experience.

1. Create a repository in the **AWS ECR Console** named `askit`.
2. Authenticate your local Docker daemon to your AWS ECR registry.
3. Tag and push the `askit-app:latest` image to your newly created ECR repository.
4. Navigate to **AWS App Runner**, select **Container Registry -> ECR**, and point it to the `askit:latest` image.
5. Set the port to `3000` and map your runtime environment variables (from `.env.local`).
6. Click **Create Service**. 

*Important:* Once deployed, update your Supabase **Site URL** and Google Cloud **Authorized JavaScript origins** with the generated App Runner public URL.

## License

MIT License
