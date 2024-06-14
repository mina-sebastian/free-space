import * as React from 'react';
import { MenuItem } from '@mui/material';
import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import { DashboardModal } from '@uppy/react';
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';
import '@uppy/drag-drop/dist/style.css';
import '@uppy/file-input/dist/style.css';
import '@uppy/progress-bar/dist/style.css';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import CryptoJS from 'crypto-js';
import axios from 'axios';

interface UploadFileButtonProps {
  onClose: () => void;
  outerFolderId: string;
}

// Function to generate SHA-256 hash for a given file
async function generateFileHash(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

const UploadFileButton: React.FC<UploadFileButtonProps> = ({ onClose, outerFolderId }) => {
  const { data: session } = useSession(); // Get session data from next-auth
  const [uppy, setUppy] = React.useState<Uppy>(null); // State for Uppy instance
  const [open, setOpen] = React.useState(false); // State for modal open/close
  const handleOpen = () => setOpen(true); // Function to handle opening modal
  const handleClose = () => setOpen(false); // Function to handle closing modal
  const router = useRouter(); // Initialize router for navigation

  React.useEffect(() => {
    if (typeof window !== 'undefined' && session?.user && outerFolderId) {
      // Initialize Uppy instance
      const up = new Uppy({
        meta: {
          tkn: session.user.id,
          folderId: outerFolderId
        },
        debug: false,
      })
        .use(Tus, {
          endpoint: 'http://localhost/files/', // Tus endpoint for file uploads
          onShouldRetry: (file, options) => false // Disable automatic retry
        });

      // Add file hash metadata when file is added
      up.on('file-added', async (file) => {
        const hash = await generateFileHash(file.data);
        up.setFileMeta(file.id, { hash });
      });

      // Preprocess files before uploading
      up.addPreProcessor((filesstr) => {
        up.setOptions({ autoProceed: false });

        return new Promise(async (resolve, reject) => {
          try {
            const files = await Promise.all(
              filesstr.map(async (fstr) => {
                const f = await up.getFile(fstr);
                return { id: f.id, hash: f.meta.hash, name: f.name };
              })
            );
            const response = await axios.post('/api/cloud/preprocess', { files, outerFolderId });
            const { alreadyUploaded, toUpload } = response.data;

            // Remove already uploaded files from Uppy
            alreadyUploaded.forEach(fileId => {
              up.removeFile(fileId);
            });

            // Set metadata for files to be uploaded
            toUpload.forEach(file => {
              up.setFileMeta(file.id, { gvnid: file.gvnid, hash: file.hash });
            });
            
            // Resolve after a delay to allow UI update
            setTimeout(() => resolve(toUpload.map(f => f.id)), 1000);
          } catch (error) {
            console.error('Error in preprocessing:', error);
            reject(error);
          }
        });
      });

      // Handle completion of uploads
      up.on('complete', () => {
        router.replace(router.asPath); // Refresh the page after upload
      });

      setUppy(up); // Set Uppy instance in state

      return () => up.close(); // Clean up Uppy instance on component unmount
    }
  }, [session, outerFolderId]); // Run effect when session or outerFolderId changes

  return (
    <>
      <MenuItem onClick={handleOpen}>Import File</MenuItem> {/* Button to open file import modal */}
      {uppy && (
        <DashboardModal
          uppy={uppy}
          open={open}
          onRequestClose={handleClose} // Handle closing modal
        />
      )}
    </>
  );
};

export default UploadFileButton;
