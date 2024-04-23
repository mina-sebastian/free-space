import { Avatar, Button, Container, Divider, Grid, Paper, Stack, TextField, Typography, useTheme } from "@mui/material";
import * as React from 'react';
import DefaultBg from "../../components/DefaultBg";
import ImageCard from "../../components/cards/ImageCard";
import axios from 'axios';
import WelcomeBg from "../../components/main/WelcomeBg";
import SearchBar from "../../components/main/SearchBar";
import { useSession} from "next-auth/react"
import Uppy from '@uppy/core';
import UploadModal from "../../components/UploadModal";
import { useRouter } from 'next/router'
import FileMenu from "../../components/main/FileMenu";

export default function FolderPath() {

  const { data: session } = useSession();
  const router = useRouter()
  const [fetchedData, setFetchedData] = React.useState<any>(null); // State to store fetched data

  console.log(router.query.filepath)

  const handleDataFetched = (data: any) => {
    // Set the fetched data to the state
    setFetchedData(data);
  };
  
  return (
    <DefaultBg onDataFetched={handleDataFetched}>
      <WelcomeBg>
        <Typography variant="h4" align="center">
        Do what you know here
        </Typography>
      </WelcomeBg>
      <FileMenu folders={fetchedData?.folders || []} files={fetchedData?.files || []} />
    </DefaultBg>
  );
}
