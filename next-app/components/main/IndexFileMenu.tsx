import React, { useRef, useReducer, useCallback, useState } from 'react';
import { List, ListItem, Divider, Checkbox, FormControlLabel, Stack, IconButton, Menu, MenuItem, Select, FormControl, InputLabel, TextField } from '@mui/material';
import FileCard from '../cards/FileCard';
import LinkGenerationModal from '../modals/LinkGenerationModal';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import { useRouter } from 'next/router';
import axios from 'axios';
import SearchBar from './SearchBar';

interface FileMenuProps {
  files: Array<{ fileId: string; name: string; hashFile: { size: number } }>;
}

type State = {
  checkedFolders: string[];
  checkedFiles: string[];
  selectAllFolders: boolean;
  selectAllFiles: boolean;
};

type Action =
  | { type: 'TOGGLE_ALL_FOLDERS'; checked: boolean; folderIds: string[] }
  | { type: 'TOGGLE_ALL_FILES'; checked: boolean; fileIds: string[] }
  | { type: 'TOGGLE_FOLDER'; folderId: string }
  | { type: 'TOGGLE_FILE'; fileId: string };

const initialState: State = {
  checkedFolders: [],
  checkedFiles: [],
  selectAllFolders: false,
  selectAllFiles: false,
};

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
    default:
      return state;
  }
};

const FileMenu: React.FC<FileMenuProps> = ({files }) => {
  const modalRef = useRef(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const router = useRouter();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<{ itemId: string; itemType: 'folder' | 'file'; name: string } | null>(null);

  const [sortCriteria, setSortCriteria] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const [folderSortCriteria, setFolderSortCriteria] = useState('name');
  const [folderSortOrder, setFolderSortOrder] = useState('asc');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, itemId: string, itemType: 'folder' | 'file', name: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem({ itemId, itemType, name });
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleRenameItem = () => {
    if (selectedItem) {
      const newName = prompt(`Enter new ${selectedItem.itemType} name:`, selectedItem.name);
      if (newName !== null) {
        axios.put(`/api/${selectedItem.itemType}/${selectedItem.itemId}/rename`, { newName })
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
  };

  const handleDeleteItem = () => {
    if (selectedItem && window.confirm(`Are you sure you want to delete ${selectedItem.itemType} "${selectedItem.name}" and all its contents?`)) {
      axios.delete(`/api/${selectedItem.itemType}/${selectedItem.itemId}/delete`)
        .then(response => {
          console.log('Item deleted successfully:', response.data);
          router.replace(router.asPath);
        })
        .catch(error => {
          console.error('Error deleting item:', error);
        });
    }
    handleMenuClose();
  };


  const handleSelectAllFiles = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'TOGGLE_ALL_FILES', checked: event.target.checked, fileIds: files.map(file => file.fileId) });
  }, [files]);

  const handleSortCriteriaChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSortCriteria(event.target.value as string);
  };

  const handleSortOrderChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSortOrder(event.target.value as string);
  };

  const handleFolderSortCriteriaChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFolderSortCriteria(event.target.value as string);
  };

  const handleFolderSortOrderChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFolderSortOrder(event.target.value as string);
  };

  const handleSearchQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    if (!searchPerformed) {
      setSearchPerformed(true);
    }
  };

  const filteredFiles = files.filter(file => file.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortCriteria === 'name') {
      return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    } else if (sortCriteria === 'size') {
      return sortOrder === 'asc' ? a.hashFile.size - b.hashFile.size : b.hashFile.size - a.hashFile.size;
    }
    return 0;
  });


  return (
    <div>
      <LinkGenerationModal ref={modalRef} />
      <SearchBar searchQuery={searchQuery} onSearchQueryChange={handleSearchQueryChange} />
      
      {searchPerformed && (
        <>
          <h2>Files</h2>
          <Stack direction="row" alignItems="center" spacing={2}>
            <FormControlLabel
              control={<Checkbox checked={state.selectAllFiles} onChange={handleSelectAllFiles} />}
              label="Select all"
            />
            {state.checkedFiles.length > 0 && (
              <>
                <IconButton aria-label="delete">
                  <DeleteIcon />
                </IconButton>
                <IconButton aria-label="move">
                  <DriveFileMoveIcon />
                </IconButton>
              </>
            )}
            <FormControl variant="outlined" size="small">
              <InputLabel>Sort By</InputLabel>
              <Select value={sortCriteria} onChange={handleSortCriteriaChange} label="Sort By">
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="size">Size</MenuItem>
              </Select>
            </FormControl>
            <FormControl variant="outlined" size="small">
              <InputLabel>Order</InputLabel>
              <Select value={sortOrder} onChange={handleSortOrderChange} label="Order">
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <List>
            {sortedFiles.map((file) => (
              <ListItem key={file.fileId}>
                <Checkbox
                  sx={{ m: -1 }}
                  checked={state.checkedFiles.includes(file.fileId)}
                  onChange={() => dispatch({ type: 'TOGGLE_FILE', fileId: file.fileId })}
                />
                <FileCard itemId={file.fileId} itemType="file" name={file.name} link={`/v/${file.fileId}`} onShare={() => modalRef.current?.open()} onMenuClick={handleMenuClick}/>
              </ListItem>
            ))}
          </List>
        </>
      )}

      <Menu id="menu" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {router.asPath.startsWith('/f/Home') && <MenuItem onClick={handleRenameItem}>Rename</MenuItem>}
        <MenuItem onClick={handleDeleteItem}>Delete</MenuItem>
        {router.asPath.startsWith('/f/Home') && <MenuItem onClick={() => selectedItem && modalRef.current?.open(selectedItem.itemType, selectedItem.itemId, selectedItem.name)}>Share</MenuItem>}
      </Menu>
    </div>
  );
};

export default FileMenu;
