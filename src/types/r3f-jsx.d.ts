// React Three Fiber JSX augmentation so TS recognizes <ambientLight/>, <mesh/>, etc.
import type { ThreeElements } from '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
export {};
