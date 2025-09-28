import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  const mint = String(req.query.mint||process.env.DEFAULT_MINT||'')
  const key = process.env.BIRDEYE_KEY || ''
  if(!mint){ return res.status(200).json({ value: 0.000001 }) }
  const url = `https://public-api.birdeye.so/defi/price?address=${encodeURIComponent(mint)}`
  try{
    const r = await fetch(url, { headers: { 'x-chain':'solana', 'X-API-KEY': key } as any })
    const j = await r.json()
    const value = j?.data?.value || j?.data?.price || j?.value || j?.price || 0
    res.status(200).json({ value })
  }catch(e){
    res.status(200).json({ value: 0.000001 })
  }
}
