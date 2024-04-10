import Head from "next/head";
import Image from "next/image";
import MyAppbar from "../../components/MyAppbar";
import { Avatar, Container, Divider, Grid, Paper, Typography, useTheme } from "@mui/material";
import * as React from 'react';
import DefaultBg from "../../components/DefaultBg";
import IconCard from "../../components/cards/IconCard";


export default function Home() {
  const theme = useTheme();
  
  return (
    <DefaultBg>
      <IconCard title={"Welcome to free-space"}>
        {/* <Typography align="center">*/}
        <Typography align="center">
            
        </Typography>
        </IconCard>
    </DefaultBg>
  );
}
