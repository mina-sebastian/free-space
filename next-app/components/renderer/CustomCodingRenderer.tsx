import React from "react";
import { DocRenderer } from "@cyntler/react-doc-viewer";

const decodeBase64 = (base64) => {
  try {
    return atob(base64.split(',')[1]);
  } catch (e) {
    console.error("Failed to decode base64:", e);
    return "Failed to decode file content.";
  }
};

// Custom Text Renderer for Python and other programming files
const MyCustomTextRenderer: DocRenderer = ({
  mainState: { currentDocument },
}) => {
  if (!currentDocument) return null;

  const decodedContent = decodeBase64(currentDocument.fileData);

  console.log("Decoded content:", decodedContent);

  return (
    <div id="my-text-renderer">
      <pre id="text-content" style={{ color: "black" }}>{decodedContent}</pre>
    </div>
  );
};

MyCustomTextRenderer.fileTypes = [
  "txt", "text/plain",
  "py", "application/x-python-code",
  "js", "application/javascript",
  "ts", "application/typescript",
  "java", "text/x-java-source",
  "rs", "application/rust",
  "hs", "application/haskell",
  "application/octet-stream",
];
MyCustomTextRenderer.weight = 1;

export default MyCustomTextRenderer;
