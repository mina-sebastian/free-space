import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import MyAppbar from './header/MyAppBar';
import MyAsideBar from './aside/MyAsideBar';


const drawerWidth = 240;

// Styled component for the main content area
const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean; // Optional prop to control whether the drawer is open
}>(({ theme, open }) => ({
  flexGrow: 1, // Allow the main content area to grow
  padding: theme.spacing(3), // Padding around the content
  transition: theme.transitions.create('margin', { // Transition effect for margin
    easing: theme.transitions.easing.sharp, // Easing function
    duration: theme.transitions.duration.leavingScreen, // Duration of the transition
  }),
  marginLeft: `-${drawerWidth}px`, // Set the left margin to the width of the drawer
  ...(open && { // Adjustments when the drawer is open
    transition: theme.transitions.create('margin', { // Transition effect for margin
      easing: theme.transitions.easing.easeOut, // Easing function
      duration: theme.transitions.duration.enteringScreen, // Duration of the transition
    }),
    marginLeft: 0, // Reset the left margin to 0 when the drawer is open
  }),
}));


// Styled component for the drawer header
const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex', // Flex display for alignment
  alignItems: 'center', // Center the items vertically
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar, // Use the toolbar mixin for styling
  justifyContent: 'flex-end', // Align items to the end of the container
}));

// Default background component for the application
export default function DefaultBg({currentlyOpen, children, folderId, refetchId}) {
  const [open, setOpen] = React.useState(false); // State to manage the open state of the drawer

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <MyAppbar open={open} setOpen={setOpen} />
      <MyAsideBar open={open} setOpen={setOpen} currentlyOpen={currentlyOpen} folderId={folderId} refetchId={refetchId} />
      <Main open={open}>
        <DrawerHeader />
        {children}
      </Main>
    </Box>
  );
}
