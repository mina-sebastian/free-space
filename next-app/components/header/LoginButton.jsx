import React, { useState } from 'react';
import { useSession, signIn, signOut } from "next-auth/react"
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import LoginIcon from '@mui/icons-material/Login';

import { Grid, useTheme } from "@mui/material";
import Link from 'next/link';
export default function LoginButton() {
  const { data: session } = useSession(); // Retrieve session data from NextAuth
  const [anchorEl, setAnchorEl] = useState(null); // State for anchor element of menu
  const open = Boolean(anchorEl); // Boolean state to determine if menu is open
  const theme = useTheme(); // Access the current theme from MUI

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget); // Set anchor element when clicking avatar
  };

  const handleClose = () => {
    setAnchorEl(null); // Close menu by resetting anchor element to null
  };

  if (session) {
    // If user is authenticated
    return (
      <>
        <Avatar 
          alt={session.user.name} // Display user's name as alt text for accessibility
          src={session.user.image} // Display user's image
          onClick={handleClick} // Open menu on avatar click
          sx={{ cursor: 'pointer' }} // Styling for pointer cursor on avatar
        />
        <Menu
          id="logout-menu" // Menu ID for accessibility
          anchorEl={anchorEl} // Anchor element for positioning menu
          open={open} // Open state of the menu
          onClose={handleClose} // Close menu on outside click or escape key
          MenuListProps={{
            'aria-labelledby': 'avatar-button', // Accessibility label for menu
          }}
        >
          <MenuItem onClick={() => {signOut(); handleClose(); }}>Sign out</MenuItem> {/* Menu item to sign out */}
          {session.user.admin && <MenuItem component={Link} href="/admin">Edit Users</MenuItem>} {/* Conditional menu item for admin users */}
        </Menu>
      </>
    )
  }

  // If user is not authenticated
  return (
    <>
      <Button variant="contained" size="medium" sx={{color: theme.palette.background.default, backgroundColor: "white"}} endIcon={<LoginIcon />} onClick={() => signIn()}>
          Sign in
      </Button>
    </>
  )
}
