import React, { useState } from 'react';
import { useSession, signIn, signOut } from "next-auth/react"
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import LoginIcon from '@mui/icons-material/Login';

import { Grid, useTheme } from "@mui/material";

export default function LoginButton() {
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const theme = useTheme();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  if (session) {
    return (
      <>
        <Avatar 
          alt={session.user.name}
          src={session.user.image}
          onClick={handleClick}
          sx={{ cursor: 'pointer' }}
        />
        <Menu
          id="logout-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'avatar-button',
          }}
        >
          <MenuItem onClick={() => {signOut(); handleClose(); }}>Sign out</MenuItem>
          <MenuItem onClick={() => {editUsers(); handleClose(); }}>Edit users</MenuItem>
        </Menu>
      </>
    )
  }

  return (
    <>
      <Button variant="contained" size="medium" sx={{color: theme.palette.background.default, backgroundColor: "white"}} endIcon={<LoginIcon />} onClick={() => signIn()}>
          Sign in
      </Button>
    </>
  )
}
