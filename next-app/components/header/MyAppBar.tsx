import * as React from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Tooltip from '@mui/material/Tooltip';
import CloudIcon from '@mui/icons-material/Cloud';
import LoginButton from './LoginButton';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import { styled, useTheme } from '@mui/material/styles';
import { useSession } from 'next-auth/react';
// Define the width of the drawer component
const drawerWidth = 240;

// Define the props for the AppBar component, extending MuiAppBarProps
interface AppBarProps extends MuiAppBarProps {
  open?: boolean; // Optional prop to control whether the drawer is open
}

// Styled component based on MuiAppBar, forwarding props except 'open'
const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  // Transition effects for margin and width based on theme
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  // Adjustments when the drawer is open
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

// Functional component representing the application's app bar
function MyAppbar({ open, setOpen }) {
  // State to manage the anchor element for navigation menu
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  // State to manage the anchor element for user menu
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  // Hook to retrieve session data using next-auth/react
  const { data: session } = useSession();

  // Close handler for the navigation menu
  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  // Handler to open the drawer
  const handleDrawerOpen = () => {
    setOpen(true);
  };

  return (
    <AppBar position="fixed" open={open}>
      {/* Toolbar component with gutter disabled */}
      <Toolbar disableGutters>
        {/* Conditional rendering based on session existence */}
        {session ? (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ ml: 4, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
        ) : null}
        
        {/* Cloud icon with conditional display based on screen size */}
        <CloudIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1, ml: 8 }} />
        
        {/* Typography component representing the app name with link */}
        <Typography
          variant="h6"
          noWrap
          component="a"
          href="/"
          sx={{
            mr: 2,
            display: { xs: 'none', md: 'flex' },
            fontFamily: 'monospace',
            fontWeight: 700,
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          free-space
        </Typography>

        {/* Box component to handle display based on screen size */}
        <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
          {/* Menu component for mobile view */}
          <Menu
            id="menu-appbar"
            anchorEl={anchorElNav}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            open={Boolean(anchorElNav)}
            onClose={handleCloseNavMenu}
            sx={{
              display: { xs: 'block', md: 'none' },
            }}
          >
            {/* Menu items will be added here */}
          </Menu>
        </Box>

        {/* Cloud icon for mobile view */}
        <CloudIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
        
        {/* Typography component for mobile view */}
        <Typography
          variant="h5"
          noWrap
          component="a"
          href="/"
          sx={{
            mr: 2,
            display: { xs: 'flex', md: 'none' },
            flexGrow: 1,
            fontFamily: 'monospace',
            fontWeight: 700,
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          free-space
        </Typography>

        {/* Box component for flexible display */}
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }} />

        {/* Box component with tooltip for login button */}
        <Box sx={{ flexGrow: 0, mr: 10 }}>
          <Tooltip title="Open settings">
            <LoginButton />
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

// Export the MyAppbar component as default
export default MyAppbar;
