
import { Avatar, Container, Divider, Grid, Paper, Typography, useTheme } from "@mui/material";
import * as React from 'react';

export default function IconCard({title, icon, children}) {
    const theme = useTheme(); // Get the current theme
    
    return (
      <Paper sx={{p: 5}}>
          <Avatar
              sx={{
                  width: 80,
                  height: 80,
                  backgroundColor: theme.palette.primary.main,
                  marginRight:'auto',
                  marginLeft:'auto'
              }}
          >
              {icon} {/* Display the icon inside the Avatar */}
          </Avatar>
          <Typography variant='h3' align="center">
              {title} {/* Display the title with variant h3 */}
          </Typography>
          <Divider sx={{pt:5}}/> {/* Divider with top padding 5 */}
          {children} {/* Render children components */}
      </Paper>
    );
  }
  