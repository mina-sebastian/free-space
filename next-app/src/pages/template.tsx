import Head from "next/head";
import Image from "next/image";
import MyAppbar from "../../components/MyAppbar";
import { Avatar, Container, Divider, Grid, Paper, Typography, useTheme } from "@mui/material";
import * as React from 'react';
import DefaultBg from "../../components/DefaultBg";
import CloudIcon from '@mui/icons-material/Cloud';
import IconCard from "../../components/cards/IconCard";


export default function Home() {
  const theme = useTheme();
  
  return (
    <DefaultBg>
      <IconCard
        title={"Template page"}
        icon={
          <CloudIcon sx={{ width: 56, height: 56, color: theme.palette.primary.contrastText }}/>
        }
      >
        {/* <Typography align="center"> */}
        <Typography sx={{m:3}} variant="h4" align="center">
          This is a template page. You can use this as a starting point for your next features.
        </Typography>
        
      </IconCard>
    </DefaultBg>
  );
}
