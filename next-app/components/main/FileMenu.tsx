// FileMenu.js

import React from 'react';
import { List, ListItem, ListItemText, Divider } from '@mui/material';
import FileCard from '../cards/FileCard';
import LinkGenerationModal from "../modals/LinkGenerationModal";

function FileMenu({ folders, files }) {

  const modalRef = React.useRef();

  return (
    <div>
      <LinkGenerationModal ref={modalRef} />

      <h2>Folders</h2>
      <List>
        {folders.map(folder => (
          <ListItem key={folder.folderId}>
            {/* Pass the onDelete function to the FileCard component */}
            <FileCard itemId={folder.folderId} itemType="folder" name={folder.name} onShare={modalRef.current.open}/>
          </ListItem>
        ))}
      </List>
      <Divider />
      <h2>Files</h2>
      <List>
        {files.map(file => (
          <ListItem key={file.fileId}>
            {/* Pass the onDelete function to the FileCard component */}
            <FileCard itemId={file.fileId} itemType="file" name={file.name} onShare={modalRef.current.open}/>
          </ListItem>
        ))}
      </List>
    </div>
  );
}

export default FileMenu;
