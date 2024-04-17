import * as React from 'react';
import ImageCard from "./cards/ImageCard";

export default function WelcomeBg({children}) {

  
  return (
    <ImageCard
    title={"Welcome to free-space"}
    imagePath={"Free-Space_Cloud.png"}
    >
        {children}
    </ImageCard>
  );
}
