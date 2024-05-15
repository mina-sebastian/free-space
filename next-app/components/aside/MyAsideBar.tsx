// MyAsideBar.js
import React, { useState } from 'react';
import AsideNewButton from './AsideNewButton';
import { Avatar, Box, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import CloudIcon from '@mui/icons-material/Cloud';
import Drawer from '@mui/material/Drawer';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import FolderListButtons from './FolderListButtons';
import { useRouter } from 'next/router';
import ImageCard from '../cards/ImageCard';

const drawerWidth = 240;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));
    
export default function MyAsideBar({ currentlyOpen, open, setOpen, folderId, refetchId="initial" }) {
  const [outerFolderId, setFolderId] = useState(0); // State to store folderId

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleFolderChange = (id) => {
    setFolderId(id);
  };
  
  const router = useRouter();

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
        <Avatar
            sx={{
                width: 90,
                height: 90,
                backgroundColor: 'transparent',
                marginRight:'auto',
                marginLeft:'auto',
                marginBottom: -5,
                marginTop: -5
            }}

            src = {"/Free-Space_logo.png"}
        >
        </Avatar>
        <IconButton onClick={handleDrawerClose}>
          <ChevronLeftIcon />
        </IconButton>
      </DrawerHeader>
      <Divider />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {router.asPath.startsWith("/f/Home") && <ListItem disablePadding>
            <AsideNewButton outerFolderId={folderId} />
          </ListItem>}
          <ListItem>
            <FolderListButtons currentlyOpen={currentlyOpen} outerFolderId={handleFolderChange} refetchId={refetchId}/>
          </ListItem>

            <ListItem disablePadding >
              <ListItemButton>
                <ListItemIcon>
                  <CloudIcon />
                </ListItemIcon>
                <ListItemText primary={"Storage"} />
              </ListItemButton>
            </ListItem>

        </List>
      </Box>
      <Divider />
    </Drawer>
  )
}
