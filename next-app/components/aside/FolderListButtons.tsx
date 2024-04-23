import React, { useEffect, useState } from 'react';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import FolderIcon from '@mui/icons-material/Folder'; // Icon for subfolders
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';
import { useRouter } from 'next/router';

async function fetchSubfolders(parentId) {
  try {
    const response = await axios.post('/api/folder/getFoldersWithParent', {
      parent: parentId
    });
    return response.data;
  } catch (error) {
    // Assuming the server might return JSON with an error message, you might want to handle it specifically
    if (error.response) {
      // The request was made and the server responded with a status code that falls out of the range of 2xx
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
      throw new Error(error.response.data.message || 'Failed to load data');
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
      throw new Error('No response received');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
      throw new Error('Error setting up request');
    }
  }
}

type FolderProps = {
    folderId: string,
    name: string
}

type FolderItemProps = {
    folder: FolderProps,
    innerFolders: [FolderProps],
    currentlyOpen: string,
    parentPath: string
};

const cleanString = (str) => {
    if(typeof str === 'string'){
        if(str.startsWith('/'))
            str = str.substring(1);
        if(str.endsWith('/'))
            str = str.substring(0, str.length - 1);
        return str;
    }else if(typeof str === 'undefined'){
        return "";
    }else{
        return str.join("/");
    
    }
}

const FolderItem = ({ folder, innerFolders, currentlyOpen, parentPath="", outerFolderId }: FolderItemProps & { outerFolderId: (id: string) => void })  => {
    const [open, setOpen] = useState(false);
    const [subfolders, setSubfolders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [rest, setRest] = useState("-");

    const router = useRouter();

    const fielOpenData: string = cleanString(currentlyOpen);
    
    useEffect(() => {
        
        if(rest === "-"){
            if(fielOpenData.includes("/")){
                const all = fielOpenData.split("/");
                setRest(all.slice(1).join("/"));
                if(all[0] === folder.name){
                    Promise.resolve().then(async () => {
                        await handleToggle();
                    });
                }
            }else{
                if(fielOpenData === folder.name){
                    Promise.resolve().then(async () => {
                        await handleToggle();
                    });
                }
                setRest("");
            }
        }
    }, [rest]);
  
    const handleToggle = async () => {
        router.push(parentPath+"/"+folder.name)
        setOpen(!open);
      if (!open && subfolders.length === 0) {
        setLoading(true);
        try {
          const data = await fetchSubfolders(folder.folderId);
          setSubfolders(data.folders);
          outerFolderId(folder.folderId);
          setError(null);
        } catch (e) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      }
    };
  
    return (
      <>
        <ListItemButton onClick={handleToggle}>
          <ListItemIcon>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText primary={folder.name} />
          {(innerFolders.length > 0) && (loading ? <CircularProgress size={24} /> : open ? <ExpandLess /> : <ExpandMore />)}
        </ListItemButton>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 2 }}>
            {error ? (
              <ListItemButton>
                <ListItemText primary={error} />
              </ListItemButton>
            ) : (
              subfolders.map(subfolder => (
                <FolderItem key={subfolder.folderId} folder={subfolder} innerFolders={subfolder.innerFolders} currentlyOpen={rest} parentPath={parentPath+"/"+folder.name} outerFolderId={outerFolderId}/>
              ))
            )}
          </List>
        </Collapse>
      </>
    );
  };
  

const FolderListButtons = ({ currentlyOpen, outerFolderId }: { currentlyOpen: string, outerFolderId: (id: string) => void }) => {
    const [folders, setFolders] = useState([]);
    React.useEffect(() => {
      fetchSubfolders(null).then(data => {
        setFolders(data.folders);
      }).catch(error => {
        console.error("Failed to fetch top-level folders:", error);
      });
    }, []);
  return (
    <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }} component="nav">
      {folders.map(folder => (
        <FolderItem key={folder.folderId} folder={folder} innerFolders={folder.innerFolders} currentlyOpen={currentlyOpen} parentPath='/f' outerFolderId={outerFolderId}/>
      ))}
    </List>
  );
};

export default FolderListButtons;

