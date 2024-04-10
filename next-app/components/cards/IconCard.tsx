
import { Avatar, Container, Divider, Grid, Paper, Typography, useTheme } from "@mui/material";
import * as React from 'react';

export default function IconCard({title, icon, children}) {
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
            {icon}
        </Avatar>
        <Typography variant='h3' align="center">
            {title}
        </Typography>
        <Divider sx={{pt:5}}/>
        {children}
    </Paper>

  );
}
