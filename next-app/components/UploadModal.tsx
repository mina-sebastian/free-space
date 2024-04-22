import { useEffect, useState } from "react";
import Uppy from "@uppy/core";
import Dashboard from '@uppy/dashboard';
import Tus from '@uppy/tus';

import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export default function UploadModal() {

    const [uppy, setUppy] = useState<Uppy>();

    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    useEffect(() => {
    if (typeof window !== 'undefined') { // Ensures this code block runs only on the client
        const up = new Uppy()
        .use(Dashboard, { inline: true, target: '#uppy-dashboard' }) // Target must match a div ID in your component
        .use(Tus, { endpoint: 'http://localhost/files/' });
        setUppy(up);

        // Cleanup function to close Uppy on component unmount
        return () => up.close();
    }
    }, []);
  
  return (
    <>
    <Button onClick={handleOpen}>Open modal</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <div id="uppy-dashboard"></div>
        </Box>
      </Modal>
    
 
    </>
  );
}
