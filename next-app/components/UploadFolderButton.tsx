import * as React from 'react';
import { MenuItem } from '@mui/material';

interface UploadFolderButtonProps {
  onClose: () => void; // Prop for handleClose function
}

const UploadFolderButton: React.FC<UploadFolderButtonProps> = ({ onClose }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    const selectedFolders = Array.from(selectedFiles).filter(file => file.webkitRelativePath.includes('/'));
    console.log('Selected folders:', selectedFolders);
    onClose();
  };

  const handleUploadFolderClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <MenuItem onClick={handleUploadFolderClick}>
        Import Folder
      </MenuItem>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        directory=""
        webkitdirectory=""
        onChange={handleFileInputChange}
      />
    </>
  );
};

export default UploadFolderButton;
