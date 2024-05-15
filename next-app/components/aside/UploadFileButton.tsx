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

const UploadFileButton: React.FC<UploadFileButtonProps> = ({ onClose, outerFolderId }) => {
  const { data: session } = useSession();
  const [uppy, setUppy] = React.useState<Uppy>(null);
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window !== 'undefined') { // Ensures this code block runs only on the client
      if (!!session && !!session.user && !!outerFolderId) {
        const up = new Uppy({
          meta: {
            tkn: session.user.id,
            folderId: outerFolderId
          },
          debug: true,
        })
          .use(Tus, {
            endpoint: 'http://localhost/files/',
          });

        up.addPreProcessor((filesstr) => {
          up.setOptions({
            autoProceed: false,
          });
          return new Promise((resolve, reject) => {
            const processFile = (file) => {
              return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                  const fileContent = reader.result as ArrayBuffer;
                  const wordArray = CryptoJS.lib.WordArray.create(fileContent);
                  const hash = CryptoJS.SHA256(wordArray).toString();
                  console.log(`File hash: ${hash}`);
                  up.setFileMeta(file.id, { hash });
                  resolve(hash);
                };
                reader.onerror = reject;
                reader.readAsArrayBuffer(file.data);
              });
            };

            Promise.all(filesstr.map(filestr => processFile(up.getFile(filestr))))
              .then(async () => {
                try {
                  const files = up.getFiles().map(f => ({ id: f.id, hash: f.meta.hash, name: f.name}));
                  const response = await axios.post('/api/cloud/preprocess', { files, outerFolderId  });
                  const { alreadyUploaded, toUpload } = response.data;

                  alreadyUploaded.forEach(fileId => {
                    up.removeFile(fileId);
                  });

                  if(toUpload.length === 0) {
                    up.info('All files have been uploaded!');
                    router.replace(router.asPath);
                    return;
                  }
                  
                  resolve(toUpload);
                } catch (error) {
                  console.error('Error in preprocessing:', error);
                  reject(error);
                }
              })
              .catch(reject);
          });
        });

        up.on('complete', (result) => {
          router.replace(router.asPath);
        });

        setUppy(up);

        return () => up.close();
      }
    }
  }, [session, outerFolderId]);

  return (
    <>
      <MenuItem onClick={handleOpen}>Import File</MenuItem>
      {!!uppy && (
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
