import React, { useRef, useReducer, useCallback, useState, memo, useEffect } from 'react';
import { List, ListItem, Divider, Checkbox, FormControlLabel, Stack, IconButton, Menu, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import FileCard from '../cards/FileCard';
import LinkGenerationModal from '../modals/LinkGenerationModal';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import { useRouter } from 'next/router';
import axios from 'axios';
import SearchBar from './SearchBar';

// Interface for props passed to FileMenu component
interface FileMenuProps {
  folders: Array<{ folderId: string; name: string; parentId?: string }>;
  files: Array<{ fileId: string; name: string; hashFile: { size: number } }>;
  canEdit: boolean;
  linkId: string;
}

// State shape for FileMenu component
type State = {
  checkedFolders: string[];
  checkedFiles: string[];
  selectAllFolders: boolean;
  selectAllFiles: boolean;
  sortCriteria: string;
  sortOrder: string;
  folderSortCriteria: string;
  folderSortOrder: string;
  searchQuery: string;
  anchorEl: HTMLElement | null;
  selectedItem: { itemId: string; itemType: 'folder' | 'file'; name: string } | null;
};

// Actions that can be dispatched to update state in the reducer
type Action =
  | { type: 'TOGGLE_ALL_FOLDERS'; checked: boolean; folderIds: string[] }
  | { type: 'TOGGLE_ALL_FILES'; checked: boolean; fileIds: string[] }
  | { type: 'TOGGLE_FOLDER'; folderId: string }
  | { type: 'TOGGLE_FILE'; fileId: string }
  | { type: 'SET_SORT_CRITERIA'; sortCriteria: string }
  | { type: 'SET_SORT_ORDER'; sortOrder: string }
  | { type: 'SET_FOLDER_SORT_CRITERIA'; folderSortCriteria: string }
  | { type: 'SET_FOLDER_SORT_ORDER'; folderSortOrder: string }
  | { type: 'SET_SEARCH_QUERY'; searchQuery: string }
  | { type: 'SET_ANCHOR_EL'; anchorEl: HTMLElement | null }
  | { type: 'SET_SELECTED_ITEM'; selectedItem: { itemId: string; itemType: 'folder' | 'file'; name: string } | null }
  | { type: 'CLEAR_CHECKED_FILES' }
  | { type: 'CLEAR_CHECKED_FOLDERS' }
  | { type: 'RESET_SELECT_ALL_FILES' }
  | { type: 'RESET_SELECT_ALL_FOLDERS' };


// Initial state for the reducer
const initialState: State = {
  checkedFolders: [],
  checkedFiles: [],
  selectAllFolders: false,
  selectAllFiles: false,
  sortCriteria: 'name',
  sortOrder: 'asc',
  folderSortCriteria: 'name',
  folderSortOrder: 'asc',
  searchQuery: '',
  anchorEl: null,
  selectedItem: null,
};

// Reducer function to manage state updates based on dispatched actions
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'TOGGLE_ALL_FOLDERS':
      return {
        ...state,
        selectAllFolders: action.checked,
        checkedFolders: action.checked ? action.folderIds : [],
      };
    case 'TOGGLE_ALL_FILES':
      return {
        ...state,
        selectAllFiles: action.checked,
        checkedFiles: action.checked ? action.fileIds : [],
      };
    case 'TOGGLE_FOLDER':
      return {
        ...state,
        checkedFolders: state.checkedFolders.includes(action.folderId)
          ? state.checkedFolders.filter((id) => id !== action.folderId)
          : [...state.checkedFolders, action.folderId],
      };
    case 'TOGGLE_FILE':
      return {
        ...state,
        checkedFiles: state.checkedFiles.includes(action.fileId)
          ? state.checkedFiles.filter((id) => id !== action.fileId)
          : [...state.checkedFiles, action.fileId],
      };
    case 'SET_SORT_CRITERIA':
      return {
        ...state,
        sortCriteria: action.sortCriteria,
      };
    case 'SET_SORT_ORDER':
      return {
        ...state,
        sortOrder: action.sortOrder,
      };
    case 'SET_FOLDER_SORT_CRITERIA':
      return {
        ...state,
        folderSortCriteria: action.folderSortCriteria,
      };
    case 'SET_FOLDER_SORT_ORDER':
      return {
        ...state,
        folderSortOrder: action.folderSortOrder,
      };
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.searchQuery,
      };
    case 'SET_ANCHOR_EL':
      return {
        ...state,
        anchorEl: action.anchorEl,
      };
    case 'SET_SELECTED_ITEM':
      return {
        ...state,
        selectedItem: action.selectedItem,
      };
    case 'CLEAR_CHECKED_FILES':
      return {
        ...state,
        checkedFiles: [],
      };
    case 'CLEAR_CHECKED_FOLDERS':
      return {
        ...state,
        checkedFolders: [],
      };
    case 'RESET_SELECT_ALL_FILES':
      return {
        ...state,
        selectAllFiles: false,
      };
    case 'RESET_SELECT_ALL_FOLDERS':
      return {
        ...state,
        selectAllFolders: false,
      };
    default:
      return state;
  }
};

// Utility function to find all subfolders of a given folder recursively
const findSubfolders = (folderId: string, allFolders: Array<{ folderId: string; name: string; parentId?: string }>): string[] => {
  const subfolders: string[] = [];
  const queue = [folderId];

  while (queue.length > 0) {
    const currentFolderId = queue.shift()!;
    const children = allFolders.filter(folder => folder.parentId === currentFolderId);
    children.forEach(child => {
      subfolders.push(child.folderId);
      queue.push(child.folderId);
    });
  }

  return subfolders;
};


// Main FileMenu component
const FileMenu: React.FC<FileMenuProps> = ({ folders, files, canEdit, linkId }) => {
  const modalRef = useRef(null); // Reference to LinkGenerationModal component
  const [state, dispatch] = useReducer(reducer, initialState); // State management using reducer
  const router = useRouter(); // Next.js router hook
  const [userFolders, setUserFolders] = useState<Array<{ folderId: string; name: string; parentId?: string }>>([]); // State for user folders
  const [foldersMenuOpen, setFoldersMenuOpen] = useState(false); // State for folders menu open/close
  const [foldersMenuAnchorEl, setFoldersMenuAnchorEl] = useState<HTMLElement | null>(null); // Anchor element for folders menu

  const currentFolderId = router.query.folderId as string; // Current folder ID from router query parameter

  // Effect to reset selected items and checkboxes on route change
  useEffect(() => {
    const handleRouteChange = () => {
      dispatch({ type: 'CLEAR_CHECKED_FILES' });
      dispatch({ type: 'CLEAR_CHECKED_FOLDERS' });
      dispatch({ type: 'RESET_SELECT_ALL_FILES' });
      dispatch({ type: 'RESET_SELECT_ALL_FOLDERS' });
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);


  // Handle click event on menu items
  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>, itemId: string, itemType: 'folder' | 'file', name: string) => {
    dispatch({ type: 'SET_ANCHOR_EL', anchorEl: event.currentTarget });
    dispatch({ type: 'SET_SELECTED_ITEM', selectedItem: { itemId, itemType, name } });
  }, []);

  // Close the menu
  const handleMenuClose = useCallback(() => {
    dispatch({ type: 'SET_ANCHOR_EL', anchorEl: null });
    dispatch({ type: 'SET_SELECTED_ITEM', selectedItem: null });
  }, []);

  // Handle rename action for selected item
  const handleRenameItem = useCallback(() => {
    if (state.selectedItem) {
      const newName = prompt(`Enter new ${state.selectedItem.itemType} name:`, state.selectedItem.name);
      if (newName !== null) {
        axios.put(`/api/${state.selectedItem.itemType}/${state.selectedItem.itemId}/rename`, { newName })
          .then(response => {
            console.log('Item renamed successfully:', response.data);
            router.replace(router.asPath);
          })
          .catch(error => {
            console.error('Error renaming item:', error);
          });
      }
    }
    handleMenuClose();
  }, [state.selectedItem, router, handleMenuClose]);


  // Handle delete action for selected item
  const handleDeleteItem = useCallback(() => {
    if (state.selectedItem && window.confirm(`Are you sure you want to delete ${state.selectedItem.itemType} "${state.selectedItem.name}" and all its contents?`)) {
      axios.delete(`/api/${state.selectedItem.itemType}/${state.selectedItem.itemId}/delete`)
        .then(response => {
          console.log('Item deleted successfully:', response.data);
          router.replace(router.asPath);
        })
        .catch(error => {
          console.error('Error deleting item:', error);
        });
    }
    handleMenuClose();
  }, [state.selectedItem, router, handleMenuClose]);

  // Handle select all folders
  const handleSelectAllFolders = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'TOGGLE_ALL_FOLDERS', checked: event.target.checked, folderIds: folders.map(folder => folder.folderId) });
  }, [folders]);

  // Handle select all files
  const handleSelectAllFiles = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'TOGGLE_ALL_FILES', checked: event.target.checked, fileIds: files.map(file => file.fileId) });
  }, [files]);

  // Handle sort criteria change for files  
  const handleSortCriteriaChange = useCallback((event: React.ChangeEvent<{ value: unknown }>) => {
    dispatch({ type: 'SET_SORT_CRITERIA', sortCriteria: event.target.value as string });
  }, []);

  // Handle sort order change for files
  const handleSortOrderChange = useCallback((event: React.ChangeEvent<{ value: unknown }>) => {
    dispatch({ type: 'SET_SORT_ORDER', sortOrder: event.target.value as string });
  }, []);

  // Handle sort criteria change for folders
  const handleFolderSortCriteriaChange = useCallback((event: React.ChangeEvent<{ value: unknown }>) => {
    dispatch({ type: 'SET_FOLDER_SORT_CRITERIA', folderSortCriteria: event.target.value as string });
  }, []);

  // Handle sort order change for folders
  const handleFolderSortOrderChange = useCallback((event: React.ChangeEvent<{ value: unknown }>) => {
    dispatch({ type: 'SET_FOLDER_SORT_ORDER', folderSortOrder: event.target.value as string });
  }, []);

  // Handle search query change
  const handleSearchQueryChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_SEARCH_QUERY', searchQuery: event.target.value });
  }, []);

  // Handle delete files
  const handleDeleteFiles = useCallback(() => {
    if (state.checkedFiles.length === 0) return;

    // Confirm deletion action
    if (window.confirm(`Are you sure you want to delete the selected files?`)) {
      const fileIdsToDelete = state.checkedFiles;

      // Delete selected files
      axios.delete('/api/file/deleteBatch', { data: { fileIds: fileIdsToDelete } })
        .then(response => {
          console.log('Files deleted successfully:', response.data);
          dispatch({ type: 'CLEAR_CHECKED_FILES' });
          dispatch({ type: 'RESET_SELECT_ALL_FILES' });
          router.replace(router.asPath);
        })
        .catch(error => {
          console.error('Error deleting files:', error);
        });
    }
    // Close the menu after deletion
    handleMenuClose();
  }, [state.checkedFiles, router, handleMenuClose]);

  // Handle delete folders
  const handleDeleteFolders = useCallback(() => {
    if (state.checkedFolders.length === 0) return;

    // Confirm deletion action
    if (window.confirm(`Are you sure you want to delete the selected folders?`)) {
      const folderIdsToDelete = state.checkedFolders;

      // Delete selected folders
      axios.delete('/api/folder/deleteBatch', { data: { folderIds: folderIdsToDelete } })
        .then(response => {
          console.log('Folders deleted successfully:', response.data);
          dispatch({ type: 'CLEAR_CHECKED_FOLDERS' });
          dispatch({ type: 'RESET_SELECT_ALL_FOLDERS' });
          router.replace(router.asPath);
        })
        .catch(error => {
          console.error('Error deleting folders:', error);
        });
    }
    // Close the menu after deletion
    handleMenuClose();
  }, [state.checkedFolders, router, handleMenuClose]);

  // Handle open folders menu
  const handleOpenFoldersMenu = (event: React.MouseEvent<HTMLElement>) => {
    setFoldersMenuOpen(true);
    setFoldersMenuAnchorEl(event.currentTarget);
  };

  // Handle close folders menu
  const handleCloseFoldersMenu = () => {
    setFoldersMenuOpen(false);
  };

  // Handle move action for selected item
  const handleMoveFileToFolder = async (destinationFolderId: string) => {
    try {
      // Move files to the selected folder
      const response = await axios.put('/api/file/moveBatch', {
        fileIds: state.checkedFiles,
        destinationFolderId,
      });
      console.log('Files moved successfully:', response.data);
      dispatch({ type: 'CLEAR_CHECKED_FILES' }); // Clear checked files
      dispatch({ type: 'RESET_SELECT_ALL_FILES' }); // Reset select all files
      router.replace(router.asPath); // Refresh the page
    } catch (error) {
      console.error('Error moving files:', error);
    }
    handleCloseFoldersMenu(); // Close the folders menu
  };
  

  // Handle move folders
  const handleMoveFolders = useCallback(async (destinationFolderId: string) => {
    if (state.checkedFolders.length === 0) return; // Return if no folders are selected

    try {
      // Move folders to the selected folder
      await axios.put('/api/folder/moveBatch', {
        folderIds: state.checkedFolders,
        destinationFolderId,
      });
      console.log('Folders moved successfully');
      dispatch({ type: 'CLEAR_CHECKED_FOLDERS' }); // Clear checked folders
      dispatch({ type: 'RESET_SELECT_ALL_FOLDERS' }); // Reset select all folders
      router.replace(router.asPath); // Refresh the page
    } catch (error) {
      console.error('Error moving folders:', error); // Log error if moving folders fails
    }
  }, [state.checkedFolders, router]); // Dependencies for useCallback hook

  // Filter available destination folders for moving folders
  const availableDestinationFolders = userFolders.filter(folder => {
    const allSubfolders = state.checkedFolders.flatMap(checkedFolderId => findSubfolders(checkedFolderId, userFolders)); // Find all subfolders of selected folders
    return !state.checkedFolders.includes(folder.folderId) && !allSubfolders.includes(folder.folderId); // Exclude selected folders and their subfolders
  });

  // Fetch user folders on component mount
  useEffect(() => {
    const fetchUserFolders = async () => {
      // Fetch user folders from the API
      try {
        const response = await axios.get('/api/folder/getFolders'); // API call to get user folders
        setUserFolders(response.data.folders); // Set the fetched folders to state
      } catch (error) {
        console.error('Error fetching user folders:', error); // Log error if fetching fails
      }
    };
    fetchUserFolders(); // Fetch user folders on component mount
  }, []);

  const filteredFiles = files.filter(file => file.name.toLowerCase().includes(state.searchQuery.toLowerCase())); // Filter files based on search query
  const filteredFolders = folders.filter(folder => folder.name.toLowerCase().includes(state.searchQuery.toLowerCase())); // Filter folders based on search query

  // Sort files and folders based on sort criteria and order
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (state.sortCriteria === 'name') {
      return state.sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name); // Sort by name
    } else if (state.sortCriteria === 'size') {
      return state.sortOrder === 'asc' ? a.hashFile.size - b.hashFile.size : b.hashFile.size - a.hashFile.size; // Sort by size
    }
    return 0;
  });

  // Sort folders based on sort criteria and order
  const sortedFolders = [...filteredFolders].sort((a, b) => {
    if (state.folderSortCriteria === 'name') {
      return state.folderSortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name); // Sort by name
    }
    return 0;
  });

  // Return the FileMenu component
  return (
    <div>
      <LinkGenerationModal ref={modalRef} /> 
      <SearchBar searchQuery={state.searchQuery} onSearchQueryChange={handleSearchQueryChange} /> 
      <h2>Folders</h2>
      <Stack direction="row" alignItems="center" spacing={2}>
        <FormControlLabel
          control={<Checkbox checked={state.selectAllFolders} onChange={handleSelectAllFolders} />} // Checkbox to select all folders
          label="Select all"
        />
        {/* Conditionally render delete and move buttons if folders are selected */}
        {state.checkedFolders.length > 0 && (
          <>
            <IconButton aria-label="delete" onClick={handleDeleteFolders}>
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
              {availableDestinationFolders
                .filter(folder => folder.folderId !== currentFolderId) // Exclude the current folder
                .map(folder => ( // Map available destination folders to menu items
                  <MenuItem key={folder.folderId} onClick={() => handleMoveFolders(folder.folderId)}>
                    {folder.name}
                  </MenuItem>
                ))}
            </Menu>
          </>
        )}
        <FormControl variant="outlined" size="small">
          <InputLabel>Sort By</InputLabel>
          <Select value={state.folderSortCriteria} onChange={handleFolderSortCriteriaChange} label="Sort By">{/* Select input to choose sort criteria */}
            <MenuItem value="name">Name</MenuItem>
          </Select>
        </FormControl>
        <FormControl variant="outlined" size="small">
          <InputLabel>Order</InputLabel>
          <Select value={state.folderSortOrder} onChange={handleFolderSortOrderChange} label="Order"> {/* Select input to choose sort order */}
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      <List>
        {sortedFolders.map((folder) => ( // Map sorted folders to list items
          <MemoizedListItem key={folder.folderId} folder={folder} state={state} dispatch={dispatch} canEdit={canEdit} handleMenuClick={handleMenuClick} modalRef={modalRef} />
        ))}
      </List>
      <Divider />
      <h2>Files</h2>
      {/* Conditionally render select all, delete, move, sort by, and order controls if files are present */}
      <Stack direction="row" alignItems="center" spacing={2}>
        <FormControlLabel
          control={<Checkbox checked={state.selectAllFiles} onChange={handleSelectAllFiles} />}
          label="Select all"
        />
        {/* Conditionally render delete and move buttons if files are selected */}
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
              {userFolders.map(folder => ( // Map user folders to menu items
                <MenuItem key={folder.folderId} onClick={() => handleMoveFileToFolder(folder.folderId)}>
                  {folder.name}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
        <FormControl variant="outlined" size="small">
          <InputLabel>Sort By</InputLabel>
          <Select value={state.sortCriteria} onChange={handleSortCriteriaChange} label="Sort By"> {/* Select input to choose sort criteria */}
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="size">Size</MenuItem>
          </Select>
        </FormControl>
        <FormControl variant="outlined" size="small">
          <InputLabel>Order</InputLabel>
          <Select value={state.sortOrder} onChange={handleSortOrderChange} label="Order"> {/* Select input to choose sort order */}
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      <List>
        {sortedFiles.map((file) => ( // Map sorted files to list items
          <MemoizedListItem key={file.fileId} file={file} state={state} dispatch={dispatch} canEdit={canEdit} handleMenuClick={handleMenuClick} modalRef={modalRef} linkId={linkId} />
        ))}
      </List>

      {!!canEdit && ( // Conditionally render menu if user can edit
        <Menu id="menu" anchorEl={state.anchorEl} open={Boolean(state.anchorEl)} onClose={handleMenuClose}>
          {(router.asPath.startsWith('/f/Home') || canEdit === true) && <MenuItem onClick={handleRenameItem}>Rename</MenuItem>}
          {<MenuItem onClick={handleDeleteItem}>Delete</MenuItem>}
          {router.asPath.startsWith('/f/Home') && <MenuItem onClick={() => state.selectedItem && modalRef.current?.open(state.selectedItem.itemType, state.selectedItem.itemId, state.selectedItem.name)}>Share</MenuItem>}
        </Menu>
      )}
    </div>
  );
};

// Memoized ListItem component to prevent unnecessary re-renders
const MemoizedListItem = memo(({ folder, file, state, dispatch, canEdit, handleMenuClick, modalRef, linkId }) => {
  // Determine the item type based on folder or file
  const item = folder || file;
  const itemType = folder ? 'folder' : 'file';
  return (
    <ListItem disablePadding>
      <Checkbox
        sx={{ m: -1 }}
        checked={state.checkedFolders.includes(item.folderId) || state.checkedFiles.includes(item.fileId)}
        onChange={() => dispatch({ type: itemType === 'folder' ? 'TOGGLE_FOLDER' : 'TOGGLE_FILE', folderId: item.folderId, fileId: item.fileId })}
      />
      <FileCard link={file ? (linkId ? `${file.fileId}?q=${linkId}` : file.fileId) : ""} itemId={itemType === 'folder' ? item.folderId : item.fileId} itemType={itemType} name={item.name} onShare={() => modalRef.current?.open()} onMenuClick={(event) => handleMenuClick(event, itemType === 'folder' ? item.folderId : item.fileId, itemType, item.name)} canEdit={canEdit} />
    </ListItem>
  );
});

export default FileMenu;
