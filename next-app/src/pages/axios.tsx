import Head from "next/head";
import Image from "next/image";
import MyAppbar from "../../components/MyAppbar";
import { Container, Grid, useTheme } from "@mui/material";
import { useState } from "react";

import axios from "axios";

export default function Home() {
    const theme = useTheme();


    // this is a special hook that allows us to store data in the component
    // we can alter the data(with setData) and the component will re-render
    const [data, setData] = useState({});

    // this is a special hook that allows will store the loading state of the request
    const [loading, setLoading] = useState(false);

    // this is a special hook that will store the error state of the request
    const [error, setError] = useState(null);

    const fetchData = async () => {

        try {
            setLoading(true);
            // this will make the request to the api
            const response = await axios.get("https://jsonplaceholder.typicode.com/posts/1");
            // this will set the data to the response data
            setData(response.data);
            // this will set the loading state to false
            setLoading(false);
        } catch (error) {
            // this will set the error state to the error
            setError(error);
        }
    }
  
  return (
    <Grid sx={{backgroundColor: theme.palette.background.default}}>
      <MyAppbar/>
        <Container>
            <h1>Simple GET request</h1>
            {/*This button will call fetchData() which will make a GET request to the API*/}
            <button onClick={fetchData}>Get Data</button>   
            {loading && <p>Loading...</p>}
            {error && <p>Error: {error.message}</p>}
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </Container>
    </Grid>
  );
}
