import * as React from 'react';
import { Backdrop, Box, Modal, Fade, Button, Typography, TextField, IconButton } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BasicDropdown from '../dropdowns/BasicDropdown';
import HorizontalRadioGroup from "../radio groups/HorizontalRadioGroup";
import { SelectChangeEvent } from '@mui/material/Select';
import axios from 'axios';

// Define the style for the modal
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)', // Center the modal
  width: 600,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: '16px'
};

// Define the TransitionsModal component
const TransitionsModal = React.forwardRef((props, ref) => {
  const accessOptions = ["Anyone with the link", "Only authenticated users"]; // Define the access options
  const radioOptions = ["View", "Edit"]; // Define the radio options

  const [type, setType] = React.useState(""); // State to manage the type of item
  const [id, setId] = React.useState(""); // State to manage the ID of the item
  const [name, setName] = React.useState(""); // State to manage the name of the item
  const [open, setOpen] = React.useState(false); // State to manage the open state of the modal
  const [link, setLink] = React.useState(''); // State to manage the generated link
  const [loading, setLoading] = React.useState(false); // State to manage the loading state
  const [access, setAccess] = React.useState(accessOptions[0]); // State to manage the access control
  const [permission, setPermission] = React.useState(radioOptions[0]); // State to manage the permissions
  const [error, setError] = React.useState(""); // State to manage the error message
  const [successMessage, setSuccessMessage] = React.useState(''); // State to manage the success message
  const [copySuccess, setCopySuccess] = React.useState(''); // State to manage the copy success message

  // Function to handle closing the modal
  React.useImperativeHandle(ref, () => ({
    open: (type, id, name) => { // Function to open the modal with the specified parameters
      setType(type);
      setId(id);
      setName(name);
      setOpen(true); // Open the modal
    }
  }));

  // Function to handle closing the modal
  const handleClose = () => {
    setOpen(false); // Close the modal
    setLink('');
    setLoading(false); // Reset the loading state
    setAccess(accessOptions[0]); // Reset the access control
    setPermission(radioOptions[0]); // Reset the permissions
    setError('');
    setSuccessMessage('');
    setCopySuccess('');
  };

  // Function to handle radio button change
  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPermission(event.target.value);
  };

  // Function to handle dropdown change
  const handleDropdownChange = (event: SelectChangeEvent) => {
    setAccess(event.target.value as string);
  };

  // Function to generate the link
  const generateLink = async () => {
    setLoading(true);

    try {
      // Determine the permissions and access based on the selected values
      const permissions = permission === "View" ? "VIEW" : "EDIT";
      const canSee = access === "Only authenticated users" ? "AUTH" : "ALL";
      const response = await axios.post('/api/link/generateLink', { type, id, permissions, canSee }); // API call to generate the link

      setLink(response.data.link);  // Set the generated link
      setSuccessMessage('Link generated successfully!'); // Set the success message
      setError("");
    } catch (err) {
      console.error('Error generating link:', err); // Log error if link generation fails
      const errorMessage = err.response?.data?.message || 'Failed to generate link. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false); // Reset the loading state
    }
  };

  // Function to copy the link to the clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(link).then( // Copy the link to the clipboard
      () => {
        setCopySuccess('Link copied to clipboard!'); 
        setTimeout(() => setCopySuccess(''), 3000);
      },
      () => {
        setCopySuccess('Failed to copy link.');
      }
    );

  };

  return (
    <Modal
      aria-labelledby="transition-modal-title"
      aria-describedby="transition-modal-description"
      open={open} // Set the open state of the modal
      onClose={handleClose} // Handle closing the modal
      closeAfterTransition // Close the modal after transition
      BackdropComponent={Backdrop} // Use backdrop component
      BackdropProps={{ timeout: 500 }} // Set backdrop timeout
    >
      <Fade in={open}>
        <Box sx={style}>
          <Typography id="transition-modal-title" variant="h6" component="h2" sx={{ textAlign: 'center', fontSize: "1.5rem" }}> {/* Title of the modal */}
            Generate Link for {name}
          </Typography>
          <Typography id="transition-modal-description" sx={{ mt: 5, fontSize: '1.2rem', mb: 3 }}> {/* Description of the modal */}
            Who can see your {type}
          </Typography>
          <BasicDropdown options={accessOptions} label="Access control" handleChange={handleDropdownChange} value={access} /> {/* Dropdown for access control */}
          <Typography id="transition-modal-description" sx={{ mt: 2, fontSize: '1.2rem', mb: 3 }}>
            Permissions
          </Typography>
          <HorizontalRadioGroup options={radioOptions} value={permission} handleRadioChange={handleRadioChange} /> {/* Radio group for permissions */}
          {error && <Typography color="error" sx={{ display: 'block', mb: 2 }}>{error}</Typography>}
          {successMessage && <Typography color="green" sx={{ display: 'block', mb: 2 }}>{successMessage}</Typography>} {/* Display success message */}
          {copySuccess && <Typography color="secondary" sx={{ display: 'block', mb: 2 }}>{copySuccess}</Typography>} {/* Display copy success message */}
          <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}> {/* Container for the link */}
            {link ? (
              <TextField
                fullWidth
                variant="outlined"
                value={link}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={copyToClipboard}> {/* Button to copy the link to clipboard */}
                      <ContentCopyIcon />
                    </IconButton>
                  ),
                }}
              />
            ) : (
              <Button onClick={generateLink} disabled={loading}> {/* Button to generate the link */}
                {loading ? 'Generating...' : 'Generate Link'}
              </Button>
            )}
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
});

export default TransitionsModal;
