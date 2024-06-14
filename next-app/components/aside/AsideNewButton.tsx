import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import { Divider, ListItemButton, ListItemIcon, ListItemText, Box } from '@mui/material';
import UploadFileButton from './UploadFileButton';
import axios from 'axios'; // Import axios for making API calls
import { useRouter } from 'next/router';

export default function AsideNewButton({outerFolderId}) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null); // State to track the anchor element for the menu
  const open = Boolean(anchorEl); // Boolean state to determine if the menu is open

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget); // Set the anchor element to the current target (opens the menu)
  };

  const handleClose = () => {
    setAnchorEl(null); // Clear the anchor element (closes the menu)
  };

  const router = useRouter(); // Initialize router for navigation

  const handleNewFolderClick = () => {
    const newName = prompt(`Enter new folder name:`); // Prompt user for new folder name
    // Make API call to create a new folder
    axios.post(`/api/folder/${outerFolderId}/createFolder`, { newName })
    .then(response => {
      handleClose(); // Close the menu after successful creation
      router.replace(router.asPath, undefined, { shallow: true }); // Refresh the current page without a full reload
      // You can add further actions, such as updating the UI with the new folder
    })
    .catch(error => {
      console.error('Error creating new folder:', error); // Log error if folder creation fails
      // Handle error cases if needed
    });
  };

  return (
    <>
      {/* Button to open the menu */}
      <ListItemButton
        id="demo-positioned-button"
        aria-controls={open ? 'demo-positioned-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <ListItemIcon>
          <AddIcon/> {/* Add icon for the button */}
        </ListItemIcon>
        <ListItemText primary="New"/> {/* Button text */}
      </ListItemButton>
      {/* Menu component */}
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
          <UploadFileButton onClose={handleClose} outerFolderId={outerFolderId} /> {/* Custom component to upload files */}
        </Box>
      </Menu>
    </>
  );
}
