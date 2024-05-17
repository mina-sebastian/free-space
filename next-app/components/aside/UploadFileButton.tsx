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

async function generateFileHash(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

const UploadFileButton: React.FC<UploadFileButtonProps> = ({ onClose, outerFolderId }) => {
  const { data: session } = useSession();
  const [uppy, setUppy] = React.useState<Uppy>(null);
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window !== 'undefined' && session?.user && outerFolderId) {
      const up = new Uppy({
        meta: {
          tkn: session.user.id,
          folderId: outerFolderId
        },
        debug: false,
      })
        .use(Tus, {
          endpoint: 'http://localhost/files/',
          onShouldRetry: (file, options) => {
            // options.
            return false;
          }
        });

        up.on('file-added', async (file) => {
          const hash = await generateFileHash(file.data);
          up.setFileMeta(file.id, { hash });
        })

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

                // console.log('Preprocessing response:');
                // console.log(response.data);

                alreadyUploaded.forEach(fileId => {
                  // console.log('File already uploaded, deleting:', fileId);
                  up.removeFile(fileId);
                });

                toUpload.forEach(file => {
                  // console.log('File not uploaded, proceeding:', file.id);
                  up.setFileMeta(file.id, { gvnid: file.gvnid, hash: file.hash });
                  // console.log('File meta:', up.getFile(file.id).meta);
                })
                
                // resolve after one second to allow the UI to update
                setTimeout(() => resolve(toUpload.map(f => f.id)), 1000);

              } catch (error) {
                console.error('Error in preprocessing:', error);
                reject(error);
              }

        });
      });

      up.on('complete', () => {
        router.replace(router.asPath);
      });

      setUppy(up);

      return () => up.close();
    }
  }, [session, outerFolderId]);

  return (
    <>
      <MenuItem onClick={handleOpen}>Import File</MenuItem>
      {uppy && (
        <DashboardModal
          uppy={uppy}
          open={open}
          onRequestClose={handleClose}
        />
      )}
    </>
  );
};

export default UploadFileButton;
