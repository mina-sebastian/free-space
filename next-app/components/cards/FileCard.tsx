// FileCard.js

import { Avatar, Typography, Paper, Divider, IconButton, useTheme, Menu, MenuItem } from "@mui/material";
import React, { useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import axios from 'axios'; // Import axios for making API calls
import { useRouter } from "next/router";
import Link from "next/link";

export default function FileCard({ itemId, itemType, name, link=""}) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);

  const router = useRouter();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRenameItem = () => {
    const newName = prompt(`Enter new ${itemType} name:`, name); // Prompt user for new item name
    console.log("New", itemType, "name:", newName, "ID:", itemId);
    if (newName !== null) {
      // If user entered a new name
      axios.put(`/api/${itemType}/${itemId}/rename`, { newName }) // Make API call to rename item
        .then(response => {
          console.log("Item renamed successfully:", response.data);
          router.replace(router.asPath);
          // Optionally, you can update the UI to reflect the new name
        })
        .catch(error => {
          console.error("Error renaming item:", error);
          // Handle error if renaming fails
        });
    }
    handleClose(); // Close the menu after renaming
  };

  const handleDeleteItem = () => {
    if (window.confirm(`Are you sure you want to delete ${itemType} "${name}" and all its contents?`)) {
      // Confirm deletion
      axios.delete(`/api/${itemType}/${itemId}/delete`) // Make API call to delete item
        .then(response => {
          console.log("Item deleted successfully:", response.data);
          router.replace(router.asPath);
          // Optionally, you can update the UI to reflect the deletion
        })
        .catch(error => {
          console.error("Error deleting item:", error);
          // Handle error if deletion fails
        });
    }
    handleClose(); // Close the menu after deletion
  };

  return (
    <Paper sx={{ width: '100%', height: 50, p: 2, display: 'flex', alignItems: 'center' }}>
      <Typography 
        component={Link} 
        href={itemType === 'folder' ? `${router.asPath+"/"+name}` : link} // Set the href like this
        variant="h6" 
        sx={{ flexGrow: 1, ml: 3 }}
      >
        {name}
      </Typography>
      <IconButton
        aria-label="more"
        aria-controls="menu"
        aria-haspopup="true"
        onClick={handleClick}
        size="large"
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={handleRenameItem}>Rename</MenuItem>
        <MenuItem onClick={handleDeleteItem}>Delete</MenuItem>
        <MenuItem onClick={() => onShare(itemType, itemId, name)}>Share</MenuItem>
        {/* Add other menu items here */}
      </Menu>
    </Paper>
  );
}
