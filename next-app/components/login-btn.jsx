import React, { useState } from 'react';
import { useSession, signIn, signOut } from "next-auth/react"
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import LoginIcon from '@mui/icons-material/Login';

export default function LoginButton() {
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  console.log(session)

  if (session) {
    return (
      <>
        <Avatar 
          alt="User Photo" 
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
        </Menu>
      </>
    )
  }

  return (
    <>
      <Button variant="contained" size="medium" endIcon={<LoginIcon />} onClick={() => signIn()}>
          Sign in
      </Button>
    </>
  )
}