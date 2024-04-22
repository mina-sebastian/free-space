import React, { useEffect, useState } from'react'
import Uppy from'@uppy/core'
import Tus from'@uppy/tus'
import { Dashboard, DashboardModal, DragDrop, ProgressBar, FileInput } from '@uppy/react'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
import '@uppy/drag-drop/dist/style.css'
import '@uppy/file-input/dist/style.css'
import '@uppy/progress-bar/dist/style.css'
import { Button } from '@mui/material'
import { useSession } from 'next-auth/react'


export default function UploadModal() {

    const { data: session } = useSession();

    const [uppy, setUppy] = useState<Uppy>(null);

    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    useEffect(() => {
    if (typeof window !== 'undefined') { // Ensures this code block runs only on the client
      if(!!session && !!session.user){
        const up = new Uppy({
          meta: { tkn: session.user.id},
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
    }, [session]);
  
  return (
    <>
    <Button onClick={handleOpen}>Open modal</Button>
    {!!uppy && <DashboardModal
        uppy={uppy}
        open={open}
        // target={document.body}
        onRequestClose={handleClose}
    />}
    
 
    </>
  );
}
