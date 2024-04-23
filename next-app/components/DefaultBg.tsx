import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import MyAppbar from './header/MyAppBar';
import MyAsideBar from './aside/MyAsideBar';
import RouterBreadcrumbs from './aside/FolderNavButton';
import FileMenu from './main/FileMenu';


const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));



const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

export default function DefaultBg({children}) {
  const [open, setOpen] = React.useState(false);
  
  const [fetchedData, setFetchedData] = React.useState<any>(null); // State to store fetched data


  // Callback function to handle fetched data
  const handleDataFetched = (data: any) => {
    // Set the fetched data to the state
    setFetchedData(data);
  };


  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <MyAppbar open={open} setOpen={setOpen} />

      <MyAsideBar open={open} setOpen={setOpen} onDataFetched={handleDataFetched} />
        
      <Main open={open}>
        <DrawerHeader />
        {children}
        <FileMenu folders={fetchedData?.folders || []} files={fetchedData?.files || []} />
      </Main>
    </Box>
  );
}
