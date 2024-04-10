import { Avatar, Button, Container, Divider, Grid, Paper, Stack, TextField, Typography, useTheme } from "@mui/material";
import * as React from 'react';
import DefaultBg from "../../components/DefaultBg";
import ImageCard from "../../components/cards/ImageCard";
import axios from 'axios';

export default function Home() {
  const theme = useTheme();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [image, setImage] = React.useState('');
  
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

        <Stack sx={{m: '5em'}} spacing={2} direction="column">
          <TextField
            id="name-input"
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            id="email-input"
            label="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            id="image-input"
            label="Image URL"
            value={image}
            onChange={(event) => setImage(event.target.value)}
          />

          <Button onClick={async () => {
            try {
              const response = await addUser(name, email, image);
              alert(response.message);
            } catch (error) {
              alert(error.message);
            }
          }}>
            Add User
          </Button>
        </Stack>

      </ImageCard>
    </DefaultBg>
  );
}

async function addUser(name, email, image) {
  try {
    const response = await axios.post('/api/addUser', {
      name,
      email,
      image,
    });

    return response.data;
  } catch (error) {
    throw new Error(error.response ? error.response.data.error : 'Failed to add user');
  }
}
