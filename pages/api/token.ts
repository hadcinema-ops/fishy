import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  const mint = String(req.query.mint||'')
  if(!mint) return res.status(200).json({ name: '' })
  try{
    // Try Birdeye token info
    const key = process.env.BIRDEYE_KEY || ''
    const r = await fetch(`https://public-api.birdeye.so/defi/token_overview?address=${encodeURIComponent(mint)}`, { headers: { 'x-chain': 'solana', 'X-API-KEY': key } as any })
    if(r.ok){
      const j = await r.json()
      const name = j?.data?.name || j?.data?.symbol || ''
      if(name) return res.status(200).json({ name })
    }
  }catch(e){}
  try{
    // Helius metadata
    const hk = process.env.HELIUS_KEY || ''
    if(hk){
      const r2 = await fetch(`https://api.helius.xyz/v0/tokens/metadata?api-key=${encodeURIComponent(hk)}`, {
        method: 'POST',
        headers: { 'content-type':'application/json' },
        body: JSON.stringify({ mintAccounts: [mint] })
      })
      if(r2.ok){
        const j2 = await r2.json()
        const t = Array.isArray(j2)? j2[0] : (j2?.[0]||{})
        const name = t?.onChainMetadata?.metadata?.data?.name || t?.name || ''
        if(name) return res.status(200).json({ name })
      }
    }
  }catch(e){}
  // fallback
  return res.status(200).json({ name: mint.slice(0,4)+'…'+mint.slice(-4) })
}
