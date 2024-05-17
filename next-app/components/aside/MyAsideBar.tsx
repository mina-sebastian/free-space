import React, { useState } from 'react';
import AsideNewButton from './AsideNewButton';
import { Box, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Drawer } from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import FolderListButtons from './FolderListButtons';
import { useRouter } from 'next/router';

const drawerWidth = 240;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

export default function MyAsideBar({ currentlyOpen, open, setOpen, folderId, refetchId = 'initial' }) {
  const handleDrawerClose = () => {
    setOpen(false);
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
        <IconButton onClick={handleDrawerClose}>
          <ChevronLeftIcon />
        </IconButton>
      </DrawerHeader>
      <Divider />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {router.asPath.startsWith('/f/Home') && (
            <ListItem disablePadding>
              <AsideNewButton outerFolderId={folderId} />
            </ListItem>
          )}
          <ListItem>
            <FolderListButtons currentlyOpen={currentlyOpen} refetchId={refetchId} />
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemIcon>
                <CloudIcon />
              </ListItemIcon>
              <ListItemText primary="Storage" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
      <Divider />
    </Drawer>
  );
}
