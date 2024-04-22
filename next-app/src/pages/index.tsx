import { Avatar, Button, Container, Divider, Grid, Paper, Stack, TextField, Typography, useTheme } from "@mui/material";
import * as React from 'react';
import DefaultBg from "../../components/DefaultBg";
import ImageCard from "../../components/cards/ImageCard";
import axios from 'axios';
import WelcomeBg from "../../components/WelcomeBg";
import SearchBar from "../../components/SearchBar";
import { useSession} from "next-auth/react"
import Uppy from '@uppy/core';
import UploadModal from "../../components/UploadModal";

export default function Home({uppy}: {uppy: Uppy}) {

  const { data: session } = useSession();
  
  return (
    <DefaultBg>
      <WelcomeBg>
        <UploadModal/>
        {session ? (
          <SearchBar/>):
          <Typography variant="h4" align="center">
            free-space is a local cloud storage service that allows you to store your files on your server!
          </Typography>
        }        
      </WelcomeBg>
    </DefaultBg>
  );
}
