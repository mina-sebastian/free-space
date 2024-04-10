import Head from "next/head";
import Image from "next/image";
import MyAppbar from "../../components/MyAppbar";
import { Avatar, Container, Divider, Grid, Paper, Typography, useTheme } from "@mui/material";
import * as React from 'react';
import DefaultBg from "../../components/DefaultBg";
import CloudIcon from '@mui/icons-material/Cloud';
import IconCard from "../../components/cards/IconCard";
import LoginButton from "../../components/login-btn";

export default function Home() {
  const theme = useTheme();
  
  return (
    <DefaultBg>
      <IconCard
        title={"Welcome to free-space"}
        icon={<CloudIcon sx={{ width: 56, height: 56, color: theme.palette.primary.contrastText }}/>
        }
      >
      <IconCard
        title={"Welcome to free-space"}
        icon={<CloudIcon sx={{ width: 56, height: 56, color: theme.palette.primary.contrastText }}/>
        }
      >
        {/* <Typography align="center">*/}
        <Typography variant="h4" align="center">
          free-space is a local cloud storage service that allows you to store your files on your server!
        <Typography variant="h4" align="center">
          free-space is a local cloud storage service that allows you to store your files on your server!
        </Typography>

        <LoginButton>

        </LoginButton>

        </IconCard>
    </DefaultBg>
  );
}
