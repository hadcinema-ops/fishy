import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default function Tank(){
  const mat = useMemo(()=> new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.85,0.95,1.0), roughness:0.2, transmission:0.9, thickness:0.6, transparent:true, opacity:0.06 }), [])
  const floorMat = useMemo(()=> new THREE.MeshStandardMaterial({ color: new THREE.Color(0.1,0.15,0.16), roughness:0.9, metalness:0 }), [])
  const causticsTex = useMemo(()=>{
    const t = new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAALklEQVQYV2NkYGD4z0AeYGRg+I8BwkCkBhgYGBgGk2CkQYwGJQZgGQ0xGgAAzCwGf5w2d4sAAAAASUVORK5CYII=')
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    return t
  }, [])
  useFrame((_,dt)=>{ causticsTex.offset.x += 0.02*dt; causticsTex.offset.y += 0.015*dt })
  return <group>
    <mesh material={mat}><boxGeometry args={[22,12,10]}/></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-5.95,0]} material={floorMat}><planeGeometry args={[22,10,1,1]}/></mesh>
    <mesh position={[0,0,-4.95]} material={floorMat}><planeGeometry args={[22,12,1,1]}/></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-5.94,0]}>
      <planeGeometry args={[22,10,1,1]}/>
      <meshBasicMaterial transparent opacity={0.45} color={0x83d0ff} map={causticsTex}/>
    </mesh>
    <Bubbles position={[-8,-5.2,2]}/><Bubbles position={[7,-5.2,-2]}/><Bubbles position={[0,-5.2,0]}/>
  </group>
}

function Bubbles(props:any){
  return <group {...props}>
    {Array.from({length:120}).map((_,i)=> <Bubble key={i}/> )}
  </group>
}
function Bubble(){
  const ref = useRef<THREE.Mesh>(null!)
  const v = useMemo(()=> 0.2 + Math.random()*0.6, [])
  useFrame((_,dt)=>{
    ref.current.position.y += v*dt
    ref.current.position.x += (Math.random()-0.5)*0.01
    ref.current.position.z += (Math.random()-0.5)*0.01
    if(ref.current.position.y>6) ref.current.position.y = -5.8 + Math.random()*0.2
  })
  return <mesh ref={ref} position={[(Math.random()-0.5)*0.3, Math.random()*0.2, (Math.random()-0.5)*0.3]}>
    <sphereGeometry args={[0.06, 10, 10]}/>
    <meshPhysicalMaterial roughness={0.1} metalness={0} color={0xffffff} transparent opacity={0.5}/>
  </mesh>
}
