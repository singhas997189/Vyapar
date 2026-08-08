# Vyapar — Nifty 500 Analyzer

A full-stack website for tracking Indian stocks: sector-wise browsing, per-stock
technical + fundamental data, live news with sentiment, a combined Buy/Hold/Sell
signal, and a portfolio tracker with live profit/loss.

No browser extension needed — this is a normal website (React frontend +
Python API backend) that runs on its own once deployed.

## What's inside

```
nifty-analyzer/
  backend/     FastAPI app — market data, indicators, news, signals, portfolio DB
  frontend/    React + Vite site — dashboard, stock pages, portfolio
```

**Data sources (all free, no API keys required):**
- Prices & fundamentals: Yahoo Finance (via `yfinance`), using NSE `.NS` tickers
- News: Google News RSS, filtered per company
- News sentiment: VADER (rule-based sentiment scoring, runs locally)
- Buy/Sell signal: a transparent rule-based score combining RSI, MACD,
  moving averages, Bollinger Bands, and news sentiment — see
  `backend/services/signals.py` to tune the weights or add your own rules
- Stock universe: Nifty 500 constituent list with sector classification
  (`backend/data/nifty500.json`) — this is a snapshot; NSE rebalances the
  index twice a year, so refresh this file occasionally (source in the file
  header) if you want it perfectly current

## Run it locally

**Backend:**
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Runs at `http://localhost:8000`. Visit `http://localhost:8000/docs` for the
interactive API explorer.

**Frontend** (separate terminal):
```bash
cd frontend
npm install
npm run dev
```
Runs at `http://localhost:5173` and proxies `/api` requests to the backend
automatically (see `vite.config.js`).

Open `http://localhost:5173` — that's your site.

## Deploying it for real

The simplest free/cheap combo:

### 1. Backend → Render.com (or Railway, Fly.io)
1. Push this folder to a GitHub repo.
2. On Render: New → Web Service → point at the repo, root directory `backend`.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Deploy. Note the URL Render gives you, e.g. `https://vyapar-api.onrender.com`.

Render's free tier sleeps after inactivity — the first request after idle
takes ~30s to wake up. Fine for personal use; upgrade if that's annoying.

### 2. Frontend → Vercel or Netlify
1. New project → point at the repo, root directory `frontend`.
2. Build command: `npm run build`, output directory: `dist`.
3. Set an environment variable `VITE_API_URL` to your backend URL from step 1,
   with `/api` on the end, e.g. `https://vyapar-api.onrender.com/api`.
4. Deploy. You'll get a URL like `https://vyapar.vercel.app` — that's your
   live site, shareable from any device, no extension required.

### One thing to tighten before sharing publicly
`backend/main.py` currently allows CORS from any origin (`allow_origins=["*"]`)
to make local development easy. Once you know your frontend's deployed URL,
change that to just that URL so random sites can't call your API from a
browser.

## Notes & limitations

- **Portfolio storage**: holdings are stored in a SQLite file
  (`backend/portfolio.db`) on the server. That's fine for solo use; if you
  deploy to a platform with an ephemeral filesystem (like Render's free tier
  redeploys), point `DATABASE_URL` in `database.py` at a persistent Postgres
  instead (Render/Railway both offer free Postgres — swapping the connection
  string is the only change needed since SQLAlchemy is already in use).
- **Rate limits**: Yahoo Finance and Google News are free but unofficial —
  they can throttle if you hammer them. The backend caches quotes (1 min),
  history (5 min), and fundamentals (1 hr) in memory to stay well under any
  reasonable limit for personal use.
- **This is not investment advice.** The Buy/Sell signal is a simple,
  transparent rule-based heuristic (visible in `signals.py`), not a
  prediction. Use it as one input among many.

## Extending it
- Add more indicators in `backend/services/indicators.py`
- Adjust signal weights/rules in `backend/services/signals.py`
- Add alerts (e.g. email when a holding crosses a signal) via a scheduled job
- Swap VADER for a stronger sentiment model, or plug in a paid news API for
  deeper coverage
