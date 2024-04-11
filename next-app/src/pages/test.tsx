import MyAppbar from "../../components/MyAppbar";
import { Button, CircularProgress, Container, Grid, Stack, TextField, Typography, useTheme } from "@mui/material";
import { useState, useEffect } from "react";

import axios from "axios";
import { useSession } from "next-auth/react";
import AddUser from "../../components/pages/test/AddUser";
import ShowUsers from "../../components/pages/test/ShowUsers";

// TEST PAGE
// THIS IS HOW EVERY PAGE SHOULD BE DONE

export default function TestPage() {
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

    // Usually we call the functions that do the GET requests "fetch"
    const fetchUsers = async () => {
        //enable loading state
        setLoading(true);
        try {
            // this will make the request to the api
            const response = await axios.get("/api/test/getUsers");
            // this will set the data to the response data
            setData(response.data);

        } catch (error) {
            // this will set the error state to the error
            setError(error);
        }
        // this will set the loading state to false
        setLoading(false);
    }

    // Usually we call the functions that do the POST requests "add" or "save"
    // this is a simple test function that sends the args to the '/api/addUser' endpoint
    const addUser = async () => {
      // enable loading state
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

    useEffect(() => {
        fetchUsers();
    }, []);
    
  
  return (
    <Grid sx={{backgroundColor: theme.palette.background.default}}>
      <MyAppbar/>
        <AddUser/>
        <ShowUsers/>
    </Grid>
  );
}
