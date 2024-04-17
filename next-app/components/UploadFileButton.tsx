import * as React from 'react';
import { MenuItem } from '@mui/material';

interface UploadFileButtonProps {
  onClose: () => void;
}

const UploadFileButton: React.FC<UploadFileButtonProps> = ({ onClose }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files[0];
    console.log('Selected file:', selectedFile);
    onClose(); 
  };

  const handleImportFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <MenuItem onClick={handleImportFileClick}>Import File</MenuItem>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".*"
        onChange={handleFileInputChange}
      />
    </>
  );
};

export default UploadFileButton;
