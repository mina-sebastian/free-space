import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, LinearProgress, CircularProgress, LinearProgressProps } from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';

// Component to display linear progress with a label
function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} /> {/* Linear progress bar */}
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(props.value)}%`}</Typography> {/* Progress percentage */}
      </Box>
    </Box>
  );
}

// Component to display storage usage
const StorageUsage = () => {
  const [storageData, setStorageData] = useState(null); // State to store storage data

  useEffect(() => {
    // Function to fetch storage data from the API
    const fetchStorageData = async () => {
      try {
        const response = await axios.get('/api/storageinfo'); // API call to get storage data
        setStorageData(response.data); // Set the fetched data to state
      } catch (error) {
        console.error('Error fetching storage data:', error); // Log error if fetching fails
      }
    };

    fetchStorageData(); // Fetch data on component mount
    const intervalId = setInterval(fetchStorageData, 60000); // Set interval to fetch data every 60 seconds

    return () => clearInterval(intervalId); // Clear interval on component unmount
  }, []);

  // Function to convert bytes to gigabytes
  const bytesToGB = (bytes) => (bytes / (1024 ** 3)).toFixed(2);

  if (!storageData) {
    return <CircularProgress />; // Show loading indicator if data is not yet available
  }

  const { total, used } = storageData; // Destructure total and used storage data
  const totalGB = bytesToGB(total); // Convert total bytes to gigabytes
  const usedGB = bytesToGB(used); // Convert used bytes to gigabytes
  const usedPercentage = ((used / total) * 100).toFixed(2); // Calculate used storage percentage

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
        <CloudIcon sx={{ mr: 2 }} /> Storage {/* Display storage icon and title */}
      </Typography>
      <Typography>Total: {totalGB} GB</Typography> {/* Display total storage */}
      <Typography>Used: {usedGB} GB</Typography> {/* Display used storage */}
      <LinearProgressWithLabel variant="determinate" value={parseFloat(usedPercentage)} /> {/* Display progress bar */}
    </Box>
  );
};

export default StorageUsage;
