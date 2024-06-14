import * as React from 'react';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import { Box } from '@mui/material';

// Define the props for the SearchBar component
interface SearchBarProps {
  searchQuery: string;
  onSearchQueryChange: (event: React.ChangeEvent<HTMLInputElement>) => void; // Function to handle search query change
}

// Functional component representing the search bar
export default function SearchBar({ searchQuery, onSearchQueryChange }: SearchBarProps) {
  return (
    <Box alignItems='center' display="flex" justifyContent="center" pt={5}>
      <Paper
        component="form" // Use form component for search bar
        sx={{ p: '2px 4px', display: 'flex', width: '100%', alignItems: 'center', backgroundColor: '#271458'}}
      >
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Search Files"
          value={searchQuery}
          onChange={onSearchQueryChange} // Handle search query change
          inputProps={{ 'aria-label': 'search files' }}
        />
        <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
          <SearchIcon />
        </IconButton>
      </Paper>
    </Box>
  );
}
