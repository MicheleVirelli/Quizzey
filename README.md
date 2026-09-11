# Quizzey

Real-time 1v1 trivia across every topic — a QuizUp-inspired web app.

- **10 questions** per match, **4 answers** each, **10 seconds** per question.
- **1 point** per correct answer, **2 points** for the last question (max **11**).
- Profiles with scores and per-country leaderboards.
- Built with **Next.js** + **Supabase**, deployed on **Vercel** (installable as a PWA).

## Getting started

See [`SETUP.md`](SETUP.md) for the full setup guide (Supabase schema, environment
variables, and deployment).

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + publishable key
npm run dev
```

Then open <http://localhost:3000/health> to confirm the backend connection.
