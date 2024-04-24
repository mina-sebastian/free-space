import * as React from 'react';
import { MenuItem } from '@mui/material';
import Uppy from'@uppy/core'
import Tus from'@uppy/tus'
import { DashboardModal } from '@uppy/react'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
import '@uppy/drag-drop/dist/style.css'
import '@uppy/file-input/dist/style.css'
import '@uppy/progress-bar/dist/style.css'
import { useSession } from 'next-auth/react'

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

  React.useEffect(() => {
    if (typeof window !== 'undefined') { // Ensures this code block runs only on the client
      if(!!session && !!session.user && !!outerFolderId){
        const up = new Uppy({
          meta: {
            tkn: session.user.id,
            folderId: outerFolderId
          },
        })
            .use(Tus,
              {
                endpoint: 'http://localhost/files/'
              })
            ;
        setUppy(up);
        
        return () => up.close();
      }
    }
    }, [session, outerFolderId]);

  return (
    <>
      <MenuItem onClick={handleOpen}>Import File</MenuItem>
      {!!uppy && <DashboardModal
        uppy={uppy}
        open={open}
        onRequestClose={handleClose}
    />}
    </>
  );
};

export default UploadFileButton;
