import Head from "next/head";
import Image from "next/image";
import MyAppbar from "../../components/MyAppbar";
import { Container, Grid, useTheme } from "@mui/material";
import * as React from 'react';
import Box from '@mui/material/Box';

export default function Home() {
  const theme = useTheme();
  
  return (
    <Grid sx={{backgroundColor: theme.palette.background.default}}>
      <MyAppbar/>

      <Box component="section" sx={{ p: 25, border: '1px transparent white' }}>
        Basic instructions for the user:
        <Box component="section" sx={{ p: 1, border: '1px transparent white' }}>
            1. Login/Logout
        </Box>
        <Box component="section" sx={{ p: 1, border: '1px transparent white' }}>
            2. Upload Files
        </Box>
      </Box>
    </Grid>
  );
}
