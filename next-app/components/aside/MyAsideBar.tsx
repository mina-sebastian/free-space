// MyAsideBar.js
import React, { useState } from 'react';
import AsideNewButton from './AsideNewButton';
import { Box, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import CloudIcon from '@mui/icons-material/Cloud';
import Drawer from '@mui/material/Drawer';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Folder } from '@mui/icons-material';
import FolderNavButton from './FolderNavButton';

const drawerWidth = 240;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));
    
export default function MyAsideBar({ open, setOpen, onDataFetched }) {
  const [outerFolderId, setFolderId] = useState(0); // State to store folderId

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleFolderChange = (id) => {
    setFolderId(id);
  };
  

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
      open={open}
    >
      <DrawerHeader>
        <IconButton onClick={handleDrawerClose}>
          <ChevronLeftIcon />
        </IconButton>
      </DrawerHeader>
      <Divider />
      <Box sx={{ overflow: 'auto' }}>
        <List sx={{ marginTop: 8, marginBottom: 8 }}>
          <ListItem disablePadding>
            <AsideNewButton outerFolderId={outerFolderId} /> {/* Pass folderId as a prop */}
          </ListItem>
          <ListItem>
            {/* Pass the onDataFetched prop to FolderNavButton */}
            <FolderNavButton onDataFetched={onDataFetched} outerFolderId={handleFolderChange}/>
          </ListItem>
          {[
            { text: 'Bin', icon: <DeleteIcon /> },
            { text: 'Storage', icon: <CloudIcon /> }
          ].map((item, index) => (
            <ListItem key={item.text} disablePadding >
              <ListItemButton>
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      <Divider />
    </Drawer>
  )
}
