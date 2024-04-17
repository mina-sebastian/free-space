import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import { Divider, ListItemButton, ListItemIcon, ListItemText, Box } from '@mui/material';
import UploadFileButton from './UploadFileButton';
import UploadFolderButton from './UploadFolderButton';

export default function AsideNewButton() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
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
          <MenuItem onClick={handleClose}>New Folder</MenuItem>
          <Divider/>
          <UploadFileButton onClose={handleClose} />
          <UploadFolderButton onClose={handleClose}/>
        </Box>
      </Menu>
    </>
  );
}
