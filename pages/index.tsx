import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { OrbitControls, Environment } from '@react-three/drei'
import create from 'zustand'
import dynamic from 'next/dynamic'

const Tank = dynamic(()=>import('../src/Tank'), { ssr:false })
const FishSchool = dynamic(()=>import('../src/FishSchool'), { ssr:false })

type Holder = { address: string; balanceTokens: number; spentSOL: number; costBasisPerToken: number }

type State = {
  mint?: string
  tokenName?: string
  holders: Holder[]
  price: number
  selected?: Holder
  setSelected: (h?: Holder)=>void
}
export const useStore = create<State>((set)=>({ mint: undefined, tokenName: undefined, holders:[], price:0, selected:undefined, setSelected:(h)=>set({selected:h}) }))

export default function Home(){
  const mint = useStore(s=>s.mint)
  const tokenName = useStore(s=>s.tokenName)
  const holders = useStore(s=>s.holders)
  const price   = useStore(s=>s.price)
  const selected = useStore(s=>s.selected)
  const setSelected = useStore(s=>s.setSelected)

  // local input
  const [pendingMint, setPendingMint] = useState<string>('')

  async function applyMint(m: string){
    if(!m) return
    // fetch tokenName
    const nres = await fetch(`/api/token?mint=${encodeURIComponent(m)}`)
    const nj = await nres.json()
    useStore.setState({ mint: m, tokenName: nj?.name || '' })
    await refresh(m) // initial fetch
    startAutoRefresh(m)
  }

  async function refresh(m: string){
    const [h, p] = await Promise.all([
      fetch(`/api/holders?mint=${encodeURIComponent(m)}`).then(r=>r.json()),
      fetch(`/api/price?mint=${encodeURIComponent(m)}`).then(r=>r.json())
    ])
    useStore.setState({ holders: h||[], price: p?.value||0 })
  }

  function startAutoRefresh(m: string){
    stopAutoRefresh()
    ;(window as any).__fishtankTimer = setInterval(()=> refresh(m), 30000)
  }
  function stopAutoRefresh(){
    if((window as any).__fishtankTimer){ clearInterval((window as any).__fishtankTimer); (window as any).__fishtankTimer = null }
  }

  useEffect(()=>()=>stopAutoRefresh(), [])

  return (<div style={{height:'100vh', width:'100vw', background:'radial-gradient(1200px 900px at 60% 100%, #0b1022 0%, #070b12 55%)'}}>
    <Header
      mint={mint} tokenName={tokenName}
      pendingMint={pendingMint} setPendingMint={setPendingMint}
      onSubmit={()=>applyMint(pendingMint)}
      holders={holders} price={price} selected={selected} setSelected={setSelected}
    />
    <Canvas camera={{ position:[0,3,18], fov:60 }} gl={{ antialias:true }}>
      <Suspense fallback={null}>
        <ambientLight intensity={0.6}/>
        <directionalLight position={[5,10,-5]} intensity={1.1}/>
        <Environment preset="city" />
        <Tank/>
        <FishSchool/>
      </Suspense>
      <OrbitControls enableDamping autoRotate autoRotateSpeed={0.5}/>
    </Canvas>
  </div>)
}

function Header({mint, tokenName, pendingMint, setPendingMint, onSubmit, holders, price, selected, setSelected}: any){
  return <div style={{position:'fixed', left:12, top:12, zIndex:10, padding:'10px 12px', background:'rgba(11,19,36,.8)', border:'1px solid #2a3e66', borderRadius:12, color:'#e9f1ff', fontSize:12, maxWidth:460}}>
    {!mint ? (
      <div style={{display:'flex', gap:8, alignItems:'center', margin:'6px 0'}}>
        <label>Mint</label>
        <input placeholder="Paste token mint (contract)" value={pendingMint} onChange={e=>setPendingMint(e.target.value)} style={inp}/>
        <button onClick={onSubmit} style={btn}>Set</button>
      </div>
    ) : (
      <div style={{display:'flex', flexDirection:'column', gap:6}}>
        <div style={{fontWeight:700, fontSize:14}}>{tokenName || 'Token'}</div>
        <div style={{fontFamily:'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', wordBreak:'break-all'}}>{mint}</div>
        <div style={{opacity:.9}}>Holders: <b>{holders?.length||0}</b> · Price: <b>{price?.toFixed?.(8)||0}</b> SOL</div>
        <div style={{display:'flex', gap:8, marginTop:4}}>
          <button onClick={()=>location.reload()} style={btn}>Reset</button>
          <button onClick={()=>{
            if(!holders?.length) return
            const idx = Math.floor(Math.random()*holders.length)
            const h = holders[idx]; useStore.getState().setSelected(h)
            window.dispatchEvent(new CustomEvent('winner-picked', { detail: { address: h.address } }))
          }} style={btn}>Pick Winner</button>
        </div>
      </div>
    )}
    {selected && <div style={{marginTop:8, padding:8, background:'rgba(20,32,60,.7)', border:'1px solid #2a3e66', borderRadius:10, width:360}}>
      <div style={{fontWeight:700, marginBottom:6}}>🎣 Selected</div>
      <div style={{fontFamily:'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', wordBreak:'break-all'}}>{selected.address}</div>
      <div>Tokens: <b>{selected.balanceTokens.toLocaleString()}</b></div>
      <div>Spent: <b>{selected.spentSOL.toFixed(2)}</b> SOL</div>
      <div>Est. PnL: <b>{(selected.balanceTokens*price - selected.spentSOL).toFixed(2)}</b> SOL</div>
      <div style={{display:'flex', gap:8, marginTop:8}}>
        <button onClick={()=>navigator.clipboard.writeText(selected.address)} style={btn}>Copy Address</button>
        <button onClick={()=>useStore.setState({selected:undefined})} style={btn}>Close</button>
      </div>
    </div>}
  </div>
}

const inp: React.CSSProperties = { background:'transparent', border:'1px solid #2a3e66', color:'#e9f1ff', padding:'6px 8px', borderRadius:8, width:240 }
const btn: React.CSSProperties = { background:'linear-gradient(180deg,#1b2845,#121b2f)', border:'1px solid #2b4370', color:'#e9f1ff', borderRadius:10, padding:'8px 12px', cursor:'pointer' }
