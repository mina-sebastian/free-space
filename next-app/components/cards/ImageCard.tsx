
import { Avatar, Container, Divider, Grid, Paper, Typography, useTheme } from "@mui/material";
import * as React from 'react';

export default function ImageCard({title, imagePath, children}) {
  const theme = useTheme(); // Get the current theme
  
  return (
    <Paper sx={{p: 5}}>
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
            src={imagePath} // Set the image source for the Avatar component
        />
        <Typography variant='h3' align="center">
            {title} {/* Display the title with variant h3 */}
        </Typography>
        <Divider sx={{pt:5}}/> {/* Divider with top padding 5 */}
        {children} {/* Render children components */}
    </Paper>
  );
}