import { Canvas, ThreeEvent, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Object3D, SpotLight, TextureLoader } from 'three';

import './App.css'
import { useMemo, useRef } from 'react';
import gsap from 'gsap';
import { MeshReflectorMaterial } from '@react-three/drei';

const images = [
  {
    title: "Max Verstappen",
    artist: "Max Verstappen",
    image: "max_verstappen.jpg",
  },
  {
    title: "You Luke Huge",
    artist: "You Luke",
    image: "you_luke_huge.png",
  },
  {
    title: "Mercy",
    artist: "Mercy",
    image: "mercy.jpg",
  },
  {
    title: "Def Hop On Later",
    artist: "Def Hop On Later",
    image: "def_hop_on_later.png",
  },
  {
    title: "Groundbreaking",
    artist: "Groundbreaking",
    image: "groundbreaking.jpg",
  }
];

function Artwork({ image, index }: {image: typeof images[number], index: number}) {
  const artworkTexture = useLoader(TextureLoader, image.image);
  const leftArrowTexture = useLoader(TextureLoader, "chevron-left.png");
  const rightArrowTexture = useLoader(TextureLoader, "chevron-right.png");
  const count = images.length;

  return (
    <object3D rotation={[0, index * 2 * Math.PI / count, 0]}>
      <mesh position={[0, 0, -4]}>
        <boxGeometry args={[3.1, 2.1, 0.08]} />
        <meshStandardMaterial color={0x404040} />
      </mesh>
      <mesh position={[0, 0, -4]}>
        <boxGeometry args={[3, 2, 0.1]} />
        <meshStandardMaterial map={artworkTexture} />
      </mesh>
      <mesh position={[-1.75, 0, -4]} userData={{ index: index === count - 1 ? 0 : index + 1 }} name="LeftArrow">
        <planeGeometry args={[0.3, 0.3]} />
        <meshStandardMaterial map={leftArrowTexture} transparent />
      </mesh>
      <mesh position={[1.75, 0, -4]} userData={{ index: index === 0 ? count - 1 : index - 1 }} name="RightArrow">
        <planeGeometry args={[0.3, 0.3]} />
        <meshStandardMaterial map={rightArrowTexture} transparent />
      </mesh>
    </object3D>
  );
}

function RootNode() {
  const rootNode = useRef<Object3D>(null);

  const rotateGallery = (direction: -1 | 1, newIndex: number) => {
    const deltaY = direction * (2 * Math.PI / images.length);
    if (rootNode.current) {
      gsap.to(rootNode.current.rotation, { duration: 0.5, y: rootNode.current.rotation.y + deltaY, ease: "power1.inOut" });
    }
  };

  const checkIntersection = (event: ThreeEvent<MouseEvent>) => {
    const { intersections } = event;
    if (intersections.length > 0) {
      const obj = intersections[0].object;
      const newIndex : number = obj.userData.index;
      if (obj.name === "LeftArrow") {
        console.log("Left Arrow clicked");
        rotateGallery(-1, newIndex);
      } else if (obj.name === "RightArrow") {
        console.log("Right Arrow clicked");
        rotateGallery(1, newIndex);
      }
    }
  }

  return (
    <object3D
      ref={rootNode}
      onClick={checkIntersection}>
      {images.map((image, index) => <Artwork image={image} index={index} key={"Artwork_" + index} />)}
    </object3D>
  );
}

function App() {
  const spotlight = useMemo(() => new SpotLight(0xffffff), []);

  return (
    <>
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 1000, position: [0,0,0]}}>
        <group>
          <primitive
            object={spotlight}
            intensity={100.0}
            distance={10.0}
            angle={Math.PI / 3}
            penumbra={1}
            position={[0, 5, 0]}
          />
          <primitive object={spotlight.target} position={[0, 0.5, -5]} />
        </group>
        <RootNode/>
        <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[10]} />
          <MeshReflectorMaterial
            mirror={1}
            blur={[300, 300]}
            resolution={720}
            mixBlur={0.6}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            metalness={0.5}
          />
        </mesh>
      </Canvas>
    </>
  )
}

export default App
