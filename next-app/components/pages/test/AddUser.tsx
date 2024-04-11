import MyAppbar from "../../../components/MyAppbar";
import { Button, CircularProgress, Container, Grid, Stack, TextField, Typography, useTheme } from "@mui/material";
import { useState, useEffect } from "react";

import axios from "axios";
import { useSession } from "next-auth/react";

export default function AddUser() {
    const { data: session } = useSession();

    const theme = useTheme();

    // this is a special hook that allows us to store data in the component
    // we can alter the data(with setData) and the component will re-render
    const [data, setData] = useState<any>({});

    // this is a special hook that allows will store the loading state of the request
    const [loading, setLoading] = useState(false);

    // this is a special hook that will store the error state of the request
    const [error, setError] = useState(null);

    // these hooks that store the fields
    // for every field we need a hook
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [image, setImage] = useState('');

        // Usually we call the functions that do the POST requests "add" or "save"
    // this is a simple test function that sends the args to the '/api/addUser' endpoint
    const addUser = async () => {
        // enable loading state
        setData({});
        setLoading(true);
        try {
          // send data to the endpoint
          const response = await axios.post('/api/test/addUser', {
            name,
            email,
            image,
          });
      
          // set the data to the response data
          setData(response.data);
        } catch (error) {
          // this will set the error state to the error
          console.error(error);
          setError(error.response.data);
        }
        // set the loading state to false
        setLoading(false);
      }

      if(!session){
        return (
          <Container>
            <Typography variant="h4">You are not authenticated. Please login to access this page</Typography>
          </Container>
        )
      }

      if(loading){
        return (
          <Container sx={{m:10}}>
            <CircularProgress />
          </Container>
        )
      }

    // Usually we call the functions that do the GET requests "fetch"
    return (

        <Container sx={{m:10}}>
            {data.message && <Typography color={"aqua"} variant="h4">Message from the server: {data.message}</Typography>}
            {error && <Typography color={"red"} variant="h4">Error from the server: {error.message}</Typography>}
            <Typography variant="h4">Add a test user to the database</Typography>
            <Typography variant="h6">This is a demo page. This is how all pages should be done</Typography>
            <Stack sx={{m: '5em'}} spacing={2} direction="column">
              {/* This field handles the name. */}
              {/* {name} takes the name from "name" hook and renders */}
              {/* at every key pressed, setName is called: setName(name + {the key pressed}) */}
              <TextField
                id="name-input"
                label="Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              {/* same for email */}
              <TextField
                id="email-input"
                label="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              {/* same for image input */}
              <TextField
                id="image-input"
                label="Image URL"
                value={image}
                onChange={(event) => setImage(event.target.value)}
              />

              {/* Here we call the addUser function with the hook parameters */}
              <Button variant="outlined" onClick={addUser}>
                Add User
              </Button>
            </Stack>
        </Container>

    )

}