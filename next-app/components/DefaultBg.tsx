import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import MyAppbar from './MyAppbar';
import MyAsideBar from './MyAsideBar'
import { Grid, useTheme } from "@mui/material";
import { useSession} from "next-auth/react"

const drawerWidth = 240;

export default function DefaultBg({ children }) {
  const theme = useTheme();
  const { data: session } = useSession();

  return (
    <Grid sx={{backgroundColor: theme.palette.background.default}}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <MyAppbar/>
        </AppBar>
        {session ? (
          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box'},
            }}
          >
            <Toolbar />
            <MyAsideBar/>
          </Drawer>
        ): null}
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Grid
            container
            spacing={0}
            direction="column"
            alignItems="center"
            sx = {{
              paddingTop: 12,
              minHeight: '100vh'
          }}>
            <Grid width="100%" maxWidth="1500px" alignItems="center" sx={{pl:2, pr:2, pt:3}}>
                {children}
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Grid>
  );
}




