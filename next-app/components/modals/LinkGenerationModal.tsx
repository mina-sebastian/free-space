import * as React from 'react';
import { Backdrop, Box, Modal, Fade, Button, Typography, TextField, IconButton } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BasicDropdown from '../dropdowns/BasicDropdown';
import HorizontalRadioGroup from "../radio groups/HorizontalRadioGroup";
import { SelectChangeEvent } from '@mui/material/Select';
import axios from 'axios';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: '16px'
};

const TransitionsModal = React.forwardRef((props, ref) => {
  const accessOptions = ["Anyone with the link", "Only authenticated users"];
  const radioOptions = ["Read", "Write", "Read-Write"];

  const [type, setType] = React.useState("");
  const [id, setId] = React.useState("");
  const [name, setName] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [link, setLink] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [access, setAccess] = React.useState(accessOptions[0]);
  const [permission, setPermission] = React.useState(radioOptions[0]);
  const [error, setError] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState('');
  const [copySuccess, setCopySuccess] = React.useState('');

  React.useImperativeHandle(ref, () => ({
    open: (type, id, name) => {
      setType(type);
      setId(id);
      setName(name);
      setOpen(true);
    }
  }));

  const handleClose = () => {
    setOpen(false);
    setLink('');
    setLoading(false);
    setAccess(accessOptions[0]);
    setPermission(radioOptions[0]);
    setError('');
    setSuccessMessage('');
    setCopySuccess('');
  };

  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPermission(event.target.value);
  };

  const handleDropdownChange = (event: SelectChangeEvent) => {
    setAccess(event.target.value as string);
  };

  const generateLink = async () => {
    setLoading(true);

    try {
      const permissions = `${access === "Only authenticated users" ? "authenticated " : "all "}${permission === "Read" ? "R" : permission === "Write" ? "W" : "RW"}`;

      const response = await axios.post('/api/link/generateLink', { type, id, permissions });

      setLink(response.data.link);
      setSuccessMessage('Link generated successfully!');
      setError("");
    } catch (err) {
      console.error('Error generating link:', err);
      const errorMessage = err.response?.data?.message || 'Failed to generate link. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(link).then(
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
      open={open}
      onClose={handleClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 500 }}
    >
      <Fade in={open}>
        <Box sx={style}>
          <Typography id="transition-modal-title" variant="h6" component="h2" sx={{ textAlign: 'center', fontSize: "1.5rem" }}>
            Generate Link for {name}
          </Typography>
          <Typography id="transition-modal-description" sx={{ mt: 5, fontSize: '1.2rem', mb: 3 }}>
            Who can see your {type}
          </Typography>
          <BasicDropdown options={accessOptions} label="Access control" handleChange={handleDropdownChange} value={access} />
          <Typography id="transition-modal-description" sx={{ mt: 2, fontSize: '1.2rem', mb: 3 }}>
            Permissions
          </Typography>
          <HorizontalRadioGroup options={radioOptions} value={permission} handleRadioChange={handleRadioChange} />
          {error && <Typography color="error" sx={{ display: 'block', mb: 2 }}>{error}</Typography>}
          {successMessage && <Typography color="green" sx={{ display: 'block', mb: 2 }}>{successMessage}</Typography>}
          {copySuccess && <Typography color="secondary" sx={{ display: 'block', mb: 2 }}>{copySuccess}</Typography>}
          <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
            {link ? (
              <TextField
                fullWidth
                variant="outlined"
                value={link}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={copyToClipboard}>
                      <ContentCopyIcon />
                    </IconButton>
                  ),
                }}
              />
            ) : (
              <Button onClick={generateLink} disabled={loading}>
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
