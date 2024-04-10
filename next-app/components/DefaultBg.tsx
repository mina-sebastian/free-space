
import MyAppbar from "./MyAppbar";
import { Grid, useTheme } from "@mui/material";
import * as React from 'react';

export default function DefaultBg({ children }) {
  const theme = useTheme();
  
  return (
    <Grid sx={{backgroundColor: theme.palette.background.default}}>
      <MyAppbar/>
      <Grid
        container
        spacing={0}
        direction="column"
        alignItems="center"
        sx = {{
          paddingTop: 12,
          minHeight: '100vh'
      }}>
        <Grid width="100%" maxWidth="1500px" alignItems="center" sx={{pl:10, pr:10}}>
            {children}
        </Grid>
      </Grid>
    </Grid>
  );
}
