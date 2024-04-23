import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import { Divider, ListItemButton, ListItemIcon, ListItemText, Box } from '@mui/material';
import UploadFileButton from './UploadFileButton';
import axios from 'axios'; // Import axios for making API calls

export default function AsideNewButton({outerFolderId}) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNewFolderClick = () => {
    const newName = prompt(`Enter new folder name:`); 
    console.log("New folder name:", newName, "Outer folder ID:", outerFolderId);
    // Make API call to create a new folder
    axios.post(`/api/folder/${outerFolderId}/createFolder`, { newName })
    .then(response => {
      console.log('New folder created:', response.data);
      handleClose(); // Close the menu after successful creation
      // You can add further actions, such as updating the UI with the new folder
    })
    .catch(error => {
      console.error('Error creating new folder:', error);
      // Handle error cases if needed
    });
  };

  return (
    <>
      <ListItemButton
        id="demo-positioned-button"
        aria-controls={open ? 'demo-positioned-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <ListItemIcon>
          <AddIcon/>
        </ListItemIcon>
        <ListItemText primary="New"/>  
      </ListItemButton>
      <Menu
        id="demo-positioned-menu"
        aria-labelledby="demo-positioned-button"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ minWidth: 200 }}>
          <MenuItem onClick={handleNewFolderClick}>New Folder</MenuItem> {/* Call handleNewFolderClick on click */}
          <Divider/>
          <UploadFileButton onClose={handleClose} />
          {/* <UploadFolderButton onClose={handleClose}/> */}
        </Box>
      </Menu>
    </>
  );
}
