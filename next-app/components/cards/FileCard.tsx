import { Avatar, Typography, Paper, Divider, IconButton, useTheme } from '@mui/material';
import React from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface FileCardProps {
  itemId: string;
  itemType: 'folder' | 'file'; // Type of item, can be either 'folder' or 'file'
  name: string; // Name of the item
  link?: string; // Link to the item (optional)
  onShare: (itemType: string, itemId: string, name: string) => void; // Function to handle sharing
  onMenuClick: (event: React.MouseEvent<HTMLElement>, itemId: string, itemType: 'folder' | 'file', name: string) => void; // Function to handle menu click
  canEdit: boolean; // Boolean to determine if the item can be edited
}

const FileCard: React.FC<FileCardProps> = ({ itemId, itemType, name, link = '', onShare, onMenuClick, canEdit }) => {
  const theme = useTheme(); // Get the current theme
  const router = useRouter(); // Initialize router for navigation

  return (
    <Paper sx={{ width: '100%', height: 50, p: 2, m: 1, display: 'flex', alignItems: 'center' }}>
      {/* Container for the file card */}
      <Typography
        component={Link}
        href={itemType === 'folder' ? `${router.asPath}/${name}` : `/v/${link}`} // Determine the link based on itemType
        variant="h6"
        sx={{ flexGrow: 1, ml: 3 }}
      >
        {name} {/* Display the name of the item */}
      </Typography>
      {canEdit && (
        <IconButton 
          aria-label="more" 
          aria-controls="menu" 
          aria-haspopup="true" 
          onClick={(event) => onMenuClick(event, itemId, itemType, name)} 
          size="large"
        >
          <MoreVertIcon /> {/* Display more options icon if canEdit is true */}
        </IconButton>
      )}
    </Paper>
  );
};

export default React.memo(FileCard); // Memoize the component to prevent unnecessary re-renders
