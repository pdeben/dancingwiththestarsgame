# DWTS S35 Pick'em

## Deploy in 4 steps

### 1. Run database setup in Supabase
- Go to supabase.com → your project → SQL Editor
- Paste the contents of `supabase-setup.sql` and click Run

### 2. Set up Google OAuth in Supabase
- Supabase → Authentication → Providers → Google → Enable
- Go to console.cloud.google.com → New Project → APIs & Services → Credentials → Create OAuth Client ID
- Application type: Web application
- Authorized redirect URI: `https://cmmhrqigosospmkkpzci.supabase.co/auth/v1/callback`
- Copy Client ID and Secret back into Supabase

### 3. Push to GitHub
```bash
cd dwts-pickem
git init
git add .
git commit -m "DWTS Pick'em app"
git remote add origin https://github.com/pdeben/dancingwiththestarsgame.git
git push -u origin main
```

### 4. Deploy on Vercel
- Go to vercel.com → Add New Project → Import from GitHub → pick `dancingwiththestarsgame`
- Add these Environment Variables:
  - `NEXT_PUBLIC_SUPABASE_URL` = `https://cmmhrqigosospmkkpzci.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your anon key)
  - `SUPABASE_SERVICE_ROLE_KEY` = (your service role key)
  - `ANTHROPIC_API_KEY` = (your Anthropic API key — get one at console.anthropic.com)
  - `CRON_SECRET` = `dwts-cron-secret-2026`
- Click Deploy

Your app will be live at a URL like `dancingwiththestarsgame.vercel.app`

## Auto-sync
The cron job at `/api/sync` runs every Wednesday at 3am UTC (Tuesday 11pm ET).
It searches the web for DWTS elimination results and updates all leaderboards automatically.
You can also trigger it manually from the Admin tab → "Run sync now".
