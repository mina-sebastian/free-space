
import { Avatar, Container, Divider, Grid, Paper, Typography, useTheme } from "@mui/material";
import * as React from 'react';

import DashboardIcon from '@mui/icons-material/Dashboard';  


export default function DefaultBg({title, children}) {
  const theme = useTheme();
  
  return (
    <Paper sx={{m:2, p: 2}}>
        <Avatar
            sx={{
                width: 80,
                height: 80,
                backgroundColor: theme.palette.primary.main,
                marginRight:'auto',
                marginLeft:'auto'
            }}
        >
            <DashboardIcon sx={{ width: 56, height: 56, color: theme.palette.primary.contrastText }}/>
        </Avatar>
        <Typography variant='h3' align="center">
            {title}
        </Typography>
        <Divider sx={{pt:5}}/>
        {children}
    </Paper>

  );
}
