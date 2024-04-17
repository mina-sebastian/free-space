import * as React from 'react';
import AsideNewButton from './AsideNewButton'; 
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudIcon from '@mui/icons-material/Cloud';

    
export default function MyAsideBar(){

  return(
    <Box sx={{ overflow: 'auto' }}>
      <List sx={{marginTop:8}}>
        <ListItem disablePadding>
          <AsideNewButton/> 
        </ListItem>
        {[
          { text: 'Home', icon: <HomeIcon /> },
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
  ) 
}
