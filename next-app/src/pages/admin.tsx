import React, { useState, useEffect } from 'react';
import { Avatar, CircularProgress, Container, Grid, Paper, Typography, IconButton, Menu, MenuItem, useTheme, Modal, Box, Button } from "@mui/material";
import { styled } from '@mui/material/styles';
import axios from "axios";
import DefaultBg from "../../components/DefaultBg";
import IconCard from "../../components/cards/IconCard";
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

// Styled Paper component for each user
const Item = styled(({ children, ...otherProps }: { children: React.ReactNode }) => (
    <Paper {...otherProps}>{children}</Paper>
))(({ theme }) => ({
    backgroundColor: theme.palette.background.default,
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    border: '2px solid white',
    boxShadow: '0 0 7px white',
    flexGrow: 1,
    minWidth: '150px',
    maxWidth: '400px',
    margin: '7px',
    position: 'relative',
}));

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)', // Center the modal
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

// AdminPage component
export default function AdminPage() {
    const theme = useTheme(); // Get the current theme
    const [users, setUsers] = useState([]); // Initialize users state
    const [anchorEl, setAnchorEl] = useState(null); // Initialize anchorEl state
    const [modalOpen, setModalOpen] = useState(false); // Initialize modalOpen state
    const [modalMessage, setModalMessage] = useState(''); // Initialize modalMessage state
    const open = Boolean(anchorEl); // Determine if the anchorEl is open

    useEffect(() => { // Fetch users on component mount
        axios.get("/api/admin/getUsers") // Fetch users from the API
            .then(response => setUsers(response.data.users)) // Set the users state with the fetched data
            .catch(error => {
                console.error("Error fetching users:", error);
                showModal("Failed to fetch users."); // Show modal with error message
            });
    }, []);

    const showModal = (message) => { // Function to show modal with message
        setModalMessage(message);
        setModalOpen(true);
    };

    const handleCloseModal = () => { // Function to close modal
        setModalOpen(false);
    };

    const handleClick = (event, userId) => { // Function to handle click on user menu
        setAnchorEl({ anchor: event.currentTarget, userId: userId }); // Set the anchorEl state with the clicked target and userId
    };

    const handleClose = () => { // Function to close the menu
        setAnchorEl(null);
    };

    const deleteUser = (userId) => { // Function to delete user
        axios.post('/api/admin/editUsers', { userId, action: 'deleteUser' }) // Send a POST request to the editUsers API with the userId and action
            .then(() => {
                setUsers(users.filter(user => user.id !== userId)); // Filter out the deleted user from the users state
                showModal("User successfully deleted.");
                handleClose();
            })
            .catch(error => {
                console.error("Failed to delete user:", error);
                showModal("Failed to delete user.");
            });
    };

    const makeAdmin = (userId) => { // Function to make user admin
        axios.post('/api/admin/editUsers', { userId, action: 'makeAdmin' }) // Send a POST request to the editUsers API with the userId and action
            .then(() => {
                const updatedUsers = users.map(user => { // Map over the users and update the user with the new admin status
                    if (user.id === userId) {
                        return { ...user, admin: true }; // Set the user as admin
                    }
                    return user;
                });
                setUsers(updatedUsers); // Set the users state with the updated users
                showModal("User successfully made admin.");
                handleClose();
            })
            .catch(error => {
                console.error("Failed to make user admin:", error);
                showModal("Failed to make user admin.");
            });
    };


    const { data: session, status } = useSession(); // Get session data and status from next-auth
    const router = useRouter(); // Initialize router for navigation

    useEffect(() => {
        // Check if the user is not logged in, does not exist in session, or is not an admin
        if(status === "loading") return; // Do nothing while loading
        if (!session || !session.user || !session.user.admin) {
            router.replace('/'); // Redirect to homepage
        }
    }, [session, router, status]); // Depend on session, router and status

    // Optional: Render a loading state while checking session
    if (status === "loading") {
        return (
            <DefaultBg>
                <IconCard title={"Loading..."} icon={<AdminPanelSettingsIcon sx={{ width: 56, height: 56, color: "grey" }} />}>
                    <Container sx={{ mt: 5 }}>
                        <Typography variant="h6" align="center">Checking permissions...</Typography>
                    </Container>
                </IconCard>
            </DefaultBg>
        );
    }

    return (
        <DefaultBg>
            <IconCard title={"Dashboard"} icon={<AdminPanelSettingsIcon sx={{ width: 56, height: 56, color: theme.palette.primary.contrastText }} />}>
                <Container sx={{ mt: 5 }}>
                    <Grid container spacing={{ xs: 1, md: 3 }} columns={{ xs: 2, sm: 8, md: 12 }} sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {users.map(user => ( // Map over the users
                            <Item key={user.email}>
                                <Avatar sx={{ width: 100, height: 100, backgroundColor: 'transparent', marginRight: 'auto', marginLeft: 'auto', marginBottom: 2.5, marginTop: 2.5 }} src={user.image}/>
                                <Typography variant="h6">{user.name}</Typography>
                                <Typography variant="body2">{user.email}</Typography>
                                {!user.admin && ( // Render the make admin button if the user is not an admin
                                    <div style={{ position: 'absolute', top: 0, right: 0 }}> {}
                                        <IconButton aria-label="more" id={`button-${user.id}`} aria-haspopup="true" onClick={(e) => handleClick(e, user.id)}> {/* Add click handler to the IconButton */}
                                            <MoreVertIcon />
                                        </IconButton>
                                        <Menu id={`menu-${user.id}`} anchorEl={anchorEl?.anchor} open={open && anchorEl?.userId === user.id} onClose={handleClose}>
                                            <MenuItem onClick={() => makeAdmin(user.id)}>Make Admin</MenuItem>
                                            <MenuItem onClick={() => deleteUser(user.id)}>Delete User</MenuItem>
                                        </Menu>
                                    </div>
                                )}
                            </Item>
                        ))}
                    </Grid>
                </Container>
            </IconCard>
            <Modal
                open={modalOpen}
                onClose={handleCloseModal}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={modalStyle}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        Notice
                    </Typography>
                    <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                        {modalMessage}
                    </Typography>
                </Box>
            </Modal>
        </DefaultBg>
    );
}
