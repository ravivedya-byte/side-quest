# Side Quest

A handcrafted travel blueprint, generated for you.

## Deploy to Vercel

1. Push this folder to a GitHub repository
2. Go to vercel.com → New Project → Import your repo
3. Framework preset: **Vite**
4. Add environment variable: `DEEPSEEK_API_KEY` = your key from DeepSeek
5. Deploy

That's it. Your site will be live at `your-project.vercel.app`.

## Local development

```bash
npm install
npm run dev
```

For local dev, create a `.env` file:
```
DEEPSEEK_API_KEY=your_key_here
```

Optional model overrides:
```
DEEPSEEK_STAGE1_MODEL=deepseek-v4-flash
DEEPSEEK_STAGE2_MODEL=deepseek-v4-pro
DEEPSEEK_REFINE_MODEL=deepseek-v4-flash
```
