import MyAppbar from "../../components/MyAppbar";
import { Button, CircularProgress, Container, Grid, Stack, TextField, Typography, useTheme } from "@mui/material";
import { useState, useEffect } from "react";

import axios from "axios";
import { useSession } from "next-auth/react";
import AddUser from "../../components/pages/test/AddUser";
import ShowUsers from "../../components/pages/test/ShowUsers";

// TEST PAGE
// THIS IS HOW EVERY PAGE SHOULD BE DONE

export default function TestPage() {
    const theme = useTheme();
  
  return (
    <Grid sx={{backgroundColor: theme.palette.background.default}}>
      <MyAppbar/>
        <AddUser/>
        <ShowUsers/>
    </Grid>
  );
}
