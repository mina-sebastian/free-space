import * as React from 'react';
import ImageCard from "./cards/ImageCard";
import LinkGenerationModal from "../components/modals/LinkGenerationModal";

export default function WelcomeBg({children}) {

  
  return (
    <>
    <ImageCard
    title={"Welcome to free-space"}
    imagePath={"Free-Space_Cloud.png"}
    >
        {children}
    </ImageCard>

    <LinkGenerationModal type={"folder"} name={"Test.js"} id={2}/>
    </>
  );
}
