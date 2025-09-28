import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useStore } from '../pages'

type Holder = { address: string; balanceTokens: number; spentSOL: number; costBasisPerToken: number }
type Agent = { mesh: THREE.Group, v: THREE.Vector3, speed: number, addr: string }

export default function FishSchool(){
  const holders = useStore(s=>s.holders)
  const setSelected = useStore(s=>s.setSelected)
  const group = useRef<THREE.Group>(null!)
  const [agents,setAgents] = useState<Agent[]>([])
  const { camera } = useThree()
  const spot = useMemo(()=> new THREE.SpotLight(0x88d2ff, 0), [])

  useEffect(()=>{ 
    if(!group.current) return;
    // Rebuild group from holders (simple + robust)
    group.current.clear()
    const A : Agent[] = []
    holders.forEach((h)=>{
      const g = makeFish(h.address)
      g.userData.addr = h.address
      g.position.set((Math.random()-0.5)*16,(Math.random()-0.5)*6,(Math.random()-0.5)*6)
      group.current.add(g)
      A.push({ mesh:g, v:new THREE.Vector3(), speed:0.8+Math.random()*1.0, addr:h.address })
    })
    setAgents(A)
  }, [holders])

  useEffect(()=>{
    function onWinner(e:any){
      const addr = e.detail?.address
      const target = agents.find(a=>a.addr===addr)
      if(!target) return
      spot.intensity = 1.4
      if(!group.current?.parent) return
      const startP = camera.position.clone()
      const startQ = camera.quaternion.clone()
      const pos = target.mesh.position.clone().add(target.mesh.getWorldDirection(new THREE.Vector3()).multiplyScalar(2.2)).add(new THREE.Vector3(0,0.6,0))
      const look = target.mesh.position.clone()
      let t=0
      function anim(){
        t += 1/60
        const k = Math.min(1, t/1.6)
        camera.position.lerpVectors(startP, pos, k)
        camera.quaternion.slerp(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(camera.position, look, new THREE.Vector3(0,1,0))), k)
        if(k<1) requestAnimationFrame(anim)
        else {
          const baseY = target.mesh.position.y; let a=0
          function hop(){
            a += 1/60*2.4
            target.mesh.position.y = baseY + Math.sin(a)*1.0
            if(a<Math.PI) requestAnimationFrame(hop)
            else { spot.intensity = 0 }
          }
          hop()
        }
      }
      anim()
    }
    window.addEventListener('winner-picked', onWinner as any)
    return ()=> window.removeEventListener('winner-picked', onWinner as any)
  }, [agents])

  useEffect(()=>{
    if(!group.current?.parent) return
    spot.position.set(0,3,0)
    group.current.parent.add(spot)
  },[])

  useFrame((_,dt)=>{
    const bounds = new THREE.Vector3(20,9,8)
    const neighbor = 3.0, avoid=1.0, cohW=0.5, aliW=0.45, sepW=0.8
    for(let i=0;i<agents.length;i++){
      const a = agents[i], pos = a.mesh.position
      let coh = new THREE.Vector3(), ali = new THREE.Vector3(), sep = new THREE.Vector3()
      let count=0
      for(let j=0;j<agents.length;j++){
        if(i===j) continue; const b = agents[j]; const d = pos.distanceTo(b.mesh.position)
        if(d<neighbor){ coh.add(b.mesh.position); ali.add(b.v); count++; if(d<avoid) sep.add(pos.clone().sub(b.mesh.position).multiplyScalar(1/Math.max(d,0.001))) }
      }
      if(count>0){ coh.multiplyScalar(1/count).sub(pos).normalize(); ali.multiplyScalar(1/count).normalize() }
      const push = new THREE.Vector3(Math.abs(pos.x)>bounds.x*0.5?-Math.sign(pos.x):0, Math.abs(pos.y)>bounds.y*0.5?-Math.sign(pos.y):0, Math.abs(pos.z)>bounds.z*0.5?-Math.sign(pos.z):0)
      const accel = new THREE.Vector3().add(coh.multiplyScalar(cohW)).add(ali.multiplyScalar(aliW)).add(sep.multiplyScalar(sepW)).add(push.multiplyScalar(1.2)).add(new THREE.Vector3().subVectors(new THREE.Vector3(0,0,0), pos).multiplyScalar(0.02))
      a.v.lerp(accel.add(a.mesh.getWorldDirection(new THREE.Vector3())).normalize().multiplyScalar(a.speed), dt*2.5)
      a.mesh.position.add(a.v.clone().multiplyScalar(dt))
      if(a.v.lengthSq()>1e-4){ a.mesh.quaternion.slerp(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), a.v.clone().normalize()), dt*2.5) }
    }
  })

  // handle clicks (raycasting handled by r3f events on group children)
  return <group ref={group} onPointerDown={(e:any)=>{
    e.stopPropagation()
    const addr = e.eventObject?.parent?.userData?.addr || e.eventObject?.userData?.addr
    const all = useStore.getState().holders
    const found = all.find(h=>h.address===addr)
    useStore.getState().setSelected(found)
  }}/>
}

function makeFish(seed:string){
  const rng = sfc32(hashString(seed))
  const group = new THREE.Group()
  const bodyGeom = new THREE.CapsuleGeometry(0.25,1.0,8,16); bodyGeom.rotateX(Math.PI/2)
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setHSL(rng(), 0.6+0.35*rng(), 0.7+0.25*rng()), metalness:0.05, roughness:0.35, clearcoat:0.6, clearcoatRoughness:0.3 })
  const body = new THREE.Mesh(bodyGeom, bodyMat); group.add(body)
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.18,0.32,12), bodyMat.clone()); tail.position.set(0,-0.8,0); tail.rotation.x=Math.PI; group.add(tail)
  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.12,0.24,12), bodyMat.clone()); dorsal.position.set(0,0.1,0.25); group.add(dorsal)
  group.scale.setScalar(0.9+Math.random()*0.25)
  return group
}
function hashString(str:string){ let h=2166136261>>>0; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619);} return h>>>0 }
function sfc32(a:number){ return function(){ a+=0x9e3779b9; let t=a; t=(t^(t>>>15))*((t|1)); t^=t+((t^(t>>>7))*((t|61))); return ((t^(t>>>14))>>>0)/4294967296 } }
