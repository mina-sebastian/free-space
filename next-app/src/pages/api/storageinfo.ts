import axios from 'axios';

export default async function handler(req, res) {

  try {
    const response = await axios.get('http://microservices:5000/disk-usage');
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch storage data' });
  }
}