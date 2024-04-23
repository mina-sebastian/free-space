import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Link, { LinkProps } from '@mui/material/Link';
import { ListItemProps } from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import Collapse from '@mui/material/Collapse';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import HomeIcon from '@mui/icons-material/Home';
import axios from 'axios';
import { Link as RouterLink, Route, Routes, MemoryRouter, useLocation } from 'react-router-dom';

interface FolderType {
  folderId: number;
  name: string;
  outerFolderId?: number | null;
  hasSubFolders?: boolean;
  subFolders?: FolderType[];
}

interface ListItemLinkProps extends ListItemProps {
  to: string;
  folder: FolderType;
  fetchFoldersAndFiles: (folderId: number, data: any) => void;
  depth: number;
}

function ListItemLink(props: ListItemLinkProps) {
  const { to, folder, depth, fetchFoldersAndFiles, ...other } = props;
  const [openNested, setOpenNested] = useState(false);
  const primary = folder.name;

  const handleClick = () => {
    setOpenNested((prevOpen) => !prevOpen);
    // Call API to fetch folders and files for the clicked folder
    axios.get(`/api/folder/${folder.folderId}/getFoldersAndFiles`)
      .then(response => {
        console.log("Fetched folders and files:", response.data);
        fetchFoldersAndFiles(folder.folderId, response.data); // Call the callback with fetched data
      })
      .catch(error => {
        console.error("Error fetching folders and files:", error);
      });
  };

  const paddingLeft = depth * 3; // Adjust padding based on depth

  return (
    <li>
      <ListItemButton component={RouterLink as any} to={to} {...other} onClick={handleClick} sx={{ paddingLeft }}>
        <ListItemText primary={primary} />
        {folder.hasSubFolders && (openNested ? <ExpandLess /> : <ExpandMore />)}
      </ListItemButton>
      {folder.hasSubFolders && (
        <Collapse in={openNested} timeout="auto" unmountOnExit>
          <List disablePadding>
            {/* Render nested folders */}
            {folder.subFolders?.map((subFolder, index) => (
              <ListItemLink
                key={index}
                to={`${to === '/' ? '' : to}/${subFolder.name}`}
                folder={subFolder}
                depth={depth + 1} // Increase depth for nested folders
                fetchFoldersAndFiles={fetchFoldersAndFiles} // Pass the callback down
              />
            ))}
          </List>
        </Collapse>
      )}
    </li>
  );
}

interface LinkRouterProps extends LinkProps {
  to: string;
  replace?: boolean;
}

function LinkRouter(props: LinkRouterProps) {
  return <Link {...props} component={RouterLink as any} />;
}

function Page() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <Breadcrumbs aria-label="breadcrumb">
      <LinkRouter underline="hover" color="inherit" to="/">
        Home
      </LinkRouter>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;

        return last ? (
          <Typography color="text.primary" key={to}>
            {value}
          </Typography>
        ) : (
          <LinkRouter underline="hover" color="inherit" to={to} key={to}>
            {value}
          </LinkRouter>
        );
      })}
    </Breadcrumbs>
  );
}

export default function RouterBreadcrumbs({onDataFetched, outerFolderId}) {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/folder/getFolders")
      .then(response => {
        const foldersData: FolderType[] = response.data.folders;
        const foldersMap: { [key: string]: FolderType } = {};
        
        // Organize folders into a map for easier access
        foldersData.forEach(folder => {
          folder.subFolders = [];
          folder.hasSubFolders = false;
          foldersMap[folder.folderId] = folder;
        });
  
        // Link folders to their parent folders
        foldersData.forEach(folder => {
          if (folder.outerFolderId !== null && foldersMap[folder.outerFolderId]) {
            foldersMap[folder.outerFolderId].subFolders.push(folder);
            foldersMap[folder.outerFolderId].hasSubFolders = true;
          }
        });
  
        // Filter out top-level folders (folders without outerFolderId)
        const topLevelFolders = foldersData.filter(folder => folder.outerFolderId === null);
  
        setFolders([...topLevelFolders]); // Create a new array to trigger re-render
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching folders:", error);
        setLoading(false);
      });
  }, []);
  
  const handleFoldersAndFiles = (folderId: string, data: any) => {
    // Handle the fetched data here, for example, you can store it in state
    console.log("Folders and files for folderId:", folderId, data);
    onDataFetched(data);
    outerFolderId(folderId);
  };

  return (
    <MemoryRouter initialEntries={['/']} initialIndex={0}>
      <Box sx={{ display: 'flex', flexDirection: 'column', width: 360 }}>
        <Routes>
          <Route path="*" element={<Page />} />
        </Routes>
        <Box
          sx={{
            bgcolor: 'background.paper',
            mt: 1,
          }}
          component="nav"
          aria-label="mailbox folders"
        >
          <List>
            <HomeIcon />
            <ListItemLink to="/" folder={{ folderId: 0, name: "Home", hasSubFolders: true, subFolders: folders }} depth={0} fetchFoldersAndFiles={handleFoldersAndFiles} />
          </List>
        </Box>
      </Box>
    </MemoryRouter>
  );
}
