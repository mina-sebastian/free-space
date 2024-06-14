import React, { useState, useEffect, useMemo, memo } from 'react';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import FolderIcon from '@mui/icons-material/Folder';
import CircularProgress from '@mui/material/CircularProgress';
import { useQuery, useQueryClient } from 'react-query';
import axios from 'axios';
import { useRouter } from 'next/router';
import DeleteIcon from '@mui/icons-material/Delete';
import HomeIcon from '@mui/icons-material/Home';
interface Folder {
  folderId: string;
  name: string;
  innerFolders: Folder[];
}

// Function to fetch subfolders from the API
const fetchSubfolders = async (parentId: string | null): Promise<Folder[]> => {
  const response = await axios.post('/api/folder/getFoldersWithParent', { parent: parentId });
  return response.data.folders;
};

// Function to clean and format the folder path string
const cleanString = (str: string | undefined | string[]): string => {
  if (typeof str === 'string') {
    if (str.startsWith('/')) str = str.substring(1);
    if (str.endsWith('/')) str = str.substring(0, str.length - 1);
    return str;
  } else if (typeof str === 'undefined') {
    return '';
  } else {
    return str.join('/');
  }
};

interface FolderItemProps {
  folder: Folder;
  innerFolders: Folder[];
  currentlyOpen: string;
  parentPath?: string;
  refetchId: string;
  givenIcon?: React.ReactNode;
}

// Memoized component for rendering a folder item
const FolderItem: React.FC<FolderItemProps> = memo(({
  folder,
  innerFolders,
  currentlyOpen,
  parentPath = '',
  refetchId = 'initial',
  givenIcon = <FolderIcon />
}) => {
  const [open, setOpen] = useState(false); // State to track if the folder is open
  const [rest, setRest] = useState('-'); // State to track the rest of the path
  const router = useRouter();
  const queryClient = useQueryClient();

  // Clean the currently open path
  const fieldOpenData = useMemo(() => cleanString(currentlyOpen), [currentlyOpen]);

  // Fetch subfolders data using react-query
  const { data: subfolders, isLoading, error, refetch } = useQuery(
    ['subfolders', folder.folderId],
    () => fetchSubfolders(folder.folderId),
    { enabled: false, initialData: () => queryClient.getQueryData(['subfolders', folder.folderId]) }
  );

  // Refetch data when refetchId or folderId changes
  useEffect(() => {
    refetch();
  }, [refetchId, refetch, folder.folderId]);

  // Handle the open state and rest path setup
  useEffect(() => {
    if (rest === '-') {
      const all = fieldOpenData.includes('/') ? fieldOpenData.split('/') : [fieldOpenData];
      setRest(all.slice(1).join('/'));
      if (all[0] === folder.name) {
        handleToggle();
      }
    }
  }, [rest, fieldOpenData, folder.name]);

  // Toggle the folder open state and fetch subfolders if needed
  const handleToggle = async () => {
    router.push(parentPath + '/' + folder.name);
    setOpen((prevOpen) => !prevOpen);
    if (!open && (!subfolders || subfolders.length === 0)) {
      await refetch();
    }
  };

  return (
    <>
      <ListItemButton onClick={handleToggle}>
        <ListItemIcon>{givenIcon}</ListItemIcon>
        <ListItemText primary={folder.name} />
        {/* Show loading indicator or expand/collapse icons */}
        {innerFolders.length > 0 && (isLoading ? <CircularProgress size={24} /> : open ? <ExpandLess /> : <ExpandMore />)}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding sx={{ pl: 2 }}>
          {error ? (
            <ListItemButton>
              <ListItemText primary="Eroare" /> {/* Show error if there's an issue fetching subfolders */}
            </ListItemButton>
          ) : (
            subfolders?.map((subfolder) => (
              <FolderItem
                key={subfolder.folderId}
                folder={subfolder}
                innerFolders={subfolder.innerFolders}
                currentlyOpen={rest}
                parentPath={parentPath + '/' + folder.name}
                refetchId={refetchId}
                givenIcon={<FolderIcon />}
              />
            ))
          )}
        </List>
      </Collapse>
    </>
  );
});

interface FolderListButtonsProps {
  currentlyOpen: string;
  refetchId: string;
}

// Component to render the list of folder buttons
const FolderListButtons: React.FC<FolderListButtonsProps> = ({ currentlyOpen, refetchId }) => {
  const { data: folders, isLoading, error } = useQuery(
    ['folders'],
    () => fetchSubfolders(null)
  );

  if (isLoading) {
    return <CircularProgress />; // Show loading indicator while folders are being fetched
  }

  if (error) {
    return <div>Eroare</div>; // Show error message if there's an issue fetching folders
  }

  return (
    <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper', ml: -4 }} component="nav">
      {folders?.map((folder) => (
        <FolderItem
          key={folder.folderId}
          folder={folder}
          innerFolders={folder.innerFolders}
          currentlyOpen={currentlyOpen}
          parentPath="/f"
          refetchId={refetchId}
          givenIcon={folder.name === 'Bin' ? <DeleteIcon /> : <HomeIcon />} // Set custom icons for specific folder names
        />
      ))}
    </List>
  );
};

export default FolderListButtons;
