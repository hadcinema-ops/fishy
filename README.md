# Fishtank Web (React + Three.js) — Final

## Run
1. `npm install`
2. Copy `.env.local.example` → `.env.local` and fill:
   - HELIUS_KEY=your_helius_key
   - BIRDEYE_KEY=your_birdeye_key
   - DEFAULT_MINT= (optional)
3. `npm run dev` → open http://localhost:3000

## Use
- Paste the **mint address** then click **Set**.
- The input disappears; header shows **token name + address**.
- Fish auto-update (holders & new fish) every **30 seconds**.
- Click a fish to see stats; use **Pick Winner** to spotlight + hop.

## Deploy
- Push to GitHub and import in **Vercel**. API routes run server-side (no CORS issues).
