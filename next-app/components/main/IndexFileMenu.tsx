import React, { useRef, useReducer, useCallback, useState, useEffect } from 'react';
import { List, ListItem, Divider, Checkbox, FormControlLabel, Stack, IconButton, Menu, MenuItem, Select, FormControl, InputLabel, TextField } from '@mui/material';
import FileCard from '../cards/FileCard';
import LinkGenerationModal from '../modals/LinkGenerationModal';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import { useRouter } from 'next/router';
import axios from 'axios';
import SearchBar from './SearchBar';

interface FileMenuProps { // Defining props interface for FileMenu component
  files: Array<{ 
    fileId: string; 
    name: string; 
    hashFile: { size: number } 
  }>;
}

type State = { // Defining State type for useReducer
  checkedFolders: string[];
  checkedFiles: string[];
  selectAllFolders: boolean;
  selectAllFiles: boolean;
};

type Action = // Defining Action type for useReducer
  | { type: 'TOGGLE_ALL_FOLDERS'; checked: boolean; folderIds: string[] }
  | { type: 'TOGGLE_ALL_FILES'; checked: boolean; fileIds: string[] }
  | { type: 'TOGGLE_FOLDER'; folderId: string }
  | { type: 'TOGGLE_FILE'; fileId: string }
  | { type: 'UPDATE_SELECT_ALL_FILES' };

const initialState: State = { // Initializing initialState for useReducer
  checkedFolders: [],
  checkedFiles: [],
  selectAllFolders: false,
  selectAllFiles: false,
};

const reducer = (state: State, action: Action): State => { // Defining reducer function for useReducer
  switch (action.type) {
    case 'TOGGLE_ALL_FOLDERS': // Reducer case for toggling all folders
      return {
        ...state,
        selectAllFolders: action.checked,
        checkedFolders: action.checked ? action.folderIds : [],
      };
    case 'TOGGLE_ALL_FILES': // Reducer case for toggling all files
      return {
        ...state,
        selectAllFiles: action.checked,
        checkedFiles: action.checked ? action.fileIds : [],
      };
    case 'TOGGLE_FOLDER': // Reducer case for toggling individual folder
      return {
        ...state,
        checkedFolders: state.checkedFolders.includes(action.folderId)
          ? state.checkedFolders.filter((id) => id !== action.folderId)
          : [...state.checkedFolders, action.folderId],
      };
    case 'TOGGLE_FILE': // Reducer case for toggling individual file
      const updatedCheckedFiles = state.checkedFiles.includes(action.fileId)
        ? state.checkedFiles.filter((id) => id !== action.fileId)
        : [...state.checkedFiles, action.fileId];
      return {
        ...state,
        checkedFiles: updatedCheckedFiles,
        selectAllFiles: updatedCheckedFiles.length === state.checkedFiles.length ? state.selectAllFiles : false,
      };
    case 'UPDATE_SELECT_ALL_FILES': // Reducer case for updating select all files state
      return {
        ...state,
        selectAllFiles: state.checkedFiles.length === state.checkedFiles.length,
      };
    default:
      return state;
  }
};

const FileMenu: React.FC<FileMenuProps> = ({ files }) => { // FileMenu component definition
  const modalRef = useRef(null); // Ref for LinkGenerationModal component
  const [state, dispatch] = useReducer(reducer, initialState); // State and dispatcher for useReducer
  const router = useRouter(); // Router instance from Next.js
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // State for menu anchor element
  const [selectedItem, setSelectedItem] = useState<{ // State for selected menu item
    itemId: string; 
    itemType: 'folder' | 'file'; 
    name: string 
  } | null>(null);

  const [sortCriteria, setSortCriteria] = useState('name'); // State for sorting criteria
  const [sortOrder, setSortOrder] = useState('asc'); // State for sorting order

  const [searchQuery, setSearchQuery] = useState(''); // State for search query
  const [searchPerformed, setSearchPerformed] = useState(false); // State to track if search has been performed

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, itemId: string, itemType: 'folder' | 'file', name: string) => { // Event handler for menu item click
    setAnchorEl(event.currentTarget); // Set menu anchor element
    setSelectedItem({ itemId, itemType, name }); // Set selected item
  };

  const handleMenuClose = () => { // Event handler for closing menu
    setAnchorEl(null); // Clear menu anchor element
    setSelectedItem(null); // Clear selected item
  };

  const handleRenameItem = () => { // Event handler for renaming item
    if (selectedItem) { // If there is a selected item
      const newName = prompt(`Enter new ${selectedItem.itemType} name:`, selectedItem.name); // Prompt user for new name
      if (newName !== null) { // If user entered a new name
        axios.put(`/api/${selectedItem.itemType}/${selectedItem.itemId}/rename`, { newName }) // Send rename request
          .then(response => {
            console.log('Item renamed successfully:', response.data); // Log success message
            router.replace(router.asPath); // Refresh page or update file list
          })
          .catch(error => {
            console.error('Error renaming item:', error); // Log error message
          });
      }
    }
    handleMenuClose(); // Close menu
  };

  const handleDeleteItem = () => { // Event handler for deleting item
    if (selectedItem && window.confirm(`Are you sure you want to delete ${selectedItem.itemType} "${selectedItem.name}" and all its contents?`)) { // Confirmation dialog
      axios.delete(`/api/${selectedItem.itemType}/${selectedItem.itemId}/delete`) // Send delete request
        .then(response => {
          console.log('Item deleted successfully:', response.data); // Log success message
          router.replace(router.asPath); // Refresh page or update file list
        })
        .catch(error => {
          console.error('Error deleting item:', error); // Log error message
        });
    }
    handleMenuClose(); // Close menu
  };

  const handleSelectAllFiles = useCallback((event: React.ChangeEvent<HTMLInputElement>) => { // Callback for selecting all files
    dispatch({ type: 'TOGGLE_ALL_FILES', checked: event.target.checked, fileIds: files.map(file => file.fileId) }); // Dispatch action to toggle all files
  }, [files]);

  const handleSortCriteriaChange = (event: React.ChangeEvent<{ value: unknown }>) => { // Event handler for sorting criteria change
    setSortCriteria(event.target.value as string); // Set sorting criteria
  };

  const handleSortOrderChange = (event: React.ChangeEvent<{ value: unknown }>) => { // Event handler for sorting order change
    setSortOrder(event.target.value as string); // Set sorting order
  };

  const handleSearchQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => { // Event handler for search query change
    setSearchQuery(event.target.value); // Set search query
    if (!searchPerformed) { // If search hasn't been performed yet
      setSearchPerformed(true); // Set search performed to true
    }
  };

  const filteredFiles = files.filter(file => file.name.toLowerCase().includes(searchQuery.toLowerCase())); // Filtering files based on search query

  const sortedFiles = [...filteredFiles].sort((a, b) => { // Sorting files based on sort criteria and order
    if (sortCriteria === 'name') {
      return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    } else if (sortCriteria === 'size') {
      return sortOrder === 'asc' ? a.hashFile.size - b.hashFile.size : b.hashFile.size - a.hashFile.size;
    }
    return 0;
  });

  const handleDeleteFiles = useCallback(() => { // Callback for deleting selected files
    if (state.checkedFiles.length === 0) return; // If no files are selected, return early

    if (window.confirm(`Are you sure you want to delete the selected files?`)) { // Confirmation dialog
      const fileIdsToDelete = state.checkedFiles; // Get selected file IDs

      axios.delete('/api/file/deleteBatchIndex', { data: { fileIds: fileIdsToDelete } }) // Send batch delete request
        .then(response => {
          console.log('Files deleted successfully:', response.data); // Log success message
          router.replace(router.asPath); // Refresh page or update file list
        })
        .catch(error => {
          console.error('Error deleting files:', error); // Log error message
        });
    }
    handleMenuClose(); // Close menu
  }, [state.checkedFiles, router, handleMenuClose]);


const [foldersMenuOpen, setFoldersMenuOpen] = useState(false);
const [foldersMenuAnchorEl, setFoldersMenuAnchorEl] = useState<HTMLElement | null>(null);
const [userFolders, setUserFolders] = useState<Array<{ folderId: string; name: string }>>([]);


// Fetch user's folders from API
useEffect(() => {
  const fetchUserFolders = async () => {
    try {
      const response = await axios.get('/api/folder/getFolders'); // API call to get user folders
      setUserFolders(response.data.folders); // Set user folders to state
    } catch (error) {
      console.error('Error fetching user folders:', error);
    }
  };
  fetchUserFolders(); // Fetch user folders on component mount
}, []);

// Handle opening folders menu
const handleOpenFoldersMenu = (event: React.MouseEvent<HTMLElement>) => {
  setFoldersMenuOpen(true);
  setFoldersMenuAnchorEl(event.currentTarget);
};

// Handle closing folders menu
const handleCloseFoldersMenu = () => {
  setFoldersMenuOpen(false);
};


const handleMoveFileToFolder = async (destinationFolderId: string) => {
  try {
    // Send a batch request to move files
    const response = await axios.put('/api/file/moveBatch', {
      fileIds: state.checkedFiles,
      destinationFolderId
    });
    console.log('Files moved successfully:', response.data);
    // Reload the page or update the file list
    router.replace(router.asPath);
  } catch (error) {
    console.error('Error moving files:', error);
  }

  // Close the folders menu
  handleCloseFoldersMenu();
};

  return (
    <div>
      <LinkGenerationModal ref={modalRef} />
      <SearchBar searchQuery={searchQuery} onSearchQueryChange={handleSearchQueryChange} />
      
      {searchPerformed && (// Conditional rendering based on search performed
        <>
          <h2>Files</h2>
          <Stack direction="row" alignItems="center" spacing={2}>
            {/* Select all files checkbox */}
            <FormControlLabel
              control={<Checkbox checked={state.selectAllFiles} onChange={handleSelectAllFiles} />}
              label="Select all"
            />
            {state.checkedFiles.length > 0 && (
              <>
                <IconButton aria-label="delete" onClick={handleDeleteFiles}>
                  <DeleteIcon />
                </IconButton>
                <IconButton aria-label="move" onClick={handleOpenFoldersMenu}>
                  <DriveFileMoveIcon />
                </IconButton>

                <Menu
                  id="folders-menu"
                  anchorEl={foldersMenuAnchorEl}
                  open={foldersMenuOpen}
                  onClose={handleCloseFoldersMenu}
                >
                  {userFolders.map(folder => ( // Map over user folders
                    <MenuItem key={folder.folderId} onClick={() => handleMoveFileToFolder(folder.folderId)}>
                      {folder.name}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
            <FormControl variant="outlined" size="small">
              <InputLabel>Sort By</InputLabel> {/* Sort by dropdown */}
              <Select value={sortCriteria} onChange={handleSortCriteriaChange} label="Sort By">
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="size">Size</MenuItem>
              </Select>
            </FormControl>
            <FormControl variant="outlined" size="small">
              <InputLabel>Order</InputLabel> {/* Order dropdown */}
              <Select value={sortOrder} onChange={handleSortOrderChange} label="Order">
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <List>
            {sortedFiles.map((file) => ( // Map over sorted files
              <ListItem key={file.fileId}>
                <Checkbox // Checkbox for file selection
                  sx={{ m: -1 }}
                  checked={state.checkedFiles.includes(file.fileId)}
                  onChange={() => dispatch({ type: 'TOGGLE_FILE', fileId: file.fileId })}
                />
                <FileCard 
                  itemId={file.fileId} 
                  itemType="file" 
                  name={file.name} 
                  link={`/v/${file.fileId}`} 
                  onShare={() => modalRef.current?.open()} 
                  onMenuClick={(event) => handleMenuClick(event, file.fileId, 'file', file.name)} // Menu click handler
                />
              </ListItem>
            ))}
          </List>
        </>
      )}

      <Menu id="menu" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}> 
        {/* Menu component for file menu */}
        {router.asPath.startsWith('/f/Home') && <MenuItem onClick={handleRenameItem}>Rename</MenuItem>}
        <MenuItem onClick={handleDeleteItem}>Delete</MenuItem>
        {router.asPath.startsWith('/f/Home') && <MenuItem onClick={() => selectedItem && modalRef.current?.open(selectedItem.itemType, selectedItem.itemId, selectedItem.name)}>Share</MenuItem>}
      </Menu>
    </div>
  );
};

export default FileMenu;
