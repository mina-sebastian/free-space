import React, { useRef, useReducer, useCallback, useState, memo } from 'react';
import { List, ListItem, Divider, Checkbox, FormControlLabel, Stack, IconButton, Menu, MenuItem, Select, FormControl, InputLabel, Button } from '@mui/material';
import FileCard from '../cards/FileCard';
import LinkGenerationModal from '../modals/LinkGenerationModal';
import TagsModal from '../modals/TagsModal'; // Import the TagsModal component
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import { useRouter } from 'next/router';
import axios from 'axios';
import SearchBar from './SearchBar';

interface FileMenuProps {
  folders: Array<{ folderId: string; name: string }>;
  files: Array<{ fileId: string; name: string; hashFile: { size: number } }>;
  canEdit: boolean;
  linkId: string;
}

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
  | { type: 'SET_SELECTED_ITEM'; selectedItem: { itemId: string; itemType: 'folder' | 'file'; name: string } | null };

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
    default:
      return state;
  }
};

const FileMenu: React.FC<FileMenuProps> = ({ folders, files, canEdit, linkId }) => {
  const modalRef = useRef(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [tagsModalOpen, setTagsModalOpen] = useState<boolean>(false);
  const router = useRouter();

  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>, itemId: string, itemType: 'folder' | 'file', name: string) => {
    dispatch({ type: 'SET_ANCHOR_EL', anchorEl: event.currentTarget });
    dispatch({ type: 'SET_SELECTED_ITEM', selectedItem: { itemId, itemType, name } });
  }, []);

  const handleMenuClose = useCallback(() => {
    dispatch({ type: 'SET_ANCHOR_EL', anchorEl: null });
    dispatch({ type: 'SET_SELECTED_ITEM', selectedItem: null });
  }, []);

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

  const handleSelectAllFolders = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'TOGGLE_ALL_FOLDERS', checked: event.target.checked, folderIds: folders.map(folder => folder.folderId) });
  }, [folders]);

  const handleSelectAllFiles = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'TOGGLE_ALL_FILES', checked: event.target.checked, fileIds: files.map(file => file.fileId) });
  }, [files]);

  const handleSortCriteriaChange = useCallback((event: React.ChangeEvent<{ value: unknown }>) => {
    dispatch({ type: 'SET_SORT_CRITERIA', sortCriteria: event.target.value as string });
  }, []);

  const handleSortOrderChange = useCallback((event: React.ChangeEvent<{ value: unknown }>) => {
    dispatch({ type: 'SET_SORT_ORDER', sortOrder: event.target.value as string });
  }, []);

  const handleFolderSortCriteriaChange = useCallback((event: React.ChangeEvent<{ value: unknown }>) => {
    dispatch({ type: 'SET_FOLDER_SORT_CRITERIA', folderSortCriteria: event.target.value as string });
  }, []);

  const handleFolderSortOrderChange = useCallback((event: React.ChangeEvent<{ value: unknown }>) => {
    dispatch({ type: 'SET_FOLDER_SORT_ORDER', folderSortOrder: event.target.value as string });
  }, []);

  const handleSearchQueryChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_SEARCH_QUERY', searchQuery: event.target.value });
  }, []);

  const filteredFiles = files.filter(file => file.name.toLowerCase().includes(state.searchQuery.toLowerCase()));
  const filteredFolders = folders.filter(folder => folder.name.toLowerCase().includes(state.searchQuery.toLowerCase()));

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (state.sortCriteria === 'name') {
      return state.sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    } else if (state.sortCriteria === 'size') {
      return state.sortOrder === 'asc' ? a.hashFile.size - b.hashFile.size : b.hashFile.size - a.hashFile.size;
    }
    return 0;
  });

  const sortedFolders = [...filteredFolders].sort((a, b) => {
    if (state.folderSortCriteria === 'name') {
      return state.folderSortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    return 0;
  });

  const handleTagsModalOpen = useCallback(() => {
    setTagsModalOpen(true);
  }, []);

  const handleTagsModalClose = useCallback(() => {
    setTagsModalOpen(false);
  }, []);

  return (
    <div>
      <LinkGenerationModal ref={modalRef} />
      <TagsModal open={tagsModalOpen} onClose={handleTagsModalClose} fileId={state.selectedItem?.itemId || ''} />
      <SearchBar searchQuery={state.searchQuery} onSearchQueryChange={handleSearchQueryChange} />
      <h2>Folders</h2>
      <Stack direction="row" alignItems="center" spacing={2}>
        <FormControlLabel
          control={<Checkbox checked={state.selectAllFolders} onChange={handleSelectAllFolders} />}
          label="Select all"
        />
        {state.checkedFolders.length > 0 && (
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
          <Select value={state.folderSortCriteria} onChange={handleFolderSortCriteriaChange} label="Sort By">
            <MenuItem value="name">Name</MenuItem>
          </Select>
        </FormControl>
        <FormControl variant="outlined" size="small">
          <InputLabel>Order</InputLabel>
          <Select value={state.folderSortOrder} onChange={handleFolderSortOrderChange} label="Order">
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      <List>
        {sortedFolders.map((folder) => (
          <MemoizedListItem key={folder.folderId} folder={folder} state={state} dispatch={dispatch} canEdit={canEdit} handleMenuClick={handleMenuClick} modalRef={modalRef} />
        ))}
      </List>
      <Divider />
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
          <Select value={state.sortCriteria} onChange={handleSortCriteriaChange} label="Sort By">
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="size">Size</MenuItem>
          </Select>
        </FormControl>
        <FormControl variant="outlined" size="small">
          <InputLabel>Order</InputLabel>
          <Select value={state.sortOrder} onChange={handleSortOrderChange} label="Order">
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      <List>
        {sortedFiles.map((file) => (
          <MemoizedListItem key={file.fileId} file={file} state={state} dispatch={dispatch} canEdit={canEdit} handleMenuClick={handleMenuClick} modalRef={modalRef} linkId={linkId} />
        ))}
      </List>
      {!!canEdit && (
        <Menu id="menu" anchorEl={state.anchorEl} open={Boolean(state.anchorEl)} onClose={handleMenuClose}>
          {(router.asPath.startsWith('/f/Home') || canEdit === true) && <MenuItem onClick={handleRenameItem}>Rename</MenuItem>}
          {<MenuItem onClick={handleDeleteItem}>Delete</MenuItem>}
          {router.asPath.startsWith('/f/Home') && state.selectedItem?.itemType === 'file' && <MenuItem onClick={handleTagsModalOpen}>Tags</MenuItem>}
          {router.asPath.startsWith('/f/Home') && <MenuItem onClick={() => state.selectedItem && modalRef.current?.open(state.selectedItem.itemType, state.selectedItem.itemId, state.selectedItem.name)}>Share</MenuItem>}
        </Menu>
      )}
    </div>
  );
};

const MemoizedListItem = memo(({ folder, file, state, dispatch, canEdit, handleMenuClick, modalRef, linkId }) => {
  const item = folder || file;
  const itemType = folder ? 'folder' : 'file';
  return (
    <ListItem disablePadding>
      <Checkbox
        sx={{ m: -1 }}
        checked={state.checkedFolders.includes(item.folderId) || state.checkedFiles.includes(item.fileId)}
        onChange={() => dispatch({ type: itemType === 'folder' ? 'TOGGLE_FOLDER' : 'TOGGLE_FILE', folderId: item.folderId, fileId: item.fileId })}
      />
      <FileCard link={file ? linkId ? `${file.fileId}?q=${linkId}` : file.fileId : ""} itemId={item.folderId || item.fileId} itemType={itemType} name={item.name} onShare={() => modalRef.current?.open()} onMenuClick={(event) => handleMenuClick(event, item.folderId || item.fileId, itemType, item.name)} canEdit={canEdit} />
    </ListItem>
  );
});

export default FileMenu;
