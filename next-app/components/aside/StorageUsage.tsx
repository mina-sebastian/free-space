import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, LinearProgress, CircularProgress, LinearProgressProps } from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';

function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(
          props.value,
        )}%`}</Typography>
      </Box>
    </Box>
  );
}

const StorageUsage = () => {
  const [storageData, setStorageData] = useState(null);

  useEffect(() => {
    const fetchStorageData = async () => {
      try {
        const response = await axios.get('/api/storageinfo');
        setStorageData(response.data);
      } catch (error) {
        console.error('Error fetching storage data:', error);
      }
    };

    fetchStorageData();
    const intervalId = setInterval(fetchStorageData, 60000); // Fetch every 60 seconds

    return () => clearInterval(intervalId);
  }, []);

  const bytesToGB = (bytes) => (bytes / (1024 ** 3)).toFixed(2);

  if (!storageData) {
    return <CircularProgress />;
  }

  const { total, used } = storageData;
  const totalGB = bytesToGB(total);
  const usedGB = bytesToGB(used);
  const usedPercentage = ((used / total) * 100).toFixed(2);

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
        <CloudIcon sx={{ mr: 2 }} /> Storage
      </Typography>
      <Typography>Total: {totalGB} GB</Typography>
      <Typography>Used: {usedGB} GB</Typography>
      <LinearProgressWithLabel variant="determinate" value={parseFloat(usedPercentage)} />
    </Box>
  );
};

export default StorageUsage;
