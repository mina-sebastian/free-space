import React, { useState, useEffect } from 'react';
import { Avatar, CircularProgress, Container, Grid, Paper, Typography, IconButton, Menu, MenuItem, useTheme, Modal, Box, Button } from "@mui/material";
import { styled } from '@mui/material/styles';
import axios from "axios";
import DefaultBg from "../../components/DefaultBg";
import IconCard from "../../components/cards/IconCard";
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import MoreVertIcon from '@mui/icons-material/MoreVert';

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
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

export default function AdminPage() {
    const theme = useTheme();
    const [users, setUsers] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const open = Boolean(anchorEl);

    useEffect(() => {
        axios.get("/api/admin/getUsers")
            .then(response => setUsers(response.data.users))
            .catch(error => {
                console.error("Error fetching users:", error);
                showModal("Failed to fetch users.");
            });
    }, []);

    const showModal = (message) => {
        setModalMessage(message);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    const handleClick = (event, userId) => {
        setAnchorEl({ anchor: event.currentTarget, userId: userId });
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const deleteUser = (userId) => {
        axios.post('/api/admin/editUsers', { userId, action: 'deleteUser' })
            .then(() => {
                setUsers(users.filter(user => user.id !== userId));
                showModal("User successfully deleted.");
                handleClose();
            })
            .catch(error => {
                console.error("Failed to delete user:", error);
                showModal("Failed to delete user.");
            });
    };

    const makeAdmin = (userId) => {
        axios.post('/api/admin/editUsers', { userId, action: 'makeAdmin' })
            .then(() => {
                const updatedUsers = users.map(user => {
                    if (user.id === userId) {
                        return { ...user, admin: true };
                    }
                    return user;
                });
                setUsers(updatedUsers);
                showModal("User successfully made admin.");
                handleClose();
            })
            .catch(error => {
                console.error("Failed to make user admin:", error);
                showModal("Failed to make user admin.");
            });
    };

    return (
        <DefaultBg>
            <IconCard title={"Dashboard"} icon={<AdminPanelSettingsIcon sx={{ width: 56, height: 56, color: theme.palette.primary.contrastText }} />}>
                <Container sx={{ mt: 5 }}>
                    <Grid container spacing={{ xs: 1, md: 3 }} columns={{ xs: 2, sm: 8, md: 12 }} sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {users.map(user => (
                            <Item key={user.email}>
                                <Avatar sx={{ width: 100, height: 100, backgroundColor: 'transparent', marginRight: 'auto', marginLeft: 'auto', marginBottom: 2.5, marginTop: 2.5 }} src={user.image}/>
                                <Typography variant="h6">{user.name}</Typography>
                                <Typography variant="body2">{user.email}</Typography>
                                {!user.admin && (
                                    <div style={{ position: 'absolute', top: 0, right: 0 }}>
                                        <IconButton aria-label="more" id={`button-${user.id}`} aria-haspopup="true" onClick={(e) => handleClick(e, user.id)}>
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
