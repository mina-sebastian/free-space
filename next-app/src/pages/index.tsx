import Head from "next/head";
import Image from "next/image";
import MyAppbar from "../../components/MyAppbar";
import { Container, Grid, useTheme } from "@mui/material";

export default function Home() {
  const theme = useTheme();
  
  return (
    <Grid sx={{backgroundColor: theme.palette.background.default}}>
      <MyAppbar/>
    </Grid>
  );
}
