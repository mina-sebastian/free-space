import React from "react";
import DocViewer, { DocRenderer } from "@cyntler/react-doc-viewer";
import ReactPlayer from "react-player";



const MyCustomVideoRenderer: DocRenderer = ({
  mainState: { currentDocument },
}) => {
  if (!currentDocument) return null;
//   console.log("currentDocument", currentDocument);

  return (
    <div style={{ display: "flex", marginLeft: 'auto', marginRight:'auto', marginBottom: "1rem" }}>
      <ReactPlayer
        url={currentDocument.uri}
        controls
      />
    </div>
  );
};

// Add common video file types to the renderer
MyCustomVideoRenderer.fileTypes = [
  "mp4", "video/mp4",
  "webm", "video/webm",
  "ogg", "video/ogg",
  "avi", "video/x-msvideo",
  "mkv", "video/x-matroska",
  "mov", "video/quicktime",
];
MyCustomVideoRenderer.weight = 1;

export default MyCustomVideoRenderer;
