
import { Avatar, Container, Divider, Grid, Paper, Typography, useTheme } from "@mui/material";
import * as React from 'react';

export default function ImageCard({title, imagePath, children}) {
  const theme = useTheme();
  
  return (
    <Paper sx={{m:2, p: 2}}>
        <Avatar
            sx={{
                width: 150,
                height: 150,
                backgroundColor: 'transparent',
                marginRight:'auto',
                marginLeft:'auto',
                marginBottom: -5,
                marginTop: -5
            }}

            src = {imagePath}
        >
        </Avatar>
        <Typography variant='h3' align="center">
            {title}
        </Typography>
        <Divider sx={{pt:5}}/>
        {children}
    </Paper>

  );
}
