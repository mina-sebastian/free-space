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

const drawerWidth = 240;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));


function MyAppbar({ open, setOpen }) {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const { data: session } = useSession();

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  return (
    <AppBar position="fixed" open={open}>
      <Toolbar disableGutters>
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
        ): null}
        <CloudIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1, ml:8 }} />
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

        <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
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
          </Menu>
        </Box>
        <CloudIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
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
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}/>

        <Box sx={{ flexGrow: 0, mr:10 }}>
        <Tooltip title="Open settings" >
          <LoginButton/>
        </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
export default MyAppbar;
