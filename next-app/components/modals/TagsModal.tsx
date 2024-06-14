import React, { useState, useEffect } from 'react';
import { Modal, Box, Button, List, ListItem, ListItemText, IconButton, TextField, Autocomplete } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

// Define the TagsModal component
const TagsModal = ({ open, onClose, fileId }) => {
  console.log("FILE ID", fileId); 
  const [tags, setTags] = useState([]); // State to manage the tags
  const [allTags, setAllTags] = useState([]); // State to manage all tags
  const [newTag, setNewTag] = useState(''); // State to manage the new tag

  // Function to fetch tags
  const fetchTags = () => {
    if (fileId) {
      // Fetch existing tags for the file
      axios.get(`/api/file/getTags?fileId=${fileId}`)
        .then(response => setTags(response.data))
        .catch(error => console.error('Error fetching tags:', error));

      // Fetch all available tags
      axios.get('/api/file/getAllTags')
        .then(response => setAllTags(response.data))
        .catch(error => console.error('Error fetching all tags:', error));
    }
  };

  // Fetch tags on component mount
  useEffect(() => {
    fetchTags();
  }, [fileId]);

  // Function to add a new tag
  const handleAddTag = () => {
    if (newTag.trim()) {
      axios.post(`/api/file/${fileId}/tags`, { action: 'add', fileId, tagName: newTag }) // Add tag to the file
        .then(response => {
          setTags([...tags, response.data]);
          setNewTag('');
          // Fetch all tags again to update the list
          fetchTags();
        })
        .catch(error => console.error('Error adding tag:', error));
    }
  };

  // Function to remove a tag
  const handleRemoveTag = (tagName) => {
    axios.post(`/api/file/${fileId}/tags`, { action: 'remove', fileId, tagName }) // Remove tag from the file
      .then(response => {
        setTags(tags.filter(tag => tag.name !== tagName));
      })
      .catch(error => console.error('Error removing tag:', error));
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2
        }}
      >
        <h2>Manage Tags</h2>
        {/* Autocomplete component for adding new tags */}
        <Autocomplete 
          freeSolo
          options={allTags.map(tag => tag.name)} // Set the options to all available tags
          value={newTag}
          onChange={(event, newValue) => setNewTag(newValue)} // Handle change in value
          renderInput={(params) => ( // Render the input field
            <TextField
              {...params} // Pass the input parameters
              label="New Tag"
              variant="outlined"
              onChange={(e) => setNewTag(e.target.value)} // Handle change in value
              fullWidth
              margin="normal"
            />
          )}
        />
        <Button variant="contained" color="primary" onClick={handleAddTag} style={{ marginTop: '10px' }}> {/* Button to add tag */}
          Add Tag
        </Button>
        <List>
          {tags.map(tag => ( // Map over the tags
            <ListItem key={tag.tagId} secondaryAction={ // List item with remove button
              <IconButton edge="end" onClick={() => handleRemoveTag(tag.name)}> {/* Button to remove tag */}
                <CloseIcon />
              </IconButton>
            }>
              <ListItemText primary={tag.name} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Modal>
  );
};

export default TagsModal;
