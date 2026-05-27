# Side Quest

A handcrafted travel blueprint, generated for you.

## Deploy to Vercel

1. Push this folder to a GitHub repository
2. Go to vercel.com → New Project → Import your repo
3. Framework preset: **Vite**
4. Add these environment variables:

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your API key from [Anthropic](https://console.anthropic.com/) |
| `SUPABASE_URL` | Project URL from Supabase → Settings → API |
| `SUPABASE_SERVICE_KEY` | Service role key (server-side only; never expose in frontend) |

5. In Supabase, create tables:

- **`destination_intelligence`** — `cache_key` (text, unique), `destination` (text), `intelligence_json` (jsonb), `expires_at` (timestamptz)
- **`trips`** — `id` (uuid, default), `trip_data` (jsonb), `destination` (text), `created_at` (timestamptz, default now)

6. Deploy

That's it. Your site will be live at `your-project.vercel.app`.

## How generation works

1. **Stage 1** — Claude Haiku + web search extracts destination intelligence (cached in Supabase for 6 months)
2. **Stage 2A** — Trip overview (title, philosophy, costs, route, packing)
3. **Stage 2B** — Day-by-day chunks (3 days per API call)
4. Trip saved to Supabase; share link at `/trip/<id>`

## Local development

```bash
npm install
npm run dev
```

For local dev, create a `.env` file in the project root:

```
ANTHROPIC_API_KEY=your_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
```

Vercel dev (`vercel dev`) is recommended for testing `/api/generate` and `/api/refine` locally.
