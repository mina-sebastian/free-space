import * as React from 'react';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import { Box } from '@mui/material';

export default function SearchBar() {
  return (
    <Box alignItems= 'center' display="flex" justifyContent="center" pt={10}>
        <Paper
        component="form"
        sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 700 , backgroundColor: '#13093C'}}
        >   
        <IconButton sx={{ p: '10px' }} aria-label="menu">
            <MenuIcon />
        </IconButton>
        <InputBase
            sx={{ ml: 1, flex: 1 }}
            placeholder="Search Files"
            inputProps={{ 'aria-label': 'search google maps' }}
        />
        <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
            <SearchIcon />
        </IconButton>
        </Paper>
    </Box>
  );
}