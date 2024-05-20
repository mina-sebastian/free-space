import { Avatar, Typography, Paper, Divider, IconButton, useTheme } from '@mui/material';
import React, { useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import axios from 'axios';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface FileCardProps {
  itemId: string;
  itemType: 'folder' | 'file';
  name: string;
  link?: string;
  onShare: (itemType: string, itemId: string, name: string) => void;
  onMenuClick: (event: React.MouseEvent<HTMLElement>, itemId: string, itemType: 'folder' | 'file', name: string) => void;
  canEdit: boolean;
}

const FileCard: React.FC<FileCardProps> = ({ itemId, itemType, name, link = '', onShare, onMenuClick, canEdit }) => {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Paper sx={{ width: '100%', height: 50, p: 2, m: 1, display: 'flex', alignItems: 'center' }}>
      <Typography
        component={Link}
        href={itemType === 'folder' ? `${router.asPath}/${name}` : `/v/${link}`}
        variant="h6"
        sx={{ flexGrow: 1, ml: 3 }}
      >
        {name}
      </Typography>
      {canEdit && <IconButton aria-label="more" aria-controls="menu" aria-haspopup="true" onClick={(event) => onMenuClick(event, itemId, itemType, name)} size="large">
        <MoreVertIcon />
      </IconButton>}
    </Paper>
  );
};

export default React.memo(FileCard);
