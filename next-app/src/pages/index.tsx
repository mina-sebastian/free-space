import { Avatar, Button, Container, Divider, Grid, Paper, Stack, TextField, Typography, useTheme } from "@mui/material";
import * as React from 'react';
import DefaultBg from "../../components/DefaultBg";
import ImageCard from "../../components/cards/ImageCard";
import axios from 'axios';

export default function Home() {

  
  return (
    <DefaultBg>
      <ImageCard
        title={"Welcome to free-space"}
        imagePath={"Free-Space_Cloud.png"}
      >
        {/* <Typography align="center">*/}
        <Typography variant="h4" align="center">
          free-space is a local cloud storage service that allows you to store your files on your server!
        </Typography>
      </ImageCard>
    </DefaultBg>
  );
}
