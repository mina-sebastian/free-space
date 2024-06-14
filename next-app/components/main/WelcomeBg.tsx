import * as React from 'react';
import ImageCard from "../cards/ImageCard";

// Functional component representing the welcome background
export default function WelcomeBg({children}) {

  
  return (
    <ImageCard
    title={"Welcome to free-space"}
    imagePath={"Free-Space_Cloud.png"}
    >
        {children} {/* Render children components */}
    </ImageCard>
  );
}
