import Head from "next/head";
import Image from "next/image";
import MyAppbar from "../../components/MyAppbar";
import { Avatar, Container, Divider, Grid, Paper, Typography, useTheme } from "@mui/material";
import * as React from 'react';
import DefaultBg from "../../components/DefaultBg";
import CloudIcon from '@mui/icons-material/Cloud';
import ImageCard from "../../components/cards/ImageCard";

export default function Home() {
  const theme = useTheme();
  
  return (
    <DefaultBg>
      <ImageCard
        title={"Welcome to free-space"}
        imagePath={"Free-Space_logo.png"}
      >
        {/* <Typography align="center">*/}
        <Typography variant="h4" align="center">
          free-space is a local cloud storage service that allows you to store your files on your server!
        </Typography>
      </ImageCard>
    </DefaultBg>
  );
}
