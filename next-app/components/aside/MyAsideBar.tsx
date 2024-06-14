import React, { useState } from 'react';
import AsideNewButton from './AsideNewButton';
import { Box, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Drawer } from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import FolderListButtons from './FolderListButtons';
import { useRouter } from 'next/router';
import StorageUsage from './StorageUsage';

const drawerWidth = 240; // Define the width of the drawer

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

export default function MyAsideBar({ currentlyOpen, open, setOpen, folderId, refetchId = 'initial' }) {
  // Function to handle closing the drawer
  const handleDrawerClose = () => {
    setOpen(false);
  };

  const router = useRouter(); // Initialize router for navigation

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
      variant="persistent"
      anchor="left"
      open={open} // Control the open state of the drawer
    >
      <DrawerHeader>
        <IconButton onClick={handleDrawerClose}>
          <ChevronLeftIcon /> {/* Icon to close the drawer */}
        </IconButton>
      </DrawerHeader>
      <Divider /> {/* Divider for separating sections */}
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {/* Conditionally render the AsideNewButton if the current path starts with '/f/Home' */}
          {router.asPath.startsWith('/f/Home') && (
            <ListItem disablePadding>
              <AsideNewButton outerFolderId={folderId} /> {/* Button to create a new item */}
            </ListItem>
          )}
          <ListItem>
            <FolderListButtons currentlyOpen={currentlyOpen} refetchId={refetchId} /> {/* Component to display folder list */}
          </ListItem>
          <ListItem>
            <StorageUsage /> {/* Component to display storage usage */}
          </ListItem>
        </List>
      </Box>
      <Divider /> {/* Divider for separating sections */}
    </Drawer>
  );
}
