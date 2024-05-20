import * as React from 'react';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import { Box } from '@mui/material';

interface SearchBarProps {
  searchQuery: string;
  onSearchQueryChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function SearchBar({ searchQuery, onSearchQueryChange }: SearchBarProps) {
  return (
    <Box alignItems='center' display="flex" justifyContent="center" pt={5}>
      <Paper
        component="form"
        sx={{ p: '2px 4px', display: 'flex', width: '100%', alignItems: 'center', backgroundColor: '#271458'}}
      >
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Search Files"
          value={searchQuery}
          onChange={onSearchQueryChange}
          inputProps={{ 'aria-label': 'search files' }}
        />
        <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
          <SearchIcon />
        </IconButton>
      </Paper>
    </Box>
  );
}
