import { Canvas, ThreeEvent, useLoader } from '@react-three/fiber';
import { Object3D, SpotLight, TextureLoader } from 'three';

import './App.css'
import { useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { MeshReflectorMaterial, PerspectiveCamera } from '@react-three/drei';

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

/**
 * The artwork component is a single artwork in the gallery.
 * The mesh will contain the geometry and material as children. While the object3D will be the parent
 * so the transformation on root node can be applied to the children.
 * 
 * The artwork, the border and the arrows are added to the base node in the same way.
 * 
 */
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

/**
 * The hierarchy of the scene is easily recognizable because of how React works.
 * 
 * This is the rootNode, which we add to the scene (i.e Canvas). We use the ref to access the object3D
 * and add the rotation animation to it when the user clicks on the artwork.
 * 
 * Unlike on the VanillaJS version, we are using gsap to animate the rotation.
 */
function RootNode({ changeIndex }: { changeIndex: (newIndex: number) => void }) {
  const rootNode = useRef<Object3D>(null);

  const rotateGallery = (direction: -1 | 1, newIndex: number) => {
    const deltaY = direction * (2 * Math.PI / images.length);
    if (rootNode.current) {
      gsap.to(rootNode.current.rotation, { duration: 0.5, y: rootNode.current.rotation.y + deltaY, ease: "power1.inOut" });
    }
    changeIndex(newIndex);
  };


  /**
   * Unlike, three JS we can check the intersections of the raycaster with onClick instead of
   * using the raycaster object on the scene.
   */
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
  const [ index, setIndex ] = useState(0);

  /**
   * Change the title of the artwork when the user clicks on the left or right arrow.
   * Opacity of the heading is handled by gsap.
   */
  const animateChangeArtwork = (newIndex: number) => {
    gsap.to("h1", {opacity: 0, duration: 0.5, ease: "power1.inOut", onComplete: () => {
      setIndex(newIndex);
      gsap.to("h1", {opacity: 1, duration: 0.5, ease: "power1.inOut"});
    }});
  };

  return (
    <>
      <h1>{images[index].title}</h1>
      <Canvas>
        {/* We used PerspectiveCamera from @react-three/drei to create the desired effect of only showing
        one artwork per scene. The default camera from Canvas doesn't provide the desired effect. */}
        <PerspectiveCamera makeDefault position={[0, 0, 0]}>
          {/** We use the group component to add a spotlight with the target being the position where we can see the artwork.
           * The position is on the global space not the local space of the artwork so rotating the root will not transform
           * the spotlight.
           * 
           * We used <primitive> instead of <spotLight> because we want to memoize the spotlight without
           * using useRef and we want to get the spotlight target as well, which is we need to add onto the scene. 
           */}
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
          <RootNode changeIndex={animateChangeArtwork} />
          {/* 
            We added a floor to the scene like the gallery is in a museum.

            Add a reflection to the floor of the scene. The values of MeshReflectorMaterial is
            tinkered to make it look like a mirror based on the spotlight we currently have. We don't want the floor
            to be a mirror so we want to blur the textures out like a clean shiny floor.
           */
          }
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
        </PerspectiveCamera>
      </Canvas>
    </>
  )
}

export default App
