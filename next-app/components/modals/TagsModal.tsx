import React, { useState, useEffect } from 'react';
import { Modal, Box, TextField, Button, List, ListItem, ListItemText, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const TagsModal = ({ open, onClose, fileId }) => {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (fileId) {
      // Fetch existing tags for the file
      axios.get(`/api/file/getTags?fileId=${fileId}`)
        .then(response => setTags(response.data))
        .catch(error => console.error('Error fetching tags:', error));
    }
  }, [fileId]);

  const handleAddTag = () => {
    if (newTag.trim()) {
      axios.post(`/api/file/${fileId}/tags`, { action: 'add', fileId, tagName: newTag })
        .then(response => {
          setTags([...tags, response.data]);
          setNewTag('');
        })
        .catch(error => console.error('Error adding tag:', error));
    }
  };

  const handleRemoveTag = (tagName) => {
    axios.post(`/api/file/${fileId}/tags`, { action: 'remove', fileId, tagName })
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
        <TextField
          label="New Tag"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button variant="contained" color="primary" onClick={handleAddTag}>Add Tag</Button>
        <List>
          {tags.map(tag => (
            <ListItem key={tag.tagId} secondaryAction={
              <IconButton edge="end" onClick={() => handleRemoveTag(tag.name)}>
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
