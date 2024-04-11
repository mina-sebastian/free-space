import MyAppbar from "../../../components/MyAppbar";
import { Button, CircularProgress, Container, Grid, Stack, TextField, Typography, useTheme } from "@mui/material";
import { useState, useEffect } from "react";

import axios from "axios";
import { useSession } from "next-auth/react";

export default function ShowUsers() {
    const { data: session } = useSession();

    const theme = useTheme();

    // this is a special hook that allows us to store data in the component
    // we can alter the data(with setData) and the component will re-render
    const [data, setData] = useState<any>({});

    // this is a special hook that allows will store the loading state of the request
    const [loading, setLoading] = useState(false);

    // this is a special hook that will store the error state of the request
    const [error, setError] = useState(null);

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
    useEffect(() => {
        fetchUsers();
    }, []);

    // if the user is not authenticated
    if(loading){
    return (
        <Container sx={{m:10}}>
        <CircularProgress />
        </Container>
    )
    }
    return (

        <Container sx={{m:10}}>
            {data.message && <Typography color={"aqua"} variant="h4">Message from the server: {data.message}</Typography>}
            {error && <Typography color={"red"} variant="h4">Error from the server: {error.message}</Typography>}
        </Container>

    )

}