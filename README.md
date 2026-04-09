# CycleSync

A privacy-focused, intelligent menstrual cycle tracking web application built with Next.js and Supabase.

## Features
- **Smart Predictions**: Calculates average cycle lengths, period durations, and confidence scores based on personal history.
- **Fertility Window**: Approximates ovulation day and fertility windows using historical averages.
- **Irregularity Detection**: Uses standard deviation to identify and flag statistically significant cycle irregularities.
- **Health Reports**: Export your data directly to a PDF for personal records or sharing with healthcare professionals.
- **Push Notifications**: Receive reminders before your predicted cycle starts via Web Push (Service Workers) powered by Supabase Edge Functions.
- **Privacy First**: Built with strict Row Level Security (RLS) in a direct-to-database architecture ensuring no one but you can access your tracked data.

*Disclaimer: CycleSync is a tracking tool and is not intended to be used as a medical device or for contraception.*

## Tech Stack
- Frontend: Next.js 14 (App Router), React, Tailwind CSS
- Backend/Database: Supabase (PostgreSQL), Supabase Auth
- Push Notifications: Web Push APIs + Supabase Edge Functions (Deno)

---

## 🛠 Set Up & Deployment Guide

### 1. Supabase Project Initialization
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Under **Project Settings > API**, find your `Project URL` and `anon public` key. 
3. Under **Project Settings > API**, find your `service_role` secret (Do NOT share this publicly).

### 2. Environment Variables
Clone the `.env.example` file to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the values:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon public key
- VAPID keys setup (see section 5).

### 3. Database Migrations
We provide full SQL migration scripts in `supabase/migrations/`. You can run these using the Supabase CLI, or copy/paste them directly into the "SQL Editor" section on the Supabase dashboard in order (01 through 06).
- `01_profiles.sql`
- `02_cycles.sql`
- `03_symptoms.sql`
- `04_predictions.sql`
- `05_push_subscriptions.sql`
- `06_notifications.sql`

*These scripts will create all tables, set up triggers (like auto-creating profiles on auth signup), and secure your data using Row Level Security policies.*

### 4. Running Locally
```bash
npm install
npm run dev
```
Navigate to `http://localhost:3000`.

### 5. Enabling Push Notifications
Push notifications require VAPID keys. You can generate them using the `web-push` CLI:
```bash
npx web-push generate-vapid-keys
```
Add the output Public Key and Private Key to your `.env.local` file.

To deploy the worker that sends the notifications daily:
1. Ensure the Supabase CLI is installed and linked to your project (`supabase link`).
2. Set secrets in the Supabase Edge Function environment:
```bash
supabase secrets set CRON_SECRET=some_strong_secret VAPID_PRIVATE_KEY=your_private_key NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key SUPABASE_SERVICE_ROLE_KEY=your_service_role_key SUPABASE_URL=your_db_url
```
3. Deploy the Edge Function:
```bash
supabase functions deploy daily-reminders
```
4. Set up an Extension (pg_cron) in Supabase SQL editor to call this function daily:
```sql
select
  cron.schedule(
    'invoke-daily-reminders',
    '0 10 * * *', -- Everyday at 10 AM UTC
    $$
    select
      net.http_post(
          url:='https://<your_project_ref>.functions.supabase.co/daily-reminders',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer some_strong_secret"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
  );
```

### 6. Deployment to Vercel
1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and Add New Project.
3. Import your repository.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
5. Click **Deploy**.

## Testing
Run the unit test suite for the core prediction algorithm:
```bash
npm install -D vitest
npm run test
# OR
npx vitest run
```
// starting code review