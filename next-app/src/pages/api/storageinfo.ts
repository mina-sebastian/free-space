import axios from 'axios';

// Handler to fetch storage information
export default async function handler(req, res) {

  try {
    const response = await axios.get('http://microservices:5000/disk-usage'); // Send a GET request to the storage service
    res.status(200).json(response.data); // Return the response data
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch storage data' }); // Return a 500 error if the request fails
  }
}